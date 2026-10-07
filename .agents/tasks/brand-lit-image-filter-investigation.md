# Brand-Lit Page — Investigation Report

## Summary Answers

### 1. Family Card Background Image
**Current behavior:** The `FamilyCard` in `app/brand-lit/page.tsx` already has logic (`firstProductImageForFamily`) to pull the first product image, but it reads from `product.images[0].src`, `product.images[0]`, or `product.imageUrl`. **The actual image field on products is `mainImage`** — that field is never checked, so the lookup returns `null` and falls back to the family's own `category.imageUrl`. When that is also absent, a `<Star>` icon placeholder renders instead.

**Fix needed:** In `firstProductImageForFamily` (line ~278), add `match.mainImage` to the fallback chain so it reads `mainImage` correctly.

### 2. Filter Behavior on the Categories Tab
**Current behavior:** `filteredProducts` is correctly filtered by the sidebar (line ~132–188). `countForFamily` correctly counts only `filteredProducts` per family (line ~223–235). However, **the family cards themselves are never hidden** — `FamilyCard` shows every family regardless of whether it has 0 matching products after filtering. The count badge shows "0" but the card still renders.

**Fix needed:** In the `FamilyCard` render inside the CATEGORIES and APPLICATIONS loops, skip (return `null`) any family whose `countForFamily(category) === 0` when any filter is active.

### 3. Product Image Field on the Family Detail Page (bonus bug)
In `app/brand-lit/family/[slug]/page.tsx` at line ~394, the product card `<SmartImage>` uses:
```
src={family.imageUrl || product.mainImage || "/placeholder.svg"}
```
It uses `family.imageUrl` **first**, meaning all product cards in the family page display the same family background image instead of each product's own image. The priority should be reversed: `product.mainImage` first, then `family.imageUrl` as a last resort.

---

## Evidence

### File: `app/brand-lit/page.tsx`

#### `firstProductImageForFamily` — lines 268–287
```tsx
const firstProductImageForFamily = useCallback(
  (family: any): string | null => {
    const title = family.title?.trim().toUpperCase();
    const match = products.find(
      (p) =>
        p.productFamily?.trim().toUpperCase() === title ||
        p.dynamicSpecs?.some(
          (s: any) => s.value?.trim().toUpperCase() === title,
        ),
    );
    if (!match) return null;
    // products store images as either images[0].src or imageUrl
    return (
      match.images?.[0]?.src ||   // ❌ wrong field — products don't use images[]
      match.images?.[0] ||         // ❌ wrong field
      match.imageUrl ||            // ❌ wrong field — imageUrl is on families, not products
      null
    );
    // ✅ MISSING: match.mainImage — the actual field used on all products
  },
  [products],
);
```

The comment says "products store images as either images[0].src or imageUrl" but:
- `bulkimportdialog.tsx` line 288 sets `mainImage: product.cloudinaryUrl` when importing — confirming the field is `mainImage`.
- `brand-lit/[slug]/page.tsx` line 50 types `mainImage?: string` on the Product interface.
- `brand-lit/[slug]/page.tsx` line 139: `setActiveImage(foundProduct.mainImage || "")`.
- `brand-lit/[slug]/page.tsx` line 208: `const allThumbnails = [product.mainImage, ...(product.galleryImages || [])]`.
- `checkout/page.tsx` line 59: `image: item.mainImage`.
- `app/components/application.tsx` line 144: `src={product.mainImage}`.
- `app/zumtobel-lighting-solutions/page.tsx` line 143: `src={item.mainImage}`.

**Conclusion:** Every other page in the project uses `product.mainImage`. The `firstProductImageForFamily` function never checks `mainImage`, so it always returns `null`.

#### `FamilyCard` — lines 291–331
```tsx
const FamilyCard = ({ category }: { category: any }) => {
  const count = countForFamily(category);         // correctly uses filteredProducts
  const slug = toSlug(category.title || "");
  const productImg = firstProductImageForFamily(category);  // always null (see above)
  const displayImage = productImg || category.imageUrl || null;  // falls back to family image

  return (
    <Link href={`/brand-lit/family/${slug}`} ...>
      <div ...>
        {displayImage ? (
          <SmartImage src={displayImage} ... />  // shows family.imageUrl or placeholder
        ) : (
          <Star size={36} className="text-gray-200" />  // placeholder star shown when no imageUrl
        )}
      </div>
      ...
      {count > 0 && <span>{count}</span>}   // count badge hides when 0 but card stays
      ...
    </Link>
  );
};
```

The card is always rendered regardless of `count`. There is no `if (count === 0 && hasActiveFilters) return null` guard.

#### Filter logic — lines 132–188 (`filteredProducts` useMemo)
The filter is working correctly for product-level matching:
```tsx
const filteredProducts = useMemo(() => {
  return products.filter((product) => {
    // 1. search query check
    // 2. for each active filter entry: check dynamicSpecs AND technicalSpecs for a match
    // if no match found → return false
  });
}, [products, filters, searchQuery]);
```

`countForFamily` (lines 223–235) depends on `filteredProducts`, so the badge count reflects filters. But the CATEGORIES tab loops over `dbCategories`/`groupedCategories` directly (line 426), not over `filteredProducts`. That's why families with 0 matching products still appear.

#### `ProductFilter` sidebar passing `products` (unfiltered) — line 698
```tsx
<ProductFilter
  products={products}           // ← passes ALL products, not filteredProducts
  productCount={filteredProducts.length}
  ...
/>
```
This is intentional and correct — the sidebar needs all possible spec values to build the dropdowns. No change needed here.

---

### File: `app/brand-lit/family/[slug]/page.tsx`

#### Product card image — lines 393–399 (bonus bug)
```tsx
<SmartImage
  src={
    family.imageUrl ||          // ❌ always truthy when family has an image → all cards show family image
    product.mainImage ||
    "/placeholder.svg"
  }
  alt={product.name}
/>
```
This means every product inside the family page shows the same image (the family's background photo). Priority should be `product.mainImage` first.

---

## Data Shape

### Product document (Firestore `products` collection)
```typescript
{
  id: string,               // Firestore doc ID
  name: string,
  slug?: string,
  sku?: string,
  itemCode?: string,
  mainImage?: string,       // ← PRIMARY image field (Cloudinary URL)
  galleryImages?: string[], // additional images
  qrCodeImage?: string,
  qrProductImages?: string | string[],
  catalogs?: string[],
  shortDescription?: string,
  rating?: number,
  reviewCount?: number,
  brands?: string[],
  productFamily?: string,   // used to match against family.title
  dynamicSpecs?: Array<{ title: string; value: string }>,
  technicalSpecs?: Array<{
    label?: string;
    specGroup?: string;
    specs?: Array<{ name: string; value: string }>;
    rows?: Array<{ name: string; value: string }>;   // legacy format
  }>,
  productUsage?: string[],  // e.g. ["INDOOR", "OUTDOOR"]
  createdAt: Timestamp,
}
```

### ProductFamily document (Firestore `productfamilies` collection)
```typescript
{
  id: string,
  title: string,            // used for matching via toSlug()
  imageUrl?: string,        // family's own image (hero/thumbnail)
  description?: string,
  productUsage?: string[],  // e.g. ["INDOOR"]
  applications?: string[],  // array of application doc IDs
  createdAt: Timestamp,
}
```

Families do **not** embed references to their products. The relationship is owned by the **product** side: products have a `productFamily` string field (or a `dynamicSpecs` entry) that matches the family's `title`.

---

## Recommended Fixes

### Fix 1 — Family card image (`app/brand-lit/page.tsx`, ~line 278)

Add `match.mainImage` to the return chain in `firstProductImageForFamily`:

```tsx
return (
  match.mainImage ||          // ✅ primary field — check this first
  match.images?.[0]?.src ||
  match.images?.[0] ||
  match.imageUrl ||
  null
);
```

### Fix 2 — Hide non-matching families when filters are active (`app/brand-lit/page.tsx`, ~line 292)

Add an early return inside `FamilyCard` (or at the call site in the grid) when filters are active and the family count is 0:

```tsx
const FamilyCard = ({ category }: { category: any }) => {
  const count = countForFamily(category);
  const hasActiveFilters =
    Object.keys(filters).length > 0 || searchQuery.trim().length > 0;

  // Hide families with 0 matching products when a filter is active
  if (hasActiveFilters && count === 0) return null;

  // ... rest of the component unchanged
};
```

`FamilyCard` is defined inside `BrandLitPage`, so it already has access to `filters` and `searchQuery` via closure — no prop changes needed.

### Fix 3 — Product card image on family detail page (`app/brand-lit/family/[slug]/page.tsx`, ~line 394)

Swap `family.imageUrl` and `product.mainImage` priority:

```tsx
src={
  product.mainImage ||   // ✅ each product's own image first
  family.imageUrl ||     // fallback to family image if product has none
  "/placeholder.svg"
}
```

---

## Summary of Changes Needed

| # | File | Line | Change |
|---|------|------|--------|
| 1 | `app/brand-lit/page.tsx` | ~278 | Add `match.mainImage ||` at the top of the `firstProductImageForFamily` return chain |
| 2 | `app/brand-lit/page.tsx` | ~292 | In `FamilyCard`, add `if (hasActiveFilters && count === 0) return null` guard |
| 3 | `app/brand-lit/family/[slug]/page.tsx` | ~394 | Swap `family.imageUrl` and `product.mainImage` to show each product's own image |
