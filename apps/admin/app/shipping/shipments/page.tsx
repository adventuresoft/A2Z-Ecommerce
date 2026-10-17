"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Shipment,
  ShipmentStatus,
  getShipments,
  updateShipmentStatus,
} from "../../../services/shipments";

export default function ShipmentsListPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | "">("");
  const [courierFilter, setCourierFilter] = useState("");

  // Update Status Modal State
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [targetStatus, setTargetStatus] = useState<ShipmentStatus>("PREPARING");
  const [statusNote, setStatusNote] = useState("");
  const [trackingNumberUpdate, setTrackingNumberUpdate] = useState("");
  const [updating, setUpdating] = useState(false);

  // Feedback Alert
  const [alert, setAlert] = useState<{
    type: "success" | "danger" | "info";
    text: string;
  } | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getShipments({
        page,
        limit,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        courierName: courierFilter || undefined,
      });

      setShipments(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to load shipments",
      });
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter, courierFilter]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  const handleOpenStatusModal = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setTargetStatus(shipment.status);
    setStatusNote("");
    setTrackingNumberUpdate(shipment.trackingNumber || "");
  };

  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment) return;

    setUpdating(true);
    try {
      await updateShipmentStatus(selectedShipment.id, {
        status: targetStatus,
        notes: statusNote.trim() || undefined,
        trackingNumber: trackingNumberUpdate.trim() || undefined,
      });

      setAlert({
        type: "success",
        text: `Shipment status updated to ${targetStatus} successfully`,
      });
      setSelectedShipment(null);
      fetchShipments();
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to update status",
      });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: ShipmentStatus) => {
    switch (status) {
      case "UNFULFILLED":
        return <span className="badge bg-secondary">Unfulfilled</span>;
      case "PREPARING":
        return <span className="badge bg-warning text-dark">Preparing</span>;
      case "DISPATCHED":
        return <span className="badge bg-primary">Dispatched</span>;
      case "IN_TRANSIT":
        return <span className="badge bg-info text-dark">In Transit</span>;
      case "OUT_FOR_DELIVERY":
        return <span className="badge bg-indigo text-white" style={{ backgroundColor: "#6610f2" }}>Out for Delivery</span>;
      case "DELIVERED":
        return <span className="badge bg-success">Delivered</span>;
      case "FAILED_DELIVERY":
        return <span className="badge bg-danger">Failed Delivery</span>;
      case "RETURNED":
        return <span className="badge bg-dark">Returned</span>;
      default:
        return <span className="badge bg-light text-dark">{status}</span>;
    }
  };

  return (
    <div className="container-fluid px-4 py-3">
      {/* Page Header */}
      <div className="row mb-3 align-items-center">
        <div className="col-sm-6">
          <h1 className="m-0 fs-3 fw-bold text-dark">
            <i className="bi bi-box me-2 text-primary"></i>
            Shipments Management
          </h1>
          <p className="text-muted small m-0">
            Dispatch, track courier deliveries, and manage fulfillment packages
          </p>
        </div>
        <div className="col-sm-6 text-sm-end mt-2 mt-sm-0">
          <Link href="/shipping/methods" className="btn btn-outline-secondary btn-sm me-2">
            <i className="bi bi-gear-wide me-1"></i> Shipping Methods
          </Link>
          <Link href="/shipping/zones" className="btn btn-outline-secondary btn-sm me-2">
            <i className="bi bi-geo-alt me-1"></i> Delivery Zones
          </Link>
          <Link href="/orders" className="btn btn-primary btn-sm">
            <i className="bi bi-cart3 me-1"></i> View Orders
          </Link>
        </div>
      </div>

      {/* Alert Notice */}
      {alert && (
        <div
          className={`alert alert-${alert.type} alert-dismissible fade show shadow-sm`}
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

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3 col-sm-6">
          <div className="card shadow-sm border-0 border-start border-4 border-primary h-100">
            <div className="card-body">
              <div className="text-muted small fw-semibold text-uppercase">Total Shipments</div>
              <div className="fs-4 fw-bold mt-1">{total}</div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="card shadow-sm border-0 border-start border-4 border-warning h-100">
            <div className="card-body">
              <div className="text-muted small fw-semibold text-uppercase">Preparing</div>
              <div className="fs-4 fw-bold mt-1 text-warning">
                {shipments.filter((s) => s.status === "PREPARING").length}
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="card shadow-sm border-0 border-start border-4 border-info h-100">
            <div className="card-body">
              <div className="text-muted small fw-semibold text-uppercase">In Transit</div>
              <div className="fs-4 fw-bold mt-1 text-info">
                {shipments.filter((s) => s.status === "IN_TRANSIT" || s.status === "DISPATCHED").length}
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="card shadow-sm border-0 border-start border-4 border-success h-100">
            <div className="card-body">
              <div className="text-muted small fw-semibold text-uppercase">Delivered</div>
              <div className="fs-4 fw-bold mt-1 text-success">
                {shipments.filter((s) => s.status === "DELIVERED").length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Box */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-lg-4 col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search tracking #, order #, courier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as ShipmentStatus | "");
                  setPage(1);
                }}
              >
                <option value="">All Shipment Statuses</option>
                <option value="PREPARING">Preparing</option>
                <option value="DISPATCHED">Dispatched</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                <option value="DELIVERED">Delivered</option>
                <option value="FAILED_DELIVERY">Failed Delivery</option>
                <option value="RETURNED">Returned</option>
              </select>
            </div>

            <div className="col-lg-3 col-md-6">
              <input
                type="text"
                className="form-control"
                placeholder="Filter by courier name"
                value={courierFilter}
                onChange={(e) => {
                  setCourierFilter(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="col-lg-2 col-md-6 text-end">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("");
                  setCourierFilter("");
                  setPage(1);
                }}
              >
                <i className="bi bi-arrow-counterclockwise me-1"></i> Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Shipments Data Table */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light text-muted small text-uppercase">
                <tr>
                  <th className="ps-3 py-3">Tracking #</th>
                  <th className="py-3">Order Ref</th>
                  <th className="py-3">Recipient & City</th>
                  <th className="py-3">Courier</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Dispatched / Delivered</th>
                  <th className="pe-3 py-3 text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5 text-muted">
                      <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                      Loading shipments...
                    </td>
                  </tr>
                ) : shipments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5 text-muted">
                      <i className="bi bi-box-seam display-6 text-muted d-block mb-2"></i>
                      No shipments found matching criteria.
                    </td>
                  </tr>
                ) : (
                  shipments.map((s) => (
                    <tr key={s.id}>
                      <td className="ps-3">
                        <div className="fw-semibold">
                          {s.trackingNumber ? (
                            <span className="font-monospace text-primary">{s.trackingNumber}</span>
                          ) : (
                            <span className="text-muted font-monospace fst-italic">Pending Assign</span>
                          )}
                        </div>
                        {s.trackingUrl && (
                          <a
                            href={s.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-decoration-none small text-muted d-inline-flex align-items-center"
                          >
                            Track URL <i className="bi bi-box-arrow-up-right ms-1" style={{ fontSize: "0.75rem" }}></i>
                          </a>
                        )}
                      </td>
                      <td>
                        <Link
                          href={`/orders/${s.orderId}`}
                          className="fw-semibold text-decoration-none font-monospace"
                        >
                          {s.orderNumber || s.orderId.slice(0, 8)}
                        </Link>
                      </td>
                      <td>
                        <div className="fw-semibold">{s.recipientName || "—"}</div>
                        <div className="small text-muted">
                          {s.shippingCity || "—"} {s.recipientPhone ? `• ${s.recipientPhone}` : ""}
                        </div>
                      </td>
                      <td>
                        <span className="fw-semibold text-dark">{s.courierName}</span>
                        {s.shippingMethodName && (
                          <div className="small text-muted">{s.shippingMethodName}</div>
                        )}
                      </td>
                      <td>{getStatusBadge(s.status)}</td>
                      <td>
                        {s.shippedAt ? (
                          <div className="small text-muted">
                            <i className="bi bi-send me-1 text-primary"></i>
                            {new Date(s.shippedAt).toLocaleDateString()}
                          </div>
                        ) : null}
                        {s.deliveredAt ? (
                          <div className="small text-success">
                            <i className="bi bi-check-circle me-1"></i>
                            {new Date(s.deliveredAt).toLocaleDateString()}
                          </div>
                        ) : null}
                        {!s.shippedAt && !s.deliveredAt && (
                          <span className="small text-muted fst-italic">Not dispatched</span>
                        )}
                      </td>
                      <td className="pe-3 text-end">
                        <button
                          className="btn btn-outline-primary btn-sm me-2"
                          onClick={() => handleOpenStatusModal(s)}
                          title="Update Status"
                        >
                          <i className="bi bi-arrow-repeat me-1"></i> Status
                        </button>
                        <Link
                          href={`/shipping/shipments/${s.id}`}
                          className="btn btn-light btn-sm border"
                          title="View Details"
                        >
                          <i className="bi bi-eye"></i>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center p-3 border-top">
              <span className="small text-muted">
                Showing page {page} of {totalPages} ({total} shipments)
              </span>
              <nav aria-label="Shipments page navigation">
                <ul className="pagination pagination-sm m-0">
                  <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => setPage((p) => Math.max(1, p - 1))}>
                      Previous
                    </button>
                  </li>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                    .map((p, idx, arr) => (
                      <React.Fragment key={p}>
                        {idx > 0 && arr[idx - 1] !== p - 1 && (
                          <li className="page-item disabled">
                            <span className="page-link">...</span>
                          </li>
                        )}
                        <li className={`page-item ${page === p ? "active" : ""}`}>
                          <button className="page-link" onClick={() => setPage(p)}>
                            {p}
                          </button>
                        </li>
                      </React.Fragment>
                    ))}
                  <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Quick Update Status Modal */}
      {selectedShipment && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  Update Shipment Status: {selectedShipment.courierName}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedShipment(null)}
                ></button>
              </div>
              <form onSubmit={handleUpdateStatusSubmit}>
                <div className="modal-body">
                  <p className="small text-muted mb-3">
                    Order Ref: <strong>{selectedShipment.orderNumber || selectedShipment.orderId}</strong>
                  </p>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Transit Status</label>
                    <select
                      className="form-select"
                      value={targetStatus}
                      onChange={(e) => setTargetStatus(e.target.value as ShipmentStatus)}
                      required
                    >
                      <option value="PREPARING">Preparing</option>
                      <option value="DISPATCHED">Dispatched (Fulfills stock & marks Order Shipped)</option>
                      <option value="IN_TRANSIT">In Transit</option>
                      <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                      <option value="DELIVERED">Delivered (Marks Order Delivered)</option>
                      <option value="FAILED_DELIVERY">Failed Delivery</option>
                      <option value="RETURNED">Returned</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Tracking / Consignment #</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. ST-2026-987654"
                      value={trackingNumberUpdate}
                      onChange={(e) => setTrackingNumberUpdate(e.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Audit Note / Checkpoint</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="e.g. Scanned at regional sorting facility"
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setSelectedShipment(null)}
                    disabled={updating}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={updating}>
                    {updating ? "Saving..." : "Update Status"}
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
