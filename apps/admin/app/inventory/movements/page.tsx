"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  StockMovementItem,
  StockMovementType,
  getStockMovements,
} from "../../../services/inventory";

export default function StockMovementsPage() {
  const searchParams = useSearchParams();
  const initialVariantId = searchParams.get("variantId") || "";

  const [items, setItems] = useState<StockMovementItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [variantId, setVariantId] = useState(initialVariantId);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [referenceFilter, setReferenceFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [alert, setAlert] = useState<{
    type: "success" | "danger" | "info";
    text: string;
  } | null>(null);

  const fetchMovements = useCallback(async () => {
    void Promise.resolve().then(() => setLoading(true));
    try {
      const res = await getStockMovements({
        page,
        limit,
        variantId: variantId || undefined,
        type: (typeFilter as StockMovementType) || undefined,
        referenceId: referenceFilter.trim() || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });

      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to load stock movements",
      });
    } finally {
      setLoading(false);
    }
  }, [page, limit, variantId, typeFilter, referenceFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  const getTypeBadge = (type: StockMovementType) => {
    switch (type) {
      case "RESTOCK":
        return <span className="badge bg-success">Restock</span>;
      case "PURCHASE_RESERVE":
        return <span className="badge bg-info text-dark">Checkout Reserve</span>;
      case "ORDER_FULFILL":
        return <span className="badge bg-primary">Order Fulfill</span>;
      case "CANCEL_RESTORE":
        return <span className="badge bg-secondary">Cancel Release</span>;
      case "RETURN_RESTORE":
        return <span className="badge bg-info">Return Restocked</span>;
      case "MANUAL_ADJUSTMENT":
        return <span className="badge bg-dark">Manual Count</span>;
      case "DAMAGED":
        return <span className="badge bg-danger">Damaged / Loss</span>;
      case "INITIAL":
        return <span className="badge bg-secondary">Initial Seed</span>;
      default:
        return <span className="badge bg-secondary">{type}</span>;
    }
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="h4 mb-1 text-dark fw-bold">Stock Movement Audit Ledger</h2>
          <p className="text-muted small mb-0">
            Immutable, append-only history of every inventory addition, deduction, reservation, and audit adjustment.
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link href="/inventory" className="btn btn-outline-secondary btn-sm">
            <i className="bi bi-layers me-1"></i> Stock Overview
          </Link>
          <Link href="/inventory/adjustments" className="btn btn-primary btn-sm">
            <i className="bi bi-pencil-square me-1"></i> New Adjustment
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

      {/* Filter Bar */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12 col-md-3">
              <label className="form-label small text-muted mb-1">Movement Reason</label>
              <select
                className="form-select form-select-sm"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Movement Types</option>
                <option value="RESTOCK">RESTOCK (+)</option>
                <option value="MANUAL_ADJUSTMENT">MANUAL ADJUSTMENT (+/-)</option>
                <option value="DAMAGED">DAMAGED (-)</option>
                <option value="PURCHASE_RESERVE">PURCHASE RESERVE</option>
                <option value="ORDER_FULFILL">ORDER FULFILL (-)</option>
                <option value="CANCEL_RESTORE">CANCEL RELEASE (+)</option>
                <option value="RETURN_RESTORE">RETURN RESTORE (+)</option>
              </select>
            </div>

            <div className="col-12 col-md-3">
              <label className="form-label small text-muted mb-1">Reference Code</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search PO#, Order ID..."
                value={referenceFilter}
                onChange={(e) => {
                  setReferenceFilter(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="col-6 col-md-2">
              <label className="form-label small text-muted mb-1">From Date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="col-6 col-md-2">
              <label className="form-label small text-muted mb-1">To Date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="col-12 col-md-2 d-flex align-items-end">
              <button
                className="btn btn-outline-secondary btn-sm w-100"
                onClick={() => {
                  setVariantId("");
                  setTypeFilter("");
                  setReferenceFilter("");
                  setDateFrom("");
                  setDateTo("");
                  setPage(1);
                }}
              >
                Reset Filters
              </button>
            </div>
          </div>

          {variantId && (
            <div className="mt-3 p-2 bg-light rounded border d-flex justify-content-between align-items-center">
              <span className="small text-muted">
                Filtering by Variant ID: <code className="text-dark">{variantId}</code>
              </span>
              <button
                className="btn btn-link btn-sm text-danger p-0"
                onClick={() => setVariantId("")}
              >
                Clear variant filter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Audit Ledger Table */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3 border-0">
          <h5 className="card-title mb-0 fs-6 fw-bold text-dark">
            Audit Ledger Entries ({total})
          </h5>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-muted small text-uppercase">
              <tr>
                <th style={{ width: "170px" }}>Timestamp</th>
                <th>SKU / Product</th>
                <th className="text-center" style={{ width: "140px" }}>Type</th>
                <th className="text-center" style={{ width: "100px" }}>Delta</th>
                <th className="text-center" style={{ width: "140px" }}>Balance</th>
                <th>Reference</th>
                <th>Staff User</th>
                <th>Audit Notes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    Loading audit movements...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted">
                    <i className="bi bi-clock-history fs-1 d-block mb-2 text-secondary"></i>
                    No stock movements recorded matching current filters.
                  </td>
                </tr>
              ) : (
                items.map((m) => {
                  const dateStr = new Date(m.createdAt).toLocaleString(undefined, {
                    dateStyle: "short",
                    timeStyle: "medium",
                  });

                  return (
                    <tr key={m.id}>
                      <td className="small text-muted font-monospace">{dateStr}</td>
                      <td>
                        <span className="fw-bold text-dark font-monospace d-block">
                          {m.sku}
                        </span>
                        <span className="small text-muted">{m.productTitle}</span>
                      </td>
                      <td className="text-center">{getTypeBadge(m.type)}</td>
                      <td className="text-center">
                        <span
                          className={`fw-bold ${
                            m.quantityChange > 0
                              ? "text-success"
                              : m.quantityChange < 0
                              ? "text-danger"
                              : "text-muted"
                          }`}
                        >
                          {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                        </span>
                      </td>
                      <td className="text-center small">
                        <span className="text-muted">{m.previousQuantity}</span>{" "}
                        <i className="bi bi-arrow-right text-muted mx-1"></i>{" "}
                        <strong className="text-dark">{m.newQuantity}</strong>
                      </td>
                      <td className="small">
                        {m.referenceId ? (
                          <span className="badge bg-light text-dark border font-monospace">
                            {m.referenceId}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="small">
                        {m.performedByUserName ? (
                          <span className="text-dark fw-medium">
                            <i className="bi bi-person me-1"></i>
                            {m.performedByUserName}
                          </span>
                        ) : (
                          <span className="text-muted">System</span>
                        )}
                      </td>
                      <td className="small text-muted" style={{ maxWidth: "250px" }}>
                        {m.notes || "—"}
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
              Page {page} of {totalPages} ({total} movement logs)
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
    </div>
  );
}
