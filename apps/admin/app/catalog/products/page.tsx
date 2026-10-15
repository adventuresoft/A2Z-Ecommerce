"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ProductItem,
  getProducts,
  updateProduct,
} from "../../../services/products";
import { CategoryItem, categoriesApi, formatCategoryOptions } from "../../../services/categories";
import { BrandItem, brandsApi } from "../../../services/brands";
import { ProductsTable } from "./components/ProductsTable";
import { ProductDeleteModal } from "./components/ProductDeleteModal";

function ProductsPageContent() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState("");
  const [sortBy, setSortBy] = useState<"title" | "createdAt" | "updatedAt">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Modals
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductItem | null>(null);

  const searchParams = useSearchParams();

  // Alert feedback
  const [alert, setAlert] = useState<{
    type: "success" | "danger" | "info";
    text: string;
  } | null>(
    searchParams.get("updated") === "true"
      ? {
          type: "success",
          text: "Product updated successfully!",
        }
      : null,
  );

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load filter dropdown options
  useEffect(() => {
    async function loadOptions() {
      try {
        const [catRes, brandRes] = await Promise.all([
          categoriesApi.getCategories({ limit: 100 }),
          brandsApi.getBrands({ limit: 100 }),
        ]);
        setCategories(catRes.items);
        setBrands(brandRes.items);
      } catch (err) {
        console.error("Failed to load category/brand options:", err);
      }
    }
    loadOptions();
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    void Promise.resolve().then(() => setLoading(true));
    try {
      const res = await getProducts({
        page,
        limit,
        search: debouncedSearch || undefined,
        categoryId: categoryFilter || undefined,
        brandId: brandFilter || undefined,
        isActive: statusFilter === "" ? undefined : statusFilter === "true",
        isFeatured: featuredFilter === "" ? undefined : featuredFilter === "true",
        sortBy,
        sortOrder,
      });

      setProducts(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load products.";
      setAlert({ type: "danger", text: msg });
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, categoryFilter, brandFilter, statusFilter, featuredFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSortChange = (col: "title" | "createdAt" | "updatedAt") => {
    if (sortBy === col) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setCategoryFilter("");
    setBrandFilter("");
    setStatusFilter("");
    setFeaturedFilter("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);
  };

  const handleToggleStatus = async (product: ProductItem) => {
    try {
      const updated = await updateProduct(product.id, {
        isActive: !product.isActive,
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isActive: updated.isActive } : p)),
      );
      setAlert({
        type: "success",
        text: `Product '${product.title}' is now ${updated.isActive ? "Active" : "Inactive"}.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update product status.";
      setAlert({ type: "danger", text: msg });
    }
  };

  const handleDeleteClick = (product: ProductItem) => {
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };

  return (
    <div className="container-fluid px-0">
      {/* Page Title & Breadcrumbs */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
            <i className="bi bi-box-seam text-primary"></i>
            Products
          </h4>
          <p className="text-muted small m-0 mt-1">
            Manage master product descriptions, categories, brands, media galleries, and variant SKUs.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Link
            href="/catalog/variants"
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 shadow-sm"
          >
            <i className="bi bi-diagram-3"></i> Cross-Product SKUs
          </Link>
          <Link
            href="/catalog/products/new"
            className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm"
          >
            <i className="bi bi-plus-lg"></i> Add Product
          </Link>
        </div>
      </div>

      {/* Alert Notification */}
      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show mb-4 shadow-sm`} role="alert">
          <div className="d-flex align-items-center gap-2">
            <i
              className={`bi ${
                alert.type === "success"
                  ? "bi-check-circle-fill"
                  : alert.type === "danger"
                    ? "bi-exclamation-octagon-fill"
                    : "bi-info-circle-fill"
              }`}
            ></i>
            <span>{alert.text}</span>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={() => setAlert(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Filter and Search Card */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            {/* Search Input */}
            <div className="col-12 col-md-4">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Search products by title, slug, SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    className="btn btn-outline-secondary border-start-0"
                    type="button"
                    onClick={() => setSearchTerm("")}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter */}
            <div className="col-6 col-md-2">
              <select
                className="form-select form-select-sm"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Categories</option>
                {formatCategoryOptions(categories).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand Filter */}
            <div className="col-6 col-md-2">
              <select
                className="form-select form-select-sm"
                value={brandFilter}
                onChange={(e) => {
                  setBrandFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Brands</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="col-6 col-md-2">
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="true">Active Only</option>
                <option value="false">Inactive Only</option>
              </select>
            </div>

            {/* Featured Filter */}
            <div className="col-6 col-md-1">
              <select
                className="form-select form-select-sm"
                value={featuredFilter}
                onChange={(e) => {
                  setFeaturedFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Featured</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            {/* Reset Filters */}
            <div className="col-12 col-md-1 text-md-end">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm w-100"
                onClick={handleResetFilters}
                title="Reset Filters"
              >
                <i className="bi bi-arrow-counterclockwise"></i> Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-white py-3 border-bottom d-flex align-items-center justify-content-between">
          <h6 className="card-title fw-bold m-0 text-dark">
            Product Catalog Listing
          </h6>
          <span className="text-muted small">
            Showing {products.length} of {total} {total === 1 ? "product" : "products"}
          </span>
        </div>

        <div className="card-body p-0">
          <ProductsTable
            products={products}
            loading={loading}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
            onDeleteClick={handleDeleteClick}
            onToggleStatus={handleToggleStatus}
          />
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="card-footer bg-white border-top py-3 d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
            <span className="text-muted small">
              Page {page} of {totalPages}
            </span>
            <ul className="pagination pagination-sm m-0">
              <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
                <button
                  type="button"
                  className="page-link"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <i className="bi bi-chevron-left"></i> Previous
                </button>
              </li>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .map((p, idx, arr) => (
                  <React.Fragment key={p}>
                    {idx > 0 && p - arr[idx - 1] > 1 && (
                      <li className="page-item disabled">
                        <span className="page-link">...</span>
                      </li>
                    )}
                    <li className={`page-item ${p === page ? "active" : ""}`}>
                      <button
                        type="button"
                        className="page-link"
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </button>
                    </li>
                  </React.Fragment>
                ))}

              <li className={`page-item ${page >= totalPages ? "disabled" : ""}`}>
                <button
                  type="button"
                  className="page-link"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next <i className="bi bi-chevron-right"></i>
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ProductDeleteModal
        product={productToDelete}
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setProductToDelete(null);
        }}
        onDeleted={() => {
          setAlert({
            type: "success",
            text: `Product '${productToDelete?.title}' was successfully deleted.`,
          });
          fetchProducts();
        }}
      />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="container-fluid py-4 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading products...</span>
          </div>
        </div>
      }
    >
      <ProductsPageContent />
    </Suspense>
  );
}
