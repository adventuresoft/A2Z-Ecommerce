"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CollectionDesignTemplate,
  CollectionItem,
  CollectionPayload,
  collectionsService,
} from "@/services/collections";
import { categoriesApi, CategoryItem } from "@/services/categories";
import { tagsApi, TagItem } from "@/services/tags";
import { getProducts, ProductItem } from "@/services/products";
import { CollectionBannerUpload } from "./CollectionBannerUpload";

interface MultiSelectOption {
  id: string;
  label: string;
  prefix?: string;
}

interface MultiSelectFieldProps {
  id: string;
  label: string;
  placeholder: string;
  options: MultiSelectOption[];
  selectedIds: string[];
  onChange: (nextIds: string[]) => void;
  accentVariant?: "blue" | "teal";
  emptyMessage?: string;
}

function MultiSelectField({
  id,
  label,
  placeholder,
  options,
  selectedIds,
  onChange,
  accentVariant = "blue",
  emptyMessage = "No matching options found",
}: MultiSelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const optionMap = useMemo(() => {
    const map = new Map<string, MultiSelectOption>();
    options.forEach((opt) => map.set(opt.id, opt));
    return map;
  }, [options]);

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [options, query]);

  const toggleOption = (optId: string) => {
    if (selectedIds.includes(optId)) {
      onChange(selectedIds.filter((item) => item !== optId));
    } else {
      onChange([...selectedIds, optId]);
    }
  };

  const removeOption = (e: React.MouseEvent, optId: string) => {
    e.stopPropagation();
    onChange(selectedIds.filter((item) => item !== optId));
  };

  const handleSelectAllFiltered = (e: React.MouseEvent) => {
    e.stopPropagation();
    const merged = Array.from(
      new Set([...selectedIds, ...filteredOptions.map((o) => o.id)])
    );
    onChange(merged);
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
    setQuery("");
  };

  const isBlue = accentVariant === "blue";
  const chipBg = isBlue ? "#eff6ff" : "#ecfeff";
  const chipBorder = isBlue ? "#bfdbfe" : "#a5f3fc";
  const chipText = isBlue ? "#1d4ed8" : "#0e7490";
  const activeBorder = isBlue ? "#2563eb" : "#0891b2";
  const activeRing = isBlue
    ? "0 0 0 3px rgba(37, 99, 235, 0.14)"
    : "0 0 0 3px rgba(8, 145, 178, 0.14)";

  return (
    <div className="mb-4" ref={containerRef}>
      {/* Field Header */}
      <div className="d-flex align-items-center justify-content-between mb-1.5">
        <label
          htmlFor={id}
          className="form-label small fw-semibold text-dark mb-0 d-flex align-items-center gap-2"
        >
          <span>{label}</span>
          <span
            className="badge rounded-pill fw-semibold"
            style={{
              backgroundColor: selectedIds.length > 0 ? chipBg : "#f1f5f9",
              color: selectedIds.length > 0 ? chipText : "#64748b",
              border: `1px solid ${
                selectedIds.length > 0 ? chipBorder : "#e2e8f0"
              }`,
              fontSize: "0.7rem",
            }}
          >
            {selectedIds.length} selected
          </span>
        </label>

        {selectedIds.length > 0 && (
          <button
            type="button"
            className="btn btn-link btn-sm text-decoration-none p-0 text-muted small"
            onClick={handleClearAll}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Interactive Multi-Select Combobox Surface */}
      <div className="position-relative">
        <div
          onClick={() => {
            setIsOpen(true);
            inputRef.current?.focus();
          }}
          className="d-flex flex-wrap align-items-center justify-content-between gap-1.5 rounded-3 bg-white px-2.5 py-2"
          style={{
            minHeight: 44,
            cursor: "text",
            border: `1px solid ${isOpen ? activeBorder : "#cbd5e1"}`,
            boxShadow: isOpen ? activeRing : "0 1px 2px rgba(15, 23, 42, 0.03)",
            transition: "border-color 0.15s ease, box-shadow 0.15s ease",
          }}
        >
          <div className="d-flex flex-wrap align-items-center gap-1.5 flex-grow-1">
            {selectedIds.map((selId) => {
              const item = optionMap.get(selId);
              if (!item) return null;
              return (
                <span
                  key={selId}
                  className="d-inline-flex align-items-center gap-1 rounded-2 px-2 py-1 small fw-semibold"
                  style={{
                    backgroundColor: chipBg,
                    color: chipText,
                    border: `1px solid ${chipBorder}`,
                    fontSize: "0.76rem",
                    lineHeight: 1.2,
                  }}
                >
                  {item.prefix && (
                    <span style={{ opacity: 0.7 }}>{item.prefix}</span>
                  )}
                  <span>{item.label}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${item.label}`}
                    onClick={(e) => removeOption(e, selId)}
                    className="btn p-0 border-0 d-inline-flex align-items-center justify-content-center ms-0.5"
                    style={{
                      color: chipText,
                      width: 15,
                      height: 15,
                      borderRadius: "50%",
                      lineHeight: 1,
                    }}
                  >
                    <i className="bi bi-x" style={{ fontSize: "0.85rem" }} />
                  </button>
                </span>
              );
            })}

            <input
              ref={inputRef}
              id={id}
              type="text"
              value={query}
              onFocus={() => setIsOpen(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!isOpen) setIsOpen(true);
              }}
              onKeyDown={(e) => {
                if (
                  e.key === "Backspace" &&
                  query === "" &&
                  selectedIds.length > 0
                ) {
                  onChange(selectedIds.slice(0, -1));
                } else if (e.key === "Escape") {
                  setIsOpen(false);
                }
              }}
              placeholder={selectedIds.length === 0 ? placeholder : "Search..."}
              className="border-0 bg-transparent small text-dark flex-grow-1"
              style={{
                outline: "none",
                minWidth: 120,
                padding: "2px 4px",
              }}
            />
          </div>

          <div className="d-flex align-items-center gap-1 pe-1">
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={(e) => {
                  e.stopPropagation();
                  setQuery("");
                  inputRef.current?.focus();
                }}
                className="btn btn-sm p-0 border-0 text-muted d-inline-flex align-items-center justify-content-center"
                style={{ width: 20, height: 20 }}
              >
                <i className="bi bi-x-circle-fill small" />
              </button>
            )}
            <button
              type="button"
              aria-label="Toggle options dropdown"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen((prev) => !prev);
              }}
              className="btn btn-sm p-0 border-0 text-secondary d-inline-flex align-items-center justify-content-center"
              style={{ width: 22, height: 22 }}
            >
              <i
                className={`bi ${
                  isOpen ? "bi-chevron-up" : "bi-chevron-down"
                } small`}
              />
            </button>
          </div>
        </div>

        {/* Floating Multi-Select Dropdown Menu */}
        {isOpen && (
          <div
            className="position-absolute start-0 end-0 mt-1 bg-white rounded-3 border overflow-hidden"
            style={{
              zIndex: 1050,
              boxShadow:
                "0 12px 28px -6px rgba(15, 23, 42, 0.14), 0 4px 10px -2px rgba(15, 23, 42, 0.06)",
              borderColor: "#cbd5e1",
            }}
          >
            {/* Quick Action Header */}
            <div
              className="d-flex align-items-center justify-content-between px-3 py-1.5 border-bottom small"
              style={{ backgroundColor: "#f8fafc", fontSize: "0.74rem" }}
            >
              <span className="text-muted fw-medium">
                Showing {filteredOptions.length} of {options.length}
              </span>
              <div className="d-flex align-items-center gap-2">
                {filteredOptions.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="btn btn-link btn-sm p-0 text-decoration-none fw-semibold"
                    style={{ fontSize: "0.74rem", color: activeBorder }}
                  >
                    Select all
                  </button>
                )}
                {selectedIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="btn btn-link btn-sm p-0 text-decoration-none text-muted"
                    style={{ fontSize: "0.74rem" }}
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Option List */}
            <div style={{ maxHeight: 220, overflowY: "auto" }} className="p-1.5">
              {filteredOptions.length === 0 ? (
                <div className="text-center py-3 text-muted small">
                  {emptyMessage}
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = selectedIds.includes(opt.id);
                  return (
                    <div
                      key={opt.id}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => toggleOption(opt.id)}
                      className="d-flex align-items-center justify-content-between px-2.5 py-1.5 rounded-2 mb-0.5"
                      style={{
                        cursor: "pointer",
                        backgroundColor: isSelected ? chipBg : "transparent",
                        color: isSelected ? chipText : "#1e293b",
                        transition: "background-color 0.12s ease",
                      }}
                    >
                      <div className="d-flex align-items-center gap-2 text-truncate">
                        <span
                          className="d-inline-flex align-items-center justify-content-center rounded-1 border"
                          style={{
                            width: 16,
                            height: 16,
                            backgroundColor: isSelected
                              ? activeBorder
                              : "#ffffff",
                            borderColor: isSelected ? activeBorder : "#94a3b8",
                            color: "#ffffff",
                            fontSize: "0.7rem",
                            flexShrink: 0,
                          }}
                        >
                          {isSelected && <i className="bi bi-check-lg" />}
                        </span>
                        <span className="small fw-medium text-truncate">
                          {opt.prefix ? `${opt.prefix}${opt.label}` : opt.label}
                        </span>
                      </div>

                      {isSelected && (
                        <span
                          className="badge rounded-pill"
                          style={{
                            backgroundColor: "#ffffff",
                            color: chipText,
                            border: `1px solid ${chipBorder}`,
                            fontSize: "0.66rem",
                          }}
                        >
                          Selected
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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
  const [showOnHomePage, setShowOnHomePage] = useState(
    initialData?.showOnHomePage ?? false
  );
  const [designTemplate, setDesignTemplate] = useState<CollectionDesignTemplate>(
    initialData?.designTemplate || "default"
  );
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
      setShowOnHomePage(initialData.showOnHomePage ?? false);
      setDesignTemplate(initialData.designTemplate || "default");
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

  const toggleProduct = (prodId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(prodId) ? prev.filter((id) => id !== prodId) : [...prev, prodId]
    );
  };

  const categoryOptions: MultiSelectOption[] = useMemo(
    () =>
      categories.map((cat) => ({
        id: cat.id,
        label: cat.name,
      })),
    [categories]
  );

  const tagOptions: MultiSelectOption[] = useMemo(
    () =>
      tags.map((tg) => ({
        id: tg.id,
        label: tg.name,
        prefix: "#",
      })),
    [tags]
  );

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
      showOnHomePage,
      designTemplate,
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
        {/* Main Left Column (8 cols) */}
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
                  <label className="form-label fw-semibold small">
                    Description / Home Page Subtitle
                  </label>
                  <textarea
                    className="form-control rounded-3"
                    rows={3}
                    placeholder="Provide a compelling subtitle/description for this collection..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <div className="form-text small text-muted">
                    When &ldquo;Show on Home Page&rdquo; is enabled, this description appears directly beneath the collection title on the home page.
                  </div>
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
                Products matching any selected Categories, Tags, or Pinned Products will be displayed on this collection page and in its home page section.
              </p>

              {/* 1. Multi-Select Categories */}
              <MultiSelectField
                id="match-categories-select"
                label="1. Match Categories"
                placeholder="Select one or more categories..."
                options={categoryOptions}
                selectedIds={selectedCategoryIds}
                onChange={setSelectedCategoryIds}
                accentVariant="blue"
                emptyMessage={
                  categories.length === 0
                    ? "Loading categories..."
                    : "No categories match your search"
                }
              />

              {/* 2. Multi-Select Tags */}
              <MultiSelectField
                id="match-tags-select"
                label="2. Match Tags"
                placeholder="Select one or more tags..."
                options={tagOptions}
                selectedIds={selectedTagIds}
                onChange={setSelectedTagIds}
                accentVariant="teal"
                emptyMessage={
                  tags.length === 0
                    ? "No tags available"
                    : "No tags match your search"
                }
              />

              {/* 3. Pinned Products */}
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

              <div className="form-check form-switch mb-3 pt-3 border-top">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="collectionShowOnHomeSwitch"
                  checked={showOnHomePage}
                  onChange={(e) => setShowOnHomePage(e.target.checked)}
                />
                <label className="form-check-label fw-semibold small d-flex align-items-center gap-1.5" htmlFor="collectionShowOnHomeSwitch">
                  <i className="bi bi-house-heart-fill text-primary" />
                  <span>Show on Home Page</span>
                </label>
                <div className="text-muted small mt-1">
                  Displays this collection&apos;s products on the storefront home page using the selected design template.
                </div>
              </div>

              <div className="mb-3 pt-2 border-top">
                <label className="form-label fw-semibold small d-flex align-items-center gap-1.5" htmlFor="collectionDesignTemplateSelect">
                  <i className="bi bi-layout-wtf text-primary" />
                  <span>Home Page Design Template</span>
                </label>
                <select
                  id="collectionDesignTemplateSelect"
                  className="form-select rounded-3"
                  value={designTemplate}
                  onChange={(e) => setDesignTemplate(e.target.value as CollectionDesignTemplate)}
                >
                  <option value="default">Default (5-Product Slider)</option>
                  <option value="collection-1">Collection-1 (Spotlight + Brand Filter Grid)</option>
                  <option value="collection-2">Collection-2 (Category Tabs + 5-Column Grid)</option>
                </select>
                <span className="text-muted small d-block mt-1">
                  Select how this collection is styled on the home page when &ldquo;Show on Home Page&rdquo; is enabled.
                </span>
              </div>

              <div className="mb-3 pt-2 border-top">
                <label className="form-label fw-semibold small">Display Sort Priority</label>
                <input
                  type="number"
                  className="form-control rounded-3"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
                />
                <span className="text-muted small">Lower numbers appear first on the home page and menus.</span>
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
                If an End Date is set, a real-time ticking countdown timer will automatically appear on the collection storefront page.
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
