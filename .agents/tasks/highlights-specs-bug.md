# Bug Investigation Report: Highlights Specs & Product Detail Specs

**Date:** 2026-07-10  
**Scope:** brand-lit HIGHLIGHTS tab + lighting-products-smart-solutions product detail page  
**Status:** Root causes identified. No code changes made (read-only investigation).

---

## Summary

Two separate but related bugs found:

1. **HIGHLIGHTS tab — specs overlay is hover-only, not click-triggered.**  
   The "Quick Overview" specs table in `Highlights.tsx` is controlled by CSS hover (`group-hover/card:opacity-100`), not a click/toggle mechanism. On mobile or when the user "clicks" (pinindot) instead of hovering, the overlay never becomes visible. There is no `onClick` state toggle at all.

2. **Product detail page (`/lighting-products-smart-solutions/[id]`) — specs section is blank.**  
   The page at `app/lighting-products-smart-solutions/[id]/page.tsx` reads `specGroup.rows` exclusively (line 303). The newer `brand-lit/[slug]/page.tsx` version correctly uses `specGroup.specs || specGroup.rows || []` as a fallback chain. If the Firestore data uses the field name `specs` instead of `rows` on some products, the `[id]` page renders nothing. Additionally, the `key` is `specGroup.id` — if a `specGroup.id` is `undefined`, React silently skips re-renders.

---

## Bug 1 — HIGHLIGHTS Tab: Specs Not Showing on Click

### File & Lines

`app/components/Highlights.tsx` — lines 62–82 (the overlay `<motion.div>`)

### Evidence

```tsx
// Highlights.tsx line 62–68
<motion.div
    initial={{ opacity: 0 }}
    whileHover={{ opacity: 1 }}
    className="absolute inset-0 bg-black/80 backdrop-blur-[4px] flex flex-col justify-center items-center p-6 opacity-0 group-hover/card:opacity-100 transition-all duration-500 z-30"
>
```

The overlay uses:
- `whileHover={{ opacity: 1 }}` — Framer Motion hover animation (desktop only)
- `group-hover/card:opacity-100` — CSS hover (desktop only)
- No `onClick` handler exists anywhere on the card or overlay
- No `useState` for an expand/show toggle

The data access is:
```tsx
// line 40
const firstGroup = product.technicalSpecs?.[0];
// line 73
{firstGroup?.rows?.slice(0, 4).map(...)}
```

This accesses `.rows` — which is correct for products created via `AddnewProduct.tsx` (confirmed at line 59: `interface SpecBlock { id: number; label: string; rows: SpecRow[]; }`). The data is available, but the display mechanism is purely hover-based.

### Root Cause

The specs overlay in HIGHLIGHTS is **hover-only**. On mobile, hover doesn't exist. On desktop, if the user "clicks" (not hovers), nothing appears. There is no click-to-expand or click-to-toggle state at all.

### Fix

Add a click-toggle state per card:

```tsx
// In Highlights.tsx — inside the topProducts.map()
const [showSpecs, setShowSpecs] = useState(false); // per card
```

Or use a `selectedProduct` state at the component level and show the specs in a modal or persistent panel below the card. The simplest fix is to move `showSpecs` state into a wrapper and toggle via `onClick`:

```tsx
// Replace the motion.div overlay with:
<div
  onClick={(e) => { e.preventDefault(); setShowSpecs(!showSpecs); }}
  className={`absolute inset-0 bg-black/80 backdrop-blur-[4px] flex flex-col justify-center items-center p-6 transition-all duration-500 z-30 cursor-pointer ${
    showSpecs ? "opacity-100" : "opacity-0 group-hover/card:opacity-100"
  }`}
>
```

Since the `motion.div` is inside a `<Link>`, using `e.preventDefault()` on click will prevent navigation and show specs instead. The state variable `showSpecs` must be declared per-card — either use an inline component or lift it to a `selectedProductId` state on the parent.

**Recommended approach** — use a `selectedId` state at the Highlights component level:

```tsx
const [expandedId, setExpandedId] = useState<string | null>(null);
// Inside the card:
onClick={(e) => { e.preventDefault(); setExpandedId(expandedId === product.id ? null : product.id); }}
// Overlay visibility:
className={`... ${expandedId === product.id ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none group-hover/card:opacity-100"} ...`}
```

---

## Bug 2 — Product Detail Page (`/lighting-products-smart-solutions/[id]`): Specs Blank

### File & Lines

`app/lighting-products-smart-solutions/[id]/page.tsx` — lines 297–308

### Evidence

The `[id]` page renders specs like this:
```tsx
// line 297–307
{product.technicalSpecs?.map((specGroup: any) => (
  <div key={specGroup.id} className="space-y-3">
    <h3 ...>{specGroup.label}</h3>
    <div className="border ...">
      <table className="w-full ...">
        <tbody>
          {specGroup.rows?.map((row: any, idx: number) => (  // ← ONLY .rows
            <tr key={idx}>
              <td>{row.name}</td>
              <td>{row.value || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
))}
```

Compare to `app/brand-lit/[slug]/page.tsx` (the newer/fixed version) which does:
```tsx
// brand-lit/[slug]/page.tsx — the correct, defensive approach
const rows = specGroup.specs || specGroup.rows || [];  // ← fallback chain
if (rows.length === 0) return null;
```

The `AddnewProduct.tsx` component (the primary admin tool) defines:
```tsx
// AddnewProduct.tsx line 59
interface SpecBlock { id: number; label: string; rows: SpecRow[]; }
```

And saves via `technicalSpecs: descBlocks` (line 370). So the canonical field name is `rows`.

However, the `bulkimportdialog.tsx` (another import path) constructs the same structure with `rows`. But if any product was migrated, manually edited in Firestore, or imported from another source where the array is called `specs`, the `[id]` page will render an empty table (because `specGroup.rows` is `undefined`) while `brand-lit/[slug]` handles it gracefully.

There is also a secondary risk: `key={specGroup.id}` — if `specGroup.id` is `undefined` on any group (which can happen if a spec block was created without an `id` field), React will warn and may behave inconsistently.

### Root Cause

The `/lighting-products-smart-solutions/[id]/page.tsx` uses **only** `specGroup.rows` with no fallback to `specGroup.specs`. It is less defensive than the `brand-lit/[slug]` equivalent. Any product whose `technicalSpecs` entries store their rows under a key other than `rows` will silently render no specs. Combined with the fact that `loading` starts as `true` and the specs section has no loading skeleton, the user sees nothing.

### Fix

Apply the same defensive pattern used in `brand-lit/[slug]/page.tsx`. Change lines 297–308 in `app/lighting-products-smart-solutions/[id]/page.tsx`:

**Before:**
```tsx
{product.technicalSpecs?.map((specGroup: any) => (
  <div key={specGroup.id} className="space-y-3">
    <h3 className="text-[10px] font-black uppercase tracking-widest text-[#d11a2a]">{specGroup.label}</h3>
    <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
      <table className="w-full border-collapse bg-white text-left">
        <tbody>
          {specGroup.rows?.map((row: any, idx: number) => (
            <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
              <td className="w-2/5 p-3 md:p-3.5 bg-gray-50/30 text-[9px] md:text-[10px] font-bold text-gray-400 uppercase border-r border-gray-50 italic">{row.name}</td>
              <td className="p-3 md:p-3.5 text-[10px] md:text-[12px] font-semibold text-gray-700 uppercase">{row.value || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
))}
```

**After:**
```tsx
{product.technicalSpecs?.map((specGroup: any, groupIdx: number) => {
  // Support both .specs (some older/imported products) and .rows (standard)
  const rows = specGroup.specs || specGroup.rows || [];
  if (rows.length === 0) return null;
  return (
    <div key={specGroup.id ?? groupIdx} className="space-y-3">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-[#d11a2a]">
        {specGroup.label || specGroup.specGroup || "Specifications"}
      </h3>
      <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full border-collapse bg-white text-left">
          <tbody>
            {rows.map((row: any, idx: number) => (
              <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                <td className="w-2/5 p-3 md:p-3.5 bg-gray-50/30 text-[9px] md:text-[10px] font-bold text-gray-400 uppercase border-r border-gray-50 italic">{row.name}</td>
                <td className="p-3 md:p-3.5 text-[10px] md:text-[12px] font-semibold text-gray-700 uppercase">{row.value || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
})}
```

---

## Additional Notes from the Original User Request

The original request also asked about:

1. **BG image per product family = first product's image** — Already implemented in `brand-lit/page.tsx` via `firstProductImageForFamily()` (lines ~262–280). This uses `product.mainImage` of the first matching product as the family card image. ✅ Already done.

2. **Hide product family if no products** — Already implemented in `FamilyCard` component (`if (count === 0) return null;`). ✅ Already done.

3. **Hide categories when filter yields no results** — Already implemented: `visibleFamilies.length === 0` check hides the whole usage group. ✅ Already done.

4. **Hide applications when filter yields no results** — Already implemented: `visibleFamilies.length === 0` check skips the application accordion entry. ✅ Already done.

5. **HIGHLIGHTS specs not showing on click** — Bug confirmed. Fix described above in Bug 1.

---

## Files to Change

| File | Change Needed |
|------|---------------|
| `app/components/Highlights.tsx` | Add `expandedId` state + `onClick` toggle to show specs overlay on click (not hover-only) |
| `app/lighting-products-smart-solutions/[id]/page.tsx` | Change `specGroup.rows?.map(...)` to use `const rows = specGroup.specs \|\| specGroup.rows \|\| []` with fallback `key={specGroup.id ?? groupIdx}` |

---

## Confidence

- Bug 1 (Highlights click): **High confidence** — the overlay mechanism is provably hover-only; no click handler or state toggle exists in the file.
- Bug 2 (Detail page specs): **High confidence** — the `[id]` page only accesses `.rows`, while the parallel `[slug]` page uses a fallback chain. The fix is a direct port of the working pattern.
