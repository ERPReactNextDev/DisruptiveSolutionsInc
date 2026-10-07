# Brands Page Fix — Investigation Report

## Summary Answer

**Part 1 — Why products still don't load:** The `where("websites", "array-contains", "Disruptive Solutions Inc")` filter is correct in structure (products DO save a `websites` string[] field), but it silently fails if any existing product was saved before the `websites` field was introduced, or if the website name stored in the product doesn't exactly match the string `"Disruptive Solutions Inc"`. The safest and most consistent fix — confirmed by comparing with the working `app/brands/page.tsx` — is to **remove the `where` clause entirely**, fetch all products, and filter in-memory by `p.brands`. The brands page already proves this approach works.

**Part 2 — Product display redesign:** Replace the Swiper carousel on the right side of each brand section with a clean CSS grid of product cards styled after the `FamilyCard` component in `app/brand-lit/page.tsx`. Hide brand sections entirely when they have 0 matched products (no "No Assets" placeholder).

---

## Part 1: Evidence

### Field names confirmed from AddnewProduct.tsx (lines 379–381)

```ts
// app/components/products/AddnewProduct.tsx
brands: selectedBrands,   // string[]
websites: selectedWebs,   // string[]
```

Products are saved with both a `brands: string[]` and a `websites: string[]` field. Both fields exist. This means the `array-contains` query should work _in theory_, but has two practical failure modes:

1. **Exact string mismatch** — The website name stored in the product depends on what the user typed/selected in the `websites` dropdown. If any product was saved with `"Disruptive Solutions Inc."` (trailing period), `"disruptive solutions inc"` (lowercase), or any other variation, the `array-contains` filter silently returns 0 results for those products.

2. **Legacy products** — Products imported before the `websites` field was added (older bulk imports or AddnewProduct saves) won't have the field at all; Firestore simply omits them from `array-contains` results.

### Why `app/brands/page.tsx` works (lines 34–42)

```ts
// app/brands/page.tsx — the working reference
const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
const unsubscribe = onSnapshot(q, (snapshot) => {
  const productData = snapshot.docs.map((doc) => ({
    id: doc.id, ...doc.data(),
  }));
  setProducts(productData);
});
```

No `where` clause at all. It fetches every product, then filters in-memory:

```ts
const filteredProducts =
  activeFilter === "All"
    ? products
    : products.filter((p) => p.brands?.includes(activeFilter));
```

This approach is immune to exact-match problems and legacy documents.

### Current broken fetch in trusted-technology-brands/page.tsx (lines 83–98)

```ts
const q = query(
  collection(db, "products"),
  where("websites", "array-contains", "Disruptive Solutions Inc"),
);
```

This is the problem. If even one character differs in any product's stored `websites` value, that product is invisible.

### Recommended fix for Part 1

Replace the `fetchProductsForBrands` function:

```ts
const fetchProductsForBrands = async (brandsList: Brand[]) => {
  try {
    // Fetch ALL products — no where clause, matches the working brands/page.tsx pattern
    const querySnapshot = await getDocs(collection(db, "products"));
    const allProducts = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const results: Record<string, any[]> = {};
    brandsList.forEach((brand) => {
      results[brand.id] = allProducts.filter(
        (p: any) =>
          Array.isArray(p.brands) &&
          p.brands.some(
            (b: string) =>
              b.toString().toLowerCase().trim() ===
              brand.title?.toString().toLowerCase().trim(),
          ),
      );
    });
    setBrandProducts(results);
  } catch (error) {
    console.error("Fetch Error:", error);
  }
};
```

Also remove the `where` and `orderBy` imports if no longer used elsewhere in the file.

---

## Part 2: Evidence

### Current product display (trusted-technology-brands/page.tsx, lines 164–224)

The current implementation uses a `<Swiper>` carousel with `Navigation` and `Autoplay` modules. It renders product cards inside `<SwiperSlide>`. When there are no products it shows a dashed-border placeholder box with text "No Assets Linked to {brand.title}".

### FamilyCard pattern from brand-lit/page.tsx (lines ~230–270)

The `FamilyCard` component shows:
- A square `aspect-square` image container with `rounded-xl bg-gray-50`, image using `object-contain`
- `group-hover:scale-105` image zoom transition
- `border border-transparent hover:border-[#d11a2a] hover:bg-white hover:shadow-lg` card hover
- Product title in `text-[9px] font-black uppercase italic` below the image
- Count badge + ArrowRight icon row
- Entire card is a `<Link>` wrapping the content

The grid uses `grid-cols-2 md:grid-cols-4 gap-4` (from lines ~305–308 in brand-lit/page.tsx).

### Recommended redesign for Part 2

Replace the Swiper section with a responsive CSS grid:

```tsx
{/* PRODUCTS GRID */}
<div className="flex-1 w-full min-w-0">
  {brandProducts[brand.id]?.length > 0 && (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {brandProducts[brand.id].slice(0, 8).map((product: any) => (
          <Link
            key={product.id}
            href={`/lighting-products-smart-solutions/${product.id}`}
            className="group flex flex-col items-center gap-3 py-5 px-3 rounded-2xl border border-transparent hover:border-[#d11a2a] hover:bg-white hover:shadow-lg transition-all duration-200"
          >
            <div className="w-full aspect-square flex items-center justify-center overflow-hidden rounded-xl bg-gray-50 group-hover:bg-white transition-colors">
              {product.mainImage ? (
                <SmartImage
                  src={product.mainImage}
                  alt={product.name}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-xl">
                  <span className="text-gray-300 text-[9px] font-bold uppercase">No Image</span>
                </div>
              )}
            </div>
            <p className="text-[9px] font-black uppercase italic text-center leading-tight text-gray-700 group-hover:text-[#d11a2a] transition-colors line-clamp-2">
              {product.name}
            </p>
          </Link>
        ))}
      </div>

      {brandProducts[brand.id].length > 8 && (
        <div className="mt-6 flex justify-center">
          <Link
            href={brand.href || "#"}
            className="inline-flex items-center gap-2 border border-gray-200 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500 hover:border-[#d11a2a] hover:text-[#d11a2a] transition-all"
          >
            View All {brandProducts[brand.id].length} Products <ArrowRight size={12} />
          </Link>
        </div>
      )}
    </>
  )}
</div>
```

The outer brand `<section>` must be conditionally rendered to hide brands with 0 products:

```tsx
// In the dynamicBrands.map:
{dynamicBrands.map((brand) => {
  // Don't render if products aren't loaded yet (undefined) OR if loaded and empty (length 0)
  // Use undefined check to avoid flicker — only hide once we know the result
  const products = brandProducts[brand.id];
  if (products !== undefined && products.length === 0) return null;

  return (
    <section key={brand.id} ...>
      ...
    </section>
  );
})}
```

The `undefined` vs `length === 0` distinction prevents flicker: while products are still loading (state value is `undefined`), the brand section remains visible. Once the fetch resolves and a brand has 0 matches, it disappears cleanly.

---

## Imports cleanup

After the redesign, the following can be removed from `trusted-technology-brands/page.tsx`:
- `Swiper`, `SwiperSlide` from `swiper/react`
- `Navigation`, `Autoplay` from `swiper/modules`
- `swiper/css` and `swiper/css/navigation`
- `ChevronLeft`, `ChevronRight` from `lucide-react` (no longer needed for nav buttons)
- `where` from `firebase/firestore` (if brand_name query still uses it, keep it — it does, so keep)
- `getDocs` stays (used for one-time product fetch), but `onSnapshot` can be replaced with `getDocs` for products too

---

## Conclusions

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Products not loading | `where("websites", "array-contains", ...)` silently drops products with unmatched or missing field | Remove `where` clause; fetch all, filter in-memory by `p.brands` |
| Swiper carousel design | Existing Swiper carousel doesn't match the requested FamilyCard grid style | Replace with CSS grid using FamilyCard pattern from brand-lit/page.tsx |
| "No Assets" placeholder | Shows empty branded section for brands without products | Skip rendering the entire `<section>` when `brandProducts[brand.id]` is a non-empty loaded array returning length 0 |
| Product link | Current uses dynamic `brandPath` from `product.brand` scalar | Change to `/lighting-products-smart-solutions/${product.id}` per the brief |
