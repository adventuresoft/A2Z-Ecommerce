/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  InventoryItem,
  getLowStockAlerts,
  adjustStock,
  LowStockSummary,
} from "../../../services/inventory";

export default function LowStockAlertsPage() {
  const [summary, setSummary] = useState<LowStockSummary>({
    totalVariants: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    items: [],
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterType, setFilterType] = useState<"all" | "out_of_stock" | "low_stock">("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Restock Quick Modal
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);
  const [restockQty, setRestockQty] = useState(25);
  const [restockPo, setRestockPo] = useState("");
  const [restockNotes, setRestockNotes] = useState("");
  const [modalSubmitting, setModalSubmitting] = useState(false);

  const [alert, setAlert] = useState<{
    type: "success" | "danger" | "info";
    text: string;
  } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace("/api/v1", "")
    : "http://localhost:3001";

  const fetchAlerts = useCallback(async () => {
    void Promise.resolve().then(() => setLoading(true));
    try {
      const data = await getLowStockAlerts(100);
      setSummary(data);
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to load low stock alerts",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Execute Quick Restock
  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItem) return;

    setModalSubmitting(true);
    try {
      await adjustStock({
        variantId: restockItem.variantId,
        type: "RESTOCK",
        quantityChange: Number(restockQty),
        referenceId: restockPo.trim() || undefined,
        notes: restockNotes.trim() || undefined,
      });

      setAlert({
        type: "success",
        text: `Restocked ${restockQty} units for SKU ${restockItem.sku}!`,
      });

      setRestockItem(null);
      setRestockPo("");
      setRestockNotes("");
      fetchAlerts();
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to restock variant",
      });
    } finally {
      setModalSubmitting(false);
    }
  };

  // Client-side filtering of the alert list
  const filteredItems = summary.items.filter((item) => {
    if (filterType === "out_of_stock" && !item.isOutOfStock) return false;
    if (filterType === "low_stock" && item.isOutOfStock) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchSku = item.sku.toLowerCase().includes(term);
      const matchTitle = item.productTitle.toLowerCase().includes(term);
      return matchSku || matchTitle;
    }
    return true;
  });

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="h4 mb-1 text-dark fw-bold">Critical Low Stock & Out of Stock Alerts</h2>
          <p className="text-muted small mb-0">
            Real-time alert dashboard of items whose sellable stock is below warehouse safety buffer.
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link href="/inventory" className="btn btn-outline-secondary btn-sm">
            <i className="bi bi-layers me-1"></i> Stock Overview
          </Link>
          <Link href="/inventory/adjustments" className="btn btn-outline-primary btn-sm">
            <i className="bi bi-pencil-square me-1"></i> Stock Adjustment
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

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card shadow-sm border-0 border-start border-danger border-4">
            <div className="card-body">
              <div className="text-muted small text-uppercase fw-bold">Out of Stock (Zero Available)</div>
              <div className="h3 mb-0 fw-bold text-danger">
                {summary.outOfStockCount}
              </div>
              <div className="small text-muted mt-1">Requires immediate restocking to avoid missed sales</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card shadow-sm border-0 border-start border-warning border-4">
            <div className="card-body">
              <div className="text-muted small text-uppercase fw-bold">Low Stock (≤ Threshold)</div>
              <div className="h3 mb-0 fw-bold text-warning">
                {summary.lowStockCount - summary.outOfStockCount}
              </div>
              <div className="small text-muted mt-1">Stock depleted below safety threshold buffer</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card shadow-sm border-0 border-start border-primary border-4">
            <div className="card-body">
              <div className="text-muted small text-uppercase fw-bold">Total Alert Items</div>
              <div className="h3 mb-0 fw-bold text-primary">
                {summary.lowStockCount}
              </div>
              <div className="small text-muted mt-1">Across {summary.totalVariants} total tracked catalog SKUs</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Filter alert items by SKU or product title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="btn-group btn-group-sm w-100" role="group">
                <button
                  type="button"
                  className={`btn ${filterType === "all" ? "btn-dark" : "btn-outline-secondary"}`}
                  onClick={() => setFilterType("all")}
                >
                  All Alerts ({summary.lowStockCount})
                </button>
                <button
                  type="button"
                  className={`btn ${filterType === "out_of_stock" ? "btn-danger" : "btn-outline-danger"}`}
                  onClick={() => setFilterType("out_of_stock")}
                >
                  Out of Stock ({summary.outOfStockCount})
                </button>
                <button
                  type="button"
                  className={`btn ${filterType === "low_stock" ? "btn-warning text-dark" : "btn-outline-warning text-dark"}`}
                  onClick={() => setFilterType("low_stock")}
                >
                  Low Stock ({summary.lowStockCount - summary.outOfStockCount})
                </button>
              </div>
            </div>
            <div className="col-12 col-md-2 text-md-end">
              <button
                className="btn btn-outline-secondary btn-sm w-100"
                onClick={() => {
                  setSearchTerm("");
                  setFilterType("all");
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Table */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3 border-0">
          <h5 className="card-title mb-0 fs-6 fw-bold text-dark">
            Attention Required Items ({filteredItems.length})
          </h5>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-muted small text-uppercase">
              <tr>
                <th style={{ width: "50px" }}>Item</th>
                <th>SKU / Product</th>
                <th>Attributes</th>
                <th className="text-center">On-Hand</th>
                <th className="text-center">Reserved</th>
                <th className="text-center">Available</th>
                <th className="text-center">Safety Threshold</th>
                <th className="text-center">Status</th>
                <th className="text-end" style={{ width: "160px" }}>Immediate Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    Scanning inventory stock levels...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-5 text-muted">
                    <i className="bi bi-check-circle fs-1 d-block mb-2 text-success"></i>
                    All product variants have healthy warehouse stock balances above safety thresholds!
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
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
                            style={{ width: "40px", height: "40px", objectFit: "cover" }}
                          />
                        ) : (
                          <div
                            className="bg-light rounded border d-flex align-items-center justify-content-center text-muted"
                            style={{ width: "40px", height: "40px" }}
                          >
                            <i className="bi bi-box"></i>
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="fw-bold text-dark font-monospace d-block">
                          {item.sku}
                        </span>
                        <span className="small text-muted">{item.productTitle}</span>
                      </td>
                      <td>
                        {item.attributes.length > 0 ? (
                          <div className="d-flex flex-wrap gap-1">
                            {item.attributes.map((attr, idx) => (
                              <span key={idx} className="badge bg-light text-dark border small">
                                {attr.name}: {attr.value}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted small">Standard</span>
                        )}
                      </td>
                      <td className="text-center fw-bold">{item.quantity}</td>
                      <td className="text-center text-muted">{item.reservedQuantity}</td>
                      <td className="text-center">
                        <span
                          className={`fw-bold fs-6 ${
                            item.availableQuantity === 0 ? "text-danger" : "text-warning"
                          }`}
                        >
                          {item.availableQuantity}
                        </span>
                      </td>
                      <td className="text-center text-muted fw-bold">
                        {item.lowStockThreshold}
                      </td>
                      <td className="text-center">
                        {item.isOutOfStock ? (
                          <span className="badge bg-danger">Out of Stock</span>
                        ) : (
                          <span className="badge bg-warning text-dark">Low Stock</span>
                        )}
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            setRestockItem(item);
                            setRestockQty(Math.max(25, item.lowStockThreshold * 2));
                          }}
                        >
                          <i className="bi bi-plus-circle me-1"></i> Restock
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restock Modal */}
      {restockItem && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fs-6 fw-bold">
                  Restock: {restockItem.sku}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setRestockItem(null)}
                ></button>
              </div>
              <form onSubmit={handleRestockSubmit}>
                <div className="modal-body">
                  <div className="alert alert-warning border small mb-3">
                    <div className="fw-bold">{restockItem.productTitle}</div>
                    <div>
                      Available: <strong className="text-danger">{restockItem.availableQuantity}</strong> (Threshold:{" "}
                      <strong>{restockItem.lowStockThreshold}</strong>)
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Restock Quantity (+)</label>
                    <input
                      type="number"
                      min={1}
                      className="form-control form-control-sm"
                      value={restockQty}
                      onChange={(e) => setRestockQty(Number(e.target.value))}
                      required
                    />
                    <div className="form-text small">
                      Resulting available stock:{" "}
                      <span className="fw-bold text-success">
                        {restockItem.availableQuantity + Number(restockQty)} units
                      </span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Purchase Order / Inward Receipt #</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. PO-RESTOCK-2026-01"
                      value={restockPo}
                      onChange={(e) => setRestockPo(e.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Notes</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows={2}
                      placeholder="Warehouse note..."
                      value={restockNotes}
                      onChange={(e) => setRestockNotes(e.target.value)}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setRestockItem(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={modalSubmitting || restockQty <= 0}
                  >
                    {modalSubmitting ? "Restocking..." : "Confirm Restock"}
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
