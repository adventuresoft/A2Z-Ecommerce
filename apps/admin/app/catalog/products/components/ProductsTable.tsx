/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import Link from "next/link";
import { ProductItem, getProductStorefrontUrl } from "../../../../services/products";
import { useAuth } from "@/context/AuthContext";

interface ProductsTableProps {
  products: ProductItem[];
  loading: boolean;
  sortBy: "title" | "createdAt" | "updatedAt";
  sortOrder: "asc" | "desc";
  onSortChange: (column: "title" | "createdAt" | "updatedAt") => void;
  onDeleteClick: (product: ProductItem) => void;
  onToggleStatus: (product: ProductItem) => void;
}

export function ProductsTable({
  products,
  loading,
  sortBy,
  sortOrder,
  onSortChange,
  onDeleteClick,
  onToggleStatus,
}: ProductsTableProps) {
  const { can } = useAuth();
  const API_URL = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '') : 'http://localhost:3001';

  const renderSortIcon = (column: "title" | "createdAt" | "updatedAt") => {
    if (sortBy !== column) {
      return <i className="bi bi-arrow-down-up text-muted opacity-50 ms-1" aria-hidden="true"></i>;
    }
    return sortOrder === "asc" ? (
      <i className="bi bi-sort-up text-primary ms-1" aria-hidden="true"></i>
    ) : (
      <i className="bi bi-sort-down text-primary ms-1" aria-hidden="true"></i>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-5" role="status" aria-live="polite">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading products…</span>
        </div>
        <p className="mt-2 text-muted small">Loading catalog products…</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-5">
        <i className="bi bi-box-seam display-4 text-muted opacity-50" aria-hidden="true"></i>
        <h5 className="mt-3 fw-bold text-dark">No Products Found</h5>
        <p className="text-muted small mb-3">
          No products match your search and filter criteria.
        </p>
        <Link href="/catalog/products/new" className="btn btn-primary btn-sm">
          <i className="bi bi-plus-lg me-1" aria-hidden="true"></i> Create First Product
        </Link>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead className="table-light">
          <tr>
            <th style={{ width: "60px" }}>Cover</th>
            <th
              style={{ cursor: "pointer", width: "30%" }}
              onClick={() => onSortChange("title")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSortChange("title");
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`Sort by product title, currently ${sortBy === "title" ? sortOrder : "unsorted"}`}
            >
              Product Title {renderSortIcon("title")}
            </th>
            <th style={{ width: "15%" }}>Category & Brand</th>
            <th style={{ width: "15%" }}>Price Range</th>
            <th style={{ width: "10%" }} className="text-center">Variants</th>
            <th style={{ width: "10%" }} className="text-center">Status</th>
            <th
              style={{ cursor: "pointer", width: "10%" }}
              onClick={() => onSortChange("createdAt")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSortChange("createdAt");
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`Sort by created date, currently ${sortBy === "createdAt" ? sortOrder : "unsorted"}`}
            >
              Created {renderSortIcon("createdAt")}
            </th>
            <th style={{ width: "10%" }} className="text-end pe-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const rawCoverUrl = product.thumbnailUrl || product.primaryImage?.imageUrl || (product.images && product.images.length > 0 ? product.images[0].imageUrl : null);
            const coverUrl = rawCoverUrl
              ? rawCoverUrl.startsWith("http")
                ? rawCoverUrl
                : `${API_URL}${rawCoverUrl}`
              : null;

            let priceDisplay = "N/A";
            if (product.minPrice !== undefined && product.maxPrice !== undefined) {
              priceDisplay =
                product.minPrice === product.maxPrice
                  ? `$${product.minPrice.toFixed(2)}`
                  : `$${product.minPrice.toFixed(2)} - $${product.maxPrice.toFixed(2)}`;
            }

            return (
              <tr key={product.id}>
                {/* Cover Image */}
                <td>
                  <div
                    className="rounded border bg-light d-flex align-items-center justify-content-center overflow-hidden"
                    style={{ width: "42px", height: "42px" }}
                  >
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={product.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <i className="bi bi-image text-muted opacity-50 fs-5"></i>
                    )}
                  </div>
                </td>

                {/* Title & Slug */}
                <td>
                  <div className="d-flex align-items-center gap-1">
                    <Link
                      href={`/catalog/products/${product.id}/edit`}
                      className="fw-bold text-dark text-decoration-none hover-primary"
                    >
                      {product.title}
                    </Link>
                    {product.isFeatured && (
                      <i
                        className="bi bi-star-fill text-warning small"
                        title="Featured Product"
                      ></i>
                    )}
                  </div>
                  <div className="text-muted small font-monospace" style={{ fontSize: "0.72rem" }}>
                    /{product.slug}
                  </div>
                  {product.tags && product.tags.length > 0 && (
                    <div className="d-flex flex-wrap gap-1 mt-1">
                      {product.tags.map((t) => (
                        <span
                          key={t.id}
                          className="badge text-white"
                          style={{
                            backgroundColor: t.colorCode || "#0d6efd",
                            fontSize: "0.68rem",
                            fontWeight: 500,
                            borderRadius: "0.5rem",
                            padding: "2px 6px",
                          }}
                        >
                          {t.name}
                        </span>
                      ))}
                    </div>
                  )}
                </td>

                {/* Category & Brand */}
                <td>
                  <div className="d-flex flex-column gap-1">
                    <span className="badge bg-secondary-subtle text-secondary border text-truncate w-auto">
                      <i className="bi bi-tag-fill me-1"></i>
                      {product.category?.name || "Uncategorized"}
                    </span>
                    {product.brand && (
                      <span className="badge bg-light text-dark border text-truncate w-auto">
                        <i className="bi bi-award me-1"></i>
                        {product.brand.name}
                      </span>
                    )}
                  </div>
                </td>

                {/* Price Range */}
                <td className="fw-semibold text-dark tabular-nums">{priceDisplay}</td>

                {/* Variant Count */}
                <td className="text-center tabular-nums">
                  <span className="badge bg-info-subtle text-info-emphasis border">
                    {product.variantCount} SKUs
                  </span>
                </td>

                {/* Status Toggle */}
                <td className="text-center">
                  <button
                    type="button"
                    className={`btn btn-sm py-0 px-2 rounded-pill border-0 ${
                      product.isActive ? "btn-success" : "btn-secondary"
                    }`}
                    style={{ fontSize: "0.75rem" }}
                    onClick={() => onToggleStatus(product)}
                    aria-label={`Toggle status for ${product.title}: currently ${product.isActive ? "Active" : "Inactive"}`}
                    title="Click to toggle status"
                  >
                    {product.isActive ? "Active" : "Inactive"}
                  </button>
                </td>

                {/* Created Date */}
                <td className="text-muted small tabular-nums">
                  {new Date(product.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>

                {/* Actions */}
                <td className="text-end pe-3">
                  <div className="btn-group btn-group-sm">
                    {product.slug && (
                      <a
                        href={getProductStorefrontUrl(product.slug)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-secondary p-1 px-2"
                        aria-label={`View ${product.title} on customer storefront`}
                        title="View on Customer Storefront"
                      >
                        <i className="bi bi-box-arrow-up-right" aria-hidden="true"></i>
                      </a>
                    )}
                    <Link
                      href={`/catalog/products/${product.id}/edit`}
                      className="btn btn-outline-primary p-1 px-2"
                      aria-label={`Edit ${product.title}`}
                      title="Edit Product & Variants"
                    >
                      <i className="bi bi-pencil" aria-hidden="true"></i>
                    </Link>
                    {can("products", "delete") && (
                      <button
                        type="button"
                        className="btn btn-outline-danger p-1 px-2"
                        aria-label={`Delete ${product.title}`}
                        title="Delete Product"
                        onClick={() => onDeleteClick(product)}
                      >
                        <i className="bi bi-trash" aria-hidden="true"></i>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
