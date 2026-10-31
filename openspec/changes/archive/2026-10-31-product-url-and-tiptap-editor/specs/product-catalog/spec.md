# product-catalog Specification Delta

## ADDED Requirements

### Requirement: Administrative Storefront Product Preview and Live Link Generation
The administrative interface SHALL resolve and present direct customer storefront URLs for products (`${STOREFRONT_URL}/products/${slug}`) upon creation or update, displaying a prominent success alert with a "View Live" new-tab link and "Copy URL" button on the products catalog page, a persistent "View on Storefront" action button in the product edit header, and an external preview icon button in the products table actions column.

#### Scenario: Viewing live storefront link after saving a product
- **WHEN** an administrator creates or updates a product and is redirected to `/catalog/products`
- **THEN** the system displays a success banner showing the full product storefront URL, a "View Live" button that opens the storefront page in a new browser tab, and a "Copy URL" button

#### Scenario: Copying product storefront URL to clipboard
- **WHEN** an administrator clicks the "Copy URL" button in the success banner
- **THEN** the system copies the complete storefront URL to the clipboard and shows confirmation feedback

#### Scenario: Opening storefront preview from products table
- **WHEN** an administrator clicks the external link icon button for a product in the catalog table
- **THEN** the system opens the product's live storefront URL in a new browser tab

### Requirement: Rich Text Description Formatting with Tiptap
The administrative product create and edit interfaces SHALL provide a rich-text WYSIWYG editor powered by Tiptap for the product's full `description`, supporting bold, italic, strikethrough, headings (H2, H3), bullet lists, ordered lists, blockquotes, hyperlinks, horizontal rules, and undo/redo history, outputting valid HTML for database persistence.

#### Scenario: Formatting structured product description
- **WHEN** an administrator inputs formatted content using the Tiptap toolbar including headings, bold text, and a bulleted list
- **THEN** the editor renders the formatted text in real time and emits formatted HTML into the form payload

#### Scenario: Loading and editing existing HTML description
- **WHEN** an administrator opens an existing product with saved HTML description in the edit form
- **THEN** the Tiptap editor parses and renders the formatted document with all styles and list structures intact for further editing

## MODIFIED Requirements

### Requirement: Administrative Product and Variant Endpoints
The system SHALL expose administrative REST endpoints beneath `/api/v1/admin/products` and `/api/v1/admin/variants` restricted to `ADMIN` and `SUPER_ADMIN` roles, supporting pagination, keyword search over `title`, `slug`, and `sku`, filtering by `categoryId`, `brandId`, `tagId`, and `isActive`, multipart image uploading, returning associated tags, and persisting full rich-text HTML descriptions without stripping valid semantic tags.

#### Scenario: Searching and filtering products
- **WHEN** an administrator requests `GET /api/v1/admin/products?search=shirt&categoryId=uuid-cat&page=1&limit=10`
- **THEN** the system returns a paginated list of matching products with image thumbnails, category/brand metadata, associated tags, and variant count

#### Scenario: Filtering products by tag in admin table
- **WHEN** an administrator requests `GET /api/v1/admin/products?tagId=uuid-tag-1`
- **THEN** the system returns only products that are linked to the specified tag

#### Scenario: Persisting rich HTML description
- **WHEN** an administrator submits a product with an HTML description containing headings and lists
- **THEN** the system stores the HTML string intact in the database and returns it in the product detail response
