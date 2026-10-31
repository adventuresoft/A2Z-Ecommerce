"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createProduct, CreateProductPayload } from "../../../../services/products";
import { CategoryItem, categoriesApi, formatCategoryOptions } from "../../../../services/categories";
import { BrandItem, brandsApi } from "../../../../services/brands";
import { SingleProductImageUpload } from "../components/SingleProductImageUpload";
import {
  VariantMatrixGenerator,
  VariantRow,
} from "../components/VariantMatrixGenerator";
import { TagMultiSelect } from "../components/TagMultiSelect";
import { TiptapEditor } from "../components/TiptapEditor";
import {
  ProductSpecificationsEditor,
  SpecificationItem,
  DEFAULT_SPECIFICATIONS,
} from "../components/ProductSpecificationsEditor";

export default function NewProductPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [warrantyText, setWarrantyText] = useState("Official BTRC / Warranty");
  const [specifications, setSpecifications] = useState<SpecificationItem[]>([
    ...DEFAULT_SPECIFICATIONS,
  ]);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Tags State
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedNewTags, setSelectedNewTags] = useState<string[]>([]);

  // Simple Product Pricing Shortcuts
  const [isMultiVariant, setIsMultiVariant] = useState(false);
  const [simpleSku, setSimpleSku] = useState("");
  const [simpleRegularPrice, setSimpleRegularPrice] = useState("29.99");
  const [simpleSalePrice, setSimpleSalePrice] = useState("");
  const [simpleWeightGrams, setSimpleWeightGrams] = useState("200");

  // Multi-variant rows
  const [variants, setVariants] = useState<VariantRow[]>([]);

  // Submitting & Feedback
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [catRes, brandRes] = await Promise.all([
          categoriesApi.getCategories({ limit: 100 }),
          brandsApi.getBrands({ limit: 100 }),
        ]);
        setCategories(catRes.items);
        setBrands(brandRes.items);
        if (catRes.items.length > 0) {
          setCategoryId(catRes.items[0].id);
        }
      } catch (err) {
        console.error("Failed to load options:", err);
      } finally {
        setLoadingOptions(false);
      }
    }
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Product title is required.");
      return;
    }
    if (!categoryId) {
      setError("Please select a Category.");
      return;
    }
    if (!description || !description.trim() || description === "<p></p>") {
      setError("Product description is required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: CreateProductPayload = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        categoryId,
        brandId: brandId || undefined,
        tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
        tags: selectedNewTags.length > 0 ? selectedNewTags : undefined,
        shortDescription: shortDescription.trim() || undefined,
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        warrantyText: warrantyText.trim() || undefined,
        specifications: specifications.filter((s) => s.key.trim() !== ""),
        description: description.trim(),
        isFeatured,
        isActive,
      };

      if (isMultiVariant && variants.length > 0) {
        payload.variants = variants.map((v) => ({
          sku: v.sku.trim(),
          barcode: v.barcode?.trim() || undefined,
          regularPrice: typeof v.regularPrice === "number" ? v.regularPrice : parseFloat(String(v.regularPrice)),
          salePrice: v.salePrice ? (typeof v.salePrice === "number" ? v.salePrice : parseFloat(String(v.salePrice))) : undefined,
          weightGrams: v.weightGrams ? parseInt(String(v.weightGrams), 10) : undefined,
          imageId: v.imageId || undefined,
          imageUrl: v.imageUrl?.trim() || undefined,
          isActive: v.isActive ?? true,
          attributeValueIds: v.attributeValueIds || [],
        }));
      } else {
        payload.sku = simpleSku.trim() || undefined;
        payload.regularPrice = parseFloat(simpleRegularPrice) || 0.01;
        payload.salePrice = simpleSalePrice ? parseFloat(simpleSalePrice) : undefined;
        payload.weightGrams = simpleWeightGrams ? parseInt(simpleWeightGrams, 10) : undefined;
      }

      const created = await createProduct(payload);
      // Redirect to edit page so user can upload gallery images
      router.push(`/catalog/products/${created.id}/edit?created=true`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create product");
      setSubmitting(false);
    }
  };

  return (
    <div className="container-fluid px-0 pb-5">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb small m-0 mb-1">
              <li className="breadcrumb-item">
                <Link href="/catalog/products" className="text-decoration-none">
                  Products
                </Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                New Product
              </li>
            </ol>
          </nav>
          <h4 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
            <i className="bi bi-plus-circle text-primary"></i>
            Create New Product
          </h4>
        </div>
        <Link href="/catalog/products" className="btn btn-outline-secondary btn-sm">
          <i className="bi bi-arrow-left me-1"></i> Back to Catalog
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show mb-4 shadow-sm" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          {/* Main Info Column */}
          <div className="col-12 col-lg-8">
            {/* General Information Card */}
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-header bg-white py-3 border-bottom">
                <h5 className="card-title fw-bold m-0 d-flex align-items-center gap-2">
                  <i className="bi bi-info-circle text-primary"></i>
                  General Information
                </h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Product Title <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Classic Cotton Crewneck T-Shirt"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    URL Slug <span className="text-muted small fw-normal">(Optional, auto-generated from title)</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted small">/</span>
                    <input
                      type="text"
                      className="form-control font-monospace"
                      placeholder="classic-cotton-crewneck-t-shirt"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Short Teaser</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Concise 1-2 sentence overview for catalog cards..."
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    maxLength={500}
                  ></textarea>
                </div>

                <div className="mb-0">
                  <label className="form-label fw-semibold">
                    Full Description <span className="text-danger">*</span>
                  </label>
                  <TiptapEditor
                    content={description}
                    onChange={(html) => setDescription(html)}
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            {/* Variants Mode Selector */}
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-header bg-white py-3 border-bottom d-flex align-items-center justify-content-between">
                <h5 className="card-title fw-bold m-0 d-flex align-items-center gap-2">
                  <i className="bi bi-tags text-primary"></i>
                  Product Pricing &amp; SKUs
                </h5>
                <div className="form-check form-switch m-0">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="multiVariantSwitch"
                    checked={isMultiVariant}
                    onChange={(e) => setIsMultiVariant(e.target.checked)}
                  />
                  <label className="form-check-label fw-semibold small" htmlFor="multiVariantSwitch">
                    {isMultiVariant ? "Multi-Variant Mode" : "Simple Single SKU"}
                  </label>
                </div>
              </div>

              <div className="card-body">
                {!isMultiVariant ? (
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">
                        SKU Code <span className="text-muted small fw-normal">(Auto-generated if blank)</span>
                      </label>
                      <input
                        type="text"
                        className="form-control font-monospace"
                        placeholder="TSH-001"
                        value={simpleSku}
                        onChange={(e) => setSimpleSku(e.target.value)}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">
                        Regular Price ($) <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        inputMode="decimal"
                        className="form-control"
                        placeholder="29.99"
                        value={simpleRegularPrice}
                        onChange={(e) => setSimpleRegularPrice(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Sale Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        inputMode="decimal"
                        className="form-control"
                        placeholder="Optional promotional price"
                        value={simpleSalePrice}
                        onChange={(e) => setSimpleSalePrice(e.target.value)}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Weight (grams)</label>
                      <input
                        type="number"
                        min="0"
                        inputMode="numeric"
                        className="form-control"
                        placeholder="200"
                        value={simpleWeightGrams}
                        onChange={(e) => setSimpleWeightGrams(e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <VariantMatrixGenerator
                    productTitle={title}
                    galleryImages={[]}
                    variants={variants}
                    onChange={setVariants}
                  />
                )}
              </div>
            </div>

            {/* Dynamic Product Specifications Table */}
            <ProductSpecificationsEditor
              specifications={specifications}
              onChange={setSpecifications}
            />
          </div>

          {/* Sidebar Settings Column */}
          <div className="col-12 col-lg-4">
            {/* Single Product Image Upload */}
            <SingleProductImageUpload
              imageUrl={thumbnailUrl}
              onChange={setThumbnailUrl}
              disabled={submitting}
            />

            {/* Taxonomy Card */}
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-header bg-white py-3 border-bottom">
                <h6 className="card-title fw-bold m-0 text-dark">Taxonomy &amp; Organization</h6>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold" htmlFor="productCategorySelect">
                    Category <span className="text-danger">*</span>
                  </label>
                  {loadingOptions ? (
                    <div className="small text-muted" role="status" aria-live="polite">Loading categories…</div>
                  ) : (
                    <select
                      id="productCategorySelect"
                      className="form-select"
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      required
                      aria-label="Select product category"
                    >
                      <option value="">Select Category…</option>
                      {formatCategoryOptions(categories).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="mb-0">
                  <label className="form-label fw-semibold" htmlFor="productBrandSelect">Brand / Manufacturer</label>
                  {loadingOptions ? (
                    <div className="small text-muted" role="status" aria-live="polite">Loading brands…</div>
                  ) : (
                    <select
                      id="productBrandSelect"
                      className="form-select"
                      value={brandId}
                      onChange={(e) => setBrandId(e.target.value)}
                      aria-label="Select product brand"
                    >
                      <option value="">No Brand (Generic / Store Brand)</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="mt-3">
                  <label className="form-label fw-semibold d-flex align-items-center justify-content-between">
                    <span>Product Tags</span>
                    <Link
                      href="/catalog/tags"
                      target="_blank"
                      className="small text-decoration-none"
                    >
                      Manage Tags <i className="bi bi-box-arrow-up-right small"></i>
                    </Link>
                  </label>
                  <TagMultiSelect
                    selectedTagIds={selectedTagIds}
                    selectedNewTags={selectedNewTags}
                    onChange={(ids, newTags) => {
                      setSelectedTagIds(ids);
                      setSelectedNewTags(newTags);
                    }}
                  />
                  <div className="form-text small">
                    Pick existing tags or type to create new tags on-the-fly.
                  </div>
                </div>
              </div>
            </div>

            {/* Warranty & Badging Card */}
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-header bg-white py-3 border-bottom">
                <h6 className="card-title fw-bold m-0 text-dark">
                  <i className="bi bi-shield-check text-primary me-2"></i>
                  Warranty &amp; Badge
                </h6>
              </div>
              <div className="card-body">
                <div className="mb-0">
                  <label className="form-label fw-semibold">Warranty / Badge Text</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Official BTRC / Warranty"
                    value={warrantyText}
                    onChange={(e) => setWarrantyText(e.target.value)}
                  />
                  <div className="form-text small">
                    Displays under product title in storefront. Leave blank to hide.
                  </div>
                </div>
              </div>
            </div>

            {/* Visibility & Toggles */}
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-header bg-white py-3 border-bottom">
                <h6 className="card-title fw-bold m-0 text-dark">Catalog Settings</h6>
              </div>
              <div className="card-body">
                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="isActiveSwitch"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <label className="form-check-label fw-semibold" htmlFor="isActiveSwitch">
                    Active &amp; Published
                  </label>
                  <div className="small text-muted">Show this product in storefront catalog searches.</div>
                </div>

                <div className="form-check form-switch mb-0">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="isFeaturedSwitch"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                  />
                  <label className="form-check-label fw-semibold" htmlFor="isFeaturedSwitch">
                    Featured Product
                  </label>
                  <div className="small text-muted">Highlight on homepage showcase sections.</div>
                </div>
              </div>
            </div>

            {/* Save Button Card */}
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2 shadow-sm"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      Saving Product...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg fs-5"></i>
                      Save &amp; Continue to Media Gallery
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
