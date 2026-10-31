"use client";

import React, { useState, useEffect, use, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ProductItem,
  ProductImageItem,
  getProduct,
  updateProduct,
  UpdateProductPayload,
  getProductStorefrontUrl,
} from "../../../../../services/products";
import { CategoryItem, categoriesApi, formatCategoryOptions } from "../../../../../services/categories";
import { BrandItem, brandsApi } from "../../../../../services/brands";
import { MediaGallery } from "../../components/MediaGallery";
import { SingleProductImageUpload } from "../../components/SingleProductImageUpload";
import {
  VariantMatrixGenerator,
  VariantRow,
} from "../../components/VariantMatrixGenerator";
import { TagMultiSelect } from "../../components/TagMultiSelect";
import { TiptapEditor } from "../../components/TiptapEditor";
import {
  ProductSpecificationsEditor,
  SpecificationItem,
  DEFAULT_SPECIFICATIONS,
} from "../../components/ProductSpecificationsEditor";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

function EditProductContent({ params }: EditProductPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justCreated = searchParams.get("created") === "true";

  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const [product, setProduct] = useState<ProductItem | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [warrantyText, setWarrantyText] = useState("Official BTRC / Warranty");
  const [specifications, setSpecifications] = useState<SpecificationItem[]>([]);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Tags State
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedNewTags, setSelectedNewTags] = useState<string[]>([]);
  const [initialTags, setInitialTags] = useState<
    Array<{ id: string; name: string; colorCode?: string | null }>
  >([]);

  // Media Gallery & Variants
  const [galleryImages, setGalleryImages] = useState<ProductImageItem[]>([]);
  const [variants, setVariants] = useState<VariantRow[]>([]);

  // Feedback State
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "danger" | "info";
    text: string;
  } | null>(
    justCreated
      ? {
          type: "success",
          text: "Product created successfully! You can now upload gallery photos and assign them to variants.",
        }
      : null,
  );
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = (url: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url);
    } else if (typeof document !== "undefined") {
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [prod, catRes, brandRes] = await Promise.all([
          getProduct(productId),
          categoriesApi.getCategories({ limit: 100 }),
          brandsApi.getBrands({ limit: 100 }),
        ]);

        setProduct(prod);
        setTitle(prod.title);
        setSlug(prod.slug);
        setCategoryId(prod.categoryId);
        setBrandId(prod.brandId || "");
        setShortDescription(prod.shortDescription || "");
        setDescription(prod.description);
        setThumbnailUrl(prod.thumbnailUrl || "");
        setWarrantyText(prod.warrantyText ?? "Official BTRC / Warranty");
        if (Array.isArray(prod.specifications)) {
          setSpecifications(prod.specifications);
        } else if (prod.specifications && typeof prod.specifications === "object") {
          const converted = Object.entries(prod.specifications).map(([k, v]) => ({
            key: k,
            value: typeof v === "string" ? v : JSON.stringify(v),
          }));
          setSpecifications(converted);
        } else {
          setSpecifications([...DEFAULT_SPECIFICATIONS]);
        }
        setIsFeatured(prod.isFeatured);
        setIsActive(prod.isActive);

        const existingTags = prod.tags || [];
        setInitialTags(existingTags);
        setSelectedTagIds(existingTags.map((t) => t.id));
        setSelectedNewTags([]);

        setGalleryImages(prod.images || []);

        const mappedVariants = (prod.variants || []).map((v) => ({
          tempId: v.id,
          sku: v.sku,
          barcode: v.barcode || "",
          regularPrice: v.regularPrice,
          salePrice: v.salePrice ?? undefined,
          weightGrams: v.weightGrams ?? undefined,
          imageId: v.imageId || undefined,
          imageUrl: v.imageUrl || undefined,
          isActive: v.isActive,
          attributeValueIds: (v.attributes || []).map((a) => a.attributeValueId),
          attributeLabels: (v.attributes || []).map((a) => `${a.attributeName}: ${a.value}`),
        }));
        setVariants(mappedVariants);

        setCategories(catRes.items);
        setBrands(brandRes.items);
      } catch (err: unknown) {
        setAlert({
          type: "danger",
          text: err instanceof Error ? err.message : "Failed to load product",
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setAlert({ type: "danger", text: "Product title is required." });
      return;
    }
    if (!categoryId) {
      setAlert({ type: "danger", text: "Please select a Category." });
      return;
    }
    if (!description || !description.trim() || description === "<p></p>") {
      setAlert({ type: "danger", text: "Product description is required." });
      return;
    }

    setSubmitting(true);
    setAlert(null);

    try {
      const payload: UpdateProductPayload = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        categoryId,
        brandId: brandId || undefined,
        tagIds: selectedTagIds,
        tags: selectedNewTags.length > 0 ? selectedNewTags : undefined,
        shortDescription: shortDescription.trim() || undefined,
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        warrantyText: warrantyText.trim() || undefined,
        specifications: specifications.filter((s) => s.key.trim() !== ""),
        description: description.trim(),
        isFeatured,
        isActive,
        variants: variants.map((v) => ({
          sku: v.sku.trim(),
          barcode: v.barcode?.trim() || undefined,
          regularPrice: typeof v.regularPrice === "number" ? v.regularPrice : parseFloat(String(v.regularPrice)),
          salePrice: v.salePrice ? (typeof v.salePrice === "number" ? v.salePrice : parseFloat(String(v.salePrice))) : undefined,
          weightGrams: v.weightGrams ? parseInt(String(v.weightGrams), 10) : undefined,
          imageId: v.imageId || undefined,
          imageUrl: v.imageUrl?.trim() || undefined,
          isActive: v.isActive ?? true,
          attributeValueIds: v.attributeValueIds || [],
        })),
      };

      const updated = await updateProduct(productId, payload);
      router.push(
        `/catalog/products?saved=true&slug=${encodeURIComponent(updated.slug)}&title=${encodeURIComponent(updated.title)}`,
      );
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to update product",
      });
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading product...</span>
        </div>
        <p className="mt-2 text-muted small">Loading product information...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-5">
        <h5 className="fw-bold text-danger">Product Not Found</h5>
        <Link href="/catalog/products" className="btn btn-outline-secondary btn-sm mt-3">
          Back to Products Catalog
        </Link>
      </div>
    );
  }

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
                Edit Product
              </li>
            </ol>
          </nav>
          <h4 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
            <i className="bi bi-pencil-square text-primary"></i>
            Edit Product: {product.title}
          </h4>
        </div>
        <div className="d-flex align-items-center gap-2">
          {product.slug && (
            <a
              href={getProductStorefrontUrl(product.slug)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1 shadow-sm"
              title="View on Customer Storefront"
            >
              <i className="bi bi-box-arrow-up-right"></i>
              <span>View on Storefront</span>
            </a>
          )}
          <Link href="/catalog/products" className="btn btn-outline-secondary btn-sm">
            <i className="bi bi-arrow-left me-1"></i> Back to Products
          </Link>
        </div>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show mb-4 shadow-sm`} role="alert">
          <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-2">
              <i
                className={`bi ${
                  alert.type === "success"
                    ? "bi-check-circle-fill fs-5"
                    : alert.type === "danger"
                      ? "bi-exclamation-octagon-fill fs-5"
                      : "bi-info-circle-fill fs-5"
                }`}
              ></i>
              <div>
                <span className="fw-semibold">{alert.text}</span>
                {alert.type === "success" && product?.slug && (
                  <div className="small text-muted mt-1 d-flex flex-wrap align-items-center gap-2">
                    <span>Storefront Link:</span>
                    <code className="text-primary bg-white px-2 py-0.5 rounded border small font-monospace">
                      {getProductStorefrontUrl(product.slug)}
                    </code>
                  </div>
                )}
              </div>
            </div>

            {alert.type === "success" && product?.slug && (
              <div className="d-flex align-items-center gap-2 mt-2 mt-md-0 ms-md-auto me-4">
                <a
                  href={getProductStorefrontUrl(product.slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-success d-flex align-items-center gap-1 shadow-sm px-3"
                  title="Open storefront product page in a new tab"
                >
                  <i className="bi bi-box-arrow-up-right"></i>
                  <span>View Live</span>
                </a>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary bg-white d-flex align-items-center gap-1 shadow-sm px-2"
                  onClick={() => handleCopyUrl(getProductStorefrontUrl(product.slug))}
                  title="Copy Storefront URL"
                >
                  <i className={`bi ${copied ? "bi-check2 text-success" : "bi-clipboard"}`}></i>
                  <span>{copied ? "Copied!" : "Copy URL"}</span>
                </button>
              </div>
            )}
          </div>
          <button type="button" className="btn-close" onClick={() => setAlert(null)} aria-label="Close"></button>
        </div>
      )}

      {/* Media Gallery Component */}
      <MediaGallery
        productId={productId}
        images={galleryImages}
        onImagesChange={setGalleryImages}
      />

      {/* Main Edit Form */}
      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          <div className="col-12 col-lg-8">
            {/* General Info Card */}
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
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">URL Slug</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted small">/</span>
                    <input
                      type="text"
                      className="form-control font-monospace"
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

            {/* Variant Matrix Generator with Photo Linkage (Option B) */}
            <VariantMatrixGenerator
              productTitle={title}
              galleryImages={galleryImages}
              variants={variants}
              onChange={setVariants}
            />

            {/* Dynamic Product Specifications Table */}
            <ProductSpecificationsEditor
              specifications={specifications}
              onChange={setSpecifications}
            />
          </div>

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
                  <label className="form-label fw-semibold" htmlFor="editProductCategorySelect">
                    Category <span className="text-danger">*</span>
                  </label>
                  <select
                    id="editProductCategorySelect"
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
                </div>

                <div className="mb-0">
                  <label className="form-label fw-semibold" htmlFor="editProductBrandSelect">Brand / Manufacturer</label>
                  <select
                    id="editProductBrandSelect"
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
                    initialTags={initialTags}
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

            {/* Visibility Settings */}
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-header bg-white py-3 border-bottom">
                <h6 className="card-title fw-bold m-0 text-dark">Catalog Settings</h6>
              </div>
              <div className="card-body">
                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="editIsActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <label className="form-check-label fw-semibold" htmlFor="editIsActive">
                    Active &amp; Published
                  </label>
                </div>

                <div className="form-check form-switch mb-0">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="editIsFeatured"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                  />
                  <label className="form-check-label fw-semibold" htmlFor="editIsFeatured">
                    Featured Product
                  </label>
                </div>
              </div>
            </div>

            {/* Save Card */}
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2 shadow-sm"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      <span>Saving Changes…</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-save" aria-hidden="true"></i>
                      <span>Save Product Changes</span>
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

export default function EditProductPage({ params }: EditProductPageProps) {
  return (
    <Suspense
      fallback={
        <div className="container-fluid py-4 text-center" role="status" aria-live="polite">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading editor…</span>
          </div>
        </div>
      }
    >
      <EditProductContent params={params} />
    </Suspense>
  );
}
