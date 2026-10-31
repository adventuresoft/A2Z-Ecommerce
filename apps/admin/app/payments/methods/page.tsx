"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  paymentMethodsService,
  PaymentMethodSetting,
  UpdatePaymentMethodPayload,
} from "../../../services/payment-methods";

const FALLBACK_METHODS: PaymentMethodSetting[] = [
  {
    id: "meth-1",
    code: "CASH_ON_DELIVERY",
    name: "Cash on Delivery",
    description: "Pay with cash upon delivery of your items.",
    instructions: "Please have the exact cash ready when the delivery rider arrives at your doorstep.",
    isEnabled: true,
    sortOrder: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "meth-2",
    code: "CHECK_PAYMENT",
    name: "Check / Cheque Payment",
    description: "Pay via bank check, banker cheque, or money order.",
    instructions: "Please send your check payable to 'A to Z E-Commerce Ltd.', Mail to: House 12, Road 5, Dhanmondi, Dhaka 1205. Your order will be dispatched once the check clears.",
    isEnabled: false,
    sortOrder: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "meth-3",
    code: "BANK_TRANSFER",
    name: "Direct Bank Transfer",
    description: "Make a direct wire or transfer to our corporate bank account.",
    instructions: "Bank: City Bank Ltd. Account Name: A to Z E-Commerce Ltd. Account Number: 1102938475001. Branch: Gulshan 1, Dhaka. Please use your Order Number as payment reference.",
    isEnabled: false,
    sortOrder: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "meth-4",
    code: "MOBILE_BANKING",
    name: "Mobile Banking (bKash / Nagad)",
    description: "Pay instantly using bKash, Nagad, or Rocket mobile wallet.",
    instructions: "Please send payment to Merchant bKash/Nagad Number: 01700000000 (Counter: 1). Enter your Order Number in the reference field.",
    isEnabled: false,
    sortOrder: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "meth-5",
    code: "PAYSTATION",
    name: "PayStation Online Gateway",
    description: "Pay securely using bKash, Nagad, Rocket, Visa, Mastercard, or Internet Banking.",
    instructions: "You will be redirected to the secure PayStation payment portal to complete your transaction with instant confirmation.",
    isEnabled: true,
    sortOrder: 5,
    merchantId: "104-1653730183",
    password: "gamecoderstorepass",
    isSandbox: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethodSetting[]>(FALLBACK_METHODS);
  const [loading, setLoading] = useState<boolean>(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: "success" | "danger" | "warning"; message: string } | null>(null);

  // Edit Modal State
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodSetting | null>(null);
  const [editForm, setEditForm] = useState<UpdatePaymentMethodPayload>({});
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  const fetchMethods = useCallback(async () => {
    setLoading(true);
    try {
      const data = await paymentMethodsService.getAll();
      if (Array.isArray(data) && data.length > 0) {
        setMethods(data);
      } else {
        setMethods(FALLBACK_METHODS);
      }
    } catch {
      // Graceful fallback to default seed methods
      setMethods(FALLBACK_METHODS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      if (!active) return;
      await fetchMethods();
    })();
    return () => {
      active = false;
    };
  }, [fetchMethods]);

  const handleToggle = async (method: PaymentMethodSetting) => {
    setTogglingId(method.id);
    const targetState = !method.isEnabled;

    // Optimistic UI update
    setMethods((prev) =>
      prev.map((m) => (m.id === method.id ? { ...m, isEnabled: targetState } : m))
    );

    try {
      const updated = await paymentMethodsService.toggle(method.id, targetState);
      setMethods((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setAlert({
        type: "success",
        message: `${method.name} is now ${targetState ? "ACTIVE (Enabled)" : "DISABLED (Inactive)"}.`,
      });
    } catch (err: unknown) {
      // Revert on error
      setMethods((prev) =>
        prev.map((m) => (m.id === method.id ? { ...m, isEnabled: method.isEnabled } : m))
      );
      const message = err instanceof Error ? err.message : "Failed to update payment method status.";
      setAlert({
        type: "danger",
        message,
      });
    } finally {
      setTogglingId(null);
    }
  };

  const openEditModal = (method: PaymentMethodSetting) => {
    setSelectedMethod(method);
    setShowPassword(false);
    setEditForm({
      name: method.name,
      description: method.description || "",
      instructions: method.instructions || "",
      isEnabled: method.isEnabled,
      sortOrder: method.sortOrder,
      merchantId: method.merchantId || (method.code === "PAYSTATION" ? "104-1653730183" : ""),
      password: method.password || (method.code === "PAYSTATION" ? "gamecoderstorepass" : ""),
      isSandbox: method.isSandbox ?? true,
    });
  };

  const closeEditModal = () => {
    setSelectedMethod(null);
    setShowPassword(false);
    setEditForm({});
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMethod) return;

    setSaving(true);
    try {
      const updated = await paymentMethodsService.update(selectedMethod.id, editForm);
      setMethods((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setAlert({
        type: "success",
        message: `Payment method '${updated.name}' updated successfully!`,
      });
      closeEditModal();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save payment method changes.";
      setAlert({
        type: "danger",
        message,
      });
    } finally {
      setSaving(false);
    }
  };

  const activeCount = methods.filter((m) => m.isEnabled).length;
  const disabledCount = methods.length - activeCount;

  const getMethodIcon = (code: string) => {
    switch (code) {
      case "CASH_ON_DELIVERY":
        return "bi-cash-coin text-success";
      case "CHECK_PAYMENT":
        return "bi-check2-circle text-primary";
      case "BANK_TRANSFER":
        return "bi-bank text-info";
      case "MOBILE_BANKING":
        return "bi-phone text-warning";
      case "PAYSTATION":
        return "bi-shield-check text-primary";
      default:
        return "bi-credit-card text-secondary";
    }
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* Alert Notification Toast */}
      {alert && (
        <div
          className={`alert alert-${alert.type} alert-dismissible fade show shadow-sm border-0 d-flex align-items-center justify-content-between p-3`}
          role="alert"
        >
          <div className="d-flex align-items-center gap-2">
            <i
              className={`bi ${
                alert.type === "success"
                  ? "bi-check-circle-fill text-success"
                  : alert.type === "warning"
                  ? "bi-exclamation-triangle-fill text-warning"
                  : "bi-x-circle-fill text-danger"
              } fs-5`}
            ></i>
            <span>{alert.message}</span>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={() => setAlert(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Metric KPI Summary Ribbon */}
      <div className="row g-3">
        <div className="col-12 col-sm-4">
          <div className="card shadow-sm border-0 border-start border-primary border-4 h-100 bg-body">
            <div className="card-body p-3 d-flex align-items-center justify-content-between">
              <div>
                <span className="text-secondary text-uppercase fw-semibold" style={{ fontSize: "0.72rem", letterSpacing: "0.04em" }}>
                  Total Payment Channels
                </span>
                <h3 className="fw-bold mb-0 text-body mt-1 tabular-nums">{methods.length}</h3>
                <small className="text-secondary" style={{ fontSize: "0.72rem" }}>
                  Available in registry
                </small>
              </div>
              <div
                className="bg-primary-subtle text-primary rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: "46px", height: "46px" }}
              >
                <i className="bi bi-wallet2 fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-4">
          <div className="card shadow-sm border-0 border-start border-success border-4 h-100 bg-body">
            <div className="card-body p-3 d-flex align-items-center justify-content-between">
              <div>
                <span className="text-secondary text-uppercase fw-semibold" style={{ fontSize: "0.72rem", letterSpacing: "0.04em" }}>
                  Active at Checkout
                </span>
                <h3 className="fw-bold mb-0 text-success mt-1 tabular-nums">{activeCount}</h3>
                <small className="text-secondary" style={{ fontSize: "0.72rem" }}>
                  Visible to shoppers
                </small>
              </div>
              <div
                className="bg-success-subtle text-success rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: "46px", height: "46px" }}
              >
                <i className="bi bi-check2-all fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-4">
          <div className="card shadow-sm border-0 border-start border-secondary border-4 h-100 bg-body">
            <div className="card-body p-3 d-flex align-items-center justify-content-between">
              <div>
                <span className="text-secondary text-uppercase fw-semibold" style={{ fontSize: "0.72rem", letterSpacing: "0.04em" }}>
                  Disabled Channels
                </span>
                <h3 className="fw-bold mb-0 text-secondary mt-1 tabular-nums">{disabledCount}</h3>
                <small className="text-secondary" style={{ fontSize: "0.72rem" }}>
                  Toggled off
                </small>
              </div>
              <div
                className="bg-body-secondary text-secondary rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: "46px", height: "46px" }}
              >
                <i className="bi bi-slash-circle fs-4"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Payment Methods Card & Table */}
      <div className="card shadow-sm border-0 bg-body">
        <div className="card-header bg-body border-bottom py-3 px-3 px-md-4 d-flex align-items-center justify-content-between">
          <div>
            <h5 className="card-title mb-0 fw-semibold text-body d-flex align-items-center gap-2" style={{ fontSize: "0.95rem" }}>
              <i className="bi bi-toggles text-primary"></i>
              <span>Payment Methods Directory</span>
            </h5>
            <small className="text-secondary" style={{ fontSize: "0.75rem" }}>
              Toggle availability on/off and customize customer instructions
            </small>
          </div>

          <button
            type="button"
            onClick={fetchMethods}
            disabled={loading}
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
            title="Refresh payment methods"
          >
            <i className={`bi bi-arrow-clockwise ${loading ? "spin" : ""}`}></i>
            <span>Refresh</span>
          </button>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.85rem" }}>
              <thead className="table-light border-bottom">
                <tr>
                  <th scope="col" className="ps-3 ps-md-4 py-3" style={{ width: "240px" }}>Method</th>
                  <th scope="col" className="py-3">Description & Customer Instructions</th>
                  <th scope="col" className="py-3 text-center" style={{ width: "120px" }}>Priority Order</th>
                  <th scope="col" className="py-3 text-center" style={{ width: "140px" }}>Active Status</th>
                  <th scope="col" className="py-3 text-center" style={{ width: "130px" }}>On / Off Switch</th>
                  <th scope="col" className="pe-3 pe-md-4 py-3 text-end" style={{ width: "110px" }}>Configure</th>
                </tr>
              </thead>
              <tbody>
                {methods.map((method) => {
                  const isToggling = togglingId === method.id;

                  return (
                    <tr key={method.id} className={method.isEnabled ? "" : "opacity-75"}>
                      {/* Method Icon & Code */}
                      <td className="ps-3 ps-md-4">
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className="bg-body-secondary rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{ width: "38px", height: "38px" }}
                          >
                            <i className={`bi ${getMethodIcon(method.code)} fs-5`}></i>
                          </div>
                          <div>
                            <div className="fw-semibold text-body">{method.name}</div>
                            <div className="text-secondary small font-monospace" style={{ fontSize: "0.7rem" }}>
                              {method.code}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Description & Instructions Preview */}
                      <td>
                        <div className="text-body small mb-1">{method.description || "No checkout description configured."}</div>
                        {method.instructions ? (
                          <div className="text-secondary small d-flex align-items-start gap-1" style={{ fontSize: "0.73rem" }}>
                            <i className="bi bi-info-circle text-info mt-0-5 flex-shrink-0"></i>
                            <span className="text-truncate" style={{ maxWidth: "420px" }}>
                              {method.instructions}
                            </span>
                          </div>
                        ) : (
                          <span className="badge bg-light text-secondary border" style={{ fontSize: "0.68rem" }}>
                            No post-order instructions
                          </span>
                        )}

                        {method.code === "PAYSTATION" && (
                          <div className="d-flex align-items-center gap-1.5 mt-1.5 flex-wrap">
                            <span className="badge bg-light text-secondary border font-monospace" style={{ fontSize: "0.68rem" }}>
                              <i className="bi bi-person-badge text-primary me-1"></i>
                              Merchant: {method.merchantId || "104-1653730183"}
                            </span>
                            <span
                              className={`badge ${
                                method.isSandbox !== false
                                  ? "bg-warning-subtle text-warning-emphasis border border-warning-subtle"
                                  : "bg-success-subtle text-success-emphasis border border-success-subtle"
                              }`}
                              style={{ fontSize: "0.68rem" }}
                            >
                              <i className={`bi ${method.isSandbox !== false ? "bi-flask" : "bi-broadcast"} me-1`}></i>
                              {method.isSandbox !== false ? "Sandbox" : "Production"}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Priority Sort Order */}
                      <td className="text-center tabular-nums fw-medium">
                        <span className="badge bg-body-secondary text-body border" style={{ fontSize: "0.75rem" }}>
                          #{method.sortOrder}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="text-center">
                        {method.isEnabled ? (
                          <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 d-inline-flex align-items-center gap-1" style={{ fontSize: "0.72rem" }}>
                            <i className="bi bi-check-circle-fill"></i>
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-2 py-1 d-inline-flex align-items-center gap-1" style={{ fontSize: "0.72rem" }}>
                            <i className="bi bi-dash-circle"></i>
                            <span>Disabled</span>
                          </span>
                        )}
                      </td>

                      {/* Interactive On/Off Switch */}
                      <td className="text-center">
                        <div className="form-check form-switch d-inline-block m-0">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id={`switch-${method.id}`}
                            checked={method.isEnabled}
                            disabled={isToggling}
                            onChange={() => handleToggle(method)}
                            style={{ cursor: "pointer", width: "2.4em", height: "1.25em" }}
                          />
                        </div>
                        {isToggling && (
                          <div className="spinner-border spinner-border-sm text-primary ms-2" role="status">
                            <span className="visually-hidden">Updating...</span>
                          </div>
                        )}
                      </td>

                      {/* Edit Button */}
                      <td className="pe-3 pe-md-4 text-end">
                        <button
                          type="button"
                          onClick={() => openEditModal(method)}
                          className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1 px-2 py-1"
                          style={{ fontSize: "0.75rem" }}
                        >
                          <i className="bi bi-gear-fill"></i>
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card-footer bg-body-tertiary border-top py-2 px-3 px-md-4 d-flex align-items-center justify-content-between small text-secondary">
          <span>Checkout strictly filters out disabled payment methods.</span>
          <span className="d-flex align-items-center gap-1 text-success fw-medium">
            <i className="bi bi-shield-check"></i>
            <span>Real-time enforcement active</span>
          </span>
        </div>
      </div>

      {/* Edit Configuration Modal */}
      {selectedMethod && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header bg-body border-bottom py-3 px-4">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="bg-primary-subtle text-primary rounded-2 d-flex align-items-center justify-content-center"
                    style={{ width: "32px", height: "32px" }}
                  >
                    <i className="bi bi-sliders fs-5"></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-semibold text-body fs-6 mb-0">
                      Configure Payment Method: {selectedMethod.name}
                    </h5>
                    <small className="text-secondary font-monospace" style={{ fontSize: "0.72rem" }}>
                      Identifier: {selectedMethod.code}
                    </small>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeEditModal}
                  aria-label="Close"
                ></button>
              </div>

              <form onSubmit={handleSaveEdit}>
                <div className="modal-body p-4 d-flex flex-column gap-3">
                  {/* Title & Sort Order row */}
                  <div className="row g-3">
                    <div className="col-12 col-md-8">
                      <label className="form-label fw-medium small">
                        Method Display Title <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={editForm.name || ""}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                        required
                        placeholder="e.g. Cash on Delivery"
                      />
                      <div className="form-text">Customer-visible title on checkout page.</div>
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label fw-medium small">Display Priority Sort</label>
                      <input
                        type="number"
                        className="form-control"
                        value={editForm.sortOrder ?? 0}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))
                        }
                        min="0"
                      />
                      <div className="form-text">Lower numbers appear first.</div>
                    </div>
                  </div>

                  {/* Customer Checkout Description */}
                  <div>
                    <label className="form-label fw-medium small">Checkout Description</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={editForm.description || ""}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief summary visible when selecting this payment method during checkout"
                    ></textarea>
                    <div className="form-text">
                      Explains payment conditions to the customer before placing the order.
                    </div>
                  </div>

                  {/* Post-Order Payment Instructions */}
                  <div>
                    <label className="form-label fw-medium small">Post-Order Payment Instructions</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={editForm.instructions || ""}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, instructions: e.target.value }))}
                      placeholder="e.g., Bank details, Check payee name and mailing address, or bKash merchant counter instructions"
                    ></textarea>
                    <div className="form-text">
                      Sent on invoice and shown on the order confirmation screen after order placement.
                    </div>
                  </div>

                  {/* Gateway API Credentials (For online gateways like PAYSTATION) */}
                  {selectedMethod.code === "PAYSTATION" && (
                    <div className="p-3 rounded-3 border border-primary-subtle bg-primary-subtle/10 d-flex flex-column gap-3">
                      <div className="d-flex align-items-center justify-content-between border-bottom pb-2">
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="bg-primary text-white rounded-2 d-flex align-items-center justify-content-center"
                            style={{ width: "26px", height: "26px" }}
                          >
                            <i className="bi bi-key-fill" style={{ fontSize: "0.8rem" }}></i>
                          </div>
                          <div>
                            <div className="fw-semibold text-body small">PayStation Gateway Credentials</div>
                            <div className="text-secondary" style={{ fontSize: "0.7rem" }}>
                              Used for initiating hosted checkout and verifying transactions
                            </div>
                          </div>
                        </div>
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1">
                          API Auth
                        </span>
                      </div>

                      <div className="row g-2">
                        <div className="col-12 col-md-6">
                          <label className="form-label fw-medium small mb-1">
                            Merchant ID <span className="text-danger">*</span>
                          </label>
                          <div className="input-group input-group-sm">
                            <span className="input-group-text bg-body-tertiary">
                              <i className="bi bi-person-vcard text-secondary"></i>
                            </span>
                            <input
                              type="text"
                              className="form-control font-monospace"
                              value={editForm.merchantId ?? ""}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, merchantId: e.target.value }))}
                              placeholder="e.g. 104-1653730183"
                              required={selectedMethod.code === "PAYSTATION"}
                            />
                          </div>
                          <div className="form-text" style={{ fontSize: "0.7rem" }}>
                            Your official merchant ID from PayStation dashboard
                          </div>
                        </div>

                        <div className="col-12 col-md-6">
                          <label className="form-label fw-medium small mb-1">
                            Password / API Key <span className="text-danger">*</span>
                          </label>
                          <div className="input-group input-group-sm">
                            <span className="input-group-text bg-body-tertiary">
                              <i className="bi bi-shield-lock text-secondary"></i>
                            </span>
                            <input
                              type={showPassword ? "text" : "password"}
                              className="form-control font-monospace"
                              value={editForm.password ?? ""}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, password: e.target.value }))}
                              placeholder="e.g. gamecoderstorepass"
                              required={selectedMethod.code === "PAYSTATION"}
                            />
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              onClick={() => setShowPassword((prev) => !prev)}
                              title={showPassword ? "Hide password" : "Show password"}
                            >
                              <i className={`bi ${showPassword ? "bi-eye-slash-fill" : "bi-eye-fill"}`}></i>
                            </button>
                          </div>
                          <div className="form-text" style={{ fontSize: "0.7rem" }}>
                            Merchant store password for transaction signing
                          </div>
                        </div>
                      </div>

                      {/* Sandbox vs Production environment toggle */}
                      <div className="p-2.5 rounded-2 bg-body border d-flex align-items-center justify-content-between mt-1">
                        <div>
                          <div className="fw-medium small text-body d-flex align-items-center gap-1.5">
                            <i className={`bi ${editForm.isSandbox ?? true ? "bi-flask text-warning" : "bi-broadcast text-success"}`}></i>
                            <span>
                              Environment: {editForm.isSandbox ?? true ? "Sandbox Testing" : "Production Live"}
                            </span>
                          </div>
                          <small className="text-secondary" style={{ fontSize: "0.7rem" }}>
                            {editForm.isSandbox ?? true
                              ? "Targeting: https://sandbox.paystation.com.bd (Safe for testing)"
                              : "Targeting: https://api.paystation.com.bd (Real live payments)"}
                          </small>
                        </div>
                        <div className="form-check form-switch m-0">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id="sandbox-toggle-switch"
                            checked={editForm.isSandbox ?? true}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, isSandbox: e.target.checked }))}
                            style={{ cursor: "pointer", width: "2.4em", height: "1.2em" }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Enabled Toggle in Modal */}
                  <div className="p-3 rounded-2 border bg-body-tertiary d-flex align-items-center justify-content-between">
                    <div>
                      <div className="fw-medium small text-body">Payment Channel Status</div>
                      <small className="text-secondary">
                        {editForm.isEnabled
                          ? "This payment method is ACTIVE and available to buyers at checkout."
                          : "This payment method is DISABLED and hidden from checkout."}
                      </small>
                    </div>
                    <div className="form-check form-switch m-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="modal-toggle-switch"
                        checked={editForm.isEnabled ?? false}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, isEnabled: e.target.checked }))}
                        style={{ cursor: "pointer", width: "2.4em", height: "1.25em" }}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-body border-top py-2 px-4">
                  <button
                    type="button"
                    className="btn btn-light border btn-sm"
                    onClick={closeEditModal}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                    disabled={saving}
                  >
                    {saving && <span className="spinner-border spinner-border-sm" role="status"></span>}
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
