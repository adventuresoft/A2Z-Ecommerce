# Tasks

## 1. Tiptap Installation & Reusable Component

- [x] 1.1 Install Tiptap packages (`@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extension-link`) in `apps/admin` and verify clean dependency resolution
- [x] 1.2 Implement reusable `TiptapEditor.tsx` component in `apps/admin/app/catalog/products/components/` with Bootstrap 5 toolbar controls (Bold, Italic, Strike, H2, H3, Lists, Blockquote, Link, HR, Undo/Redo) and scoped styling matching AdminLTE

## 2. Product Create & Edit Form Integration

- [x] 2.1 Integrate `TiptapEditor` into Product Create page (`/catalog/products/new`) replacing the plain `<textarea>`, and verify form state updating and payload submission
- [x] 2.2 Integrate `TiptapEditor` into Product Edit page (`/catalog/products/[id]/edit`) replacing the plain `<textarea>`, and verify HTML content re-hydration and update payload submission

## 3. Storefront Product URL Resolution & Display

- [x] 3.1 Implement `getProductStorefrontUrl(slug: string)` helper in `apps/admin/services/products.ts` respecting `NEXT_PUBLIC_STORE_URL`
- [x] 3.2 Add persistent "View on Storefront" action button to the Product Edit page header (`/catalog/products/[id]/edit`) with `target="_blank"`
- [x] 3.3 Add storefront preview icon button (`bi bi-box-arrow-up-right`) to the actions column in `ProductsTable.tsx`
- [x] 3.4 Update product create and edit save redirect flows to pass saved product slug and title, and enhance `/catalog/products` page to render a rich success alert banner with "View Live" and "Copy URL" buttons with clipboard feedback

## 4. Verification & Quality Assurance

- [x] 4.1 Run type-checking (`npm --prefix apps/admin run check-types`) and linter (`npm --prefix apps/admin run lint`) to ensure zero errors
- [x] 4.2 Run production build (`npm --prefix apps/admin run build`) and backend tests (`npm --prefix apps/api test`) to verify complete system integrity

## Workflow follow-up

- Sync specs and archive the change after implementation and verification are complete.
