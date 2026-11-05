# Proposal

## Why

The membership API (plans, checkout, callback, history) exists, but customers have no way to see plans, buy one or check their status. The marketplace directory (Phase 3 of `docs/freelancer.md`) does not exist at all, so approved freelancers are invisible and membership has nothing to unlock. Both are needed before messaging (Phase 4) can ship.

## What Changes

- Add the customer-facing membership UI in `apps/web`: public pricing page, current-plan status, payment history, PayStation return page.
- Add a `marketplace` NestJS module: freelancer listing with filters, sort and cursor pagination; public profile; phone reveal with membership check, daily quota and audit log.
- Add the marketplace UI in `apps/web`: directory (`/hire`) and public profile (`/hire/[id]`), with locked/unlocked contact actions.
- Add a "Hire a Professional" entry to the storefront navigation.
- Listing and profile require login (redirect to `/login` with a return URL). Pricing is public.
- Search uses Prisma filters and `ILIKE`. The `pg_trgm` index is a later additive step.
- No change to Order, Payment or checkout behavior.

## Capabilities

### New Capabilities
- `membership-pricing-ui`: customer pages for viewing plans, buying, current membership status, history and payment result.
- `marketplace-directory`: freelancer listing, filters, public profile and phone reveal (API and UI).

### Modified Capabilities

## Impact

- API: new `apps/api/src/marketplace` module (controller, service, DTOs, specs); `app.module.ts` registration. Reuses `MembershipGuard`, `ContactReveal`, `AuditLog` and the settings module (reveal quota).
- Web: new routes `/membership`, `/membership/callback`, `/hire`, `/hire/[id]`; new components under `components/Membership` and `components/Marketplace`; client libs `lib/membership-client.ts`, `lib/marketplace-client.ts`; navbar and mobile nav links.
- No new dependencies. No schema change is expected (models already exist); a missing index may be added with `db push`.

