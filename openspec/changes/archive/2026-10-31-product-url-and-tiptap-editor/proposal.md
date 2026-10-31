# Proposal: Product URL Display & Tiptap Rich Text Editor

## Why

Currently, catalog administrators must enter product descriptions using an unstyled plain text `<textarea>`, making it impossible to format structured product specifications, headings, bulleted lists, quotes, and links. Furthermore, after saving or updating a product, administrators are redirected back to the catalog without seeing or copying the live storefront link, hindering rapid content verification and previewing. Introducing a modern Tiptap rich-text editor and direct storefront preview links streamlines catalog operations and elevates content quality.

## What Changes

- **Tiptap Rich-Text Description Editor**:
  - Install Tiptap core and extensions (`@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extension-link`) in `apps/admin`.
  - Build a reusable Bootstrap 5 / AdminLTE styled `TiptapEditor` component providing formatting controls: Bold, Italic, Strike, Headings (H2, H3), Bullet Lists, Ordered Lists, Blockquotes, Links, Horizontal Rules, and Undo/Redo.
  - Integrate `TiptapEditor` into both Product Create (`/catalog/products/new`) and Product Edit (`/catalog/products/[id]/edit`) pages, replacing the plain `textarea`.
  - Ensure sanitized HTML strings are passed to the API and cleanly re-hydrated on edit.
- **Storefront URL Exposure**:
  - Display a prominent success alert banner on `/catalog/products` after product creation or update that displays the full storefront product URL, a "View Live" button opening in a new tab, and a "Copy URL" button with clipboard feedback.
  - Add a persistent "View on Storefront" action button to the product Edit page header alongside "Back to Products".
  - Add an external link icon button (`bi bi-box-arrow-up-right`) in each row of `ProductsTable.tsx` for instant storefront preview.
  - Configure the base storefront URL via `NEXT_PUBLIC_STORE_URL` (fallback to `http://localhost:3000`).

## Capabilities

### Modified Capabilities

- `product-catalog`: Product description formatting support for rich HTML content and administrative storefront URL preview resolution.

## Impact

- `apps/admin/package.json`: Add Tiptap dependencies.
- `apps/admin/app/catalog/products/components/TiptapEditor.tsx`: New component.
- `apps/admin/app/catalog/products/new/page.tsx`: Replace description textarea with `TiptapEditor`, pass slug/URL parameters upon redirect.
- `apps/admin/app/catalog/products/[id]/edit/page.tsx`: Replace description textarea with `TiptapEditor`, add storefront URL header link and URL parameter on redirect.
- `apps/admin/app/catalog/products/page.tsx`: Display enhanced success alert with storefront link and copy button.
- `apps/admin/app/catalog/products/components/ProductsTable.tsx`: Add storefront link action button.
