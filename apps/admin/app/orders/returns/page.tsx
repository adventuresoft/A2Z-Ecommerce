"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  AdminOrder,
  OrderStatus,
  PaymentStatus,
  ShipmentStatus,
  ordersService,
} from "../../../services/orders";
import { paymentsService, AdminRefund } from "../../../services/payments";

export default function OrdersReturnsPage() {
  const [returnedOrders, setReturnedOrders] = useState<AdminOrder[]>([]);
  const [refunds, setRefunds] = useState<AdminRefund[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [refundStatusFilter, setRefundStatusFilter] = useState<string>("");

  // Alert
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch orders with orderStatus=RETURNED
      const ordersRes = await ordersService.getOrders({
        page,
        limit,
        search: debouncedSearch || undefined,
        orderStatus: "RETURNED" as OrderStatus,
      });

      // Also fetch refunds for reference
      const refundsRes = await paymentsService.getRefunds({ limit: 100 }).catch(() => ({ items: [], total: 0 }));

      setReturnedOrders(ordersRes.items || []);
      setTotal(ordersRes.total || 0);
      setTotalPages(ordersRes.totalPages || 1);
      setRefunds(refundsRes.items || []);
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to load returned orders",
      });
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculations for KPI summary cards
  const totalRefundAmount = refunds.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const pendingRefunds = refunds.filter((r) => r.status === "PENDING").length;

  return (
    <div className="container-fluid px-3 py-3">
      {/* Header */}
      <div className="row align-items-center mb-3">
        <div className="col-sm-6">
          <h4 className="m-0 fw-semibold text-dark d-flex align-items-center gap-2">
            <i className="bi bi-arrow-return-left text-danger"></i> Returns & Replacements
          </h4>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0 small text-muted">
              <li className="breadcrumb-item">
                <Link href="/">Home</Link>
              </li>
              <li className="breadcrumb-item">
                <Link href="/orders">Orders</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Returns
              </li>
            </ol>
          </nav>
        </div>
        <div className="col-sm-6 text-sm-end mt-2 mt-sm-0 d-flex align-items-center justify-content-sm-end gap-2">
          <Link href="/orders" className="btn btn-outline-primary btn-sm">
            <i className="bi bi-cart3 me-1"></i> All Orders
          </Link>
          <Link href="/payments/refunds" className="btn btn-outline-secondary btn-sm">
            <i className="bi bi-cash-coin me-1"></i> Refund Center
          </Link>
          <button
            onClick={() => fetchData()}
            className="btn btn-outline-secondary btn-sm"
            title="Refresh returns list"
          >
            <i className="bi bi-arrow-clockwise me-1"></i> Refresh
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

      {/* Summary KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 border-start border-danger border-4">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-secondary small fw-medium text-uppercase">Total Returned Orders</span>
                  <h4 className="fw-bold mb-0 text-dark mt-1">{total}</h4>
                </div>
                <div className="bg-danger-subtle text-danger p-3 rounded-circle">
                  <i className="bi bi-arrow-return-left fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 border-start border-warning border-4">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-secondary small fw-medium text-uppercase">Total Refund Records</span>
                  <h4 className="fw-bold mb-0 text-dark mt-1">{refunds.length}</h4>
                </div>
                <div className="bg-warning-subtle text-warning p-3 rounded-circle">
                  <i className="bi bi-receipt-cutoff fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 border-start border-info border-4">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-secondary small fw-medium text-uppercase">Total Refunded Sum</span>
                  <h4 className="fw-bold mb-0 text-dark mt-1">
                    BDT{" "}
                    {totalRefundAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </h4>
                </div>
                <div className="bg-info-subtle text-info p-3 rounded-circle">
                  <i className="bi bi-cash-stack fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 border-start border-success border-4">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-secondary small fw-medium text-uppercase">Pending Actions</span>
                  <h4 className="fw-bold mb-0 text-dark mt-1">{pendingRefunds}</h4>
                </div>
                <div className="bg-success-subtle text-success p-3 rounded-circle">
                  <i className="bi bi-clock-history fs-4"></i>
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
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Search by order #, recipient name, phone..."
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

            <div className="col-md-3">
              <select
                className="form-select"
                value={refundStatusFilter}
                onChange={(e) => setRefundStatusFilter(e.target.value)}
              >
                <option value="">Refund Status: All</option>
                <option value="COMPLETED">Refund Completed</option>
                <option value="PENDING">Refund Pending</option>
                <option value="NONE">No Refund Processed</option>
              </select>
            </div>

            <div className="col-md-3 text-md-end text-muted small">
              Showing <strong>{returnedOrders.length}</strong> of <strong>{total}</strong> returned orders
            </div>
          </div>
        </div>
      </div>

      {/* Returns Table */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light text-secondary small">
                <tr>
                  <th style={{ width: "160px" }}>Order Number</th>
                  <th>Customer & Recipient</th>
                  <th className="text-center" style={{ width: "130px" }}>
                    Order Status
                  </th>
                  <th className="text-center" style={{ width: "130px" }}>
                    Payment / Refund
                  </th>
                  <th className="text-center" style={{ width: "130px" }}>
                    Shipment
                  </th>
                  <th className="text-end" style={{ width: "120px" }}>
                    Grand Total
                  </th>
                  <th style={{ width: "160px" }}>Date</th>
                  <th className="text-center" style={{ width: "120px" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-5">
                      <div className="spinner-border text-primary spinner-border-sm me-2" role="status"></div>
                      <span className="text-muted">Loading returned orders...</span>
                    </td>
                  </tr>
                ) : returnedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-5">
                      <div className="text-secondary opacity-50 mb-2">
                        <i className="bi bi-check-circle fs-1 text-success"></i>
                      </div>
                      <h6 className="fw-semibold text-dark">No Returned Orders Found</h6>
                      <p className="text-muted small mb-0">
                        {debouncedSearch
                          ? "No returns match your search criteria."
                          : "Great news! There are currently no returned orders recorded in the system."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  returnedOrders.map((order) => {
                    const orderRefunds = (order.refunds || []);
                    const hasRefund = orderRefunds.length > 0;

                    return (
                      <tr key={order.id}>
                        <td>
                          <Link
                            href={`/orders/${order.id}`}
                            className="fw-bold text-primary text-decoration-none"
                          >
                            {order.orderNumber}
                          </Link>
                          <div className="text-muted small">
                            {order.items?.length || 0} item{(order.items?.length || 0) > 1 ? "s" : ""}
                          </div>
                        </td>
                        <td>
                          <div className="fw-semibold text-dark">{order.recipientName}</div>
                          <div className="text-muted small">{order.recipientPhone}</div>
                          <div className="text-muted small">{order.shippingCity}</div>
                        </td>
                        <td className="text-center">
                          <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">
                            <i className="bi bi-arrow-return-left me-1"></i> Returned
                          </span>
                        </td>
                        <td className="text-center">
                          {hasRefund ? (
                            <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1">
                              Refunded ({orderRefunds.length})
                            </span>
                          ) : order.paymentStatus === "REFUNDED" ? (
                            <span className="badge bg-secondary px-2 py-1">Refunded</span>
                          ) : (
                            <span className="badge bg-light text-dark border px-2 py-1">
                              {order.paymentStatus}
                            </span>
                          )}
                        </td>
                        <td className="text-center">
                          <span className="badge bg-secondary-subtle text-secondary px-2 py-1">
                            {order.shipmentStatus}
                          </span>
                        </td>
                        <td className="text-end fw-bold text-dark">
                          BDT{" "}
                          {order.grandTotal.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="text-secondary small">
                          {new Date(order.updatedAt || order.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="text-center">
                          <div className="btn-group btn-group-sm">
                            <Link
                              href={`/orders/${order.id}`}
                              className="btn btn-outline-primary btn-sm"
                              title="View Order Details"
                            >
                              <i className="bi bi-eye me-1"></i> Details
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
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="card-footer bg-white border-top py-3 d-flex align-items-center justify-content-between">
            <span className="small text-muted">
              Page {page} of {totalPages}
            </span>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
                <button className="page-link" onClick={() => setPage(page - 1)}>
                  Previous
                </button>
              </li>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <li key={p} className={`page-item ${p === page ? "active" : ""}`}>
                  <button className="page-link" onClick={() => setPage(p)}>
                    {p}
                  </button>
                </li>
              ))}
              <li className={`page-item ${page >= totalPages ? "disabled" : ""}`}>
                <button className="page-link" onClick={() => setPage(page + 1)}>
                  Next
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
