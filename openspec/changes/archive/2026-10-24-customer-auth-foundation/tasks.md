# Tasks

## 1. Backend Cookie Middleware and Auth Cookie Enhancements

- [x] 1.1 Add `cookie-parser` and `@types/cookie-parser` to `apps/api/package.json` and verify dependencies install and resolve cleanly
- [x] 1.2 Register `cookieParser()` middleware in `apps/api/src/main.ts` and verify the server boots without middleware errors
- [x] 1.3 Update `AuthController` (`login` and `register`) to attach `refreshToken` as an HTTP-only cookie (`SameSite=Lax`, `Path=/api/v1/auth`, 7-day expiration) and verify with tests
- [x] 1.4 Update `AuthController` (`refresh` and `logout`) to read `refreshToken` from cookies with fallback to request body, rotate the cookie, and clear cookie on logout, verifying with tests

## 2. Backend Account & Address Book APIs

- [x] 2.1 Create DTOs in `apps/api/src/account/dto/` (`UpdateProfileDto`, `ChangePasswordDto`, `CreateAddressDto`, `UpdateAddressDto`) with validation decorators and verify validation tests
- [x] 2.2 Implement `AccountService` and `AccountController` (`GET /api/v1/account/profile`, `PATCH /api/v1/account/profile`, `POST /api/v1/account/change-password`) with `tokenVersion` increment, and verify unit tests pass
- [x] 2.3 Implement `AccountAddressesService` and `AccountAddressesController` with transactional default flag enforcement and user ownership isolation, and verify unit tests pass
- [x] 2.4 Register `AccountModule` in `apps/api/src/app.module.ts`, add Swagger documentation, and verify routes render in Swagger UI

## 3. Frontend Network Layer and Authentication Context

- [x] 3.1 Implement `apps/web/lib/api-client.ts` with `credentials: 'include'`, in-memory access token retention, and 401 transparent refresh queue
- [x] 3.2 Implement `apps/web/context/AuthContext.tsx` with user state, login, register, logout, profile update, and silent mount hydration, wrapping it in `apps/web/app/layout.tsx`
- [x] 3.3 Verify token storage and silent refresh behavior with mock/e2e tests asserting session restoration on page reload

## 4. Frontend Customer Authentication Screens

- [x] 4.1 Build `apps/web/app/login/page.tsx` with email/password validation, show/hide password toggle, redirect query parameter handling, and verify visual rendering
- [x] 4.2 Build `apps/web/app/register/page.tsx` with name, email, phone formatting, password strength meter, and auto-login redirection, and verify form validation

## 5. Frontend Customer Dashboard Hub & Address Book

- [x] 5.1 Build `apps/web/app/account/layout.tsx` with unauthenticated route guard and sidebar navigation menu
- [x] 5.2 Build `apps/web/app/account/page.tsx` (Dashboard Overview) with welcome banner, stat summary cards, default address snapshot, and recent orders placeholder
- [x] 5.3 Build `apps/web/app/account/profile/page.tsx` with profile information editor and change password card
- [x] 5.4 Build `apps/web/app/account/addresses/page.tsx` with address cards, default badges, and modal dialog for adding/editing addresses
- [x] 5.5 Update `apps/web/components/Navbar/Header.tsx`, `MobileBottomBar.tsx`, and `MobileDrawer.tsx` to display customer name, avatar, and dropdown links to account pages

## 6. End-to-End Verification & Integration Checks

- [x] 6.1 Run monorepo type-checking (`turbo check-types`) and linting (`turbo lint`) to verify zero errors across `apps/api` and `apps/web`
- [x] 6.2 Verify the full customer journey: registration -> profile inspection -> address creation -> password change with session revocation -> login
