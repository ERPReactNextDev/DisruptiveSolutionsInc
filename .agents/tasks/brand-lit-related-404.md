# Investigation Report: Related Gear Section — 404 on Product Click

## Summary Answer

When a user clicks a product in the "Related Gear / You Might Also Need" section on a brand-lit product detail page (e.g. `/brand-lit/track-bar-1-5-meter-white`), they are routed to `/lit/<slug>`. **That route does not exist.** The correct route is `/brand-lit/<slug>`. This is a single-line hardcoded typo in the related products `<Link href>`.

---

## Evidence

### 1. The Bug — Hardcoded Wrong Prefix in the `<Link>`

**File:** `app/brand-lit/[slug]/page.tsx`, line **695**

```tsx
<Link
  href={`/lit/${item.slug || item.id}`}   // ← BUG: /lit/ does not exist
  onClick={() =>
    logActivity(`Clicked Related Product: ${item.name}`, {
      fromProductId: product.id,
    })
  }
  className="group block h-full"
>
```

The `relatedProducts` array is fetched from the same `products` Firestore collection that backs all brand-lit product pages. Every product in that collection is properly reachable at `/brand-lit/<slug>`. The `href` prefix was incorrectly written as `/lit/` instead of `/brand-lit/`.

### 2. Route Structure — `/lit` Does Not Exist

The `app/` directory was fully enumerated. There is no `app/lit/` directory. The routes available are:

| URL pattern | Directory |
|---|---|
| `/brand-lit` | `app/brand-lit/page.tsx` |
| `/brand-lit/family/[slug]` | `app/brand-lit/family/[slug]/page.tsx` |
| `/brand-lit/[slug]` | `app/brand-lit/[slug]/page.tsx` ← the product detail page |
| `/lit-lighting-solutions` | `app/lit-lighting-solutions/page.tsx` (separate page, no `[slug]` child) |

When Next.js receives a request for `/lit/regular_e27_bulb_12w_warm_white`, it finds no matching route and serves the default 404.

### 3. The Correct URL Pattern

The breadcrumb inside `app/brand-lit/[slug]/page.tsx` confirms the correct prefix:

```tsx
// Line ~270 in app/brand-lit/[slug]/page.tsx
<Link href="/brand-lit" className="hover:text-black transition-colors">Products</Link>
```

The family page (`app/brand-lit/family/[slug]/page.tsx`) also correctly uses `/brand-lit/<slug>` for its product cards:

```tsx
// app/brand-lit/family/[slug]/page.tsx
<Link href={`/brand-lit/${product.slug || product.id}`}>
```

The listing page (`app/brand-lit/page.tsx`) also correctly routes family cards to `/brand-lit/family/<slug>`.

Only the Related Gear `<Link>` in `app/brand-lit/[slug]/page.tsx` uses the wrong `/lit/` prefix.

### 4. The Status Bar URL Observed by the User

The user observed `localhost:3001/lit/regular_e27_bulb_12w_warm_white` in the status bar — this matches exactly the pattern `href={`/lit/${item.slug || item.id}`}` where `item.slug = "regular_e27_bulb_12w_warm_white"`.

### 5. The `next/image` Error (Original Report, Message 1)

The `next.config.ts` already contains `disruptivesolutionsinc.com` in `remotePatterns`:

```ts
{ protocol: "https", hostname: "disruptivesolutionsinc.com" },
```

This hostname has already been added to the config. The runtime error in message 1 was likely captured before that fix was applied, or it reflects a cached `.next` build. **This error is resolved; no further action needed.**

---

## Conclusions

| Question | Answer |
|---|---|
| What URL is being constructed for related product links? | `/lit/<slug>` — e.g. `/lit/regular_e27_bulb_12w_warm_white` |
| What is the correct URL pattern? | `/brand-lit/<slug>` — e.g. `/brand-lit/regular_e27_bulb_12w_warm_white` |
| Why is the link pointing to `/lit/...` instead of `/brand-lit/...`? | Hardcoded typo in the Swiper slide `<Link href>` at line 695 of `app/brand-lit/[slug]/page.tsx` |
| Where is the related gear component? | Inline in `app/brand-lit/[slug]/page.tsx` (no separate component file) — the Swiper section starting around line 680 |

---

## Recommended Fix

**File:** `app/brand-lit/[slug]/page.tsx`  
**Line:** 695

Change:
```tsx
href={`/lit/${item.slug || item.id}`}
```

To:
```tsx
href={`/brand-lit/${item.slug || item.id}`}
```

This is a one-word change. No data model changes, no new files, no route changes required. After the fix, clicking any related product card will navigate to the correct `/brand-lit/<slug>` detail page.
