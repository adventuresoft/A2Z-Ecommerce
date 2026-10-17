"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import {
  AdminOrder,
  OrderStatus,
  PaymentStatus,
  ShipmentStatus,
  ordersService,
} from "../../../services/orders";
import { createShipment } from "../../../services/shipments";

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;

  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{
    type: "success" | "danger" | "info";
    text: string;
  } | null>(null);

  // Status Update Modal State
  const [showModal, setShowModal] = useState(false);
  const [newOrderStatus, setNewOrderStatus] = useState<OrderStatus>("PENDING");
  const [newPaymentStatus, setNewPaymentStatus] = useState<PaymentStatus>("PENDING");
  const [newShipmentStatus, setNewShipmentStatus] = useState<ShipmentStatus>("UNFULFILLED");
  const [statusNotes, setStatusNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  // Create Shipment Modal State
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [shipmentCourier, setShipmentCourier] = useState("Steadfast Courier");
  const [shipmentTracking, setShipmentTracking] = useState("");
  const [shipmentTrackingUrl, setShipmentTrackingUrl] = useState("");
  const [shipmentNotes, setShipmentNotes] = useState("");
  const [creatingShipment, setCreatingShipment] = useState(false);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ordersService.getOrderById(orderId);
      setOrder(data);
      setNewOrderStatus(data.orderStatus);
      setNewPaymentStatus(data.paymentStatus);
      setNewShipmentStatus(data.shipmentStatus);
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to load order details",
      });
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const updated = await ordersService.updateOrderStatus(orderId, {
        orderStatus: newOrderStatus !== order?.orderStatus ? newOrderStatus : undefined,
        paymentStatus: newPaymentStatus !== order?.paymentStatus ? newPaymentStatus : undefined,
        shipmentStatus: newShipmentStatus !== order?.shipmentStatus ? newShipmentStatus : undefined,
        notes: statusNotes || undefined,
      });

      setOrder(updated);
      setShowModal(false);
      setStatusNotes("");
      setAlert({
        type: "success",
        text: "Order status updated successfully",
      });
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to update order status",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setCreatingShipment(true);
    try {
      await createShipment({
        orderId: order.id,
        courierName: shipmentCourier.trim(),
        trackingNumber: shipmentTracking.trim() || undefined,
        trackingUrl: shipmentTrackingUrl.trim() || undefined,
        notes: shipmentNotes.trim() || undefined,
      });

      setShowShipmentModal(false);
      setShipmentTracking("");
      setShipmentTrackingUrl("");
      setShipmentNotes("");
      setAlert({
        type: "success",
        text: `Shipment package created via ${shipmentCourier} successfully.`,
      });
      fetchOrder();
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to create shipment",
      });
    } finally {
      setCreatingShipment(false);
    }
  };

  const getOrderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "PENDING":
        return <span className="badge bg-warning text-dark px-2 py-1">Pending</span>;
      case "CONFIRMED":
        return <span className="badge bg-info text-dark px-2 py-1">Confirmed</span>;
      case "PROCESSING":
        return <span className="badge bg-primary px-2 py-1">Processing</span>;
      case "SHIPPED":
        return <span className="badge text-white px-2 py-1" style={{ backgroundColor: "#6610f2" }}>Shipped</span>;
      case "DELIVERED":
        return <span className="badge bg-success px-2 py-1">Delivered</span>;
      case "CANCELLED":
        return <span className="badge bg-danger px-2 py-1">Cancelled</span>;
      case "RETURNED":
        return <span className="badge bg-secondary px-2 py-1">Returned</span>;
      default:
        return <span className="badge bg-light text-dark px-2 py-1">{status}</span>;
    }
  };

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case "PAID":
        return <span className="badge bg-success px-2 py-1">Paid</span>;
      case "PENDING":
        return <span className="badge bg-warning text-dark px-2 py-1">Pending</span>;
      case "FAILED":
        return <span className="badge bg-danger px-2 py-1">Failed</span>;
      case "REFUNDED":
        return <span className="badge bg-secondary px-2 py-1">Refunded</span>;
      default:
        return <span className="badge bg-light text-dark px-2 py-1">{status}</span>;
    }
  };

  const getShipmentStatusBadge = (status: ShipmentStatus) => {
    switch (status) {
      case "DELIVERED":
        return <span className="badge bg-success px-2 py-1">Delivered</span>;
      case "DISPATCHED":
      case "IN_TRANSIT":
      case "OUT_FOR_DELIVERY":
        return <span className="badge bg-info text-dark px-2 py-1">{status.replace(/_/g, " ")}</span>;
      case "PREPARING":
        return <span className="badge bg-warning text-dark px-2 py-1">Preparing</span>;
      case "UNFULFILLED":
        return <span className="badge bg-light text-dark border px-2 py-1">Unfulfilled</span>;
      case "FAILED_DELIVERY":
      case "RETURNED":
        return <span className="badge bg-danger px-2 py-1">{status.replace(/_/g, " ")}</span>;
      default:
        return <span className="badge bg-light text-dark px-2 py-1">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="container-fluid p-4 text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading order details...</span>
        </div>
        <p className="text-muted mt-2">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-fluid p-4 text-center py-5">
        <i className="bi bi-exclamation-triangle text-warning fs-1 d-block mb-3"></i>
        <h4>Order Not Found</h4>
        <p className="text-muted">The requested order could not be located.</p>
        <Link href="/orders" className="btn btn-primary mt-2">
          <i className="bi bi-arrow-left me-1"></i> Back to All Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="container-fluid p-3">
      {/* Header and Breadcrumbs */}
      <div className="row mb-3 align-items-center">
        <div className="col-sm-8">
          <div className="d-flex align-items-center gap-2">
            <Link href="/orders" className="btn btn-outline-secondary btn-sm">
              <i className="bi bi-arrow-left"></i>
            </Link>
            <h1 className="h3 mb-0 text-dark font-weight-bold font-monospace">
              Order {order.orderNumber}
            </h1>
            {getOrderStatusBadge(order.orderStatus)}
          </div>
          <p className="text-muted small mb-0 mt-1">
            Placed on {new Date(order.createdAt).toLocaleString()} · ID: <span className="font-monospace">{order.id}</span>
          </p>
        </div>
        <div className="col-sm-4 text-sm-end mt-2 mt-sm-0">
          <button
            onClick={() => {
              setNewOrderStatus(order.orderStatus);
              setNewPaymentStatus(order.paymentStatus);
              setNewShipmentStatus(order.shipmentStatus);
              setShowModal(true);
            }}
            className="btn btn-primary btn-sm me-2"
          >
            <i className="bi bi-pencil-square me-1"></i> Update Status
          </button>
          <button
            onClick={() => fetchOrder()}
            className="btn btn-outline-secondary btn-sm"
            title="Refresh order"
          >
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>

      {/* Alert banner */}
      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
          <i className="bi bi-info-circle me-2"></i>
          {alert.text}
          <button
            type="button"
            className="btn-close"
            onClick={() => setAlert(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="row g-4">
        {/* Left Column (8 cols): Order Line Items & Financials */}
        <div className="col-lg-8">
          {/* Purchased Line Items */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-white border-bottom py-3">
              <h5 className="card-title mb-0 font-weight-bold text-dark">
                <i className="bi bi-box-seam me-2 text-primary"></i>
                Order Items ({order.items?.length || 0})
              </h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table align-middle table-hover mb-0">
                  <thead className="table-light text-muted small text-uppercase">
                    <tr>
                      <th scope="col" className="ps-3">Item Details</th>
                      <th scope="col">SKU</th>
                      <th scope="col" className="text-end">Unit Price</th>
                      <th scope="col" className="text-center">Quantity</th>
                      <th scope="col" className="text-end pe-3">Total Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="ps-3">
                          <div className="fw-bold text-dark">{item.productTitle}</div>
                          {item.variantAttributes && (
                            <span className="badge bg-light text-secondary border small mt-1">
                              {item.variantAttributes}
                            </span>
                          )}
                        </td>
                        <td className="font-monospace small text-muted">{item.sku}</td>
                        <td className="text-end font-monospace">৳{item.unitPrice.toFixed(2)}</td>
                        <td className="text-center font-monospace">
                          <span className="badge bg-light text-dark border">{item.quantity}</span>
                        </td>
                        <td className="text-end pe-3 fw-bold font-monospace text-dark">
                          ৳{item.totalPrice.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Financial Summary */}
            <div className="card-footer bg-light border-top p-3">
              <div className="row justify-content-end">
                <div className="col-md-6 col-lg-5">
                  <div className="d-flex justify-content-between mb-1 small text-muted">
                    <span>Items Subtotal:</span>
                    <span className="font-monospace fw-semibold text-dark">৳{order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-1 small text-muted">
                    <span>Shipping Delivery Fee:</span>
                    <span className="font-monospace fw-semibold text-dark">৳{order.shippingFee.toFixed(2)}</span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="d-flex justify-content-between mb-1 small text-success">
                      <span>Promotional Discount:</span>
                      <span className="font-monospace fw-semibold">-৳{order.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <hr className="my-2" />
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="h6 mb-0 text-dark fw-bold">Grand Total:</span>
                    <span className="h5 mb-0 text-primary font-monospace fw-bold">
                      ৳{order.grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Notes if provided */}
          {order.customerNotes && (
            <div className="card shadow-sm border-0 mb-4 bg-light">
              <div className="card-body">
                <h6 className="card-title text-muted fw-bold mb-1">
                  <i className="bi bi-chat-left-text me-2"></i>Customer Delivery Instructions:
                </h6>
                <p className="mb-0 text-dark font-italic">“{order.customerNotes}”</p>
              </div>
            </div>
          )}

          {/* Status Transition Audit Timeline */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-white border-bottom py-3">
              <h5 className="card-title mb-0 font-weight-bold text-dark">
                <i className="bi bi-clock-history me-2 text-primary"></i>
                Order Status History & Audit Log
              </h5>
            </div>
            <div className="card-body">
              {order.statusHistory && order.statusHistory.length > 0 ? (
                <ul className="list-group list-group-flush">
                  {order.statusHistory.map((h) => (
                    <li key={h.id} className="list-group-item px-0 py-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <div>
                          <span className="me-2">{getOrderStatusBadge(h.toStatus)}</span>
                          {h.fromStatus && (
                            <span className="small text-muted me-2">
                              (from {h.fromStatus})
                            </span>
                          )}
                          {h.changedByUserName && (
                            <span className="badge bg-light text-dark border small">
                              By: {h.changedByUserName}
                            </span>
                          )}
                        </div>
                        <span className="small text-muted">
                          {new Date(h.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {h.notes && (
                        <p className="text-muted small mb-0 mt-1 ps-1 border-start border-3 border-primary ms-1">
                          {h.notes}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted small mb-0">No historical status transitions recorded.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Three-Axis Statuses & Recipient Snapshot */}
        <div className="col-lg-4">
          {/* Status Overview Card */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-white border-bottom py-3">
              <h6 className="card-title mb-0 font-weight-bold text-dark">
                <i className="bi bi-sliders me-2 text-primary"></i>Fulfillment Status
              </h6>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label text-muted small text-uppercase mb-1">
                  Order Lifecycle Status
                </label>
                <div>{getOrderStatusBadge(order.orderStatus)}</div>
              </div>

              <div className="mb-3">
                <label className="form-label text-muted small text-uppercase mb-1">
                  Payment Transaction Status
                </label>
                <div>{getPaymentStatusBadge(order.paymentStatus)}</div>
              </div>

              <div className="mb-3">
                <label className="form-label text-muted small text-uppercase mb-1">
                  Shipment & Courier Status
                </label>
                <div>{getShipmentStatusBadge(order.shipmentStatus)}</div>
              </div>

              <button
                type="button"
                className="btn btn-outline-primary btn-sm w-100 mt-2"
                onClick={() => {
                  setNewOrderStatus(order.orderStatus);
                  setNewPaymentStatus(order.paymentStatus);
                  setNewShipmentStatus(order.shipmentStatus);
                  setShowModal(true);
                }}
              >
                <i className="bi bi-pencil me-1"></i> Change Status
              </button>
            </div>
          </div>

          {/* Courier Shipments Card */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <h6 className="card-title mb-0 font-weight-bold text-dark">
                <i className="bi bi-truck me-2 text-primary"></i>Courier Shipments
              </h6>
              {order.orderStatus !== "CANCELLED" && order.orderStatus !== "RETURNED" && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm py-0 px-2"
                  style={{ fontSize: "0.8rem" }}
                  onClick={() => setShowShipmentModal(true)}
                >
                  <i className="bi bi-plus-lg me-1"></i> Dispatch
                </button>
              )}
            </div>
            <div className="card-body">
              {order.shipments && order.shipments.length > 0 ? (
                <div className="d-flex flex-column gap-3">
                  {order.shipments.map((s) => (
                    <div key={s.id} className="p-2 border rounded bg-light">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="fw-bold small text-dark">{s.courierName}</span>
                        {getShipmentStatusBadge(s.status)}
                      </div>
                      <div className="small font-monospace text-primary mb-1">
                        {s.trackingNumber ? (
                          <span>Tracking: {s.trackingNumber}</span>
                        ) : (
                          <span className="text-muted fst-italic">No tracking #</span>
                        )}
                      </div>
                      <div className="d-flex justify-content-between align-items-center mt-2 pt-1 border-top">
                        <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                          {new Date(s.createdAt).toLocaleDateString()}
                        </span>
                        <Link
                          href={`/shipping/shipments/${s.id}`}
                          className="btn btn-outline-secondary btn-sm py-0 px-2"
                          style={{ fontSize: "0.75rem" }}
                        >
                          Details <i className="bi bi-arrow-right ms-1"></i>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3">
                  <i className="bi bi-box-seam display-6 text-muted d-block mb-1"></i>
                  <p className="text-muted small mb-2">No shipment package created yet.</p>
                  {order.orderStatus !== "CANCELLED" && order.orderStatus !== "RETURNED" && (
                    <button
                      type="button"
                      className="btn btn-outline-success btn-sm"
                      onClick={() => setShowShipmentModal(true)}
                    >
                      <i className="bi bi-box-seam me-1"></i> Create Shipment Package
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Delivery & Recipient Snapshot Card */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-white border-bottom py-3">
              <h6 className="card-title mb-0 font-weight-bold text-dark">
                <i className="bi bi-geo-alt me-2 text-primary"></i>Delivery Address Snapshot
              </h6>
            </div>
            <div className="card-body">
              <div className="mb-2">
                <div className="small text-muted text-uppercase">Recipient Name:</div>
                <div className="fw-semibold text-dark">{order.recipientName}</div>
              </div>
              <div className="mb-2">
                <div className="small text-muted text-uppercase">Contact Phone:</div>
                <div className="fw-semibold text-dark font-monospace">{order.recipientPhone}</div>
              </div>
              <div className="mb-2">
                <div className="small text-muted text-uppercase">Street Address:</div>
                <div className="text-dark">{order.shippingStreet}</div>
              </div>
              <div className="mb-2">
                <div className="small text-muted text-uppercase">City & Postal Code:</div>
                <div className="text-dark">
                  {order.shippingCity} - {order.shippingPostalCode}
                  {order.shippingState ? `, ${order.shippingState}` : ""}
                </div>
              </div>
              {order.customerEmail && (
                <div className="mt-3 pt-2 border-top">
                  <div className="small text-muted text-uppercase">Customer Account:</div>
                  <div className="small text-dark fw-semibold">{order.customerName}</div>
                  <div className="small text-muted font-monospace">{order.customerEmail}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Update Status Modal */}
      {showModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          tabIndex={-1}
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content border-0 shadow">
              <form onSubmit={handleStatusUpdate}>
                <div className="modal-header bg-light">
                  <h5 className="modal-title font-weight-bold">
                    Update Status for {order.orderNumber}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Order Fulfillment Status</label>
                    <select
                      className="form-select"
                      value={newOrderStatus}
                      onChange={(e) => setNewOrderStatus(e.target.value as OrderStatus)}
                    >
                      <option value="PENDING">Pending</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="PROCESSING">Processing</option>
                      <option value="SHIPPED">Shipped (Fulfills reserved stock)</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="CANCELLED">Cancelled (Releases reserved stock)</option>
                      <option value="RETURNED">Returned (Restores warehouse stock)</option>
                    </select>
                    <div className="form-text small">
                      {newOrderStatus === "SHIPPED" && (
                        <span className="text-primary">
                          <i className="bi bi-info-circle me-1"></i> Marking as Shipped will deduct reserved physical warehouse inventory.
                        </span>
                      )}
                      {newOrderStatus === "CANCELLED" && (
                        <span className="text-danger">
                          <i className="bi bi-exclamation-triangle me-1"></i> Marking as Cancelled will release reserved inventory back to available stock.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Payment Status</label>
                    <select
                      className="form-select"
                      value={newPaymentStatus}
                      onChange={(e) => setNewPaymentStatus(e.target.value as PaymentStatus)}
                    >
                      <option value="PENDING">Pending (COD awaiting collection)</option>
                      <option value="PAID">Paid (Amount collected)</option>
                      <option value="FAILED">Failed</option>
                      <option value="REFUNDED">Refunded</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Shipment Status</label>
                    <select
                      className="form-select"
                      value={newShipmentStatus}
                      onChange={(e) => setNewShipmentStatus(e.target.value as ShipmentStatus)}
                    >
                      <option value="UNFULFILLED">Unfulfilled</option>
                      <option value="PREPARING">Preparing</option>
                      <option value="DISPATCHED">Dispatched</option>
                      <option value="IN_TRANSIT">In Transit</option>
                      <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="FAILED_DELIVERY">Failed Delivery</option>
                      <option value="RETURNED">Returned</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Administrative Note / Reason</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="e.g. Verified with customer by phone, handed to Pathao courier..."
                      value={statusNotes}
                      onChange={(e) => setStatusNotes(e.target.value)}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                    disabled={updating}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={updating}>
                    {updating ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                        Updating...
                      </>
                    ) : (
                      "Save Status Changes"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Shipment Dispatch Modal */}
      {showShipmentModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          tabIndex={-1}
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content border-0 shadow">
              <form onSubmit={handleCreateShipment}>
                <div className="modal-header bg-light">
                  <h5 className="modal-title font-weight-bold">
                    <i className="bi bi-truck me-2 text-primary"></i>
                    Dispatch Shipment for Order #{order.orderNumber}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowShipmentModal(false)}
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Courier Provider *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. Steadfast Courier, Pathao, RedX"
                      value={shipmentCourier}
                      onChange={(e) => setShipmentCourier(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Tracking / Consignment #</label>
                    <input
                      type="text"
                      className="form-control form-control-sm font-monospace"
                      placeholder="e.g. ST-2026-987654"
                      value={shipmentTracking}
                      onChange={(e) => setShipmentTracking(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Direct Carrier Tracking URL</label>
                    <input
                      type="url"
                      className="form-control form-control-sm"
                      placeholder="https://steadfast.com.bd/t/..."
                      value={shipmentTrackingUrl}
                      onChange={(e) => setShipmentTrackingUrl(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Package Notes / Handling</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows={2}
                      placeholder="e.g. Handed to courier pickup driver"
                      value={shipmentNotes}
                      onChange={(e) => setShipmentNotes(e.target.value)}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowShipmentModal(false)}
                    disabled={creatingShipment}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={creatingShipment}>
                    {creatingShipment ? "Dispatching..." : "Create Shipment"}
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
