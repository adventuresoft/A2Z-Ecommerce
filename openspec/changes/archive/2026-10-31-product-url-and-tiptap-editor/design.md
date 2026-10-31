# Design: Product URL Exposure & Tiptap Rich-Text Editor

## Context

The administrative frontend (`apps/admin`) uses Next.js 16 (App Router), React 19, Bootstrap 5.3.8, and AdminLTE 4.10.0. Product creation and updating currently pass form state to `createProduct` / `updateProduct` API endpoints. The product `description` field is stored as text in PostgreSQL via Prisma, which can directly accept and store rich HTML strings. Currently, `apps/admin/app/catalog/products/new/page.tsx` and `[id]/edit/page.tsx` use a standard HTML `<textarea>`, and after saving, redirect to `/catalog/products?updated=true` without sharing product slug or URL details.

## Goals / Non-Goals

**Goals:**
- Provide an intuitive, modern WYSIWYG editor using Tiptap (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`) styled with Bootstrap 5 and Bootstrap Icons (`bi-*`) matching AdminLTE visual conventions.
- Enable rich text formatting: Bold, Italic, Strike, Headings (H2, H3), Bullet/Numbered lists, Blockquotes, Hyperlinks, Horizontal Rules, and Undo/Redo.
- Ensure SSR-safe client execution on Next.js 16 (`immediatelyRender: false`).
- Expose the live storefront product URL (`${STOREFRONT_URL}/products/${slug}`) across three key touchpoints:
  1. Success alert banner on `/catalog/products` with "View Live" and "Copy URL" buttons.
  2. Persistent "View on Storefront" button in the Product Edit page header.
  3. Action icon button in each row of `ProductsTable.tsx`.

**Non-Goals:**
- Complex multi-column page builders or embedded external widgets in product descriptions.
- Markdown syntax editing mode (descriptions are standard HTML formatted for e-commerce storefronts).

## Decisions

### Decision 1: Tiptap v2 for Rich Text Editing
- **Choice:** Install `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, and `@tiptap/extension-link`.
- **Rationale:** Tiptap is headless, framework-native to React, and does not inject forced styling or heavy bundles. We can style toolbar buttons directly using standard Bootstrap 5 classes (`btn btn-sm btn-outline-secondary`, `btn-group`, `card-header`).
- **Alternatives Considered:**
  - *Quill / React-Quill:* Outdated maintenance, tricky React 19 compatibility, difficult custom toolbar styling.
  - *TinyMCE:* Heavyweight, requires external API keys or licensing, difficult theme synchronization with AdminLTE.

### Decision 2: Storefront URL Resolution Helper
- **Choice:** Create a helper in `apps/admin/services/products.ts`:
  ```ts
  export function getProductStorefrontUrl(slug: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_STORE_URL || "http://localhost:3000";
    return `${baseUrl.replace(/\/$/, "")}/products/${slug}`;
  }
  ```
- **Rationale:** Keeps storefront URL computation consistent across table rows, edit page headers, and success banners. Allows easy environment configuration for production storefront domains.

### Decision 3: Rich Redirect Parameters on Product Save
- **Choice:** Update the save handlers in both `new/page.tsx` and `[id]/edit/page.tsx` to redirect with descriptive query params:
  ```ts
  router.push(`/catalog/products?saved=true&slug=${encodeURIComponent(product.slug)}&title=${encodeURIComponent(product.title)}`);
  ```
- **Rationale:** This allows `/catalog/products/page.tsx` to display a tailored success banner showing the exact product title, storefront URL, a 1-click "View Live" link (`target="_blank"`), and a 1-click "Copy URL" button.

### Decision 4: SSR Safety in Next.js 16
- **Choice:** Mark `TiptapEditor.tsx` with `"use client"`, configure `immediatelyRender: false` in `useEditor`, and ensure proper placeholder / mounting fallback to prevent React 19 hydration warnings.

## Risks / Trade-offs

- **[Risk]** React 19 peer-dependency warnings during `@tiptap/react` installation.
  - *Mitigation:* Install current compatible `@tiptap/react` packages or use appropriate package manager flags if peer warnings occur, and verify with `pnpm --filter admin check-types` and `npm --prefix apps/admin run build`.
- **[Risk]** Clipboard API permissions in insecure or unsupported browser contexts.
  - *Mitigation:* Fall back gracefully to `document.execCommand('copy')` if `navigator.clipboard` is unavailable, and provide visual tooltips/toast feedback.
