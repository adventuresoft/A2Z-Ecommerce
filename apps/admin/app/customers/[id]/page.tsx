"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  CustomerDetail,
  CustomerSpendingTier,
  customersService,
  UpdateCustomerPayload,
} from "../../../services/customers";

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params?.id as string;

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"orders" | "reviews" | "security">("orders");

  // Alert state
  const [alert, setAlert] = useState<{
    type: "success" | "danger" | "info";
    text: string;
  } | null>(null);

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [editForm, setEditForm] = useState<UpdateCustomerPayload>({
    name: "",
    phone: "",
    password: "",
    isActive: true,
    city: "",
    streetAddress: "",
    postalCode: "",
    country: "Bangladesh",
  });

  const fetchCustomer = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      const data = await customersService.getCustomerById(customerId);
      setCustomer(data);
      setEditForm({
        name: data.name,
        phone: data.phone || "",
        password: "",
        isActive: data.isActive,
        city: data.addresses[0]?.city || "",
        streetAddress: data.addresses[0]?.streetAddress || "",
        postalCode: data.addresses[0]?.postalCode || "",
        country: data.addresses[0]?.country || "Bangladesh",
      });
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to load customer profile",
      });
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    setActionLoading(true);
    try {
      const payload: UpdateCustomerPayload = {
        name: editForm.name,
        phone: editForm.phone || undefined,
        isActive: editForm.isActive,
        city: editForm.city || undefined,
        streetAddress: editForm.streetAddress || undefined,
        postalCode: editForm.postalCode || undefined,
      };
      if (editForm.password && editForm.password.trim().length >= 6) {
        payload.password = editForm.password;
      }

      await customersService.updateCustomer(customer.id, payload);
      setAlert({ type: "success", text: "Customer profile updated successfully." });
      setShowEditModal(false);
      fetchCustomer();
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to update customer.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!customer) return;
    setActionLoading(true);
    try {
      const nextStatus = !customer.isActive;
      const res = await customersService.toggleCustomerStatus(customer.id, nextStatus);
      setAlert({ type: "success", text: res.message });
      setShowStatusModal(false);
      fetchCustomer();
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to update status.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getTierBadge = (tier: CustomerSpendingTier) => {
    switch (tier) {
      case "VIP":
        return (
          <span className="badge text-white px-2 py-1" style={{ backgroundColor: "#6f42c1" }}>
            <i className="bi bi-star-fill me-1 text-warning"></i>VIP Customer
          </span>
        );
      case "REGULAR":
        return (
          <span className="badge bg-primary text-white px-2 py-1">
            <i className="bi bi-person-check me-1"></i>Regular Customer
          </span>
        );
      case "ONE_TIME":
        return (
          <span className="badge bg-info text-dark px-2 py-1">
            <i className="bi bi-bag me-1"></i>One-Time Customer
          </span>
        );
      case "ZERO_ORDER":
      default:
        return (
          <span className="badge bg-secondary text-white px-2 py-1">
            <i className="bi bi-person-plus me-1"></i>New / Zero Orders
          </span>
        );
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <span className="badge bg-warning text-dark">Pending</span>;
      case "CONFIRMED":
        return <span className="badge bg-info text-dark">Confirmed</span>;
      case "PROCESSING":
        return <span className="badge bg-primary">Processing</span>;
      case "SHIPPED":
        return <span className="badge text-white" style={{ backgroundColor: "#6610f2" }}>Shipped</span>;
      case "DELIVERED":
        return <span className="badge bg-success">Delivered</span>;
      case "CANCELLED":
        return <span className="badge bg-danger">Cancelled</span>;
      case "RETURNED":
        return <span className="badge bg-secondary">Returned</span>;
      default:
        return <span className="badge bg-light text-dark">{status}</span>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <span className="badge bg-success">Paid</span>;
      case "PENDING":
        return <span className="badge bg-warning text-dark">Pending</span>;
      case "FAILED":
        return <span className="badge bg-danger">Failed</span>;
      case "REFUNDED":
        return <span className="badge bg-info text-dark">Refunded</span>;
      default:
        return <span className="badge bg-light text-dark">{status}</span>;
    }
  };

  const getAvatarInitials = (name: string) => {
    if (!name) return "CU";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  if (loading) {
    return (
      <div className="container-fluid py-5 text-center">
        <div className="spinner-border text-primary me-2" role="status"></div>
        <span className="text-muted">Loading customer 360 profile...</span>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="container-fluid py-5 text-center">
        <i className="bi bi-person-x fs-1 text-danger d-block mb-3"></i>
        <h4 className="fw-bold text-gray-800">Customer Not Found</h4>
        <p className="text-muted">The requested customer record does not exist or was removed.</p>
        <Link href="/customers" className="btn btn-primary btn-sm">
          <i className="bi bi-arrow-left me-1"></i> Back to Customers List
        </Link>
      </div>
    );
  }

  return (
    <div className="container-fluid py-3">
      {/* Breadcrumb Navigation */}
      <div className="row mb-3 align-items-center">
        <div className="col-sm-6">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1">
              <li className="breadcrumb-item">
                <Link href="/" className="text-decoration-none">
                  Dashboard
                </Link>
              </li>
              <li className="breadcrumb-item">
                <Link href="/customers" className="text-decoration-none">
                  Customers
                </Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                {customer.name}
              </li>
            </ol>
          </nav>
          <div className="d-flex align-items-center gap-2">
            <h1 className="h3 mb-0 text-gray-800 fw-bold">{customer.name}</h1>
            {getTierBadge(customer.spendingTier)}
            {customer.isActive ? (
              <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">
                Active
              </span>
            ) : (
              <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25">
                Suspended
              </span>
            )}
          </div>
        </div>
        <div className="col-sm-6 text-sm-end mt-2 mt-sm-0">
          <Link href="/customers" className="btn btn-outline-secondary me-2">
            <i className="bi bi-arrow-left me-1"></i> Back to List
          </Link>
          <button
            type="button"
            className="btn btn-outline-primary me-2"
            onClick={() => setShowEditModal(true)}
          >
            <i className="bi bi-pencil me-1"></i> Edit Profile
          </button>
          <button
            type="button"
            className={`btn ${customer.isActive ? "btn-outline-warning" : "btn-outline-success"}`}
            onClick={() => setShowStatusModal(true)}
          >
            <i className={`bi ${customer.isActive ? "bi-slash-circle" : "bi-check2-circle"} me-1`}></i>
            {customer.isActive ? "Suspend Account" : "Activate Account"}
          </button>
        </div>
      </div>

      {/* Global Alert Notification */}
      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
          <i
            className={`bi me-2 ${
              alert.type === "success"
                ? "bi-check-circle-fill"
                : alert.type === "danger"
                  ? "bi-exclamation-triangle-fill"
                  : "bi-info-circle-fill"
            }`}
          ></i>
          {alert.text}
          <button
            type="button"
            className="btn-close"
            onClick={() => setAlert(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* 2-Column Customer 360 View */}
      <div className="row g-4">
        {/* LEFT COLUMN: Customer Summary & Addresses */}
        <div className="col-12 col-lg-4">
          {/* Profile Card */}
          <div className="card shadow-sm border-0 mb-4 text-center">
            <div className="card-body p-4">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold mx-auto mb-3 shadow"
                style={{
                  width: "72px",
                  height: "72px",
                  fontSize: "24px",
                  backgroundColor:
                    customer.spendingTier === "VIP"
                      ? "#6f42c1"
                      : customer.isActive
                        ? "#0d6efd"
                        : "#6c757d",
                }}
              >
                {getAvatarInitials(customer.name)}
              </div>

              <h5 className="fw-bold text-gray-800 mb-1">{customer.name}</h5>
              <p className="text-muted small mb-2">
                <i className="bi bi-envelope me-1"></i> {customer.email}
              </p>
              {customer.phone && (
                <p className="text-muted small mb-3">
                  <i className="bi bi-telephone me-1"></i> {customer.phone}
                </p>
              )}

              <hr />

              <div className="row text-center g-2">
                <div className="col-6">
                  <div className="text-muted text-xs text-uppercase">Lifetime Spend</div>
                  <div className="h5 fw-bold text-primary mb-0">
                    ৳{customer.totalSpent.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="col-6">
                  <div className="text-muted text-xs text-uppercase">Total Orders</div>
                  <div className="h5 fw-bold text-gray-800 mb-0">{customer.ordersCount}</div>
                </div>
                <div className="col-6 mt-3">
                  <div className="text-muted text-xs text-uppercase">Avg Order Value</div>
                  <div className="fw-bold text-dark mb-0">৳{Math.round(customer.averageOrderValue)}</div>
                </div>
                <div className="col-6 mt-3">
                  <div className="text-muted text-xs text-uppercase">Cancelled</div>
                  <div className="fw-bold text-danger mb-0">{customer.cancelledOrdersCount}</div>
                </div>
              </div>

              <hr />

              <div className="text-start small">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Customer ID:</span>
                  <span className="font-monospace text-xs text-truncate" style={{ maxWidth: "160px" }}>
                    {customer.id}
                  </span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Account Registered:</span>
                  <span className="fw-semibold">
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Email Verified:</span>
                  <span>
                    {customer.emailVerifiedAt ? (
                      <span className="text-success fw-semibold">
                        <i className="bi bi-patch-check-fill me-1"></i>Verified
                      </span>
                    ) : (
                      <span className="text-warning">
                        <i className="bi bi-clock me-1"></i>Pending
                      </span>
                    )}
                  </span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Last Order Date:</span>
                  <span className="fw-semibold">
                    {customer.lastOrderDate
                      ? new Date(customer.lastOrderDate).toLocaleDateString()
                      : "No orders placed"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Saved Addresses Card */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-white py-3 border-bottom d-flex align-items-center justify-content-between">
              <h6 className="m-0 fw-bold text-gray-800">
                <i className="bi bi-geo-alt me-2 text-danger"></i>
                Saved Address Book ({customer.addresses.length})
              </h6>
            </div>
            <div className="card-body p-3">
              {customer.addresses.length === 0 ? (
                <div className="text-center py-4 text-muted small">
                  <i className="bi bi-house-slash fs-3 d-block mb-1"></i>
                  No saved addresses in address book.
                </div>
              ) : (
                customer.addresses.map((addr, idx) => (
                  <div
                    key={addr.id}
                    className={`p-3 rounded border mb-2 ${
                      addr.isDefaultShipping ? "border-primary bg-light" : "border-light"
                    }`}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span className="fw-bold text-gray-800 small">
                        {addr.label || `Address #${idx + 1}`}
                      </span>
                      {addr.isDefaultShipping && (
                        <span className="badge bg-primary text-xs">Default Shipping</span>
                      )}
                    </div>
                    <div className="small text-gray-700">
                      <strong>{addr.recipientName}</strong>
                    </div>
                    <div className="small text-muted">{addr.streetAddress}</div>
                    <div className="small text-muted">
                      {addr.city}
                      {addr.state ? `, ${addr.state}` : ""} - {addr.postalCode}
                    </div>
                    <div className="small text-muted">
                      <i className="bi bi-telephone me-1"></i> {addr.phone}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Tabbed Sections (Orders, Reviews, Activity) */}
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm border-0">
            {/* Nav Tabs */}
            <div className="card-header bg-white border-bottom p-0">
              <ul className="nav nav-tabs card-header-tabs m-0 border-0">
                <li className="nav-item">
                  <button
                    className={`nav-link py-3 px-4 border-0 border-bottom border-3 ${
                      activeTab === "orders"
                        ? "active border-primary fw-bold text-primary"
                        : "text-muted"
                    }`}
                    onClick={() => setActiveTab("orders")}
                  >
                    <i className="bi bi-bag-check me-2"></i>
                    Orders History ({customer.recentOrders.length})
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link py-3 px-4 border-0 border-bottom border-3 ${
                      activeTab === "reviews"
                        ? "active border-primary fw-bold text-primary"
                        : "text-muted"
                    }`}
                    onClick={() => setActiveTab("reviews")}
                  >
                    <i className="bi bi-star me-2"></i>
                    Reviews & Ratings ({customer.reviews.length})
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link py-3 px-4 border-0 border-bottom border-3 ${
                      activeTab === "security"
                        ? "active border-primary fw-bold text-primary"
                        : "text-muted"
                    }`}
                    onClick={() => setActiveTab("security")}
                  >
                    <i className="bi bi-shield-lock me-2"></i>
                    Account & Security
                  </button>
                </li>
              </ul>
            </div>

            <div className="card-body p-0">
              {/* TAB 1: ORDERS */}
              {activeTab === "orders" && (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light text-muted small text-uppercase">
                      <tr>
                        <th scope="col" className="ps-3">
                          Order Number
                        </th>
                        <th scope="col">Date</th>
                        <th scope="col">Order Status</th>
                        <th scope="col">Payment</th>
                        <th scope="col" className="text-end">
                          Total (BDT)
                        </th>
                        <th scope="col" className="text-end pe-3">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {customer.recentOrders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-5 text-muted">
                            <i className="bi bi-bag-x fs-1 d-block mb-2"></i>
                            No orders placed yet by this customer.
                          </td>
                        </tr>
                      ) : (
                        customer.recentOrders.map((order) => (
                          <tr key={order.id}>
                            <td className="ps-3">
                              <Link
                                href={`/orders/${order.id}`}
                                className="fw-bold text-primary text-decoration-none"
                              >
                                {order.orderNumber}
                              </Link>
                              <div className="text-muted text-xs">
                                {order.itemsCount} {order.itemsCount === 1 ? "item" : "items"}
                                {order.paymentMethod ? ` · ${order.paymentMethod.replace(/_/g, " ")}` : ""}
                              </div>
                            </td>
                            <td className="small text-muted">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </td>
                            <td>{getOrderStatusBadge(order.orderStatus)}</td>
                            <td>{getPaymentStatusBadge(order.paymentStatus)}</td>
                            <td className="text-end fw-bold text-gray-800">
                              ৳{order.grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="text-end pe-3">
                              <Link
                                href={`/orders/${order.id}`}
                                className="btn btn-sm btn-outline-secondary"
                                title="View Full Order Details"
                              >
                                <i className="bi bi-arrow-right"></i>
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 2: REVIEWS */}
              {activeTab === "reviews" && (
                <div className="p-3">
                  {customer.reviews.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <i className="bi bi-chat-square-text fs-1 d-block mb-2"></i>
                      This customer has not submitted any product reviews.
                    </div>
                  ) : (
                    customer.reviews.map((rev) => (
                      <div key={rev.id} className="card border mb-3 shadow-none">
                        <div className="card-body p-3">
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <div>
                              <span className="fw-bold text-primary me-2">{rev.productTitle}</span>
                              {rev.isVerifiedPurchase && (
                                <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 text-xs">
                                  <i className="bi bi-patch-check-fill me-1"></i>Verified Purchase
                                </span>
                              )}
                            </div>
                            <span className="text-muted small">
                              {new Date(rev.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="mb-2">
                            {Array.from({ length: 5 }, (_, i) => (
                              <i
                                key={i}
                                className={`bi bi-star-fill me-1 ${
                                  i < rev.rating ? "text-warning" : "text-muted opacity-25"
                                }`}
                              ></i>
                            ))}
                            {rev.title && (
                              <strong className="ms-2 text-gray-800">{rev.title}</strong>
                            )}
                          </div>

                          <p className="text-muted small mb-0">{rev.comment}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: ACCOUNT & SECURITY */}
              {activeTab === "security" && (
                <div className="p-4">
                  <h6 className="fw-bold text-gray-800 mb-3">Security & Session Overview</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-sm-6">
                      <div className="p-3 bg-light rounded border">
                        <div className="text-muted text-xs text-uppercase mb-1">
                          Token Version
                        </div>
                        <div className="h5 fw-bold mb-0 text-gray-800">
                          v{customer.tokenVersion}
                        </div>
                        <div className="text-muted text-xs mt-1">
                          Incrementing token version invalidates all existing JWT sessions.
                        </div>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="p-3 bg-light rounded border">
                        <div className="text-muted text-xs text-uppercase mb-1">
                          Registration Location
                        </div>
                        <div className="h5 fw-bold mb-0 text-gray-800">
                          {customer.location || "Bangladesh"}
                        </div>
                        <div className="text-muted text-xs mt-1">
                          Recorded geographic origin of customer profile.
                        </div>
                      </div>
                    </div>
                  </div>

                  <h6 className="fw-bold text-gray-800 mb-3">Administrative Actions</h6>
                  <div className="d-flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => setShowEditModal(true)}
                    >
                      <i className="bi bi-key me-1"></i> Reset Password
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${
                        customer.isActive ? "btn-outline-warning" : "btn-outline-success"
                      }`}
                      onClick={() => setShowStatusModal(true)}
                    >
                      <i
                        className={`bi ${customer.isActive ? "bi-slash-circle" : "bi-check2-circle"} me-1`}
                      ></i>
                      {customer.isActive ? "Suspend Account" : "Activate Account"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {showEditModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fs-6 fw-bold">
                  <i className="bi bi-pencil-square me-2"></i> Edit Customer Profile
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowEditModal(false)}
                  disabled={actionLoading}
                ></button>
              </div>
              <form onSubmit={handleUpdate}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Email Address (Read Only)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm bg-light"
                      value={customer.email}
                      disabled
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">
                      Full Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      required
                      value={editForm.name || ""}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Phone Number</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={editForm.phone || ""}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">City</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={editForm.city || ""}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">
                      Reset Password (Leave blank to keep existing)
                    </label>
                    <input
                      type="password"
                      className="form-control form-control-sm"
                      placeholder="Enter new password if resetting"
                      minLength={6}
                      value={editForm.password || ""}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    />
                  </div>
                  <div className="form-check form-switch mb-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      id="editDetailIsActive"
                      checked={editForm.isActive}
                      onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    />
                    <label className="form-check-label small" htmlFor="editDetailIsActive">
                      Account active and permitted to login
                    </label>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setShowEditModal(false)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-dark" disabled={actionLoading}>
                    {actionLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* STATUS TOGGLE MODAL */}
      {showStatusModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content border-0 shadow">
              <div
                className={`modal-header ${
                  customer.isActive ? "bg-warning text-dark" : "bg-success text-white"
                }`}
              >
                <h5 className="modal-title fs-6 fw-bold">
                  <i
                    className={`bi ${customer.isActive ? "bi-slash-circle" : "bi-check-circle"} me-2`}
                  ></i>
                  {customer.isActive ? "Suspend Account" : "Activate Account"}
                </h5>
                <button
                  type="button"
                  className={`btn-close ${customer.isActive ? "" : "btn-close-white"}`}
                  onClick={() => setShowStatusModal(false)}
                  disabled={actionLoading}
                ></button>
              </div>
              <div className="modal-body p-3">
                <p className="small mb-0">
                  Are you sure you want to {customer.isActive ? "suspend" : "activate"}{" "}
                  <strong>{customer.name}</strong>?
                </p>
                {customer.isActive && (
                  <p className="text-muted small mt-2 mb-0">
                    Suspending this account will immediately revoke all active customer sessions and
                    prevent checkout.
                  </p>
                )}
              </div>
              <div className="modal-footer bg-light p-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setShowStatusModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${customer.isActive ? "btn-warning" : "btn-success"}`}
                  onClick={handleToggleStatus}
                  disabled={actionLoading}
                >
                  {actionLoading
                    ? "Processing..."
                    : customer.isActive
                      ? "Suspend Account"
                      : "Activate Account"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
