/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ProductVariantItem,
  getVariants,
  updateVariant,
} from "../../../services/products";

export default function VariantsPage() {
  const [variants, setVariants] = useState<ProductVariantItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Edit Modal State
  const [editingVariant, setEditingVariant] = useState<ProductVariantItem | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editSalePrice, setEditSalePrice] = useState("");
  const [editBarcode, setEditBarcode] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  // Alert Feedback
  const [alert, setAlert] = useState<{
    type: "success" | "danger" | "info";
    text: string;
  } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace("/api/v1", "")
    : "http://localhost:3001";

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchVariants = useCallback(async () => {
    void Promise.resolve().then(() => setLoading(true));
    try {
      const res = await getVariants({
        page,
        limit,
        search: debouncedSearch || undefined,
        isActive: statusFilter === "" ? undefined : statusFilter === "true",
      });

      setVariants(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to load variants",
      });
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchVariants();
  }, [fetchVariants]);

  const handleToggleStatus = async (variant: ProductVariantItem) => {
    try {
      const updated = await updateVariant(variant.id, {
        isActive: !variant.isActive,
      });
      setVariants((prev) =>
        prev.map((v) => (v.id === variant.id ? { ...v, isActive: updated.isActive } : v)),
      );
      setAlert({
        type: "success",
        text: `SKU '${variant.sku}' is now ${updated.isActive ? "Active" : "Inactive"}.`,
      });
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to update status",
      });
    }
  };

  const openEditModal = (variant: ProductVariantItem) => {
    setEditingVariant(variant);
    setEditPrice(variant.regularPrice.toString());
    setEditSalePrice(variant.salePrice !== null && variant.salePrice !== undefined ? variant.salePrice.toString() : "");
    setEditBarcode(variant.barcode || "");
  };

  const handleSaveQuickEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVariant) return;

    setModalLoading(true);
    try {
      const updated = await updateVariant(editingVariant.id, {
        regularPrice: parseFloat(editPrice) || editingVariant.regularPrice,
        salePrice: editSalePrice ? parseFloat(editSalePrice) : undefined,
        barcode: editBarcode.trim() || undefined,
      });

      setVariants((prev) =>
        prev.map((v) => (v.id === editingVariant.id ? { ...v, ...updated } : v)),
      );
      setAlert({
        type: "success",
        text: `SKU '${editingVariant.sku}' updated successfully.`,
      });
      setEditingVariant(null);
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to update variant",
      });
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="container-fluid px-0 pb-5">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
            <i className="bi bi-diagram-3 text-primary"></i>
            Product Variants &amp; SKUs
          </h4>
          <p className="text-muted small m-0 mt-1">
            Global cross-product SKU index for inventory auditing, pricing checks, and barcode lookups.
          </p>
        </div>
        <Link href="/catalog/products/new" className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm">
          <i className="bi bi-plus-lg"></i> Create Product
        </Link>
      </div>

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
          <button type="button" className="btn-close" onClick={() => setAlert(null)}></button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-6">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Search by SKU, barcode, or product title..."
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

            <div className="col-6 col-md-3">
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

            <div className="col-6 col-md-3 text-end">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("");
                  setPage(1);
                }}
              >
                <i className="bi bi-arrow-counterclockwise"></i> Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Variants Table Card */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-white py-3 border-bottom d-flex align-items-center justify-content-between">
          <h6 className="card-title fw-bold m-0 text-dark">All Catalog Variants</h6>
          <span className="text-muted small">
            Showing {variants.length} of {total} {total === 1 ? "variant" : "variants"}
          </span>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading variants...</span>
              </div>
              <p className="mt-2 text-muted small">Loading catalog variants...</p>
            </div>
          ) : variants.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-diagram-3 display-4 text-muted opacity-50"></i>
              <h5 className="mt-3 fw-bold text-dark">No Variants Found</h5>
              <p className="text-muted small mb-0">
                No variants match your search and filter criteria.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.85rem" }}>
                <thead className="table-light">
                  <tr>
                    <th style={{ width: "50px" }}>Photo</th>
                    <th style={{ width: "20%" }}>SKU &amp; Barcode</th>
                    <th style={{ width: "25%" }}>Product Master</th>
                    <th style={{ width: "20%" }}>Attributes</th>
                    <th style={{ width: "15%" }}>Price</th>
                    <th style={{ width: "10%" }} className="text-center">Status</th>
                    <th style={{ width: "10%" }} className="text-end pe-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v) => {
                    const rawPhotoUrl = v.imageUrl || v.image?.imageUrl || null;
                    const photoUrl = rawPhotoUrl
                      ? rawPhotoUrl.startsWith("http")
                        ? rawPhotoUrl
                        : `${API_URL}${rawPhotoUrl}`
                      : null;

                    return (
                      <tr key={v.id}>
                        {/* Variant Photo (Option B) */}
                        <td>
                          <div
                            className="rounded border bg-light d-flex align-items-center justify-content-center overflow-hidden"
                            style={{ width: "36px", height: "36px" }}
                          >
                            {photoUrl ? (
                              <img
                                src={photoUrl}
                                alt={v.sku}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            ) : (
                              <i className="bi bi-image text-muted opacity-50 fs-6"></i>
                            )}
                          </div>
                        </td>

                        {/* SKU & Barcode */}
                        <td>
                          <div className="fw-bold font-monospace text-dark">{v.sku}</div>
                          {v.barcode && (
                            <div className="small text-muted font-monospace" style={{ fontSize: "0.72rem" }}>
                              <i className="bi bi-upc me-1"></i>
                              {v.barcode}
                            </div>
                          )}
                        </td>

                        {/* Product Title */}
                        <td>
                          <Link
                            href={`/catalog/products/${v.productId}/edit`}
                            className="fw-semibold text-decoration-none text-dark hover-primary"
                          >
                            {v.productTitle || "Parent Product"}
                          </Link>
                        </td>

                        {/* Attributes */}
                        <td>
                          {v.attributes && v.attributes.length > 0 ? (
                            <div className="d-flex flex-wrap gap-1">
                              {v.attributes.map((a, idx) => (
                                <span
                                  key={idx}
                                  className="badge bg-secondary-subtle text-secondary border d-flex align-items-center gap-1"
                                  style={{ fontSize: "0.68rem" }}
                                >
                                  {a.colorCode && (
                                    <span
                                      className="rounded-circle border"
                                      style={{
                                        width: "8px",
                                        height: "8px",
                                        backgroundColor: a.colorCode,
                                        display: "inline-block",
                                      }}
                                    ></span>
                                  )}
                                  {a.attributeName}: {a.label || a.value}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted small fst-italic">Default SKU</span>
                          )}
                        </td>

                        {/* Pricing */}
                        <td>
                          <div className="fw-bold text-dark">${v.regularPrice.toFixed(2)}</div>
                          {v.salePrice !== null && v.salePrice !== undefined && (
                            <span className="badge bg-danger-subtle text-danger border" style={{ fontSize: "0.68rem" }}>
                              Sale: ${v.salePrice.toFixed(2)}
                            </span>
                          )}
                        </td>

                        {/* Status Toggle */}
                        <td className="text-center">
                          <button
                            type="button"
                            className={`btn btn-sm py-0 px-2 rounded-pill border-0 ${
                              v.isActive ? "btn-success" : "btn-secondary"
                            }`}
                            style={{ fontSize: "0.72rem" }}
                            onClick={() => handleToggleStatus(v)}
                            title="Toggle SKU active status"
                          >
                            {v.isActive ? "Active" : "Inactive"}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="text-end pe-3">
                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              className="btn btn-outline-secondary p-1 px-2"
                              title="Quick Edit Price & Barcode"
                              onClick={() => openEditModal(v)}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <Link
                              href={`/catalog/products/${v.productId}/edit`}
                              className="btn btn-outline-primary p-1 px-2"
                              title="Edit in Product Form"
                            >
                              <i className="bi bi-box-arrow-up-right"></i>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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
                  Previous
                </button>
              </li>
              <li className="page-item active">
                <span className="page-link">{page}</span>
              </li>
              <li className={`page-item ${page >= totalPages ? "disabled" : ""}`}>
                <button
                  type="button"
                  className="page-link"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Quick Edit Modal */}
      {editingVariant && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <form onSubmit={handleSaveQuickEdit}>
                <div className="modal-header bg-light py-3">
                  <h5 className="modal-title fw-bold">
                    Quick Edit: <span className="font-monospace text-primary">{editingVariant.sku}</span>
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setEditingVariant(null)}
                  ></button>
                </div>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Regular Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="form-control"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Sale Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="form-control"
                      placeholder="Optional"
                      value={editSalePrice}
                      onChange={(e) => setEditSalePrice(e.target.value)}
                    />
                  </div>
                  <div className="mb-0">
                    <label className="form-label fw-semibold">Barcode</label>
                    <input
                      type="text"
                      className="form-control font-monospace"
                      placeholder="UPC / EAN / GTIN"
                      value={editBarcode}
                      onChange={(e) => setEditBarcode(e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-footer bg-light py-2 px-4">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setEditingVariant(null)}
                    disabled={modalLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={modalLoading}
                  >
                    {modalLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
