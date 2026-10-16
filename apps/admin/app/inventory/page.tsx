/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  InventoryItem,
  getInventory,
  adjustStock,
  updateThreshold,
} from "../../services/inventory";
import { categoriesApi, CategoryItem } from "../../services/categories";

export default function InventoryOverviewPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "in_stock" | "low_stock" | "out_of_stock">("");
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  // Modals
  const [adjustModalItem, setAdjustModalItem] = useState<InventoryItem | null>(null);
  const [adjustType, setAdjustType] = useState<"RESTOCK" | "MANUAL_ADJUSTMENT" | "DAMAGED">("RESTOCK");
  const [adjustQuantity, setAdjustQuantity] = useState<number>(10);
  const [adjustReference, setAdjustReference] = useState("");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Inline Threshold Modal
  const [thresholdModalItem, setThresholdModalItem] = useState<InventoryItem | null>(null);
  const [newThreshold, setNewThreshold] = useState<number>(5);

  // Notification Banner
  const [alert, setAlert] = useState<{
    type: "success" | "danger" | "info";
    text: string;
  } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace("/api/v1", "")
    : "http://localhost:3001";

  // Load categories once
  useEffect(() => {
    async function loadCats() {
      try {
        const res = await categoriesApi.getCategories({ limit: 100 });
        setCategories(res.items);
      } catch {
        // Non-critical
      }
    }
    loadCats();
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchInventory = useCallback(async () => {
    void Promise.resolve().then(() => setLoading(true));
    try {
      const res = await getInventory({
        page,
        limit,
        search: debouncedSearch || undefined,
        categoryId: categoryId || undefined,
        lowStock: statusFilter === "low_stock" ? true : undefined,
        outOfStock: statusFilter === "out_of_stock" ? true : undefined,
      });

      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to load inventory balances",
      });
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, categoryId, statusFilter]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Execute Stock Adjustment
  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalItem) return;

    setModalSubmitting(true);
    try {
      await adjustStock({
        variantId: adjustModalItem.variantId,
        type: adjustType,
        quantityChange: Number(adjustQuantity),
        referenceId: adjustReference.trim() || undefined,
        notes: adjustNotes.trim() || undefined,
      });

      setAlert({
        type: "success",
        text: `Stock successfully adjusted for SKU ${adjustModalItem.sku}!`,
      });

      setAdjustModalItem(null);
      setAdjustNotes("");
      setAdjustReference("");
      fetchInventory();
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Stock adjustment failed",
      });
    } finally {
      setModalSubmitting(false);
    }
  };

  // Execute Threshold Update
  const handleThresholdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thresholdModalItem) return;

    setModalSubmitting(true);
    try {
      await updateThreshold(thresholdModalItem.variantId, Number(newThreshold));
      setAlert({
        type: "success",
        text: `Threshold updated to ${newThreshold} for SKU ${thresholdModalItem.sku}`,
      });
      setThresholdModalItem(null);
      fetchInventory();
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to update threshold",
      });
    } finally {
      setModalSubmitting(false);
    }
  };

  return (
    <div className="container-fluid py-4">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="h4 mb-1 text-dark fw-bold">Warehouse Stock Overview</h2>
          <p className="text-muted small mb-0">
            Real-time tracking of physical on-hand stock, customer reservations, and sellable availability.
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link href="/inventory/adjustments" className="btn btn-primary btn-sm">
            <i className="bi bi-pencil-square me-1"></i> Stock Adjustment
          </Link>
          <Link href="/inventory/movements" className="btn btn-outline-secondary btn-sm">
            <i className="bi bi-arrow-left-right me-1"></i> Audit Ledger
          </Link>
          <Link href="/inventory/low-stock" className="btn btn-outline-danger btn-sm">
            <i className="bi bi-exclamation-triangle me-1"></i> Low Stock Alerts
          </Link>
        </div>
      </div>

      {/* Alert Notification */}
      {alert && (
        <div
          className={`alert alert-${alert.type} alert-dismissible fade show`}
          role="alert"
        >
          {alert.text}
          <button
            type="button"
            className="btn-close"
            onClick={() => setAlert(null)}
          ></button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-md-3">
          <div className="card shadow-sm border-0 border-start border-primary border-4">
            <div className="card-body">
              <div className="text-muted small text-uppercase fw-bold">Tracked SKUs</div>
              <div className="h4 mb-0 fw-bold">{total}</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-md-3">
          <div className="card shadow-sm border-0 border-start border-success border-4">
            <div className="card-body">
              <div className="text-muted small text-uppercase fw-bold">In Stock</div>
              <div className="h4 mb-0 fw-bold text-success">
                {items.filter((i) => !i.isLowStock && !i.isOutOfStock).length}
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-md-3">
          <div className="card shadow-sm border-0 border-start border-warning border-4">
            <div className="card-body">
              <div className="text-muted small text-uppercase fw-bold">Low Stock Warning</div>
              <div className="h4 mb-0 fw-bold text-warning">
                {items.filter((i) => i.isLowStock && !i.isOutOfStock).length}
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-md-3">
          <div className="card shadow-sm border-0 border-start border-danger border-4">
            <div className="card-body">
              <div className="text-muted small text-uppercase fw-bold">Out of Stock</div>
              <div className="h4 mb-0 fw-bold text-danger">
                {items.filter((i) => i.isOutOfStock).length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12 col-md-4">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by SKU, product, or barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-6 col-md-3">
              <select
                className="form-select form-select-sm"
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-6 col-md-3">
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as "" | "in_stock" | "low_stock" | "out_of_stock");
                  setPage(1);
                }}
              >
                <option value="">All Stock Statuses</option>
                <option value="in_stock">In Stock (Normal)</option>
                <option value="low_stock">Low Stock (≤ Threshold)</option>
                <option value="out_of_stock">Out of Stock (= 0)</option>
              </select>
            </div>
            <div className="col-12 col-md-2 text-md-end">
              <button
                className="btn btn-outline-secondary btn-sm w-100"
                onClick={() => {
                  setSearchTerm("");
                  setCategoryId("");
                  setStatusFilter("");
                  setPage(1);
                }}
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Inventory Data Table */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3 border-0">
          <h5 className="card-title mb-0 fs-6 fw-bold text-dark">
            Inventory Stock Balances ({total})
          </h5>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-muted small text-uppercase">
              <tr>
                <th style={{ width: "60px" }}>Item</th>
                <th>SKU / Product</th>
                <th>Attributes</th>
                <th className="text-center">On-Hand</th>
                <th className="text-center">Reserved</th>
                <th className="text-center">Available</th>
                <th className="text-center">Threshold</th>
                <th className="text-center">Status</th>
                <th className="text-end" style={{ width: "160px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    Loading warehouse stock balances...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-5 text-muted">
                    <i className="bi bi-boxes fs-1 d-block mb-2 text-secondary"></i>
                    No inventory records match the current filters.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const thumb = item.thumbnailUrl
                    ? item.thumbnailUrl.startsWith("http")
                      ? item.thumbnailUrl
                      : `${API_URL}${item.thumbnailUrl}`
                    : null;

                  return (
                    <tr key={item.id}>
                      <td>
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={item.sku}
                            className="rounded border"
                            style={{ width: "42px", height: "42px", objectFit: "cover" }}
                          />
                        ) : (
                          <div
                            className="bg-light rounded border d-flex align-items-center justify-content-center text-muted"
                            style={{ width: "42px", height: "42px" }}
                          >
                            <i className="bi bi-box fs-5"></i>
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="fw-bold text-dark font-monospace d-block">
                          {item.sku}
                        </span>
                        <span className="small text-muted">{item.productTitle}</span>
                        {item.categoryName && (
                          <span className="badge bg-light text-secondary ms-1 border">
                            {item.categoryName}
                          </span>
                        )}
                      </td>
                      <td>
                        {item.attributes.length > 0 ? (
                          <div className="d-flex flex-wrap gap-1">
                            {item.attributes.map((attr, idx) => (
                              <span
                                key={idx}
                                className="badge bg-light text-dark border small"
                              >
                                {attr.colorCode && (
                                  <span
                                    className="d-inline-block rounded-circle me-1 border"
                                    style={{
                                      width: "8px",
                                      height: "8px",
                                      backgroundColor: attr.colorCode,
                                    }}
                                  ></span>
                                )}
                                {attr.name}: {attr.value}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted small">Standard</span>
                        )}
                      </td>
                      <td className="text-center fw-bold fs-6">{item.quantity}</td>
                      <td className="text-center text-muted">
                        {item.reservedQuantity > 0 ? (
                          <span className="badge bg-info-subtle text-info border">
                            {item.reservedQuantity}
                          </span>
                        ) : (
                          "0"
                        )}
                      </td>
                      <td className="text-center">
                        <span
                          className={`fw-bold fs-6 ${
                            item.availableQuantity === 0
                              ? "text-danger"
                              : item.availableQuantity <= item.lowStockThreshold
                              ? "text-warning"
                              : "text-success"
                          }`}
                        >
                          {item.availableQuantity}
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-link btn-sm text-decoration-none p-0 text-muted"
                          title="Click to change threshold"
                          onClick={() => {
                            setThresholdModalItem(item);
                            setNewThreshold(item.lowStockThreshold);
                          }}
                        >
                          {item.lowStockThreshold} <i className="bi bi-pencil-fill ms-1" style={{ fontSize: "10px" }}></i>
                        </button>
                      </td>
                      <td className="text-center">
                        {item.isOutOfStock ? (
                          <span className="badge bg-danger">Out of Stock</span>
                        ) : item.isLowStock ? (
                          <span className="badge bg-warning text-dark">Low Stock</span>
                        ) : (
                          <span className="badge bg-success">In Stock</span>
                        )}
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary btn-sm"
                            title="Quick Adjust Stock"
                            onClick={() => {
                              setAdjustModalItem(item);
                              setAdjustType("RESTOCK");
                              setAdjustQuantity(10);
                            }}
                          >
                            <i className="bi bi-plus-slash-minus me-1"></i> Adjust
                          </button>
                          <Link
                            href={`/inventory/movements?variantId=${item.variantId}`}
                            className="btn btn-outline-secondary btn-sm"
                            title="View Audit Ledger"
                          >
                            <i className="bi bi-clock-history"></i>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="card-footer bg-white d-flex justify-content-between align-items-center py-3 border-0">
            <span className="small text-muted">
              Page {page} of {totalPages} ({total} total SKUs)
            </span>
            <div className="btn-group btn-group-sm">
              <button
                className="btn btn-outline-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                className="btn btn-outline-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Adjust Modal */}
      {adjustModalItem && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fs-6 fw-bold">
                  Stock Adjustment: {adjustModalItem.sku}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setAdjustModalItem(null)}
                ></button>
              </div>
              <form onSubmit={handleAdjustSubmit}>
                <div className="modal-body">
                  <div className="alert alert-light border small mb-3">
                    <div className="fw-bold">{adjustModalItem.productTitle}</div>
                    <div className="text-muted">
                      Current On-Hand: <strong>{adjustModalItem.quantity}</strong> | Reserved:{" "}
                      <strong>{adjustModalItem.reservedQuantity}</strong> | Available:{" "}
                      <strong>{adjustModalItem.availableQuantity}</strong>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Action / Movement Type</label>
                    <select
                      className="form-select form-select-sm"
                      value={adjustType}
                      onChange={(e) => {
                        const val = e.target.value as "RESTOCK" | "MANUAL_ADJUSTMENT" | "DAMAGED";
                        setAdjustType(val);
                        if (val === "RESTOCK") setAdjustQuantity(Math.abs(adjustQuantity) || 10);
                        if (val === "DAMAGED") setAdjustQuantity(-Math.abs(adjustQuantity) || -1);
                      }}
                    >
                      <option value="RESTOCK">Restock (Warehouse Replenishment: +)</option>
                      <option value="MANUAL_ADJUSTMENT">Manual Adjustment (Physical Count Correction)</option>
                      <option value="DAMAGED">Damaged / Write-off (Shrinkage: -)</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">
                      Quantity Delta ({adjustQuantity > 0 ? `+${adjustQuantity}` : adjustQuantity})
                    </label>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={adjustQuantity}
                      onChange={(e) => setAdjustQuantity(Number(e.target.value))}
                      required
                    />
                    <div className="form-text small">
                      Resulting Physical Stock:{" "}
                      <span className="fw-bold">
                        {adjustModalItem.quantity + Number(adjustQuantity)}
                      </span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Reference Number (Optional)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. PO-2026-992, AUDIT-OCT"
                      value={adjustReference}
                      onChange={(e) => setAdjustReference(e.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Audit Notes</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows={2}
                      placeholder="Reason for adjustment..."
                      value={adjustNotes}
                      onChange={(e) => setAdjustNotes(e.target.value)}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setAdjustModalItem(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={modalSubmitting || adjustQuantity === 0}
                  >
                    {modalSubmitting ? "Updating..." : "Commit Stock Adjustment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Threshold Modal */}
      {thresholdModalItem && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fs-6 fw-bold">Low Stock Threshold</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setThresholdModalItem(null)}
                ></button>
              </div>
              <form onSubmit={handleThresholdSubmit}>
                <div className="modal-body">
                  <p className="small text-muted mb-2">
                    SKU: <strong>{thresholdModalItem.sku}</strong>
                  </p>
                  <label className="form-label small fw-bold">Alert Threshold</label>
                  <input
                    type="number"
                    min={0}
                    className="form-control form-control-sm"
                    value={newThreshold}
                    onChange={(e) => setNewThreshold(Number(e.target.value))}
                    required
                  />
                  <div className="form-text small">
                    Triggers warning when available quantity drops below or equals this number.
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setThresholdModalItem(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={modalSubmitting}
                  >
                    Save
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
