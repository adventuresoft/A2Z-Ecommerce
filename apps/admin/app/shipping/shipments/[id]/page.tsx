"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Shipment,
  ShipmentStatus,
  getShipment,
  updateShipmentStatus,
  updateShipmentDetails,
} from "../../../../services/shipments";

export default function ShipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);

  // Status Update state
  const [targetStatus, setTargetStatus] = useState<ShipmentStatus>("PREPARING");
  const [statusNote, setStatusNote] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Edit details state
  const [courierName, setCourierName] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);

  // Alert
  const [alert, setAlert] = useState<{
    type: "success" | "danger";
    text: string;
  } | null>(null);

  const loadShipment = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getShipment(id);
      setShipment(data);
      setTargetStatus(data.status);
      setCourierName(data.courierName);
      setTrackingNumber(data.trackingNumber || "");
      setTrackingUrl(data.trackingUrl || "");
      setNotes(data.notes || "");
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to load shipment details",
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadShipment();
  }, [loadShipment]);

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipment) return;

    setUpdatingStatus(true);
    try {
      const updated = await updateShipmentStatus(shipment.id, {
        status: targetStatus,
        notes: statusNote.trim() || undefined,
        trackingNumber: trackingNumber.trim() || undefined,
        trackingUrl: trackingUrl.trim() || undefined,
      });

      setShipment(updated);
      setStatusNote("");
      setAlert({
        type: "success",
        text: `Shipment status updated to ${targetStatus} and synchronized with order.`,
      });
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to update status",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipment) return;

    setSavingDetails(true);
    try {
      const updated = await updateShipmentDetails(shipment.id, {
        courierName: courierName.trim() || undefined,
        trackingNumber: trackingNumber.trim() || undefined,
        trackingUrl: trackingUrl.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setShipment(updated);
      setAlert({
        type: "success",
        text: "Shipment metadata saved successfully.",
      });
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to save details",
      });
    } finally {
      setSavingDetails(false);
    }
  };

  const getStatusBadge = (status: ShipmentStatus) => {
    switch (status) {
      case "UNFULFILLED":
        return <span className="badge bg-secondary fs-6">Unfulfilled</span>;
      case "PREPARING":
        return <span className="badge bg-warning text-dark fs-6">Preparing</span>;
      case "DISPATCHED":
        return <span className="badge bg-primary fs-6">Dispatched</span>;
      case "IN_TRANSIT":
        return <span className="badge bg-info text-dark fs-6">In Transit</span>;
      case "OUT_FOR_DELIVERY":
        return (
          <span className="badge bg-indigo text-white fs-6" style={{ backgroundColor: "#6610f2" }}>
            Out for Delivery
          </span>
        );
      case "DELIVERED":
        return <span className="badge bg-success fs-6">Delivered</span>;
      case "FAILED_DELIVERY":
        return <span className="badge bg-danger fs-6">Failed Delivery</span>;
      case "RETURNED":
        return <span className="badge bg-dark fs-6">Returned</span>;
      default:
        return <span className="badge bg-light text-dark fs-6">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="container-fluid px-4 py-5 text-center">
        <div className="spinner-border text-primary me-2" role="status"></div>
        <span className="text-muted">Loading shipment details...</span>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="container-fluid px-4 py-5 text-center">
        <h4 className="text-danger fw-bold">Shipment Not Found</h4>
        <p className="text-muted">The requested shipment does not exist or was deleted.</p>
        <Link href="/shipping/shipments" className="btn btn-outline-secondary btn-sm">
          Back to Shipments
        </Link>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-3">
      {/* Page Header */}
      <div className="row mb-3 align-items-center">
        <div className="col-sm-6">
          <div className="d-flex align-items-center gap-2">
            <button
              onClick={() => router.back()}
              className="btn btn-outline-secondary btn-sm"
              title="Go Back"
            >
              <i className="bi bi-arrow-left"></i>
            </button>
            <h1 className="m-0 fs-3 fw-bold text-dark">
              Shipment {shipment.trackingNumber ? `#${shipment.trackingNumber}` : shipment.id.slice(0, 8)}
            </h1>
            <div>{getStatusBadge(shipment.status)}</div>
          </div>
          <p className="text-muted small m-0 mt-1">
            Created on {new Date(shipment.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="col-sm-6 text-sm-end mt-2 mt-sm-0">
          <Link
            href={`/orders/${shipment.orderId}`}
            className="btn btn-outline-primary btn-sm me-2"
          >
            <i className="bi bi-receipt me-1"></i> View Order #{shipment.orderNumber || shipment.orderId.slice(0, 8)}
          </Link>
          <Link href="/shipping/shipments" className="btn btn-outline-secondary btn-sm">
            <i className="bi bi-list-ul me-1"></i> All Shipments
          </Link>
        </div>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show shadow-sm mb-4`} role="alert">
          {alert.text}
          <button type="button" className="btn-close" onClick={() => setAlert(null)}></button>
        </div>
      )}

      <div className="row g-4">
        {/* Left Column: Courier & Delivery Details */}
        <div className="col-lg-7">
          {/* Courier Card */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-white py-3">
              <h5 className="card-title m-0 fw-bold">
                <i className="bi bi-truck text-primary me-2"></i>
                Courier & Logistics Details
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-sm-6">
                  <div className="text-muted small">Courier Provider</div>
                  <div className="fw-bold fs-6 text-dark">{shipment.courierName}</div>
                </div>
                <div className="col-sm-6">
                  <div className="text-muted small">Tracking / Consignment Number</div>
                  <div className="fw-bold fs-6 font-monospace text-primary">
                    {shipment.trackingNumber || <span className="text-muted fst-italic">None Assigned</span>}
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="text-muted small">Shipping Method</div>
                  <div className="fw-semibold text-dark">
                    {shipment.shippingMethodName || "Default Rate Card"}
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="text-muted small">Public Tracking Link</div>
                  <div>
                    {shipment.trackingUrl ? (
                      <a
                        href={shipment.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary text-decoration-none small d-inline-flex align-items-center"
                      >
                        Open Carrier Tracking <i className="bi bi-box-arrow-up-right ms-1"></i>
                      </a>
                    ) : (
                      <span className="text-muted small fst-italic">No URL configured</span>
                    )}
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="text-muted small">Shipped / Dispatched At</div>
                  <div className="fw-semibold text-dark">
                    {shipment.shippedAt ? new Date(shipment.shippedAt).toLocaleString() : "Pending Dispatch"}
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="text-muted small">Delivered At</div>
                  <div className="fw-semibold text-success">
                    {shipment.deliveredAt ? new Date(shipment.deliveredAt).toLocaleString() : "Not Delivered"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Recipient Card */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-white py-3">
              <h5 className="card-title m-0 fw-bold">
                <i className="bi bi-geo-alt text-danger me-2"></i>
                Recipient & Delivery Destination
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-sm-6">
                  <div className="text-muted small">Recipient Full Name</div>
                  <div className="fw-bold text-dark">{shipment.recipientName || "—"}</div>
                </div>
                <div className="col-sm-6">
                  <div className="text-muted small">Contact Telephone</div>
                  <div className="fw-bold text-dark">{shipment.recipientPhone || "—"}</div>
                </div>
                <div className="col-12">
                  <div className="text-muted small">Street & Building Address</div>
                  <div className="fw-semibold text-dark">{shipment.shippingStreet || "—"}</div>
                </div>
                <div className="col-sm-6">
                  <div className="text-muted small">City / Area</div>
                  <div className="fw-semibold text-dark">{shipment.shippingCity || "—"}</div>
                </div>
                <div className="col-sm-6">
                  <div className="text-muted small">Delivery Notes</div>
                  <div className="small text-muted">{shipment.notes || "None"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Metadata Form */}
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3">
              <h5 className="card-title m-0 fw-bold">
                <i className="bi bi-pencil-square text-secondary me-2"></i>
                Update Courier & Tracking Metadata
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleDetailsSubmit}>
                <div className="row g-3">
                  <div className="col-sm-6">
                    <label className="form-label small fw-semibold">Courier Name</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={courierName}
                      onChange={(e) => setCourierName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label small fw-semibold">Tracking #</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-semibold">Tracking URL</label>
                    <input
                      type="url"
                      className="form-control form-control-sm"
                      placeholder="https://carrier.com/track/..."
                      value={trackingUrl}
                      onChange={(e) => setTrackingUrl(e.target.value)}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-semibold">Package Notes</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    ></textarea>
                  </div>
                  <div className="col-12 text-end">
                    <button type="submit" className="btn btn-outline-primary btn-sm" disabled={savingDetails}>
                      {savingDetails ? "Saving..." : "Save Metadata"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: Status Transitions & Audit Timeline */}
        <div className="col-lg-5">
          {/* Quick Transition Card */}
          <div className="card shadow-sm border-0 mb-4 border-top border-4 border-primary">
            <div className="card-header bg-white py-3">
              <h5 className="card-title m-0 fw-bold">
                <i className="bi bi-arrow-repeat text-primary me-2"></i>
                Advance Transit Status
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleStatusSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Target Transit Status</label>
                  <select
                    className="form-select form-select-sm"
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value as ShipmentStatus)}
                    required
                  >
                    <option value="PREPARING">Preparing</option>
                    <option value="DISPATCHED">Dispatched (Advances Order to Shipped)</option>
                    <option value="IN_TRANSIT">In Transit</option>
                    <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                    <option value="DELIVERED">Delivered (Marks Order Delivered)</option>
                    <option value="FAILED_DELIVERY">Failed Delivery</option>
                    <option value="RETURNED">Returned</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Checkpoint / Audit Note</label>
                  <textarea
                    className="form-control form-control-sm"
                    rows={2}
                    placeholder="e.g. Received at delivery branch hub"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm w-100 fw-semibold"
                  disabled={updatingStatus}
                >
                  {updatingStatus ? "Processing Transition..." : "Update Shipment Status"}
                </button>
              </form>
            </div>
          </div>

          {/* Status History Timeline */}
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3">
              <h5 className="card-title m-0 fw-bold">
                <i className="bi bi-clock-history text-secondary me-2"></i>
                Transit Status History
              </h5>
            </div>
            <div className="card-body p-3">
              {shipment.statusHistory.length === 0 ? (
                <p className="text-muted small m-0">No status transitions recorded yet.</p>
              ) : (
                <div className="timeline-list">
                  {shipment.statusHistory.map((h, idx) => (
                    <div key={h.id || idx} className="d-flex mb-3 position-relative">
                      <div className="me-3">
                        <span className="badge rounded-pill bg-light text-dark border p-2">
                          <i className="bi bi-record-circle text-primary"></i>
                        </span>
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-bold small">{getStatusBadge(h.toStatus)}</span>
                          <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                            {new Date(h.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {h.notes && <div className="text-secondary small mt-1">{h.notes}</div>}
                        {h.changedByUserName && (
                          <div className="text-muted" style={{ fontSize: "0.7rem" }}>
                            By {h.changedByUserName}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
