# E-commerce Storefront Design Guidelines
**Project:** AZ E-commerce  
**Document:** `docs/storefront-design.md`  
**Status:** Design direction / under GRILL-ME review  
**Reference websites:** https://www.pickaboo.com/ and https://www.techlandbd.com/  
**Stack context:** Next.js storefront, NestJS REST API, PostgreSQL, Prisma; single-vendor physical-products store.

> This document proposes a design direction based on the supplied project PRD and data model, plus a high-level review of the two public reference storefronts. It is not a pixel-perfect copy of either brand. Re-check live pages before implementation because promotions, layouts, and branding can change.
>
> Decisions approved during GRILL-ME are recorded in `docs/storefront-design-decisions.md`. Where the two conflict, the decisions document wins.

---

## 1. Executive recommendation

Build a **clean, trustworthy, product-first Bangladesh e-commerce storefront** that combines:

- **Pickaboo-inspired strengths:** broad consumer-electronics merchandising, promotional storytelling, clear category discovery, trust messaging, and shopping journeys for many product types.
- **TechLand BD-inspired strengths:** technology-focused category browsing, visible deals and savings, price comparison, product-focused merchandising, and clear technical product information.
- **Our own design identity:** restrained navy/blue brand system, white/light-grey surfaces, clear price hierarchy, strong product photography, consistent spacing, and mobile-first checkout.

Do not copy either site's exact layout, logo, text, assets, or brand identity. Use them as UX references and create a coherent, original design system.

## 2. Reference-site analysis

### 2.1 Pickaboo — https://www.pickaboo.com/

**Positioning observed from public site/search-visible content:** a broad electronics and lifestyle e-commerce destination covering smartphones, computing, cameras, accessories, kitchen/home appliances, and other consumer products. Public descriptions emphasize official warranty, delivery, offers, and multiple payment options. A published redesign case study describes work on search, categories, product cards, cart, pricing/deal calculations, OTP/social login, and order tracking.

**Design ideas worth learning from**
- Use a prominent, easy-to-find global search because customers may know the model or brand they want.
- Organize a wide catalog into understandable category groups and curated homepage sections.
- Make promotions, official warranty, delivery, and payment assurances easy to notice without making every area shout.
- Support product discovery through category entry points, campaigns, and related products.
- Treat order tracking and checkout clarity as part of the shopping experience, not just backend features.

**Risks to avoid**
- Too many promotional strips, badges, carousels, or homepage sections can make the page feel crowded.
- Do not allow banners to push search and real product discovery too far below the fold.
- Avoid inconsistent card heights, overlong product titles, and repeated competing CTA buttons.
- Do not display trust claims (official warranty, free delivery, return policy) unless the store can actually honor them.

### 2.2 TechLand BD — https://www.techlandbd.com/

**Homepage structure visible in public page content:** featured categories, flash sale, featured products, latest products, and best sellers. The catalog includes computer components, laptops, desktop PCs, monitors, networking products, accessories, and selected home appliances. Deal cards display current and previous prices and savings.

**Design ideas worth learning from**
- Feature category shortcuts near the top of the page.
- Use distinct, reusable merchandising sections such as Flash Sale, Featured Products, New Arrivals, and Best Sellers.
- Show selling price, previous price, and savings in a consistent, scannable hierarchy.
- Support detailed, technical product titles while limiting line count on cards.
- Provide category filters and sorting for customers who know specifications such as brand, price, processor, memory, storage, or screen size.

**Risks to avoid**
- Large lists of products and SEO-heavy text can make the homepage unnecessarily long.
- Flash-sale timers should only appear when there is a real, configured end time.
- Savings must be calculated from valid prices; do not show fake discounts or stale crossed-out prices.
- Technical specifications should be structured and filterable rather than crammed into every product card.

### 2.3 What we should take from both

| Area | Recommended approach |
|---|---|
| Header | Compact announcement strip, logo, large search, account, wishlist (if in scope), and cart |
| Navigation | Category menu with a well-designed desktop mega-menu; usable mobile drawer |
| Homepage | One main campaign banner, category shortcuts, a few focused product sections, trust strip |
| Product card | Image, brand, short title, price, optional compare-at price, honest discount, stock state, one clear action |
| Listing page | Breadcrumbs, category title, filters, sort, result count, responsive grid |
| Product detail | Gallery, title, SKU/brand, price, variant choices, stock, delivery estimate, warranty/returns information, add-to-cart |
| Cart/checkout | Clear item summary, editable quantity, transparent shipping/discount/total, minimal steps |
| Trust | Real warranty, delivery, COD/payment, return, contact and support information |
| Mobile | Search-first layout, tap-friendly controls, compact sticky cart/add-to-cart where appropriate |

---

## 3. Recommended brand colors

### Proposed palette: “Trust Blue + Commerce Orange”

This is a recommendation for our own brand, not a claim about either reference site's official color values.

| Token | Hex | Use |
|---|---|---|
| Primary | `#1D4ED8` | Primary buttons, links, selected states, key interactive controls |
| Primary hover | `#1E40AF` | Hover/pressed state for primary actions |
| Primary soft | `#EFF6FF` | Selected filter backgrounds, subtle blue panels |
| Secondary | `#0F172A` | Main navigation, strong headings, footer, high-contrast text |
| Accent / CTA | `#F97316` | Limited campaign accents, deal highlights, secondary emphasis |
| Accent hover | `#EA580C` | Hover state for accent actions |
| Success | `#15803D` | In-stock and success states |
| Warning | `#D97706` | Low-stock warnings and caution |
| Danger | `#DC2626` | Errors, out-of-stock where appropriate, destructive actions |
| Page background | `#F8FAFC` | Main page background |
| Surface | `#FFFFFF` | Cards, menus, forms, panels |
| Border | `#E2E8F0` | Card borders, dividers, inputs |
| Main text | `#0F172A` | Body text and headings |
| Muted text | `#64748B` | Secondary labels, metadata |
| Disabled | `#94A3B8` | Disabled controls and low-emphasis elements |

### Color usage rules

- Use **blue as the primary brand/action color**. Keep the majority of the interface white or very light grey.
- Use orange sparingly for campaign/deal emphasis. Do not make every button orange.
- Use dark navy for text and selected structural areas; avoid using pure black everywhere.
- Red is for errors or genuine discount labels only, not for all sale-related UI.
- Keep text/background contrast accessible. Never communicate status by color alone; add labels or icons.
- Do not use a gradient behind every section. If a campaign needs a gradient, limit it to that campaign.
- Product images should remain the visual focus; UI colors should not compete with them.

### Suggested component styling

- Primary button: blue background, white text, 8px radius, clear hover/focus states.
- Secondary button: white background, navy text, grey border.
- Sale badge: pale red background with dark red text, only when a real discount exists.
- Product card: white surface, subtle border, 10–12px radius, consistent image frame, restrained hover elevation.
- Inputs: white background, grey border, visible blue focus ring.
- Avoid excessive shadows, pill-shaped controls everywhere, and unnecessary animations.

---

## 4. Storefront information architecture

Proposed top-level navigation (final categories must be confirmed in GRILL-ME):

- Home
- Shop / All Products
- Categories
- Brands
- Deals
- New Arrivals
- Best Sellers
- Support / Contact

Suggested category examples for a technology-led general electronics store:
- Laptops
- Desktop PCs
- Components
- Monitors
- Phones & Tablets
- Accessories
- Networking
- Smart Devices
- Home Appliances

Do not hard-code these examples if the catalog will cover different product families. Categories and brands should come from the API/database.

### Header hierarchy

1. Optional announcement bar for one real offer or service message.
2. Main header: logo, search input, account/sign-in, cart.
3. Category navigation row on desktop.
4. Mobile header: logo, search access, cart; category drawer and search should remain easy to reach.

Search should support product title, SKU where appropriate, brand, and category. Search suggestions should show useful results, not a large decorative dropdown.

---

## 5. Homepage layout proposal

Recommended order:

1. **Announcement bar** — one short, accurate message; optional and dismissible.
2. **Main header + search** — dominant, immediately visible.
3. **Category shortcuts** — 6–10 high-priority categories with consistent icons/images.
4. **Hero campaign** — one main banner with a clear headline, short copy, and one CTA. Add carousel only if there are multiple real campaigns and accessible controls.
5. **Trust strip** — only confirmed promises such as official warranty, secure checkout, COD, delivery support, or return policy.
6. **Flash Sale / Deals** — only when active promotions exist; clear end time if time-limited.
7. **Featured Products** — curated products selected by admin.
8. **Shop by Category** — category tiles for important catalog groups.
9. **Best Sellers** — use actual sales data or rename to “Popular Picks” if it is manually curated.
10. **New Arrivals** — newest active products.
11. **Brand strip** — only brands with available products and valid logos.
12. **Service/help section** — contact, delivery, warranty and returns links.
13. **Footer** — categories, customer service, policies, contact details, social links, and payment methods actually supported.

Keep the first screen focused. Do not show every section if the catalog is small; hide empty sections instead of displaying placeholders.

---

## 6. Product cards and catalog pages

### Product card content order

1. Product image in a consistent aspect-ratio frame; use `object-fit: contain` for most electronics.
2. Brand or small category label.
3. Product title, clamped to 2–3 lines.
4. Current selling price in BDT (৳).
5. Previous price only when there is a valid sale price.
6. Discount amount/percentage only when calculated from valid prices.
7. Stock/availability status when useful.
8. One clear primary action, such as “View Details” or “Add to Cart”, depending on the product/variant flow.

Do not force every product card to have a large button if it makes the grid noisy. Keep card heights consistent and ensure keyboard focus is visible.

### Listing/category page

- Breadcrumbs and descriptive page title.
- Result count and sort control.
- Desktop: filter sidebar plus responsive product grid.
- Mobile: filter and sort controls in a clear bottom sheet/drawer.
- Useful filters should be based on actual product data: category, brand, price range, availability, and relevant attributes.
- Filters must work together and be reflected in URL query parameters where practical.
- Include loading, empty, error, and pagination states.
- Avoid displaying filters that have no matching values.

### Product details page

- Image gallery with zoom or larger view; thumbnails accessible on mobile.
- Title, brand, SKU, reviews only if real reviews exist.
- Clear price, sale price and discount explanation.
- Variant selectors (e.g. color, storage, size) based on available variant data.
- Stock availability and quantity validation.
- Delivery estimate/fee based on configured shipping rules; do not invent a promise before address/zone is known.
- Warranty, returns, payment methods, and seller/support information based on real store policy.
- Description and structured specifications.
- Related products only when relevant.
- Add-to-cart feedback and a clear path to cart/checkout.

The existing data model supports Product, ProductImage, ProductVariant, Attribute/AttributeValue, Inventory, Brand, Category, Review, ShippingZone and ShippingMethod. The UI should reflect these models without exposing internal database structure to customers.

---

## 7. Cart and checkout UX

- Support a persistent cart for signed-in users and guest sessions if the backend implements both.
- Clearly show product image/title, selected variant, unit price, quantity, and line total.
- Allow quantity changes and removal with clear feedback.
- Revalidate price and inventory on the server; never trust totals submitted by the browser.
- Show subtotal, coupon discount, shipping fee, and grand total separately.
- Explain when a shipping fee cannot be finalized until an address/zone is selected.
- Use a short checkout flow with clear progress and field-level validation.
- Keep Cash on Delivery visible if it is enabled; only show online payment methods after they are implemented and verified.
- Prevent duplicate submissions and show a useful order confirmation with order number and next steps.
- Make error recovery easy: preserve valid entered data and explain what needs correction.

---

## 8. Responsive design and accessibility

### Breakpoint guidance
Use the project's existing design-system breakpoints if available. Otherwise start with:
- Small mobile: `320–479px`
- Mobile/large phone: `480–767px`
- Tablet: `768–1023px`
- Desktop: `1024px+`

### Requirements
- Mobile-first layout and product grids that adapt without horizontal page scrolling.
- Tap targets around 44×44 CSS pixels where practical.
- Visible keyboard focus and semantic headings/landmarks.
- Proper labels for search, forms, filters, and icon-only buttons.
- Useful alt text for meaningful product images; decorative images should not create noise.
- Respect reduced-motion preferences.
- Do not use color as the only status indicator.
- Verify contrast and test keyboard-only navigation.
- Use skeletons only when they accurately represent loading content; provide empty/error states too.

---

## 9. Design-system implementation guidance

Before adding dependencies, inspect the existing repository and reuse compatible packages. Avoid adding a UI library solely for one component.

Create or standardize:
- Design tokens for colors, spacing, typography, radii, shadows, and breakpoints.
- Shared storefront shell: announcement bar, header, search, navigation, footer.
- Shared product card, price display, sale badge, rating display, stock badge, quantity control.
- Shared filter/sort controls, breadcrumbs, pagination, empty/loading/error states.
- Shared cart summary, form fields, alert/toast, modal/drawer.
- Consistent spacing scale, e.g. 4, 8, 12, 16, 24, 32, 48, 64px.
- A restrained type scale and readable body text; use an existing project font if it is already suitable.

Keep storefront components separate from the admin dashboard. The storefront should optimize shopping and conversion; the admin dashboard should optimize operational tasks and data management.

### Suggested CSS tokens

```css
:root {
  --color-primary: #1D4ED8;
  --color-primary-hover: #1E40AF;
  --color-primary-soft: #EFF6FF;
  --color-secondary: #0F172A;
  --color-accent: #F97316;
  --color-accent-hover: #EA580C;
  --color-success: #15803D;
  --color-warning: #D97706;
  --color-danger: #DC2626;
  --color-page: #F8FAFC;
  --color-surface: #FFFFFF;
  --color-border: #E2E8F0;
  --color-text: #0F172A;
  --color-muted: #64748B;
  --radius-card: 12px;
  --radius-control: 8px;
}
```

---

## 10. GRILL-ME interview checklist

Run GRILL-ME **before implementing the design**, asking one question at a time. For each question, recommend a practical default and explain the trade-off briefly. Record approved decisions in `docs/storefront-design-decisions.md`.

1. **Catalog scope:** Is the store technology-focused like TechLand, broad electronics/home like Pickaboo, or a different product mix?
2. **Brand identity:** Should we adopt the proposed Trust Blue + Commerce Orange palette, or does AZ E-commerce already have a logo/brand guide?
3. **Target customers:** Are customers mainly budget shoppers, premium-tech buyers, business buyers, or a mix?
4. **Homepage priorities:** Which three categories or campaigns must be visible first?
5. **Promotions:** Are flash sales, coupons, campaign banners, and countdown timers in the initial release?
6. **Product variants:** Which options must customers choose before adding an item to cart?
7. **Product information:** Which specifications, warranty details, delivery estimates, and stock states are available and reliable?
8. **Search and filters:** Which product attributes must be searchable/filterable for the first release?
9. **Checkout:** Guest checkout or login-required? Confirm required address and phone fields for Bangladesh.
10. **Payments:** Is COD the only initial option, consistent with the PRD, or are other methods already integrated?
11. **Delivery:** Which delivery zones, fees, courier names, and estimate rules are confirmed?
12. **Trust and policies:** What are the real warranty, returns, refund, support and contact policies?
13. **Mobile behavior:** Should a sticky bottom Add to Cart bar be used on product pages?
14. **Reviews:** Are reviews available at launch, and must they be linked to verified purchases?
15. **Content ownership:** Which homepage sections are admin-managed versus automatically generated from catalog/sales data?
16. **Accessibility/language:** English only initially, or English and Bangla? Any brand/font requirements?
17. **Performance:** What is the minimum supported device/network, and are there existing image/CDN constraints?
18. **Scope boundary:** Which pages are included in this design change: homepage only, or full storefront (listing, detail, cart, checkout, account, orders)?

**Interview rule:** Do not ask all questions in one message. Ask one question, wait for the answer, update the decision record, then continue. If the user says “recommend defaults”, apply reasonable defaults and mark them as assumptions requiring approval.

---

## 11. OpenSpec workflow for implementing the design

Follow the project's PRD workflow. Do not jump directly from this document into coding.

### Step 1 — Review current project
Inspect `apps/web`, `apps/api`, root package scripts, existing styles/components, installed UI libraries, routing, API clients, and current pages. Identify what exists before proposing changes. Do not replace working architecture without evidence.

### Step 2 — GRILL-ME
Use the interview checklist in Section 10. Ask one question at a time. Confirm scope, design decisions, data availability, mobile behavior, and acceptance criteria.

### Step 3 — Save decisions
Create/update:
- `docs/storefront-design.md` — this design direction and design system.
- `docs/storefront-design-decisions.md` — decisions explicitly approved during GRILL-ME.
- `docs/PRD.md` only if product requirements materially change; do not duplicate the entire design document into the PRD.

### Step 4 — OpenSpec Explore
Use `opsx:explore` to inspect the current storefront and compare it against the approved design documents. Identify missing pages/components, implementation constraints, data/API dependencies, accessibility/performance risks, and the smallest safe implementation boundary. Explore mode must not implement the feature.

### Step 5 — OpenSpec Propose
Create a focused change, for example `storefront-design` or a smaller scoped change such as `storefront-homepage`. Include:
- `proposal.md`: user problem, goals, non-goals, and scope.
- `design.md`: approved visual system, component architecture, responsive behavior, and API/data dependencies.
- `specs/.../spec.md`: testable behavior and scenarios.
- `tasks.md`: ordered implementation and verification tasks.

Keep the change aligned with `docs/storefront-design.md`, `docs/storefront-design-decisions.md`, `docs/PRD.md`, and the approved `docs/data-model.md`. Resolve conflicts explicitly rather than silently rewriting the approved data model.

### Step 6 — Review before Apply
Check that proposal, specs, design, and tasks agree; scope is small enough; existing packages are reused; API requirements are feasible; and acceptance criteria are testable. Do not add backend/database changes merely to support decorative UI.

### Step 7 — OpenSpec Apply
Implement in small, reviewable slices:
1. Design tokens and storefront shell.
2. Header, search, and navigation.
3. Reusable product card and price/stock displays.
4. Homepage sections using real API data.
5. Listing/filter/sort pages.
6. Product details and variant selection.
7. Cart and checkout UX.
8. Responsive and accessibility refinements.

Reorder only when repository dependencies justify it. Do not implement all features in one giant operation.

### Step 8 — Verify and review
Run relevant lint, type-check, tests, and build commands from the actual package scripts. Verify:
- Desktop, tablet, and mobile layouts.
- Loading, empty, error, and unavailable-stock states.
- Search, filters, sorting, pagination, variants, cart and totals.
- Keyboard navigation, visible focus, labels and contrast.
- Real API data and error handling; no hard-coded fake products in production pages.
- No invented discount, delivery, warranty, payment, or stock promises.
- No broken links, overflow, console errors, or unverified test claims.

### Step 9 — Fix and archive
Fix issues and rerun affected checks. Summarize changed files and test results. Archive the OpenSpec change only after implementation and verification are complete.

---

## 12. Suggested reusable prompts

### GRILL-ME prompt

```text
Act as a senior e-commerce UX designer and requirements interviewer.
Read docs/PRD.md, docs/data-model.md, and docs/storefront-design.md, then inspect the existing storefront before suggesting changes.
Run a GRILL-ME interview one question at a time. For every question, recommend a practical default and explain the trade-off briefly.
Clarify catalog scope, branding, homepage priorities, product cards, filters, variants, checkout, mobile UX, accessibility, API data, and acceptance criteria.
Do not implement code during the interview. Record approved decisions in docs/storefront-design-decisions.md. Do not silently change approved requirements or the data model.
```

### OpenSpec Explore prompt

```text
Run opsx:explore for the approved storefront-design work.
Inspect the existing repository and compare it with docs/PRD.md, docs/data-model.md, docs/storefront-design.md, and docs/storefront-design-decisions.md.
Report existing components, gaps, API/data dependencies, responsive/accessibility risks, and the smallest sensible change scope.
Do not implement code and do not assume missing features exist. Ask for clarification only where a decision blocks a reliable proposal.
```

### OpenSpec Propose prompt

```text
Use OpenSpec to propose a focused storefront design change based on the approved docs/storefront-design.md and docs/storefront-design-decisions.md.
Create proposal.md, design.md, specs, and tasks.md with testable acceptance criteria.
Inspect the repository first, reuse existing dependencies, preserve the approved PRD/data model, and separate confirmed requirements from assumptions.
Do not implement code during propose. Keep the change small enough to review and verify.
```

### OpenSpec Apply prompt

```text
Apply only the approved OpenSpec change.
Follow its tasks in order; inspect existing code before editing, reuse compatible components and dependencies, and keep the storefront responsive and accessible.
Use real API data where available; do not invent products, discounts, stock, delivery, warranty, or payment promises.
After implementation, run the relevant lint, type-check, tests, and build scripts; fix failures and report exact results. Do not archive until verification passes.
```

---

## 13. Acceptance criteria

The design implementation is ready for review when:

- The storefront has a consistent, original visual identity and reusable design tokens.
- Header, search, navigation, product cards, and key CTAs are visually consistent.
- Homepage sections are driven by valid data and empty sections are hidden.
- Category listing, product detail, cart, and checkout layouts work on mobile and desktop within approved scope.
- Product price, discount, variants, and availability are displayed accurately.
- Shipping, payment, warranty, return, and review claims match implemented business rules.
- Loading, empty, error, and out-of-stock states are handled.
- Keyboard navigation, focus states, labels, and contrast are checked.
- Relevant automated checks pass, and no test is reported as passing unless it actually ran.

## 14. Source and confidence notes

- **Project-specific facts** come from the supplied `docs/PRD.md` and `docs/data-model.md`: Next.js storefront, NestJS API, PostgreSQL/Prisma, product catalog, variants, inventory, cart, orders, COD-first payment approach, shipping, coupons, reviews, and the GRILL-ME/OpenSpec workflow.
- **Reference-site observations** are high-level observations from public website content and search-visible page structure. Live layouts and campaigns may change.
- **Design decisions** such as the proposed color palette, section order, spacing, and component styles are recommendations for AZ E-commerce, not verified facts about Pickaboo or TechLand BD.
