# Tasks

## 1. Marketplace API

- [x] 1.1 Create `marketplace` module with list/profile DTOs (explicit selects, no phone/email/address) and register in `app.module.ts`; verify `pnpm.cmd --dir apps/api build` passes
- [x] 1.2 Implement listing: visibility predicate, filters, text search, sort options, cursor pagination (20/page); verify service spec covers filters, default order, and cursor without repeats
- [x] 1.3 Implement public profile endpoint; verify spec that suspended/incomplete freelancers return 404 and payload has no phone, email or address
- [x] 1.4 Implement `POST :id/reveal-phone` with `MembershipGuard`, Asia/Dhaka daily distinct quota (setting `marketplace.revealDailyLimit`, default 20), free repeat reveal and `AuditLog` entry; verify spec for 403, 429, repeat and suspended cases
- [x] 1.5 Add controller spec for 401 without token; run `pnpm.cmd --dir apps/api test` for the marketplace specs and confirm green

## 2. Web foundations

- [x] 2.1 Add `lib/membership-client.ts` and `lib/marketplace-client.ts` with typed requests, plus a `useMembership` hook; verify `pnpm.cmd --dir apps/web check-types` passes
- [x] 2.2 Add an auth-gate helper that redirects to `/login?redirect=<path>` and renders a skeleton while the session resolves; verify visiting `/hire` logged out redirects and returns after login
- [x] 2.3 Add shared UI parts (availability badge with edge, lock/upgrade button, empty and error states) following the design tokens; verify keyboard focus and contrast in the browser

## 3. Membership pricing UI

- [x] 3.1 Build `/membership` pricing section from `GET /memberships/plans` (public); verify it renders logged out with plan price and duration
- [x] 3.2 Add buy flow (checkout, redirect, logged-out redirect, error retry); verify with a test plan that the gateway URL redirect happens
- [x] 3.3 Add current membership status and renewal labelling (including expiring-soon highlight); verify active, expired and none states
- [x] 3.4 Add payment history list with empty state; verify ordering newest first
- [x] 3.5 Build `/membership/callback` result page confirming via `GET /memberships/me`; verify success, failed and cancelled states

## 4. Marketplace UI

- [x] 4.1 Build `/hire` listing: filter panel (category, profession, skills, experience, price, location cascade, address type, availability), search, sort, cards with availability edge and locked actions; verify filters work and appear in the URL
- [x] 4.2 Add cursor "Load more", empty state and mobile filter panel; verify at 360px width and with more than 20 seeded results
- [x] 4.3 Build `/hire/[id]` profile (sticky contact column, services, skills, portfolio, locations); verify no phone, email or address in the network payload
- [x] 4.4 Implement reveal-number interaction: member success, 403 prompt to buy, 429 quota message, locked state for non-members; verify each response path in the browser
- [x] 4.5 Add "Hire a Professional" links to navbar and mobile nav; verify navigation on desktop and mobile

## 5. Integration checks

- [x] 5.1 Run web and API type checks and lint; verify no new errors
- [x] 5.2 Walk the client journey end to end (login, filter, view, buy plan, reveal number) and confirm existing cart and checkout pages are unchanged

## Workflow follow-up

- Archive the change after review.
- Start the Phase 4 (messaging) change next.
