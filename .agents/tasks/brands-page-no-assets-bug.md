# Bug Investigation Report: Brands Page — "No Assets Linked to [Brand]"

**Date:** 2026-07-10  
**Page:** `/trusted-technology-brands` (`app/trusted-technology-brands/page.tsx`)  
**Status:** Root cause identified. No code changes made (read-only investigation).

---

## Summary Answer

**The root cause is a field name mismatch.** Products are saved to Firestore with a field called `brands` (an **array** of brand name strings). The `/trusted-technology-brands` page queries products and tries to match them using `p.brand` (a **singular string** field). That field does not exist on any product document. The comparison always fails, so zero products are ever matched to any brand — hence "NO ASSETS LINKED TO [BRAND]" on every brand section.

---

## Evidence

### 1. How products store their brand — the data shape

Both product-creation paths save brand data identically:

**`app/components/products/AddnewProduct.tsx` — line 380:**
```ts
brands: selectedBrands,   // string[] — e.g. ["LIT", "ZUMTOBEL"]
```

**`app/components/bulkimportdialog.tsx` — line 295:**
```ts
brands: selectedBrands,   // string[] — same shape
```

`selectedBrands` is a `string[]` populated by selecting checkboxes from the `brands` Firestore collection. The field written to every product document is **`brands` (array)**.

There is no `brand` (singular) field saved anywhere in the product creation code.

---

### 2. What the brands page expects — the query

**`app/trusted-technology-brands/page.tsx` — lines 92–120 (`fetchProductsForBrands`):**

```ts
const fetchProductsForBrands = async (brandsList: Brand[]) => {
  const q = query(
    collection(db, "products"),
    where("website", "==", "Disruptive Solutions Inc"),
  );

  const querySnapshot = await getDocs(q);
  const allProducts = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  const results: any = {};

  brandsList.forEach((brand) => {
    const matchedProducts = allProducts.filter(
      (p: any) =>
        p.brand?.toString().toLowerCase().trim() ===   // ← WRONG: reads p.brand (singular)
        brand.title?.toString().toLowerCase().trim(),
    );
    results[brand.id] = matchedProducts;
  });

  setBrandProducts(results);
};
```

**Line 103** is the bug: `p.brand?.toString()...` reads a singular `brand` string field. No product has that field. Every `matchedProducts` array is empty. Every brand section renders the fallback `"No Assets Linked to {brand.title}"` message.

---

### 3. What the brands page expects vs what data actually has

| | Field name | Type | Example value |
|---|---|---|---|
| **Firestore product document** (actual data) | `brands` | `string[]` | `["LIT"]` |
| **`trusted-technology-brands/page.tsx`** (what it reads) | `brand` | `string` | `"lit"` |

The page reads `p.brand` — this field **does not exist** on any product. Result: always `undefined`, comparison always fails.

---

### 4. Secondary issue — `website` filter may also drop products

The query on line 93 adds `where("website", "==", "Disruptive Solutions Inc")`. Products also store their website as an array:

**`AddnewProduct.tsx` line 382:**
```ts
websites: selectedWebs,  // string[] — not a single string field "website"
```

Firestore's `where("website", "==", ...)` queries a **scalar** field named `website`. If products store `websites` (array, not scalar), this filter also returns zero results — meaning even after fixing the `brand`/`brands` mismatch, the query might still return no products because of this second mismatch.

> **Note:** `brands/page.tsx` (the simpler `/brands` route) does NOT have this problem — it fetches all products with no `where` clause and filters in-memory, which is why products show there. The `trusted-technology-brands` page is the one with both issues.

---

### 5. The "Brands" collection vs "brand_name" collection

The brands page reads brand documents from the `brand_name` collection (line 67). The product's `brands` array stores **names** (e.g. `"LIT"`, `"ZUMTOBEL"`) sourced from the `brands` collection (a separate Firestore collection used by the admin product form). The `brand_name` collection's `title` field holds values like `"LIT"`, `"ZUMTOBEL"` — these should match when compared correctly. So the matching logic just needs to use `p.brands?.includes(brand.title)` (case-insensitive if needed).

---

## Ready-to-Apply Fix

**File:** `app/trusted-technology-brands/page.tsx`  
**Function:** `fetchProductsForBrands` (lines ~88–121)

### Change 1 — Fix the product query (remove the broken `where` clause, or change it to match the actual field)

If products store `websites: ["Disruptive Solutions Inc"]` (array), the `where` clause needs to change from `where("website", "==", ...)` to `where("websites", "array-contains", "Disruptive Solutions Inc")`.

Alternatively, fetch all products without a `where` clause and filter in-memory (same approach as `brands/page.tsx` — simpler and already proven to work).

### Change 2 — Fix the field name from `p.brand` to `p.brands?.includes(...)`

```ts
// BEFORE (broken):
const matchedProducts = allProducts.filter(
  (p: any) =>
    p.brand?.toString().toLowerCase().trim() ===
    brand.title?.toString().toLowerCase().trim(),
);

// AFTER (fixed):
const matchedProducts = allProducts.filter(
  (p: any) =>
    Array.isArray(p.brands) &&
    p.brands.some(
      (b: string) =>
        b.toString().toLowerCase().trim() ===
        brand.title?.toString().toLowerCase().trim(),
    ),
);
```

### Full fixed `fetchProductsForBrands`:

```ts
const fetchProductsForBrands = async (brandsList: Brand[]) => {
  try {
    // Fetch all products — no scalar "website" filter because products store an
    // array field called "websites", not a scalar field called "website".
    const q = query(
      collection(db, "products"),
      where("websites", "array-contains", "Disruptive Solutions Inc"),
    );

    const querySnapshot = await getDocs(q);
    const allProducts = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const results: any = {};

    brandsList.forEach((brand) => {
      const matchedProducts = allProducts.filter(
        (p: any) =>
          // Products store brands as string[] — use Array.includes, not string equality
          Array.isArray(p.brands) &&
          p.brands.some(
            (b: string) =>
              b.toString().toLowerCase().trim() ===
              brand.title?.toString().toLowerCase().trim(),
          ),
      );
      results[brand.id] = matchedProducts;
    });

    setBrandProducts(results);
  } catch (error) {
    console.error("Fetch Error:", error);
  }
};
```

> If the `websites` array-contains query also fails (i.e., products stored without any `websites` field), fall back to fetching all products:
> ```ts
> const q = query(collection(db, "products"));
> ```
> This matches what `brands/page.tsx` already does (no where clause). The `brands` page correctly shows all products, confirming the products exist and are accessible without a `where` filter.

---

### Change 3 — Product card renders `product.mainImage` but the field is correct

The Swiper product cards (lines ~156–183) already use `product.mainImage`, which is the correct field name saved by `AddnewProduct.tsx`. No change needed there.

---

## Files to Change

| File | Line(s) | Change |
|------|---------|--------|
| `app/trusted-technology-brands/page.tsx` | 88–121 | Replace `p.brand === brand.title` with `p.brands?.includes(brand.title)` (case-insensitive); fix `where("website"...)` to `where("websites", "array-contains", ...)` or remove the where clause |

---

## Confidence

- **Field name mismatch (`brand` vs `brands`):** High confidence. The admin forms (`AddnewProduct.tsx` line 380, `bulkimportdialog.tsx` line 295) both save `brands: selectedBrands` (array). The brands page reads `p.brand` (singular, nonexistent field). This is definitively the primary bug.
- **`website` vs `websites` mismatch:** High confidence. Both admin forms save `websites: selectedWebs` (array). The `where("website", "==", ...)` filter targets a field that also does not exist as a scalar. This is a secondary bug that would prevent products from loading even after the first fix.
- **The `brands/page.tsx` page working without issues:** Confirms the products exist in Firestore and are fetchable — the issue is entirely in the query and matching logic of `trusted-technology-brands/page.tsx`.
