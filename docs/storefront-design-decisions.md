# Storefront Design Decisions

**Started:** 2026-10-22  
**Status:** Approved & Finalized  
**Related Documents:**
- [storefront-design.md](file:///c:/xampp/htdocs/office/az-ecommerce/docs/storefront-design.md) — design direction (this file takes precedence on conflict)
- [PRD.md](file:///c:/xampp/htdocs/office/az-ecommerce/docs/PRD.md)
- [data-model.md](file:///c:/xampp/htdocs/office/az-ecommerce/docs/data-model.md)
- [admin-dashboard-decisions.md](file:///c:/xampp/htdocs/office/az-ecommerce/docs/admin-dashboard-decisions.md)

---

## Repository findings (baseline, 2026-10-22)

- `apps/web` is the untouched Turborepo starter (Next 16.3, React 19.2, Geist font, no storefront components).
- Prisma schema has **no** `Cart`/`CartItem`, **no** `Coupon`, **no** banner/campaign model, and **no** sale start/end dates.
- `Order.userId` is required → guest checkout is not currently possible.
- Available for browsing: `Category` (nested, `imageUrl`, `sortOrder`), `Brand` (`logoUrl`), `Product` (`isFeatured`, `thumbnailUrl`), `ProductImage`, `ProductVariant` (`regularPrice`, `salePrice`), `Attribute`/`AttributeValue` (TEXT/COLOR/BUTTON), `Inventory` (`lowStockThreshold`), `Review` (`status`, `isVerifiedPurchase`), `ShippingZone`/`ShippingMethod` (`estimatedDays`), `StoreSetting` (`isPublic`).

---

## Decision matrix

| # | Topic | Status | Decision |
|---|---|---|---|
| 1 | Scope boundary | **Approved** | Shell + browsing pages (read-only) |
| 2 | Catalog scope | **Approved** | General multi-category store (electronics, fashion, groceries, etc.) |
| 3 | Brand colours & logo | **Approved** | Blue `#1D4ED8` / Navy `#0F172A` / Orange `#F97316` / Page `#F8FAFC`; logo at `uploads/site/Logo.png` |
| 4 | Store name & logo assets | **Approved** (assets: assumption) | Customer-facing name "A to Z Ecommerce"; static logo derivatives in `apps/web/public/brand/` |
| 5 | Language & fonts | **Approved** (details: assumption) | English + Bangla from v1; Inter (EN), Kalpurush (BN) |
| 6 | Currency & price formatting | **Approved** | Prefix "BDT", 2 decimal places, South Asian grouping (e.g., `BDT 1,25,000.00`) |
| 7 | Homepage banners & merchandising | **Approved** | Hero via StoreSetting JSON; Deals from actual `salePrice < regularPrice`; no fake countdown timers |
| 8 | Product card & PDP variant actions | **Approved** | "View Details" on cards; interactive swatches/pills on PDP; "Add to Cart" with launch toast in read-only phase |
| 9 | PDP specifications, delivery, warranty & reviews | **Approved** | Dynamic specs from attributes; real ShippingMethod estimates; verified APPROVED reviews only |
| 10 | Search, listing filters, sorting & URL sync | **Approved** | Live suggestions; category/brand/price/in-stock/attribute filters; URL param sync; mobile drawer |
| 11 | Mobile UX, navigation & PDP sticky bar | **Approved** | 4-tab bottom nav; slide-out drawer with language switcher; sticky Add-to-Cart bar on mobile PDP; min 44px tap targets |
| 12 | CSS styling & Mockup-first strategy | **Approved** | Tailwind CSS v4 with brand tokens; Interactive Homepage Mockup first |
| 13 | Full-journey pages sequencing & global state | **Approved** | Shared Cart & Wishlist context with localStorage; build PDP -> Shop/Category/Archive -> Cart -> Checkout -> Wishlist |
| 14 | Single Product Page (PDP) architecture | **Approved** | Dual-column: sticky multi-image gallery + right buy-box (variants, trust, dual CTAs), specs matrix & reviews tabs |
| 15 | Unified Catalog Engine for Shop, Category & Archive | **Approved** | Reusable ProductCatalogView with desktop sticky filter sidebar, mobile drawer, active filter pills, search & URL sync |
| 16 | Cart, Bangladesh Checkout & Wishlist flow | **Approved** | Dedicated Cart with coupon & shipping estimator; BD-optimized Checkout (COD/bKash/Nagad, district selectors) & instant success; Wishlist with 1-click move |

---

## Decision records

### Decision 1: Scope boundary
- **Approved:** This design change covers design tokens, storefront shell (announcement bar, header, search, category navigation, footer), homepage, category/listing pages, and product detail page — all read-only.
- **Out of scope (separate future change):** cart, checkout, account, order history/tracking.
- **Rationale:** Everything in scope is backed by existing Prisma models; no backend/database changes are needed for decorative UI. Cart/checkout requires data-model decisions (Cart model, guest checkout vs. required `Order.userId`, Coupon model) that must be agreed per the PRD before implementation.
- **Implications:** Add-to-cart behaviour on cards/PDP must be resolved (see later decision) since no cart exists yet. Checklist items 9 (checkout), 10 (payments) and cart parts of 5 (coupons) are deferred.

### Decision 2: Catalog scope
- **Approved:** AZ E-commerce is a general, single-vendor multi-category store selling electronics, fashion, groceries and other product families. Categories remain fully data-driven from the API.
- **Effect on references:** Pickaboo and TechLand BD remain UX references for electronics merchandising, price/discount hierarchy, and spec presentation only. They are not references for the overall visual tone, which must suit fashion and groceries too.
- **Layout defaults (assumptions, confirm during later decisions):**
  - One consistent **square (1:1) image frame** across all product cards so mixed-category grids (homepage, search) stay aligned; `object-fit: contain` on white by default.
  - Product titles clamp to 2 lines on cards.
  - Product detail page renders specifications only when attribute data exists (electronics); fashion relies on variant selectors (size/colour); groceries on pack size/weight.
  - Desktop navigation uses a two-level category mega-menu driven by `Category.parentId`.
- **Known data gaps (not resolved here, flagged for future changes):**
  - Groceries usually need a unit-of-sale label (e.g. "1 kg", "500 ml"); today this can only be modelled as a variant attribute value. `weightGrams` exists but is a shipping field, not a display unit.
  - Perishables, expiry dates, and delivery time slots are not modelled and are out of scope for this change.
  - Fashion size guides are not modelled.

### Decision 3: Brand colours & logo
- **Approved core palette:**

  | Role | Hex | Use |
  |---|---|---|
  | Primary — Blue | `#1D4ED8` | Primary buttons, links, selected states |
  | Secondary — Dark Navy | `#0F172A` | Headings, navigation, footer, text |
  | Accent — Orange | `#F97316` | Campaigns, deal highlights, limited emphasis |
  | Page background | `#F8FAFC` | Clean, light page background |

- **Supporting tokens (derived from storefront-design.md §3; not separately approved, treated as defaults):** primary hover `#1E40AF`, primary soft `#EFF6FF`, accent hover `#EA580C`, success `#15803D`, warning `#D97706`, danger `#DC2626`, surface `#FFFFFF`, border `#E2E8F0`, muted text `#64748B`, disabled `#94A3B8`.
- **Accessibility note:** orange `#F97316` on white is ~2.8:1 contrast, below WCAG AA for normal text. Use it for fills, badges with dark text, icons and large text only; use `#C2410C` (or navy text on orange) where orange text must be readable at body size.
- **Logo:** `uploads/site/Logo.png` — cart mark with blue "A", navy "to", orange "Z" and swoosh, wordmark "A to Z Ecommerce". Its colours match the approved palette.
- **Logo issues to resolve during implementation:**
  - The file is a 1024×1024 square with large white padding and a stacked layout; it cannot be used as-is in a ~40px-tall header.
  - Needed derivatives: (a) horizontal header lockup (mark + wordmark side-by-side) on transparent background, (b) icon-only mark for mobile header and favicon, (c) optional light/monochrome version for the navy footer.
  - Ideally source vector (SVG) artwork; otherwise trimmed transparent PNG/WebP exports.

### Decision 4: Store name & logo assets
- **Approved:** The customer-facing store name is **"A to Z Ecommerce"** — used in `<title>` templates, meta/Open Graph tags, logo alt text, footer copyright, and structured data. "AZ E-commerce" remains the internal project/repo name only.
- **Assumption (vector source not confirmed):** No vector artwork has been supplied. During implementation, derive trimmed transparent exports from `uploads/site/Logo.png` (header mark, icon-only mark/favicon, footer variant) and mark them as **temporary** until designer-supplied SVGs replace them.
- **Assumption:** Logo derivatives are static files in `apps/web/public/brand/`, not loaded from `StoreSetting`. Admin-managed logo is deferred.

### Decision 5: Language & fonts
- **Approved:** The storefront ships in **English and Bangla** in this change.
- **Approved fonts:**
  - English / Latin: **Inter** via `next/font/google`.
  - Bangla: **Kalpurush**. Not on Google Fonts — must be **self-hosted** via `next/font/local` (WOFF2 in `apps/web/app/fonts/`). Licence terms of the obtained font file must be verified before committing it.
- **Implementation assumptions (confirm in OpenSpec design):**
  - Locale-prefixed routes: `/en/...` and `/bn/...` via an `app/[locale]/` segment; default locale and root redirect to be decided.
  - `<html lang>` set per locale; `hreflang` alternates emitted for SEO.
  - UI strings stored in per-locale message files; a language switcher in the header.
  - Font stack per locale: BN pages use Kalpurush first with Inter for Latin glyphs/digits; EN pages use Inter with Kalpurush as fallback for Bangla product names.
  - Bangla script needs line-height ≥ 1.6 and line-clamp-based (not fixed-height) title truncation.
  - Kalpurush is a single-weight font; bold Bangla will be synthesised by the browser unless a bold file is sourced — headings may need weight/size compensation.

### Decision 6: Currency & price formatting
- **Approved format:**
  - Prefix: **`BDT `** (e.g., `BDT 1,25,000.00`).
  - Digits: English numerals (`0–9`) across both English and Bangla locales.
  - Decimal places: Always **2 decimal places** (e.g., `.00`).
  - Grouping: **South Asian lakh/crore grouping** (e.g., `1,25,000.00`, `12,50,000.00`).
- **Implementation note:** Implement a reusable formatting helper `formatPrice(amount: number | string | Decimal): string` utilizing `Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })` prefixed with `BDT ` to ensure consistent display across all product cards, badges, and PDP components.

### Decision 7: Homepage banners & merchandising data source
- **Approved:**
  - **Hero Banner:** Powered by public `StoreSetting` (key: `storefront.hero_banners` containing JSON array of banner objects with `imageUrl`, `title`, `subtitle`, `linkUrl`, `badgeText`), with graceful fallback defaults if unset. No database schema change required.
  - **Featured Products Section:** Populated by products with `isFeatured: true, isActive: true`.
  - **Special Deals Section:** Populated by products containing variants where `salePrice != null` and `salePrice < regularPrice`. Card displays genuine percentage discount calculated as `((regularPrice - salePrice) / regularPrice) * 100`.
  - **Countdown Timers:** No fake countdown timers will be rendered. The section will be titled **"Special Deals" / "আজকের ডিল"**.
  - **Category Shortcuts:** Rendered dynamically from root categories (`parentId: null, isActive: true`) ordered by `sortOrder`, displaying `imageUrl` and `name`.
  - **Empty Section Rule:** Any homepage section with 0 qualifying items will be completely hidden rather than displaying broken or empty placeholders.

### Decision 8: Product card & PDP variant actions
- **Approved:**
  - **Product Card CTA:** Primary action is **"View Details" / "বিস্তারিত দেখুন"** navigating directly to `/products/[slug]`. Keeps listing grids uniform and forces explicit variant choice (size/color/spec) before purchase.
  - **PDP Variant Selector:**
    - `COLOR` attributes render as circular swatches with color fill (`colorCode`), checkmark indicator on active, and hover tooltip label.
    - `TEXT` / `BUTTON` attributes (Size, Capacity, Pack) render as rounded pill buttons with clear active/disabled states.
    - Changing variants dynamically updates: displayed price (regular & sale), SKU code, stock availability badge ("In Stock" / "স্টকে আছে" vs "Out of Stock" / "স্টক শেষ"), and swaps the primary gallery image if variant has an assigned `imageId`.
  - **PDP "Add to Cart" Action (Read-only browsing phase):**
    - Render the fully styled primary action button **"Add to Cart" / "কার্টে যোগ করুন"**.
    - If active variant is out of stock (`Inventory.quantity <= 0`), button is disabled with "Out of Stock" / "স্টক শেষ".
    - If in stock, clicking triggers an accessible toast notification informing the customer that online cart checkout is launching in the next phase, preserving the exact visual layout for seamless API wiring later.

### Decision 9: PDP specifications, delivery, warranty & reviews
- **Approved:**
  - **Specifications Table:** Built dynamically from structured catalog data: Brand, Category, and `ProductVariantAttributeValue` key-value pairs (e.g., Material, Color, Size, Storage, Weight). General description rendered from `Product.description`.
  - **Delivery Estimate Box:** Built directly from active `ShippingMethod` records in the database, displaying honest configured rates and day ranges (e.g., *Inside Dhaka: BDT 60.00 (2–3 days)*, *Outside Dhaka: BDT 120.00 (4–6 days)*). No fabricated "Next Day Guaranteed" claims.
  - **Warranty & Store Guarantees:** Storewide trust points sourced from public `StoreSetting` (e.g., 7-day return policy, genuine products, cash on delivery). Item-specific warranty is displayed only when a `Warranty` attribute is present on the product.
  - **Reviews & Ratings:**
    - Rating summary and review cards filtered strictly by `status: APPROVED`.
    - Badge *"Verified Purchase" / "যাচাইকৃত ক্রেতা"* rendered only when `isVerifiedPurchase: true`.
    - If zero approved reviews exist, renders an honest empty state (*"No reviews yet for this product"*).
    - Review submission displays an informative prompt indicating reviews can be submitted by verified customers upon logging into their account.

### Decision 10: Search, listing filters, sorting & URL sync
- **Approved:**
  - **Global Header Search:** Prominent input with debounced (300ms) live autocomplete suggestions displaying top 5 matched products (with thumbnail, title, formatted BDT price), matching brands, and matching categories. Submitting queries navigates to `/products?q={query}`.
  - **Listing Page Filters:** Left sticky sidebar on desktop (`>=1024px`), bottom-sheet slide-up drawer on mobile/tablet (`<1024px`) with active filter badge.
  - **Supported Filters:**
    - Category tree (drill down by parent/child).
    - Brand (multi-select checkboxes with counts).
    - Price range (numeric min/max in BDT with apply action).
    - In-stock availability toggle (*"In Stock Only" / "শুধুমাত্র স্টকে আছে"*).
    - Category-scoped dynamic attributes (e.g. Size, Color, Storage, Pack).
  - **Sorting Options:** Latest (default), Price: Low to High, Price: High to Low, and Featured.
  - **URL Synchronization:** All filter and sort states are bidirectional with URL query parameters (`?q=&category=&brand=&minPrice=&maxPrice=&inStock=&sort=&page=`), providing shareable links and full browser history support.
  - **Zero Results State:** Displays clear messaging with a prominent "Reset All Filters" button and suggested popular items.

### Decision 11: Mobile UX, navigation & PDP sticky bar
- **Approved:**
  - **Mobile Bottom Navigation Bar (App-like):** Fixed sticky bar at the bottom of the screen (`<768px`) with 4 main destinations:
    1. *Home* (*হোম*)
    2. *Categories* (*ক্যাটাগরি*) — triggers the slide-out category drawer
    3. *Deals* (*ডিলস*) — directs to discounted products
    4. *Cart* (*কার্ট*) — shows item badge and launches the cart preview/notice
  - **Mobile Slide-Out Drawer:**
    - Top header contains a bilingual toggle (`English` | `বাংলা`) with immediate locale persistence.
    - Full vertical category hierarchy with animated chevrons for nested subcategories.
    - Direct access links to Deals, Brands, and Customer Support.
  - **Mobile Sticky Action Bar on PDP:**
    - Appears smoothly when scrolling past the main hero gallery and price block.
    - Compact 56px docked strip showing selected variant price (`BDT ...`) and full-width high-contrast **"Add to Cart" / "কার্টে যোগ করুন"** CTA.
  - **Accessibility & Ergonomics:** All interactive buttons, pills, swatches, and menu items adhere to a minimum 44×44px tap target size to prevent mis-clicks on mobile touchscreens.

### Decision 12: CSS Architecture, Animation Stack & Mockup-First UI Strategy
- **Approved Styling & Animation Architecture:**
  - **Tailwind CSS v4** (`@tailwindcss/postcss`) leveraging native CSS custom property theme tokens (`--color-primary: #1D4ED8`, `--color-navy: #0F172A`, `--color-accent: #F97316`, `--color-page: #F8FAFC`, etc.).
  - **Lenis Smooth Scrolling:** Ultra-smooth momentum scroll with GSAP ticker synchronization and reduced-motion compliance.
  - **Motion (Framer Motion):** Staggered product card scroll reveals (`whileInView`), tactile hover elevations (`whileHover={{ y: -6 }}`), tab layout animations, and spring button physics.
  - **GSAP & ScrollTrigger:** Ambient floating timelines on Hero badges/showcase images and scroll depth effects.
  - **Top Scroll Progress Bar:** 3px gradient line (`from-blue-600 via-indigo-600 to-orange-500`) tracking viewport reading progress.
  - **Floating Arrow Top Scroll Button:** Spring-animated floating action button (`↑`) appearing at `scrollY > 350px` for smooth instant return to top.
  - Next.js 16 native `<Image>` optimization with responsive `sizes` and square 1:1 aspect-ratio frames for product media.
  - Lucide icons for clean, lightweight iconography matching the design system.
- **Approved Implementation Strategy (Mockup First):**
  - **Step 1 (Current Focus): High-Fidelity Homepage Mockup:**
    - Pure frontend UI mockup without backend integration, built with realistic sample catalog data.
    - **Hybrid Layout** uniting the best elements of [homepage-2.png](file:///c:/xampp/htdocs/office/az-ecommerce/docs/design/homepage-2.png) (top utility bar, "All Categories" navigation, 6-card Flash Sale with progress bars, and 3-card promo grid) and [homepage-1.png](file:///c:/xampp/htdocs/office/az-ecommerce/docs/design/homepage-1.png) (clean modern typography, 8-card tabbed Featured Products section, and official partner brands).
    - **Added Merchandising Sections:** Dedicated "NEW ARRIVALS" shelf, Category Deals spotlight ("Best Deals on Official Smartphones!"), and Trending Showcase ("Best Sellers" & "Top Viewed Products").
    - **Interactive Client Elements:** Live Flash Sale countdown timer, Hero carousel slider controls, Featured category tabs switching, search preview dropdown, and Add-to-Cart toast notifications with badge count increment.
    - English mockup first; multi-language (Bangla Kalpurush) and remaining pages (Catalog, PDP, Cart) proceed after user review and approval of the Homepage Mockup.
  - **Step 2 (Post-Approval):**
    - Subsequent browsing pages (Product Listing/Catalog, Search Filtering, PDP) mockup and review.
    - Backend API integration and dynamic database wiring.

### Decision 13: Full-Journey Pages Sequencing & Global State Foundation
- **Approved:**
  - Build persistent **`CartContext`** and **`WishlistContext`** (with `localStorage` hydration) to wrap the entire storefront.
  - Ensures cart quantities, price calculations, wishlist toggles, and count badges update in real-time across Navbar Header, Mobile Bottom Bar, Mini-Cart Drawer, Single Product Page, Catalog, Full Cart, and Wishlist.
  - Step-by-step implementation order:
    1. Shared Global Cart & Wishlist Context (`CartContext`, `WishlistContext`).
    2. Step 1: Single Product Page (PDP) (`/products/[slug]`).
    3. Step 2: Shop / Category / Archive Pages (`/shop`, `/category/[slug]`, `/archive`).
    4. Step 3: Full Cart Page (`/cart`).
    5. Step 4: Checkout Page (`/checkout`).
    6. Step 5: Wishlist Page (`/wishlist`).

### Decision 14: Single Product Page (PDP) Architecture & Design
- **Approved:**
  - **Dual-column e-commerce layout:**
    - **Left sticky gallery:** Multi-image gallery with high-resolution main viewer, zoom-on-hover effect, thumbnail strip, and discount badge overlay.
    - **Right buy-box:** Breadcrumbs, product title, brand badge, SKU, live stock badge ("In Stock"), star ratings with reviews count, pricing block (sale price in BDT `৳`, crossed regular price, savings badge).
    - **Key Highlights:** 3–4 bulleted technical/feature takeaways.
    - **Interactive Variant Selectors:** Color swatches (with active ring) and size/storage pill buttons that update displayed price, SKU, stock status, and active gallery image.
    - **Delivery & Trust Card:** Configured shipping estimate (Inside Dhaka ৳60 / Outside Dhaka ৳120), 7-day replacement guarantee, and 100% genuine product seal.
    - **Action CTAs:** Quantity counter (- / +), primary **"Add to Cart"** button (triggers mini-cart drawer + toast), secondary high-contrast **"Buy Now"** button (navigates directly to `/checkout`), and wishlist toggle button.
  - **Tabbed Deep-Dive Section:**
    - Tab 1: **Full Specifications Matrix** (structured table with grouped specs).
    - Tab 2: **Product Overview & Details** (rich descriptions and feature highlights).
    - Tab 3: **Customer Reviews & Ratings** (rating score bar breakdown, verified buyer reviews, and review submission trigger).
  - **Related & Recommended Products Carousel:** Curated similar products from the same category.
  - **Mobile Sticky Action Bar:** Bottom docked bar with current variant price and prominent "Add to Cart" CTA.

### Decision 15: Unified Catalog Engine for Shop, Category & Archive
- **Approved:**
  - Reusable **`ProductCatalogView`** powering:
    - `/shop`: All catalog products.
    - `/category/[slug]`: Scoped by category with category header banner, breadcrumbs, and subcategory pill shortcuts.
    - `/archive`: Filterable archive / clearance / deal showcase.
  - **Desktop Filter Sidebar:** Sticky left column with collapsible sections: Category tree, Brand checkboxes (with search & count badges), Price Range slider / numeric min-max in BDT, In-Stock toggle, and Star Rating filter.
  - **Mobile Filter Drawer:** Animated slide-up bottom sheet with active filter counts and "Apply Filters" button.
  - **Top Toolbar:** Results count, Active filter tags (with 1-click remove & "Clear All"), Grid/List display toggle, and Sort dropdown (Featured, Price: Low to High, Price: High to Low, Newest, Best Rating).

### Decision 16: Cart, Bangladesh-Optimized Checkout & Wishlist Flow
- **Approved:**
  - **Full Cart Page (`/cart`):**
    - Itemized table/cards with product thumbnail, title, selected variant, unit price, quantity increment/decrement, line total, and remove item action.
    - Promo / Coupon input with real-time discount calculation.
    - Shipping cost estimator (Inside Dhaka / Outside Dhaka / Free threshold).
    - Sticky Order Summary card with Subtotal, Discount, Shipping, Total, and "Proceed to Checkout" CTA.
  - **Checkout Page (`/checkout`):**
    - **Step 1: Contact & Delivery Information:** Customer name, phone number (with Bangladesh +880 format helper), Division / District / Upazila selection, full street address, and delivery instructions.
    - **Step 2: Delivery Speed:** Standard Delivery (৳60 / ৳120) or Express Courier.
    - **Step 3: Payment Method:** Cash on Delivery (COD) pre-selected with zero hassle; tabs for bKash, Nagad, and Card payments.
    - **Order Summary Sidebar & Instant Order Success:** Live review of items and costs; placing order triggers an instant animated Order Confirmation screen with generated Order ID, delivery timeline, and "Continue Shopping" or "Track Order" CTAs.
  - **Wishlist Page (`/wishlist`):**
    - Dedicated view of all saved products with stock status and direct "Move to Cart" action.



