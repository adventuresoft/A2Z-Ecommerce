"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  AdminPayment,
  PaymentMethod,
  PaymentStatus,
  PaymentStats,
  paymentsService,
} from "../../../services/payments";

export default function TransactionsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "">("");
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Alert
  const [alert, setAlert] = useState<{
    type: "success" | "danger" | "info";
    text: string;
  } | null>(null);

  // Detail Modal
  const [selectedPayment, setSelectedPayment] = useState<AdminPayment | null>(null);

  // Update Status Modal (Confirm / Collect COD)
  const [statusModalPayment, setStatusModalPayment] = useState<AdminPayment | null>(null);
  const [newStatus, setNewStatus] = useState<PaymentStatus>("PAID");
  const [statusRef, setStatusRef] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Record Payment Modal
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [recordOrderId, setRecordOrderId] = useState("");
  const [recordMethod, setRecordMethod] = useState<PaymentMethod>("CASH_ON_DELIVERY");
  const [recordAmount, setRecordAmount] = useState("");
  const [recordStatus, setRecordStatus] = useState<PaymentStatus>("PAID");
  const [recordRef, setRecordRef] = useState("");
  const [recordNotes, setRecordNotes] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Issue Refund Modal Shortcut
  const [refundModalPayment, setRefundModalPayment] = useState<AdminPayment | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundRef, setRefundRef] = useState("");
  const [refundNotes, setRefundNotes] = useState("");
  const [submittingRefund, setSubmittingRefund] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [res, statsRes] = await Promise.all([
        paymentsService.getTransactions({
          page,
          limit,
          search: debouncedSearch || undefined,
          status: statusFilter || undefined,
          method: methodFilter || undefined,
          dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
          dateTo: dateTo ? new Date(dateTo).toISOString() : undefined,
        }),
        paymentsService.getPaymentStats().catch(() => null),
      ]);

      setPayments(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      if (statsRes) {
        setStats(statsRes);
      }
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to load transactions",
      });
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter, methodFilter, dateFrom, dateTo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalPayment) return;

    setUpdatingStatus(true);
    try {
      await paymentsService.updatePaymentStatus(statusModalPayment.id, {
        status: newStatus,
        transactionRef: statusRef.trim() || undefined,
        notes: statusNotes.trim() || undefined,
      });

      setAlert({
        type: "success",
        text: `Transaction status updated to ${newStatus} successfully!`,
      });
      setStatusModalPayment(null);
      setStatusRef("");
      setStatusNotes("");
      loadData();
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to update transaction status",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordOrderId || !recordAmount) return;

    setSubmittingPayment(true);
    try {
      await paymentsService.recordPayment({
        orderId: recordOrderId.trim(),
        method: recordMethod,
        amount: Number(recordAmount),
        status: recordStatus,
        transactionRef: recordRef.trim() || undefined,
        notes: recordNotes.trim() || undefined,
      });

      setAlert({
        type: "success",
        text: "Payment record created successfully!",
      });
      setShowRecordModal(false);
      setRecordOrderId("");
      setRecordAmount("");
      setRecordRef("");
      setRecordNotes("");
      loadData();
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to record payment",
      });
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundModalPayment || !refundAmount || !refundReason) return;

    setSubmittingRefund(true);
    try {
      await paymentsService.createRefund({
        orderId: refundModalPayment.orderId,
        paymentId: refundModalPayment.id,
        amount: Number(refundAmount),
        reason: refundReason.trim(),
        transactionRef: refundRef.trim() || undefined,
        notes: refundNotes.trim() || undefined,
      });

      setAlert({
        type: "success",
        text: `Refund of ৳${Number(refundAmount).toFixed(2)} processed successfully!`,
      });
      setRefundModalPayment(null);
      setRefundAmount("");
      setRefundReason("");
      setRefundRef("");
      setRefundNotes("");
      loadData();
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to issue refund",
      });
    } finally {
      setSubmittingRefund(false);
    }
  };

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case "PAID":
        return <span className="badge bg-success"><i className="bi bi-check-circle me-1"></i>Paid</span>;
      case "PENDING":
        return <span className="badge bg-warning text-dark"><i className="bi bi-hourglass-split me-1"></i>Pending</span>;
      case "FAILED":
        return <span className="badge bg-danger"><i className="bi bi-x-circle me-1"></i>Failed</span>;
      case "REFUNDED":
        return <span className="badge bg-secondary"><i className="bi bi-arrow-counterclockwise me-1"></i>Refunded</span>;
      default:
        return <span className="badge bg-light text-dark">{status}</span>;
    }
  };

  const getMethodBadge = (method: PaymentMethod) => {
    switch (method) {
      case "CASH_ON_DELIVERY":
        return (
          <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle">
            <i className="bi bi-cash-stack me-1"></i>Cash on Delivery
          </span>
        );
      case "CREDIT_CARD":
        return (
          <span className="badge bg-primary-subtle text-primary-emphasis border border-primary-subtle">
            <i className="bi bi-credit-card me-1"></i>Credit Card
          </span>
        );
      case "MOBILE_BANKING":
        return (
          <span className="badge bg-danger-subtle text-danger-emphasis border border-danger-subtle">
            <i className="bi bi-phone me-1"></i>Mobile Banking
          </span>
        );
      default:
        return <span className="badge bg-light text-dark">{method}</span>;
    }
  };

  return (
    <div className="container-fluid p-3">
      {/* Page Header */}
      <div className="row mb-3 align-items-center">
        <div className="col-sm-6">
          <h1 className="h3 mb-0 text-dark font-weight-bold">
            <i className="bi bi-wallet2 me-2 text-primary"></i>Transactions Management
          </h1>
          <p className="text-muted small mb-0 mt-1">
            Monitor incoming revenue, reconcile Cash on Delivery collections, and audit transaction records.
          </p>
        </div>
        <div className="col-sm-6 text-sm-end mt-2 mt-sm-0 d-flex gap-2 justify-content-sm-end">
          <button
            onClick={() => setShowRecordModal(true)}
            className="btn btn-primary btn-sm"
          >
            <i className="bi bi-plus-circle me-1"></i> Record Payment
          </button>
          <button
            onClick={() => loadData()}
            className="btn btn-outline-secondary btn-sm"
            title="Refresh Transactions"
          >
            <i className="bi bi-arrow-clockwise me-1"></i> Refresh
          </button>
        </div>
      </div>

      {/* Alert banner */}
      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show shadow-sm`} role="alert">
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

      {/* Financial Metric Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-md-3">
          <div className="card shadow-sm border-0 border-start border-primary border-4 h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-muted small text-uppercase fw-bold">Total Volume</div>
                  <div className="h4 mb-0 fw-bold text-dark">
                    ৳{stats ? stats.totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}
                  </div>
                  <div className="small text-muted mt-1">{stats ? stats.transactionCount : 0} total transactions</div>
                </div>
                <div className="bg-primary-subtle text-primary p-3 rounded-circle">
                  <i className="bi bi-wallet2 fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-3">
          <div className="card shadow-sm border-0 border-start border-success border-4 h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-muted small text-uppercase fw-bold">Collected / Paid</div>
                  <div className="h4 mb-0 fw-bold text-success">
                    ৳{stats ? stats.totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}
                  </div>
                  <div className="small text-muted mt-1">{stats ? stats.paidCount : 0} verified payments</div>
                </div>
                <div className="bg-success-subtle text-success p-3 rounded-circle">
                  <i className="bi bi-check-circle fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-3">
          <div className="card shadow-sm border-0 border-start border-warning border-4 h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-muted small text-uppercase fw-bold">Pending COD</div>
                  <div className="h4 mb-0 fw-bold text-warning">
                    ৳{stats ? stats.totalPendingCod.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}
                  </div>
                  <div className="small text-muted mt-1">{stats ? stats.pendingCount : 0} awaiting collection</div>
                </div>
                <div className="bg-warning-subtle text-warning p-3 rounded-circle">
                  <i className="bi bi-cash-coin fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-3">
          <div className="card shadow-sm border-0 border-start border-danger border-4 h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-muted small text-uppercase fw-bold">Total Refunded</div>
                  <div className="h4 mb-0 fw-bold text-danger">
                    ৳{stats ? stats.totalRefunded.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}
                  </div>
                  <div className="small text-muted mt-1">{stats ? stats.refundCount : 0} return settlements</div>
                </div>
                <div className="bg-danger-subtle text-danger p-3 rounded-circle">
                  <i className="bi bi-arrow-counterclockwise fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body bg-light rounded">
          <div className="row g-2 align-items-center">
            {/* Search */}
            <div className="col-md-3">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Order #, ref, customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    className="btn btn-outline-secondary bg-white border-start-0"
                    type="button"
                    onClick={() => setSearchTerm("")}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>
            </div>

            {/* Status Filter */}
            <div className="col-md-2">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as PaymentStatus | "");
                  setPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>

            {/* Method Filter */}
            <div className="col-md-2">
              <select
                className="form-select"
                value={methodFilter}
                onChange={(e) => {
                  setMethodFilter(e.target.value as PaymentMethod | "");
                  setPage(1);
                }}
              >
                <option value="">All Methods</option>
                <option value="CASH_ON_DELIVERY">Cash on Delivery</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="MOBILE_BANKING">Mobile Banking</option>
              </select>
            </div>

            {/* Date From */}
            <div className="col-md-2">
              <input
                type="date"
                className="form-control"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                title="Date From"
              />
            </div>

            {/* Date To */}
            <div className="col-md-2">
              <input
                type="date"
                className="form-control"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                title="Date To"
              />
            </div>

            {/* Reset */}
            <div className="col-md-1 text-end">
              {(searchTerm || statusFilter || methodFilter || dateFrom || dateTo) && (
                <button
                  className="btn btn-outline-secondary w-100"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("");
                    setMethodFilter("");
                    setDateFrom("");
                    setDateTo("");
                    setPage(1);
                  }}
                  title="Clear Filters"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Data Table */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-bold text-dark">
            <i className="bi bi-list-ul me-2 text-muted"></i>
            Transactions Ledger
            <span className="badge bg-secondary-subtle text-secondary ms-2 fw-normal">
              {total} total records
            </span>
          </h5>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading transactions...</span>
              </div>
              <p className="text-muted mt-2 small">Loading transaction records...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-receipt-cutoff fs-1 text-muted opacity-50"></i>
              <p className="text-muted mt-2 fw-medium">No transactions found</p>
              <p className="text-muted small">
                Try adjusting your search query, status filters, or date range.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th scope="col" className="ps-3">Reference / ID</th>
                    <th scope="col">Order Number</th>
                    <th scope="col">Customer / Recipient</th>
                    <th scope="col">Payment Method</th>
                    <th scope="col">Amount</th>
                    <th scope="col">Status</th>
                    <th scope="col">Date / Paid At</th>
                    <th scope="col" className="text-end pe-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="ps-3">
                        <div className="fw-semibold text-dark font-monospace small">
                          {payment.transactionRef || payment.id.substring(0, 8)}
                        </div>
                        {payment.transactionRef && (
                          <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                            UUID: {payment.id.substring(0, 8)}...
                          </div>
                        )}
                      </td>
                      <td>
                        {payment.order ? (
                          <Link
                            href={`/orders/${payment.orderId}`}
                            className="text-primary fw-bold text-decoration-none"
                          >
                            <i className="bi bi-box-arrow-up-right me-1 small"></i>
                            {payment.order.orderNumber}
                          </Link>
                        ) : (
                          <span className="text-muted small">{payment.orderId.substring(0, 8)}...</span>
                        )}
                      </td>
                      <td>
                        <div className="fw-medium text-dark">
                          {payment.order?.recipientName || payment.order?.customerName || "Customer"}
                        </div>
                        <div className="text-muted small">
                          {payment.order?.recipientPhone || payment.order?.customerEmail || ""}
                        </div>
                      </td>
                      <td>{getMethodBadge(payment.method)}</td>
                      <td>
                        <div className="fw-bold text-dark">
                          ৳{payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        {(payment.refundedAmount || 0) > 0 && (
                          <div className="text-danger small" style={{ fontSize: "0.72rem" }}>
                            -৳{payment.refundedAmount?.toFixed(2)} refunded
                          </div>
                        )}
                      </td>
                      <td>{getStatusBadge(payment.status)}</td>
                      <td>
                        <div className="small text-dark">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                          {payment.paidAt ? `Paid: ${new Date(payment.paidAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : "Unpaid"}
                        </div>
                      </td>
                      <td className="text-end pe-3">
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-secondary"
                            onClick={() => setSelectedPayment(payment)}
                            title="View Transaction Details"
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          {payment.status === "PENDING" && (
                            <button
                              className="btn btn-outline-success"
                              onClick={() => {
                                setStatusModalPayment(payment);
                                setNewStatus("PAID");
                                setStatusRef(payment.transactionRef || "");
                                setStatusNotes("");
                              }}
                              title="Mark as Paid / Collect COD"
                            >
                              <i className="bi bi-check2-circle me-1"></i>Collect
                            </button>
                          )}
                          {payment.status === "PAID" && (
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => {
                                setRefundModalPayment(payment);
                                setRefundAmount(String(payment.amount - (payment.refundedAmount || 0)));
                                setRefundReason("");
                                setRefundRef("");
                                setRefundNotes("");
                              }}
                              title="Issue Refund for this Transaction"
                            >
                              <i className="bi bi-arrow-counterclockwise me-1"></i>Refund
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="card-footer bg-white d-flex justify-content-between align-items-center py-3">
            <span className="small text-muted">
              Showing page {page} of {totalPages} ({total} transactions)
            </span>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </button>
              </li>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p = page - 2 + i;
                if (page <= 2) p = 1 + i;
                if (page >= totalPages - 2) p = totalPages - 4 + i;
                if (p < 1 || p > totalPages) return null;
                return (
                  <li
                    key={p}
                    className={`page-item ${p === page ? "active" : ""}`}
                  >
                    <button className="page-link" onClick={() => setPage(p)}>
                      {p}
                    </button>
                  </li>
                );
              })}
              <li className={`page-item ${page >= totalPages ? "disabled" : ""}`}>
                <button
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

      {/* MODAL: View Transaction Details */}
      {selectedPayment && (
        <div className="modal show fade d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow border-0">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title">
                  <i className="bi bi-receipt me-2"></i>
                  Transaction Details
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedPayment(null)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <div className="row g-3 mb-4">
                  <div className="col-sm-6">
                    <label className="text-muted small text-uppercase fw-bold">Transaction Reference</label>
                    <div className="fw-bold fs-6 font-monospace">
                      {selectedPayment.transactionRef || "N/A (Standard COD)"}
                    </div>
                    <div className="text-muted small">UUID: {selectedPayment.id}</div>
                  </div>
                  <div className="col-sm-6 text-sm-end">
                    <label className="text-muted small text-uppercase fw-bold">Current Status</label>
                    <div>{getStatusBadge(selectedPayment.status)}</div>
                  </div>
                </div>

                <div className="card bg-light border-0 mb-4">
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-sm-4">
                        <span className="text-muted small d-block">Method</span>
                        <div className="mt-1">{getMethodBadge(selectedPayment.method)}</div>
                      </div>
                      <div className="col-sm-4">
                        <span className="text-muted small d-block">Gross Amount</span>
                        <div className="fw-bold fs-5 text-dark mt-1">
                          ৳{selectedPayment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {selectedPayment.currency}
                        </div>
                      </div>
                      <div className="col-sm-4">
                        <span className="text-muted small d-block">Paid At</span>
                        <div className="mt-1 small">
                          {selectedPayment.paidAt
                            ? new Date(selectedPayment.paidAt).toLocaleString()
                            : "Awaiting Doorstep Collection / Confirmation"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Linked Order Snapshot */}
                {selectedPayment.order && (
                  <div className="mb-4">
                    <h6 className="fw-bold text-dark border-bottom pb-2">
                      <i className="bi bi-cart3 me-1 text-primary"></i> Linked Order Information
                    </h6>
                    <div className="row g-2 small">
                      <div className="col-sm-6">
                        <span className="text-muted">Order Number: </span>
                        <Link href={`/orders/${selectedPayment.orderId}`} className="fw-bold text-primary">
                          {selectedPayment.order.orderNumber}
                        </Link>
                      </div>
                      <div className="col-sm-6">
                        <span className="text-muted">Order Total: </span>
                        <span className="fw-bold">৳{selectedPayment.order.grandTotal.toFixed(2)}</span>
                      </div>
                      <div className="col-sm-6">
                        <span className="text-muted">Recipient: </span>
                        <span>{selectedPayment.order.recipientName} ({selectedPayment.order.recipientPhone})</span>
                      </div>
                      <div className="col-sm-6">
                        <span className="text-muted">Customer Email: </span>
                        <span>{selectedPayment.order.customerEmail || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Refund History for this transaction */}
                {selectedPayment.refunds && selectedPayment.refunds.length > 0 && (
                  <div>
                    <h6 className="fw-bold text-danger border-bottom pb-2">
                      <i className="bi bi-arrow-counterclockwise me-1"></i> Refund History ({selectedPayment.refunds.length})
                    </h6>
                    <ul className="list-group list-group-flush small">
                      {selectedPayment.refunds.map((ref) => (
                        <li key={ref.id} className="list-group-item d-flex justify-content-between align-items-center px-0">
                          <div>
                            <span className="fw-bold text-danger me-2">৳{ref.amount.toFixed(2)}</span>
                            <span className="badge bg-secondary-subtle text-secondary me-2">{ref.status}</span>
                            <span className="text-muted">{ref.reason}</span>
                          </div>
                          <span className="text-muted">{new Date(ref.createdAt).toLocaleDateString()}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedPayment.notes && (
                  <div className="mt-3">
                    <label className="text-muted small text-uppercase fw-bold">Notes</label>
                    <p className="small text-secondary mb-0 bg-light p-2 rounded">{selectedPayment.notes}</p>
                  </div>
                )}
              </div>
              <div className="modal-footer bg-light">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSelectedPayment(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Update Status / Confirm Payment */}
      {statusModalPayment && (
        <div className="modal show fade d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow border-0">
              <form onSubmit={handleUpdateStatusSubmit}>
                <div className="modal-header bg-success text-white">
                  <h5 className="modal-title">
                    <i className="bi bi-cash-coin me-2"></i>
                    Collect / Confirm Payment
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setStatusModalPayment(null)}
                  ></button>
                </div>
                <div className="modal-body p-4">
                  <p className="small text-muted mb-3">
                    Confirm that payment has been collected or received for Order{" "}
                    <strong>{statusModalPayment.order?.orderNumber || statusModalPayment.orderId}</strong>.
                  </p>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Transaction Status</label>
                    <select
                      className="form-select"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as PaymentStatus)}
                      required
                    >
                      <option value="PAID">Mark as PAID (Collected)</option>
                      <option value="FAILED">Mark as FAILED (Customer refused COD)</option>
                      <option value="PENDING">Keep PENDING</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Money Receipt / Reference Code</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. COD-REC-10293 or Rider Cash Slip #"
                      value={statusRef}
                      onChange={(e) => setStatusRef(e.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Collection Notes</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="e.g. Full amount collected by courier rider and remitted to merchant account."
                      value={statusNotes}
                      onChange={(e) => setStatusNotes(e.target.value)}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setStatusModalPayment(null)}
                    disabled={updatingStatus}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success btn-sm"
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? "Saving..." : "Confirm Collection"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Record New Payment */}
      {showRecordModal && (
        <div className="modal show fade d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow border-0">
              <form onSubmit={handleRecordPaymentSubmit}>
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title">
                    <i className="bi bi-plus-circle me-2"></i>
                    Record Payment Transaction
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowRecordModal(false)}
                  ></button>
                </div>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Order UUID <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter Order ID UUID"
                      value={recordOrderId}
                      onChange={(e) => setRecordOrderId(e.target.value)}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-sm-6">
                      <label className="form-label small fw-bold">Payment Method</label>
                      <select
                        className="form-select"
                        value={recordMethod}
                        onChange={(e) => setRecordMethod(e.target.value as PaymentMethod)}
                      >
                        <option value="CASH_ON_DELIVERY">Cash on Delivery</option>
                        <option value="CREDIT_CARD">Credit Card</option>
                        <option value="MOBILE_BANKING">Mobile Banking</option>
                      </select>
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label small fw-bold">Initial Status</label>
                      <select
                        className="form-select"
                        value={recordStatus}
                        onChange={(e) => setRecordStatus(e.target.value as PaymentStatus)}
                      >
                        <option value="PAID">Paid</option>
                        <option value="PENDING">Pending</option>
                        <option value="FAILED">Failed</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Amount (BDT) <span className="text-danger">*</span></label>
                    <div className="input-group">
                      <span className="input-group-text">৳</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        className="form-control"
                        placeholder="0.00"
                        value={recordAmount}
                        onChange={(e) => setRecordAmount(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Transaction Reference / Receipt</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. TXN-10294 or Bank Cheque #"
                      value={recordRef}
                      onChange={(e) => setRecordRef(e.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Notes</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="Internal reference or audit remark"
                      value={recordNotes}
                      onChange={(e) => setRecordNotes(e.target.value)}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowRecordModal(false)}
                    disabled={submittingPayment}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={submittingPayment}
                  >
                    {submittingPayment ? "Recording..." : "Record Payment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Issue Refund Shortcut */}
      {refundModalPayment && (
        <div className="modal show fade d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow border-0">
              <form onSubmit={handleRefundSubmit}>
                <div className="modal-header bg-danger text-white">
                  <h5 className="modal-title">
                    <i className="bi bi-arrow-counterclockwise me-2"></i>
                    Issue Refund for Order {refundModalPayment.order?.orderNumber}
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setRefundModalPayment(null)}
                  ></button>
                </div>
                <div className="modal-body p-4">
                  <div className="alert alert-warning small py-2 mb-3">
                    <i className="bi bi-exclamation-triangle me-1"></i>
                    Original payment was ৳{refundModalPayment.amount.toFixed(2)} ({refundModalPayment.method}).
                    Remaining balance: ৳{(refundModalPayment.amount - (refundModalPayment.refundedAmount || 0)).toFixed(2)}.
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Refund Amount (BDT) <span className="text-danger">*</span></label>
                    <div className="input-group">
                      <span className="input-group-text">৳</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={refundModalPayment.amount - (refundModalPayment.refundedAmount || 0)}
                        className="form-control"
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Reason for Refund <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Customer returned damaged parcel during delivery"
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Payout Reference / Slip #</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. REFUND-bKash-98124 or Cash Return Voucher"
                      value={refundRef}
                      onChange={(e) => setRefundRef(e.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Administrative Remarks</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="Optional internal notes"
                      value={refundNotes}
                      onChange={(e) => setRefundNotes(e.target.value)}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setRefundModalPayment(null)}
                    disabled={submittingRefund}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-danger btn-sm"
                    disabled={submittingRefund}
                  >
                    {submittingRefund ? "Processing..." : "Process Refund"}
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
