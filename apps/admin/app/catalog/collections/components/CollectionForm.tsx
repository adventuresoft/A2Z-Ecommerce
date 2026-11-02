"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CollectionItem,
  CollectionPayload,
  collectionsService,
} from "@/services/collections";
import { categoriesApi, CategoryItem } from "@/services/categories";
import { tagsApi, TagItem } from "@/services/tags";
import { getProducts, ProductItem } from "@/services/products";
import { CollectionBannerUpload } from "./CollectionBannerUpload";

interface CollectionFormProps {
  initialData?: CollectionItem | null;
  isEditing?: boolean;
}

export function CollectionForm({
  initialData,
  isEditing = false,
}: CollectionFormProps) {
  const router = useRouter();

  // Basic Info
  const [name, setName] = useState(initialData?.name || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [bannerUrl, setBannerUrl] = useState(initialData?.bannerUrl || "");
  const [badgeText, setBadgeText] = useState(initialData?.badgeText || "");
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [sortOrder, setSortOrder] = useState<number>(initialData?.sortOrder ?? 0);

  // Campaign / Timer
  const [startDate, setStartDate] = useState(
    initialData?.startDate ? initialData.startDate.substring(0, 16) : ""
  );
  const [endDate, setEndDate] = useState(
    initialData?.endDate ? initialData.endDate.substring(0, 16) : ""
  );

  // SEO
  const [seoTitle, setSeoTitle] = useState(initialData?.seoTitle || "");
  const [seoDescription, setSeoDescription] = useState(
    initialData?.seoDescription || ""
  );

  // Hybrid Rules
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    initialData?.categoryIds || []
  );
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    initialData?.tagIds || []
  );
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    initialData?.productIds || []
  );

  // Auxiliary data
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [availableProducts, setAvailableProducts] = useState<ProductItem[]>([]);
  const [productSearch, setProductSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories, tags, products
  useEffect(() => {
    categoriesApi
      .getCategories({ limit: 100 })
      .then((res) => setCategories(res.items || []))
      .catch(() => {});

    tagsApi
      .getTags({ limit: 100 })
      .then((res) => setTags(res.items || []))
      .catch(() => {});

    getProducts({ limit: 50 })
      .then((res) => setAvailableProducts(res.items || []))
      .catch(() => {});
  }, []);

  // Search products
  useEffect(() => {
    if (!productSearch.trim()) return;
    const timer = setTimeout(() => {
      getProducts({ search: productSearch.trim(), limit: 25 })
        .then((res) => setAvailableProducts(res.items || []))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearch]);

  // If initialData changes or loads later
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setSlug(initialData.slug || "");
      setDescription(initialData.description || "");
      setBannerUrl(initialData.bannerUrl || "");
      setBadgeText(initialData.badgeText || "");
      setIsActive(initialData.isActive ?? true);
      setSortOrder(initialData.sortOrder ?? 0);
      setStartDate(
        initialData.startDate ? initialData.startDate.substring(0, 16) : ""
      );
      setEndDate(
        initialData.endDate ? initialData.endDate.substring(0, 16) : ""
      );
      setSeoTitle(initialData.seoTitle || "");
      setSeoDescription(initialData.seoDescription || "");
      if (initialData.categoryIds) setSelectedCategoryIds(initialData.categoryIds);
      if (initialData.tagIds) setSelectedTagIds(initialData.tagIds);
      if (initialData.productIds) setSelectedProductIds(initialData.productIds);
    }
  }, [initialData]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing) {
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/['’]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(generated);
    }
  };

  const toggleCategory = (catId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const toggleProduct = (prodId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(prodId) ? prev.filter((id) => id !== prodId) : [...prev, prodId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Collection name is required.");
      return;
    }

    setLoading(true);
    setError(null);

    const payload: CollectionPayload = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      description: description.trim() || undefined,
      bannerUrl: bannerUrl.trim() || undefined,
      badgeText: badgeText.trim() || undefined,
      isActive,
      sortOrder: Number(sortOrder) || 0,
      startDate: startDate ? new Date(startDate).toISOString() : null,
      endDate: endDate ? new Date(endDate).toISOString() : null,
      seoTitle: seoTitle.trim() || undefined,
      seoDescription: seoDescription.trim() || undefined,
      categoryIds: selectedCategoryIds,
      tagIds: selectedTagIds,
      productIds: selectedProductIds,
    };

    try {
      if (isEditing && initialData) {
        await collectionsService.updateCollection(initialData.id, payload);
      } else {
        await collectionsService.createCollection(payload);
      }
      router.push("/catalog/collections");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Failed to save collection");
    } finally {
      setLoading(false);
    }
  };

  const storeUrl =
    process.env.NEXT_PUBLIC_STORE_URL ||
    process.env.NEXT_PUBLIC_STOREFRONT_URL ||
    "http://localhost:3000";

  return (
    <form onSubmit={handleSubmit} className="pb-5">
      {/* Top Bar with Breadcrumbs & Actions */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1 text-muted small">
              <li className="breadcrumb-item">
                <Link href="/catalog/products" className="text-decoration-none text-muted">
                  Catalog
                </Link>
              </li>
              <li className="breadcrumb-item">
                <Link href="/catalog/collections" className="text-decoration-none text-muted">
                  Collections
                </Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                {isEditing ? "Edit Collection" : "New Collection"}
              </li>
            </ol>
          </nav>
          <h2 className="h4 fw-bold text-dark mb-1">
            {isEditing ? `Edit Collection: ${name || initialData?.name}` : "Create New Collection"}
          </h2>
          <p className="text-muted small mb-0">
            Define promotional campaigns, curated landing pages, and hybrid category rules.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          {isEditing && slug && (
            <a
              href={`${storeUrl.replace(/\/$/, "")}/collections/${slug}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline-secondary rounded-3 d-inline-flex align-items-center gap-1.5"
            >
              <i className="bi bi-box-arrow-up-right" />
              <span>View on Storefront</span>
            </a>
          )}
          <Link
            href="/catalog/collections"
            className="btn btn-light border rounded-3 px-3"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary rounded-3 px-4 d-inline-flex align-items-center gap-2 shadow-sm"
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" />
                Saving...
              </>
            ) : (
              <>
                <i className="bi bi-check-lg" />
                <span>{isEditing ? "Save Changes" : "Create Collection"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger rounded-3 py-2.5 px-3 mb-4 d-flex align-items-center gap-2">
          <i className="bi bi-exclamation-triangle-fill text-danger" />
          <span>{error}</span>
        </div>
      )}

      <div className="row g-4">
        {/* Main Left Column (7 cols) */}
        <div className="col-lg-8">
          {/* 1. General Info Card */}
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-header bg-white border-bottom py-3 px-4">
              <h5 className="card-title fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-info-circle text-primary" />
                General Information
              </h5>
            </div>
            <div className="card-body p-4">
              <div className="row g-3">
                <div className="col-md-7">
                  <label className="form-label fw-semibold small">
                    Collection Title <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control rounded-3"
                    placeholder="e.g. Flash Sale Deals or Best Selling TV"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-5">
                  <label className="form-label fw-semibold small">URL Slug</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted small">/collections/</span>
                    <input
                      type="text"
                      className="form-control rounded-end-3"
                      placeholder="flash-sale"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                    />
                  </div>
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold small">Description</label>
                  <textarea
                    className="form-control rounded-3"
                    rows={3}
                    placeholder="Provide a compelling description for this collection or campaign..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold small">Badge / Pill Text</label>
                  <input
                    type="text"
                    className="form-control rounded-3"
                    placeholder="e.g. 50% Off or Limited Time"
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold small">Collection Banner Image</label>
                  <CollectionBannerUpload
                    bannerUrl={bannerUrl}
                    onChange={(url) => setBannerUrl(url)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Hybrid Matching Rules Card */}
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-header bg-white border-bottom py-3 px-4">
              <h5 className="card-title fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-sliders text-primary" />
                Product Matching Rules (Hybrid)
              </h5>
            </div>
            <div className="card-body p-4">
              <p className="text-muted small mb-4">
                Products matching any selected Categories, Tags, or Pinned Products will be displayed on this collection page.
              </p>

              {/* Categories */}
              <div className="mb-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <label className="form-label small fw-semibold text-dark mb-0">
                    1. Match Categories ({selectedCategoryIds.length} selected)
                  </label>
                  {selectedCategoryIds.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-link btn-sm text-decoration-none p-0 text-muted"
                      onClick={() => setSelectedCategoryIds([])}
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="d-flex flex-wrap gap-1.5 border rounded-3 p-3 bg-light/50" style={{ maxHeight: 150, overflowY: "auto" }}>
                  {categories.length === 0 ? (
                    <span className="text-muted small">Loading categories...</span>
                  ) : (
                    categories.map((cat) => {
                      const isSelected = selectedCategoryIds.includes(cat.id);
                      return (
                        <button
                          type="button"
                          key={cat.id}
                          onClick={() => toggleCategory(cat.id)}
                          className={`btn btn-sm rounded-pill py-1 px-3 text-xs transition-colors ${
                            isSelected
                              ? "btn-primary text-white shadow-xs"
                              : "btn-outline-secondary bg-white text-dark"
                          }`}
                        >
                          {isSelected && <i className="bi bi-check me-1" />}
                          {cat.name}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="mb-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <label className="form-label small fw-semibold text-dark mb-0">
                    2. Match Tags ({selectedTagIds.length} selected)
                  </label>
                  {selectedTagIds.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-link btn-sm text-decoration-none p-0 text-muted"
                      onClick={() => setSelectedTagIds([])}
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="d-flex flex-wrap gap-1.5 border rounded-3 p-3 bg-light/50" style={{ maxHeight: 130, overflowY: "auto" }}>
                  {tags.length === 0 ? (
                    <span className="text-muted small">No tags available</span>
                  ) : (
                    tags.map((tg) => {
                      const isSelected = selectedTagIds.includes(tg.id);
                      return (
                        <button
                          type="button"
                          key={tg.id}
                          onClick={() => toggleTag(tg.id)}
                          className={`btn btn-sm rounded-pill py-1 px-3 text-xs transition-colors ${
                            isSelected
                              ? "btn-info text-white shadow-xs"
                              : "btn-outline-secondary bg-white text-dark"
                          }`}
                        >
                          {isSelected && <i className="bi bi-check me-1" />}
                          #{tg.name}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Pinned Products */}
              <div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <label className="form-label small fw-semibold text-dark mb-0">
                    3. Specific / Pinned Products ({selectedProductIds.length} selected)
                  </label>
                  <div className="input-group input-group-sm" style={{ maxWidth: 220 }}>
                    <span className="input-group-text bg-white">
                      <i className="bi bi-search text-muted small" />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search to pin..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="border rounded-3 p-2 bg-light/30" style={{ maxHeight: 180, overflowY: "auto" }}>
                  {availableProducts.map((p) => {
                    const isSelected = selectedProductIds.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => toggleProduct(p.id)}
                        className={`d-flex align-items-center justify-content-between p-2 rounded-2 mb-1 cursor-pointer transition-colors ${
                          isSelected ? "bg-warning-subtle text-dark border border-warning" : "bg-white hover:bg-light border"
                        }`}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="d-flex align-items-center gap-2 text-truncate" style={{ maxWidth: 460 }}>
                          {isSelected && <i className="bi bi-pin-angle-fill text-warning" />}
                          <span className="small fw-medium text-truncate">{p.title}</span>
                        </div>
                        <span className={`badge ${isSelected ? "bg-warning text-dark" : "bg-light text-muted border"}`}>
                          {isSelected ? "Pinned" : "Pin Product"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 3. SEO Card */}
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-header bg-white border-bottom py-3 px-4">
              <h5 className="card-title fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-search text-primary" />
                Search Engine Optimization (SEO)
              </h5>
            </div>
            <div className="card-body p-4">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label fw-semibold small">SEO Meta Title</label>
                  <input
                    type="text"
                    className="form-control rounded-3"
                    placeholder="Custom page title for Google & search engines"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold small">SEO Meta Description</label>
                  <textarea
                    className="form-control rounded-3"
                    rows={2}
                    placeholder="Brief description previewed in search engine results"
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Column (4 cols) */}
        <div className="col-lg-4">
          {/* Status & Visibility Card */}
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-header bg-white border-bottom py-3 px-4">
              <h6 className="card-title fw-bold text-dark mb-0">Publishing & Status</h6>
            </div>
            <div className="card-body p-4">
              <div className="form-check form-switch mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="collectionStatusSwitch"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <label className="form-check-label fw-semibold small" htmlFor="collectionStatusSwitch">
                  {isActive ? "Active (Live on Website)" : "Draft / Inactive (Hidden)"}
                </label>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold small">Display Sort Priority</label>
                <input
                  type="number"
                  className="form-control rounded-3"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
                />
                <span className="text-muted small">Lower numbers appear first.</span>
              </div>
            </div>
          </div>

          {/* Campaign & Countdown Timer Card */}
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-header bg-white border-bottom py-3 px-4">
              <h6 className="card-title fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-clock-history text-danger" />
                Live Campaign Timer
              </h6>
            </div>
            <div className="card-body p-4">
              <p className="text-muted small mb-3">
                If an End Date is set, a real-time ticking countdown timer will automatically appear on the storefront.
              </p>

              <div className="mb-3">
                <label className="form-label small fw-semibold text-secondary">Start Date & Time</label>
                <input
                  type="datetime-local"
                  className="form-control form-control-sm rounded-3"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="mb-2">
                <label className="form-label small fw-semibold text-secondary">End Date & Time</label>
                <input
                  type="datetime-local"
                  className="form-control form-control-sm rounded-3"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
