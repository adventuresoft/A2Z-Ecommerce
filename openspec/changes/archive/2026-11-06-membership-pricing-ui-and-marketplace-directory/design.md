## Context

Backend for plans, checkout, callback, `me` and `history` exists in `apps/api/src/memberships`. Prisma already has `ContactReveal`, `FreelancerProfile` (with `startingPrice`, `lastActiveAt`, `availability`), `FreelancerLocation`, `FreelancerService`, and taxonomy tables. Web has `lib/api-client.ts` (`request`), `lib/freelancer-client.ts`, and `CascadingLocationSelector` / `useLocationCascade` from Phase 0. Storefront theme: Tailwind v4 tokens in `globals.css` (primary `#1D4ED8`, accent `#EA580C`, Inter + Hind Siliguri). Source of truth for product rules: `docs/freelancer.md`.

## Goals / Non-Goals

**Goals:**
- Customers can see plans, buy one, see status, history and payment result.
- Customers can discover freelancers, open a profile and reveal a phone number within membership rules.
- A distinct but on-brand marketplace look.

**Non-Goals:**
- Messaging, reports, blocks (Phase 4); dashboards, analytics (Phase 5).
- `pg_trgm`, Elasticsearch, featured boost, reviews.
- Any change to Order, Payment or checkout tables.

## Decisions

**D1. API: new `marketplace` module.** Routes under `/marketplace/freelancers` (list), `/:id` (profile), `/:id/reveal-phone` (POST). All behind `JwtAuthGuard`; reveal also behind `MembershipGuard`. Public DTOs are built with explicit `select`, so phone, email and address can never leak. Alternative (extend `freelancers` module) rejected: it mixes owner and public concerns.

**D2. Listing query.** Prisma `findMany` with `where` built from filters; visibility predicate (APPROVED, `user.isActive`, `locations some`, `services some`). Location filters use `locations some`. Text search is `contains` insensitive on `displayName` and `title`. Cursor: opaque base64 of `(sortKey, id)`; `take = 21` to detect the next page. Default order uses an availability rank, so rank is computed by ordering on `availability` (enum order AVAILABLE, BUSY, UNAVAILABLE must be verified against the schema; otherwise sort in two passes with `orderBy` array) then `lastActiveAt desc`, `createdAt desc`, `id`. Alternative (raw SQL with `pg_trgm`) deferred, per decision.

**D3. Reveal quota.** In one transaction: count distinct `freelancerId` in `ContactReveal` for this user since the start of the current day (Asia/Dhaka); if the freelancer is already in that set, return the number without a new row; if count >= limit (setting `marketplace.revealDailyLimit`, default 20), throw 429; else insert and write an `AuditLog` entry. Day boundary is Asia/Dhaka local midnight.

**D4. Auth gate on web.** Directory and profile routes check the session client-side (existing auth context) and redirect to `/login?redirect=<path>`. Pricing page is public and only checks auth on "Buy". Membership state comes from `GET /memberships/me` and is shared through one small hook, `useMembership`.

**D5. Payment return.** `/membership/callback` reads `status` from the query, then confirms by calling `GET /memberships/me` rather than trusting the query alone, and shows the result.

**D6. State in URL.** Filters, sort and cursor chain live in search params (`useSearchParams`), so results are shareable and survive refresh. "Load more" appends pages client-side.

**D7. Visual design plan (frontend-design + ui-ux-pro-max).**
- Color: Ink `#0F172A`, Paper `#F8FAFC`, Trust blue `#1D4ED8`, Signal orange `#EA580C` (only for locked/upgrade moments), Available green `#15803D`, Busy grey `#64748B`. All text pairs meet 4.5:1.
- Type: Inter for UI and numerals, Hind Siliguri for Bangla. Scale 12/14/16/20/28/40, tight 1.2 line-height for headings, 1.5 body.
- Memorable element: the **availability edge**. Each freelancer card has a 4px vertical edge on its leading side coloured by availability, plus a text badge (colour is never the only signal). Locked contact buttons carry a small padlock and the orange upgrade cue; this is the single orange moment on the card.
- Layout, directory:
```
+---------------------------------------------------------+
| Hire a professional          [search______________] [Sort] |
+----------+----------------------------------------------+
| Filters  | | Photo  Name            Available            |
| category | | Electrician · 6 yrs · Mirpur, Dhaka         |
| district | | House wiring, Fan repair, +3                |
| price    | | From ৳500/visit   [View] [Message] [Number] |
| exp      | |---------------------------------------------|
| avail.   | | next card ...                               |
+----------+----------------------------------------------+
```
- Layout, pricing: three plans side by side, the annual plan shows per-month cost; current membership summary sits above the plans, history below. Left-aligned text, numbers right-aligned.
- Profile: left column photo, name, profession, availability, contact actions (sticky on desktop); right column about, services table, skills, portfolio grid, locations.
- Motion: none on load; only action-driven (filter panel open, reveal confirm). `prefers-reduced-motion` respected.
- Copy: plain verbs ("Show number", "Buy plan", "Renew"); errors say what happened and what to do.
- Review vs generic: avoids identical rounded SaaS cards and gradient washes. Cards are flat rows with a structural availability edge; pricing uses a comparison table-like layout, not three identical glossy cards.

## Risks / Trade-offs

- **Availability sort via enum order** may not match the desired rank → verify in schema and fall back to a computed ordering. Covered by a service test.
- **Client-side auth redirect** causes a flash for visitors → render a skeleton until the session resolves; API remains the real gate.
- **Daily quota race** (two parallel reveals) → quota check and insert in one transaction; worst case is one extra reveal, accepted.
- **`ILIKE` search at 50k rows** may exceed the 300 ms target → measure on seeded data; `pg_trgm` index is the planned follow-up.

