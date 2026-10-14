# Project Review — PRD & Admin Dashboard Design vs. Repository

**Date:** 2026-10-13 · **Scope:** read-only review (no code, config, or package changes intended)

**Legend:** ✅ Verified (inspected or executed) · ⚠️ Assumption / inferred · ❌ Missing

> [!WARNING]
> **Side effect during review.** At 11:16 `apps/api/node_modules/@prisma/client` resolved correctly. I then ran `pnpm --filter api exec prisma validate`, which hung, and I killed it. Afterwards (verified):
> - `apps/api/node_modules/@prisma` and `apps/api/node_modules/prisma` are **no longer present**.
> - `apps/api/node_modules/.bin` had a timestamp of 11:17:37, which falls inside that command's run.
> - `pnpm-lock.yaml`, `node_modules/.modules.yaml` and git-tracked files are **unchanged**. `git status` is clean.
>
> ⚠️ Most likely, pnpm 11 began re-syncing dependencies before `exec` and was interrupted partway. A `pnpm install` should restore the links. I have **not** run it, because you asked me not to install anything.

---

## 1. Repository architecture (✅)

| Item | Finding |
|---|---|
| Monorepo | Turborepo `2.11.7` + pnpm `11.25.0` workspaces (`apps/*`, `packages/*`) |
| Node | Installed `v25.3.0`. `engines: >=24` ✅ |
| Git | One root commit (`d163070`). Working tree clean |
| `apps/api` | NestJS API. **It is a gitlink (mode 160000) with its own `.git` and no `.gitmodules`.** The root repo does not track any API source, so a fresh clone gets an empty `apps/api` |
| `apps/admin` | Next.js app straight from `create-next-app`. **It has its own `apps/admin/pnpm-workspace.yaml`** |
| `apps/web`, `apps/docs` | Next.js apps from the Turborepo starter (storefront not started yet) |
| `packages/ui` | Stub components only (`button`, `card`, `code`) |
| `packages/eslint-config`, `typescript-config` | Shared configs. **`admin` and `api` use neither** |
| `docs/` | Only `PRD.md` and `admin-dashboard-design.md`. `docs/data-model.md` does not exist yet |
| OpenSpec | CLI `1.14.1` is installed globally. The repo has **no `openspec/` folder**, so it is not initialised |
| Skills | `frontend-design`, `grill-me`, `vercel-react-best-practices` are installed. **`grill-me` just calls a `grilling` skill, which is not installed** |

---

## 2. Dependencies

### 2.1 API (`apps/api`): declared vs installed (✅ via `pnpm list`)

| Package | Declared | Installed |
|---|---|---|
| @nestjs/common / core / platform-express / testing | ^12.0.1 | 12.1.2 |
| @nestjs/cli / schematics | ^12.0.0 | 12.0.8 / 12.0.6 |
| @nestjs/observe | ^0.3.0 | 0.3.7 |
| @nestjs/mau | ^0.2.6 | 0.2.8 |
| @prisma/client / prisma | 7.10.0 | 7.10.0 (links now missing, see the warning above) |
| typescript | ^6.0.2 | 6.0.3 |
| vitest / @vitest/coverage-v8 | ^4.1.2 | 4.1.11 |
| oxlint / oxlint-tsgolint | ^1.58 / ^7.0.2001 | 1.87.0 / 7.0.2004 |
| supertest, rxjs, reflect-metadata | — | 7.3.1, 7.8.2, 0.2.2 |

### 2.2 Admin (`apps/admin`)

| Package | Declared | Status |
|---|---|---|
| next | 16.4.0 | ✅ in `apps/admin/node_modules/.pnpm` |
| react / react-dom | 19.3.0 | ✅ in local `.pnpm` |
| tailwindcss + @tailwindcss/turbopack | ^4 | tailwindcss 4.3.3 in local `.pnpm` |
| typescript | ^5 | 5.9.3 |
| eslint / eslint-config-next | ^9 / 16.4.0 | eslint 9.39.5 |

> [!IMPORTANT]
> **The admin app is effectively not installed in the workspace** (✅ verified):
> - `apps/admin` is **not listed as an importer in the root `pnpm-lock.yaml`**.
> - `pnpm --filter admin list` returns nothing.
> - `apps/admin/node_modules` holds only a private `.pnpm` store (352 entries) and no top-level links, so `require.resolve('next')` from `apps/admin` fails.
> - ⚠️ Likely cause: the nested `pnpm-workspace.yaml` makes pnpm treat `apps/admin` as its own workspace root.

### 2.3 Missing dependencies for the PRD (❌ not installed; latest versions and peers checked on npm ✅)

| Need (PRD) | Candidate | Latest | Works with Nest 12 / TS 6? |
|---|---|---|---|
| Prisma 7 DB connection | `@prisma/adapter-pg` + `pg` | 7.10.0 | ✅ same version as the client |
| Env config | `@nestjs/config` | 12.0.1 | ✅ |
| Swagger | `@nestjs/swagger` | 12.0.2 | ✅ (peer TS ^5.5 \|\| ^6) |
| DTO validation | `class-validator`, `class-transformer` | 0.15.1 / 0.5.1 | ✅ |
| Partial DTOs | `@nestjs/mapped-types` (or the swagger helpers) | 12.0.0 | ✅ |
| JWT | `@nestjs/jwt` (+ optional `@nestjs/passport`, `passport-jwt`) | 12.0.3 / 12.0.0 | ✅ |
| Password hashing | `argon2` (or `bcrypt`) | 0.45.1 | ⚠️ native build, so it must be added to `allowBuilds` |
| Rate limiting | `@nestjs/throttler` | 6.7.1 | ✅ |
| Security headers | `helmet` | 8.3.0 | ✅ |

The **Admin UI** (only after the design decision in §6) would need `admin-lte@4.10.0` with peer `bootstrap ^5.3.8`, plus an icon set such as `bootstrap-icons@1.13.2`. The admin app has no data-fetching, form or validation libraries yet. ⚠️ Whether to add any (for example `react-hook-form` or `zod`) is still to be decided.

### 2.4 Version drift and compatibility issues

| # | Issue | Evidence | Severity |
|---|---|---|---|
| 1 | Three TypeScript majors in use: root/web/docs/ui `7.0.2`, api `6.0.3`, admin `5.9.3` | ✅ package.json + installed | Medium. ⚠️ TS 7 (native) tooling support in Next and ESLint is unverified |
| 2 | Different React/Next versions: admin `19.3.0`/`16.4.0` vs web/docs/ui `19.2.8`/`16.3.8` | ✅ | Medium. Two React copies if admin uses `@repo/ui` |
| 3 | ESLint 9 in admin vs ESLint 10 elsewhere. Admin skips `@repo/eslint-config` | ✅ | Low |
| 4 | Port clashes: web `3000` vs admin default `3000`; docs `3001` vs API default `3001` | ✅ scripts / `main.ts` | Medium for `turbo dev` |
| 5 | `admin` has no `check-types` script, so `turbo check-types` skips it | ✅ | Low |
| 6 | Admin `next.config.ts` turns on `cacheComponents`, `partialPrefetching` and `experimental.agentFeedback` | ✅ | ⚠️ `cacheComponents` affects auth/cookie data patterns |
| 7 | Tailwind is wired in through a Turbopack loader rule (`@tailwindcss/turbopack`) rather than the usual PostCSS plugin | ✅ | ⚠️ Not verified to build |

---

## 3. Backend status

### 3.1 Verified runtime blockers (✅ executed)

1. **The compiled API crashes when loaded.** `dist/prisma/index.js` uses extensionless ESM imports (`'./prisma.service'`). Running `import()` on it gives `ERR_MODULE_NOT_FOUND`. Cause: the package is `"type": "module"` with `module: preserve`, and `src/prisma/*.ts` leave out the `.js` extensions that the other files include.
2. **Prisma 7 needs a driver adapter.** Calling `new PrismaClient()` with no options throws `PrismaClientInitializationError: A driver adapter is required`. `PrismaService extends PrismaClient` passes no options, and `@prisma/adapter-pg`/`pg` are not installed.
3. **Placeholder telemetry credentials are hardcoded.** `ObserveModule.forRoot({ appKey: 'YOUR_APP_KEY', … })` sits in `app.module.ts`. This breaks the PRD rule that secrets live in env, and it sends telemetry to an external service.

### 3.2 Existing modules (✅)

| Module | State |
|---|---|
| `AppModule` / `AppController` / `AppService` | Scaffold `GET /` → "Hello World!" |
| `PrismaModule` (global) / `PrismaService` | Present but broken (see §3.1) |
| `ObserveModule` | Present, with placeholder keys |
| Tests | 1 unit spec and 1 e2e spec (scaffold only). ⚠️ Not run |

### 3.3 Missing foundations (❌)

- `main.ts` has no global `/api/v1` prefix or versioning, no `ValidationPipe`, no Swagger, no CORS (needed by admin and web), no `helmet`, no shutdown hooks, and no config module or env validation.
- There is no shared layer: exception filter, error response shape, pagination DTO, guards, decorators (`@Roles`, `@Public`, `@CurrentUser`), or transaction helper.

### 3.4 Missing feature modules vs PRD §5/§7 (❌ all)

Auth · Users/Profile · Addresses · Roles/Permissions · Categories · Brands · Products/Images/Attributes/Variants · Inventory/StockMovements · Cart · Checkout · Orders/StatusHistory · Payments (COD) · Refunds · Shipping (methods/zones/shipments) · Coupons · Reviews · Notifications · Reports · Settings · AuditLog · Uploads.

---

## 4. Database and Prisma status

| Item | Status |
|---|---|
| PostgreSQL | ✅ Windows service `postgresql-x64-18` running, port 5432 open |
| `DATABASE_URL` | ✅ Set in `apps/api/.env` with a `postgresql://` scheme (value not printed). `.env.example` exists |
| `prisma.config.ts` | ✅ Prisma 7 style. Loads `.env` with `process.loadEnvFile` |
| Schema | ✅ Contains only `User` (id uuid, email, name, password). No roles, no other entities |
| Generator | ✅ `prisma-client-js`. ⚠️ Prisma 7's recommended generator is `prisma-client` with an explicit `output` |
| Generated client | ✅ Present in the pnpm store (generated 2026-10-12, `User` only) |
| Migrations | ❌ No `prisma/migrations` folder |
| DB exists / migrate status | ⚠️ **Unverified.** The Prisma CLI could not run (hung via `pnpm exec`, then the link went missing) |
| Stray store versions | ✅ `prisma@6.19.3` and `prisma@8.0.0-rc.22` sit in the root store. ⚠️ Leftovers from earlier installs |

> [!NOTE]
> The existing `User` model was written before the data-model interview. PRD §6 and §9 require the full model to be agreed and saved to `docs/data-model.md` **before** any schema work. Treat the current model as disposable.

---

## 5. Admin dashboard frontend readiness

| Design-doc requirement | Status |
|---|---|
| Admin app location | ✅ `apps/admin` (App Router) |
| Layouts / pages | ❌ Only the create-next-app `layout.tsx` and `page.tsx` (metadata still "Create Next App") |
| Shared components (`AdminLayout`, `DataTable`, …) | ❌ None. `@repo/ui` has stubs only |
| Auth flow / route protection | ❌ None (the backend has no auth either) |
| API client / env config | ❌ No client and no `NEXT_PUBLIC_API_URL` or `.env` |
| AdminLTE / Bootstrap / icons | ❌ Not installed |
| Styling | ✅ Tailwind v4, set up by the scaffold |

### Navigation map (design doc §6, classified per its rule)

No admin feature exists in either the API or the UI, so **nothing is "Existing"**.

| Group | Items | Class |
|---|---|---|
| Dashboard | Overview | Required (PRD §5.10 reports) |
| Catalog | Products, Categories, Brands, Attributes, Variants | Required (§5.2) |
| Orders | Orders, Order details | Required (§5.5) |
| Orders | Returns | Required as rules/status (§5.5). A dedicated page is **Proposed** |
| Inventory | Overview, Adjustments, Movements, Low stock | Required (§5.3) |
| Customers | List, Details | Required (§4 Admin) |
| Marketing | Coupons | Required (§5.8) |
| Marketing | "Discounts" (separate from coupons) | **Proposed**: the PRD only defines coupons |
| Payments | Transactions/History, Refunds | Required (§5.6) |
| Shipping | Shipments, Methods, Zones | Required (§5.7) |
| Engagement | Reviews (moderation) | Required (§5.9, "where required") |
| Engagement | Notifications | Required (history, §5.9) |
| Reports | Sales, Orders, Inventory, Customers, Payments/Refunds | Required (§5.10) |
| System | Settings, Activity/Audit logs | Required (§5.10) |
| System | Admin users, Roles & Permissions | **Pending**: PRD §4 says to confirm in the interview |

**Every dashboard widget is blocked by missing endpoints**, for example `/admin/reports/*`, `/admin/orders`, `/admin/inventory?lowStock` and `/admin/customers`.

---

## 6. AdminLTE and `frontend-design` compatibility

### 6.1 AdminLTE (✅ npm registry)

- `admin-lte@4.10.0` is the latest. Peer dependency is `bootstrap ^5.3.8`. It has no runtime dependencies and no jQuery. Other tags: `legacy` = 4.8.0, `v2-latest` = 2.4.18.
- ⚠️ AdminLTE 4 JavaScript plugins (sidebar push-menu, treeview, card widgets) work by manipulating the DOM directly. In a React/Next App Router app they should be **re-implemented as React components**, using only AdminLTE's CSS and markup conventions.

**Conflict:** the admin app already uses **Tailwind v4**. The design doc says to use the Bootstrap version that matches AdminLTE and not to add a second CSS framework without approval. Tailwind's Preflight reset and Bootstrap's Reboot also clash.

| Option | Approach | Trade-off |
|---|---|---|
| **A (recommended)** | Remove Tailwind from admin. Use AdminLTE 4 CSS + Bootstrap 5.3 + Bootstrap Icons, with React components for layout and behaviour | Matches the spec literally. Switching costs almost nothing because admin is an empty scaffold |
| B | Keep Tailwind and rebuild AdminLTE's layout and look in Tailwind | No Bootstrap, but it is a custom imitation of AdminLTE rather than AdminLTE |
| C | Use both | Not recommended: reset conflicts, two token systems, and it breaks spec §4 |

### 6.2 `frontend-design` skill (✅ read in full)

- **Conflict:** the skill asks for distinctive, risk-taking aesthetics. The design doc asks for a restrained AdminLTE look with no excess gradients or animation.
- **Resolution:** the skill itself says *"where the brief pins down a visual direction, follow it exactly — the brief's own words always win."* So the design doc takes priority.
- **Parts of the skill that still apply:**
  - A compact token plan (4–6 named colours, typefaces, layout sketch).
  - A deliberate choice of typeface.
  - Copy guidance: sentence case, active verbs, consistent action names, direct error messages, empty states that tell users what to do.
  - Restraint, and a quality floor for responsiveness, focus states and reduced motion.
- **Smaller tensions to decide on:**
  - AdminLTE sidebar headers are uppercase by default; the skill discourages all-caps labels.
  - AdminLTE's `small-box`/`info-box` stat cards are close to the "SaaS card kit" the skill warns against. The design doc also forbids decorative cards, so use them only for real metrics.

---

## 7. Decisions needed

1. **API repo:** turn `apps/api` into a proper submodule, or fold it into the root repo (recommended: fold it in)?
2. **Admin workspace:** delete `apps/admin/pnpm-workspace.yaml` and move its `allowBuilds` to the root so admin joins the workspace (recommended)?
3. **Styling:** pick Option A, B or C (§6.1).
4. **Version alignment:** which React, Next, TypeScript and ESLint versions should all apps share?
5. **Observe module:** remove `@nestjs/observe`, or move its keys into env?
6. **Ports:** proposed web 3000, admin 3002, docs 3003, API 3001 (or keep `apps/docs` at all?).

---

## 8. Recommended next steps (after your approval)

1. **Repair the environment.** Run `pnpm install` from the root after decision 2. This restores the `@prisma` links and adds admin to the lockfile. Then rerun `prisma validate` and `prisma migrate status`.
2. **Phase 1 – Backend foundation** (one OpenSpec change):
   - Fix the ESM imports and add the Prisma adapter (`@prisma/adapter-pg`).
   - Add `@nestjs/config` with env validation.
   - Set the `/api/v1` prefix and a global `ValidationPipe`.
   - Add Swagger, CORS, `helmet`, a shared error format and pagination.
   - Add a health endpoint.
   - Run lint, test and build.
3. **Process setup.** Run `openspec init`, and install or fix the `grilling` skill that `grill-me` relies on.
4. **GRILL-ME interview** on the permission model, order/payment/shipment status transitions, stock reservation rules and the full data model. Save the result to `docs/data-model.md`.
5. **Admin foundation.** Apply the styling decision, write the token plan, then build `AdminLayout`, sidebar, navbar and auth shell using only the routes that have been approved.
6. **First vertical slice.** Auth + admin login → Catalog: Categories CRUD, end to end (API, Swagger, admin table and form). Categories are the simplest entity and exercise every shared pattern.
7. Continue through the PRD §10 phases. The dashboard overview should come after the Orders and Reports endpoints exist, so it can show real data.

> [!TIP]
> Steps 2 and 4 are a good fit for `/grill-me` (decisions) and `/plan` (the foundation change).
