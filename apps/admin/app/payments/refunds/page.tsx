"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  AdminRefund,
  PaymentMethod,
  RefundStatus,
  paymentsService,
} from "../../../services/payments";

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<AdminRefund[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RefundStatus | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Alert
  const [alert, setAlert] = useState<{
    type: "success" | "danger" | "info";
    text: string;
  } | null>(null);

  // Detail Modal
  const [selectedRefund, setSelectedRefund] = useState<AdminRefund | null>(null);

  // Review / Decision Modal (for PENDING refunds)
  const [decisionModalRefund, setDecisionModalRefund] = useState<AdminRefund | null>(null);
  const [decisionStatus, setDecisionStatus] = useState<RefundStatus>("COMPLETED");
  const [decisionRef, setDecisionRef] = useState("");
  const [decisionNotes, setDecisionNotes] = useState("");
  const [submittingDecision, setSubmittingDecision] = useState(false);

  // Issue New Refund Modal
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueOrderId, setIssueOrderId] = useState("");
  const [issueAmount, setIssueAmount] = useState("");
  const [issueReason, setIssueReason] = useState("");
  const [issueMethod, setIssueMethod] = useState<PaymentMethod>("CASH_ON_DELIVERY");
  const [issueRef, setIssueRef] = useState("");
  const [issueNotes, setIssueNotes] = useState("");
  const [submittingIssue, setSubmittingIssue] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadRefunds = useCallback(async () => {
    setLoading(true);
    try {
      const res = await paymentsService.getRefunds({
        page,
        limit,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
        dateTo: dateTo ? new Date(dateTo).toISOString() : undefined,
      });

      setRefunds(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to load refunds",
      });
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    loadRefunds();
  }, [loadRefunds]);

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionModalRefund) return;

    setSubmittingDecision(true);
    try {
      await paymentsService.updateRefundStatus(decisionModalRefund.id, {
        status: decisionStatus,
        transactionRef: decisionRef.trim() || undefined,
        notes: decisionNotes.trim() || undefined,
      });

      setAlert({
        type: "success",
        text: `Refund status updated to ${decisionStatus} successfully!`,
      });
      setDecisionModalRefund(null);
      setDecisionRef("");
      setDecisionNotes("");
      loadRefunds();
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to resolve refund request",
      });
    } finally {
      setSubmittingDecision(false);
    }
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueOrderId || !issueAmount || !issueReason) return;

    setSubmittingIssue(true);
    try {
      await paymentsService.createRefund({
        orderId: issueOrderId.trim(),
        amount: Number(issueAmount),
        reason: issueReason.trim(),
        refundMethod: issueMethod,
        transactionRef: issueRef.trim() || undefined,
        notes: issueNotes.trim() || undefined,
      });

      setAlert({
        type: "success",
        text: `Refund of ৳${Number(issueAmount).toFixed(2)} recorded successfully!`,
      });
      setShowIssueModal(false);
      setIssueOrderId("");
      setIssueAmount("");
      setIssueReason("");
      setIssueRef("");
      setIssueNotes("");
      loadRefunds();
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to issue refund",
      });
    } finally {
      setSubmittingIssue(false);
    }
  };

  const getStatusBadge = (status: RefundStatus) => {
    switch (status) {
      case "COMPLETED":
        return <span className="badge bg-success"><i className="bi bi-check2-circle me-1"></i>Completed</span>;
      case "PENDING":
        return <span className="badge bg-warning text-dark"><i className="bi bi-hourglass-split me-1"></i>Pending Review</span>;
      case "REJECTED":
        return <span className="badge bg-secondary"><i className="bi bi-x-circle me-1"></i>Rejected</span>;
      default:
        return <span className="badge bg-light text-dark">{status}</span>;
    }
  };

  // Metrics summary
  const completedRefunds = refunds.filter((r) => r.status === "COMPLETED");
  const pendingRefunds = refunds.filter((r) => r.status === "PENDING");
  const rejectedRefunds = refunds.filter((r) => r.status === "REJECTED");
  const totalCompletedAmount = completedRefunds.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="container-fluid p-3">
      {/* Header */}
      <div className="row mb-3 align-items-center">
        <div className="col-sm-6">
          <h1 className="h3 mb-0 text-dark font-weight-bold">
            <i className="bi bi-arrow-counterclockwise me-2 text-danger"></i>Refunds Management
          </h1>
          <p className="text-muted small mb-0 mt-1">
            Authorize return payouts, resolve customer disputes, and track disbursed refund balances.
          </p>
        </div>
        <div className="col-sm-6 text-sm-end mt-2 mt-sm-0 d-flex gap-2 justify-content-sm-end">
          <button
            onClick={() => setShowIssueModal(true)}
            className="btn btn-danger btn-sm"
          >
            <i className="bi bi-plus-circle me-1"></i> Issue Refund
          </button>
          <button
            onClick={() => loadRefunds()}
            className="btn btn-outline-secondary btn-sm"
            title="Refresh Refunds"
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

      {/* Metrics Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-md-3">
          <div className="card shadow-sm border-0 border-start border-danger border-4 h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-muted small text-uppercase fw-bold">Settled Refunds</div>
                  <div className="h4 mb-0 fw-bold text-danger">
                    ৳{totalCompletedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="small text-muted mt-1">{completedRefunds.length} completed on this view</div>
                </div>
                <div className="bg-danger-subtle text-danger p-3 rounded-circle">
                  <i className="bi bi-cash-stack fs-4"></i>
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
                  <div className="text-muted small text-uppercase fw-bold">Disbursed Count</div>
                  <div className="h4 mb-0 fw-bold text-success">
                    {completedRefunds.length}
                  </div>
                  <div className="small text-muted mt-1">Successfully resolved</div>
                </div>
                <div className="bg-success-subtle text-success p-3 rounded-circle">
                  <i className="bi bi-check2-circle fs-4"></i>
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
                  <div className="text-muted small text-uppercase fw-bold">Pending Review</div>
                  <div className="h4 mb-0 fw-bold text-warning">
                    {pendingRefunds.length}
                  </div>
                  <div className="small text-muted mt-1">Requires staff approval</div>
                </div>
                <div className="bg-warning-subtle text-warning p-3 rounded-circle">
                  <i className="bi bi-hourglass-split fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-3">
          <div className="card shadow-sm border-0 border-start border-secondary border-4 h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-muted small text-uppercase fw-bold">Rejected</div>
                  <div className="h4 mb-0 fw-bold text-secondary">
                    {rejectedRefunds.length}
                  </div>
                  <div className="small text-muted mt-1">Denied requests</div>
                </div>
                <div className="bg-secondary-subtle text-secondary p-3 rounded-circle">
                  <i className="bi bi-x-circle fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body bg-light rounded">
          <div className="row g-2 align-items-center">
            {/* Search */}
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Search order #, refund slip, customer..."
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
                  setStatusFilter(e.target.value as RefundStatus | "");
                  setPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending Review</option>
                <option value="REJECTED">Rejected</option>
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
            <div className="col-md-2 text-end">
              {(searchTerm || statusFilter || dateFrom || dateTo) && (
                <button
                  className="btn btn-outline-secondary w-100"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("");
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

      {/* Refunds Table */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-bold text-dark">
            <i className="bi bi-arrow-return-left me-2 text-muted"></i>
            Refund Settlements Ledger
            <span className="badge bg-secondary-subtle text-secondary ms-2 fw-normal">
              {total} records
            </span>
          </h5>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-danger" role="status">
                <span className="visually-hidden">Loading refunds...</span>
              </div>
              <p className="text-muted mt-2 small">Loading refund records...</p>
            </div>
          ) : refunds.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-arrow-counterclockwise fs-1 text-muted opacity-50"></i>
              <p className="text-muted mt-2 fw-medium">No refund records found</p>
              <p className="text-muted small">
                Try adjusting your search criteria or issue a new return refund.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th scope="col" className="ps-3">Refund Ref / ID</th>
                    <th scope="col">Order Number</th>
                    <th scope="col">Customer</th>
                    <th scope="col">Original Payment</th>
                    <th scope="col">Refund Amount</th>
                    <th scope="col">Reason</th>
                    <th scope="col">Status</th>
                    <th scope="col">Processed By</th>
                    <th scope="col">Date</th>
                    <th scope="col" className="text-end pe-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {refunds.map((refund) => (
                    <tr key={refund.id}>
                      <td className="ps-3">
                        <div className="fw-semibold text-dark font-monospace small">
                          {refund.transactionRef || refund.id.substring(0, 8)}
                        </div>
                        <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                          UUID: {refund.id.substring(0, 8)}...
                        </div>
                      </td>
                      <td>
                        {refund.order ? (
                          <Link
                            href={`/orders/${refund.orderId}`}
                            className="text-primary fw-bold text-decoration-none"
                          >
                            <i className="bi bi-box-arrow-up-right me-1 small"></i>
                            {refund.order.orderNumber}
                          </Link>
                        ) : (
                          <span className="text-muted small">{refund.orderId.substring(0, 8)}...</span>
                        )}
                      </td>
                      <td>
                        <div className="fw-medium text-dark small">
                          {refund.order?.recipientName || refund.order?.customerName || "Customer"}
                        </div>
                        <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                          {refund.order?.recipientPhone || refund.order?.customerEmail || ""}
                        </div>
                      </td>
                      <td>
                        <div className="small text-muted">
                          {refund.payment ? (
                            <>
                              <span className="fw-medium">{refund.payment.method.replace(/_/g, " ")}</span>
                              <div>৳{refund.payment.amount.toFixed(2)}</div>
                            </>
                          ) : (
                            "N/A"
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="fw-bold text-danger">
                          ৳{refund.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td>
                        <div className="text-truncate small" style={{ maxWidth: "200px" }} title={refund.reason}>
                          {refund.reason}
                        </div>
                      </td>
                      <td>{getStatusBadge(refund.status)}</td>
                      <td>
                        <div className="small text-muted">
                          {refund.processedByUserName || "System / Admin"}
                        </div>
                      </td>
                      <td>
                        <div className="small text-dark">
                          {new Date(refund.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="text-end pe-3">
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-secondary"
                            onClick={() => setSelectedRefund(refund)}
                            title="View Refund Details"
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          {refund.status === "PENDING" && (
                            <button
                              className="btn btn-outline-warning text-dark"
                              onClick={() => {
                                setDecisionModalRefund(refund);
                                setDecisionStatus("COMPLETED");
                                setDecisionRef(refund.transactionRef || "");
                                setDecisionNotes("");
                              }}
                              title="Review / Resolve Pending Refund"
                            >
                              <i className="bi bi-pencil-square me-1"></i>Review
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
              Showing page {page} of {totalPages} ({total} records)
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

      {/* MODAL: View Refund Details */}
      {selectedRefund && (
        <div className="modal show fade d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow border-0">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title">
                  <i className="bi bi-arrow-counterclockwise me-2"></i>
                  Refund Statement & Breakdown
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedRefund(null)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <div className="row g-3 mb-4">
                  <div className="col-sm-6">
                    <label className="text-muted small text-uppercase fw-bold">Refund Reference</label>
                    <div className="fw-bold fs-6 font-monospace">
                      {selectedRefund.transactionRef || "N/A (Standard Refund Slip)"}
                    </div>
                    <div className="text-muted small">UUID: {selectedRefund.id}</div>
                  </div>
                  <div className="col-sm-6 text-sm-end">
                    <label className="text-muted small text-uppercase fw-bold">Settlement Status</label>
                    <div>{getStatusBadge(selectedRefund.status)}</div>
                  </div>
                </div>

                <div className="card bg-light border-0 mb-4">
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-sm-4">
                        <span className="text-muted small d-block">Disbursed Amount</span>
                        <div className="fw-bold fs-4 text-danger mt-1">
                          ৳{selectedRefund.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div className="col-sm-4">
                        <span className="text-muted small d-block">Refund Channel</span>
                        <div className="fw-semibold text-dark mt-1">
                          {selectedRefund.refundMethod ? selectedRefund.refundMethod.replace(/_/g, " ") : "Original Payment Method"}
                        </div>
                      </div>
                      <div className="col-sm-4">
                        <span className="text-muted small d-block">Processed Date</span>
                        <div className="mt-1 small">
                          {new Date(selectedRefund.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reason & Notes */}
                <div className="mb-4">
                  <label className="text-muted small text-uppercase fw-bold">Justification & Return Reason</label>
                  <div className="bg-light p-3 rounded text-dark small border-start border-danger border-4">
                    {selectedRefund.reason}
                  </div>
                  {selectedRefund.notes && (
                    <div className="mt-2 text-muted small">
                      <strong>Admin Notes: </strong>{selectedRefund.notes}
                    </div>
                  )}
                </div>

                {/* Linked Order Snapshot */}
                {selectedRefund.order && (
                  <div className="mb-4">
                    <h6 className="fw-bold text-dark border-bottom pb-2">
                      <i className="bi bi-cart3 me-1 text-primary"></i> Linked Order Information
                    </h6>
                    <div className="row g-2 small">
                      <div className="col-sm-6">
                        <span className="text-muted">Order Number: </span>
                        <Link href={`/orders/${selectedRefund.orderId}`} className="fw-bold text-primary">
                          {selectedRefund.order.orderNumber}
                        </Link>
                      </div>
                      <div className="col-sm-6">
                        <span className="text-muted">Order Grand Total: </span>
                        <span className="fw-bold">৳{selectedRefund.order.grandTotal.toFixed(2)}</span>
                      </div>
                      <div className="col-sm-6">
                        <span className="text-muted">Recipient Name: </span>
                        <span>{selectedRefund.order.recipientName} ({selectedRefund.order.recipientPhone})</span>
                      </div>
                      <div className="col-sm-6">
                        <span className="text-muted">Customer Email: </span>
                        <span>{selectedRefund.order.customerEmail || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-muted small">
                  <strong>Authorized By: </strong>{selectedRefund.processedByUserName || "Store Administration"}
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSelectedRefund(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Review / Decision for Pending Refund */}
      {decisionModalRefund && (
        <div className="modal show fade d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow border-0">
              <form onSubmit={handleDecisionSubmit}>
                <div className="modal-header bg-warning text-dark">
                  <h5 className="modal-title">
                    <i className="bi bi-check2-circle me-2"></i>
                    Review Refund Request
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setDecisionModalRefund(null)}
                  ></button>
                </div>
                <div className="modal-body p-4">
                  <p className="small text-muted mb-3">
                    Decide on refund request of <strong>৳{decisionModalRefund.amount.toFixed(2)}</strong> for Order{" "}
                    <strong>{decisionModalRefund.order?.orderNumber}</strong>.
                  </p>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Decision</label>
                    <select
                      className="form-select"
                      value={decisionStatus}
                      onChange={(e) => setDecisionStatus(e.target.value as RefundStatus)}
                      required
                    >
                      <option value="COMPLETED">Approve & Disburse Payout</option>
                      <option value="REJECTED">Reject Refund Request</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Disbursement Voucher / Slip #</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. REFUND-bKash-10293 or Cash Voucher #"
                      value={decisionRef}
                      onChange={(e) => setDecisionRef(e.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Resolution Notes / Reason</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="e.g. Return parcel inspected and approved. Disbursed via mobile banking."
                      value={decisionNotes}
                      onChange={(e) => setDecisionNotes(e.target.value)}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setDecisionModalRefund(null)}
                    disabled={submittingDecision}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`btn btn-sm ${decisionStatus === "COMPLETED" ? "btn-success" : "btn-danger"}`}
                    disabled={submittingDecision}
                  >
                    {submittingDecision ? "Saving..." : decisionStatus === "COMPLETED" ? "Approve Payout" : "Reject Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Issue New Refund */}
      {showIssueModal && (
        <div className="modal show fade d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow border-0">
              <form onSubmit={handleIssueSubmit}>
                <div className="modal-header bg-danger text-white">
                  <h5 className="modal-title">
                    <i className="bi bi-plus-circle me-2"></i>
                    Issue New Order Refund
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowIssueModal(false)}
                  ></button>
                </div>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Order UUID <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter Order ID UUID"
                      value={issueOrderId}
                      onChange={(e) => setIssueOrderId(e.target.value)}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-sm-6">
                      <label className="form-label small fw-bold">Refund Amount (BDT) <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <span className="input-group-text">৳</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          className="form-control"
                          placeholder="0.00"
                          value={issueAmount}
                          onChange={(e) => setIssueAmount(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label small fw-bold">Payout Method</label>
                      <select
                        className="form-select"
                        value={issueMethod}
                        onChange={(e) => setIssueMethod(e.target.value as PaymentMethod)}
                      >
                        <option value="CASH_ON_DELIVERY">Cash Return (Doorstep)</option>
                        <option value="MOBILE_BANKING">Mobile Banking (bKash/Nagad)</option>
                        <option value="CREDIT_CARD">Credit Card Reversal</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Return Reason / Justification <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Customer returned damaged parcel during delivery"
                      value={issueReason}
                      onChange={(e) => setIssueReason(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Payout Reference / Slip #</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. REF-2026-98124 or Cash Return Slip"
                      value={issueRef}
                      onChange={(e) => setIssueRef(e.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Internal Notes</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="Optional administration remarks"
                      value={issueNotes}
                      onChange={(e) => setIssueNotes(e.target.value)}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowIssueModal(false)}
                    disabled={submittingIssue}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-danger btn-sm"
                    disabled={submittingIssue}
                  >
                    {submittingIssue ? "Issuing..." : "Confirm & Issue Refund"}
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
