"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  AdminOrder,
  OrderStatus,
  PaymentStatus,
  ShipmentStatus,
  ordersService,
} from "../../services/orders";

export default function OrdersListPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatus | "">("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatus | "">("");
  const [shipmentStatusFilter, setShipmentStatusFilter] = useState<ShipmentStatus | "">("");

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

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ordersService.getOrders({
        page,
        limit,
        search: debouncedSearch || undefined,
        orderStatus: orderStatusFilter || undefined,
        paymentStatus: paymentStatusFilter || undefined,
        shipmentStatus: shipmentStatusFilter || undefined,
      });

      setOrders(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to load orders",
      });
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, orderStatusFilter, paymentStatusFilter, shipmentStatusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const getOrderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "PENDING":
        return <span className="badge bg-warning text-dark">Pending</span>;
      case "CONFIRMED":
        return <span className="badge bg-info text-dark">Confirmed</span>;
      case "PROCESSING":
        return <span className="badge bg-primary">Processing</span>;
      case "SHIPPED":
        return <span className="badge bg-indigo text-white" style={{ backgroundColor: "#6610f2" }}>Shipped</span>;
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

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case "PAID":
        return <span className="badge bg-success">Paid</span>;
      case "PENDING":
        return <span className="badge bg-warning text-dark">Pending</span>;
      case "FAILED":
        return <span className="badge bg-danger">Failed</span>;
      case "REFUNDED":
        return <span className="badge bg-secondary">Refunded</span>;
      default:
        return <span className="badge bg-light text-dark">{status}</span>;
    }
  };

  const getOrderPaymentMethod = (order: AdminOrder): string | null => {
    if (order.paymentMethod) return order.paymentMethod;
    if (order.payments && order.payments.length > 0) {
      return order.payments[0].method;
    }
    return null;
  };

  const formatPaymentMethodName = (code: string) => {
    switch (code) {
      case "PAYSTATION":
        return "PayStation";
      case "CASH_ON_DELIVERY":
        return "Cash on Delivery";
      case "MOBILE_BANKING":
        return "bKash / Nagad";
      case "CHECK_PAYMENT":
        return "Cheque";
      case "BANK_TRANSFER":
        return "Bank Wire";
      case "CREDIT_CARD":
        return "Card";
      default:
        return code.replace(/_/g, " ");
    }
  };

  const getPaymentMethodIcon = (code: string) => {
    switch (code) {
      case "PAYSTATION":
        return "bi-shield-check text-primary";
      case "CASH_ON_DELIVERY":
        return "bi-cash-coin text-success";
      case "MOBILE_BANKING":
        return "bi-phone text-warning";
      case "CHECK_PAYMENT":
        return "bi-check2-circle text-primary";
      case "BANK_TRANSFER":
        return "bi-bank text-info";
      default:
        return "bi-credit-card text-secondary";
    }
  };

  const getPaymentMethodBadge = (order: AdminOrder) => {
    const method = getOrderPaymentMethod(order);
    if (!method) return null;

    return (
      <span
        className="badge bg-light text-secondary border d-inline-flex align-items-center gap-1 font-monospace"
        style={{ fontSize: "0.68rem" }}
        title={`Payment Channel: ${formatPaymentMethodName(method)}`}
      >
        <i className={`bi ${getPaymentMethodIcon(method)}`}></i>
        <span>{formatPaymentMethodName(method)}</span>
      </span>
    );
  };

  const getShipmentStatusBadge = (status: ShipmentStatus) => {
    switch (status) {
      case "DELIVERED":
        return <span className="badge bg-success">Delivered</span>;
      case "DISPATCHED":
      case "IN_TRANSIT":
      case "OUT_FOR_DELIVERY":
        return <span className="badge bg-info text-dark">{status.replace(/_/g, " ")}</span>;
      case "PREPARING":
        return <span className="badge bg-warning text-dark">Preparing</span>;
      case "UNFULFILLED":
        return <span className="badge bg-light text-dark border">Unfulfilled</span>;
      case "FAILED_DELIVERY":
      case "RETURNED":
        return <span className="badge bg-danger">{status.replace(/_/g, " ")}</span>;
      default:
        return <span className="badge bg-light text-dark">{status}</span>;
    }
  };

  return (
    <div className="container-fluid p-3">
      {/* Page Header */}
      <div className="row mb-3 align-items-center">
        <div className="col-sm-6">
          <h1 className="h3 mb-0 text-dark font-weight-bold">
            <i className="bi bi-cart3 me-2 text-primary"></i>Orders Management
          </h1>
          <p className="text-muted small mb-0 mt-1">
            Track customer orders, manage status transitions, and oversee fulfillment.
          </p>
        </div>
        <div className="col-sm-6 text-sm-end mt-2 mt-sm-0 d-flex align-items-center justify-content-sm-end gap-2">
          <Link href="/orders/create" className="btn btn-primary btn-sm">
            <i className="bi bi-plus-lg me-1"></i> Create Order
          </Link>
          <button
            onClick={() => fetchOrders()}
            className="btn btn-outline-secondary btn-sm"
            title="Refresh Orders"
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

      {/* Filter and Search Bar */}
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
                  type="search"
                  className="form-control border-start-0 ps-0"
                  placeholder="Search order #, customer, phone…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Search orders by order number, customer, or phone"
                />
                {searchTerm && (
                  <button
                    className="btn btn-outline-secondary bg-white border-start-0"
                    type="button"
                    onClick={() => setSearchTerm("")}
                    aria-label="Clear search input"
                  >
                    <i className="bi bi-x" aria-hidden="true"></i>
                  </button>
                )}
              </div>
            </div>

            {/* Order Status Filter */}
            <div className="col-md-2">
              <select
                className="form-select"
                value={orderStatusFilter}
                onChange={(e) => {
                  setOrderStatusFilter(e.target.value as OrderStatus | "");
                  setPage(1);
                }}
                aria-label="Filter by order status"
              >
                <option value="">Order Status: All</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="RETURNED">Returned</option>
              </select>
            </div>

            {/* Payment Status Filter */}
            <div className="col-md-2">
              <select
                className="form-select"
                value={paymentStatusFilter}
                onChange={(e) => {
                  setPaymentStatusFilter(e.target.value as PaymentStatus | "");
                  setPage(1);
                }}
                aria-label="Filter by payment status"
              >
                <option value="">Payment: All</option>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>

            {/* Shipment Status Filter */}
            <div className="col-md-2">
              <select
                className="form-select"
                value={shipmentStatusFilter}
                onChange={(e) => {
                  setShipmentStatusFilter(e.target.value as ShipmentStatus | "");
                  setPage(1);
                }}
                aria-label="Filter by shipment status"
              >
                <option value="">Shipment: All</option>
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

            {/* Reset Filters */}
            <div className="col-md-2 text-md-end">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setSearchTerm("");
                  setOrderStatusFilter("");
                  setPaymentStatusFilter("");
                  setShipmentStatusFilter("");
                  setPage(1);
                }}
                aria-label="Reset all search and status filters"
              >
                <i className="bi bi-arrow-counterclockwise me-1" aria-hidden="true"></i>Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table Card */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white border-bottom py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="card-title mb-0 font-weight-bold text-dark">
              Orders <span className="badge bg-secondary ms-1">{total}</span>
            </h5>
            <span className="text-muted small">
              Page {page} of {totalPages || 1}
            </span>
          </div>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-striped align-middle mb-0">
              <thead className="table-light text-muted small text-uppercase">
                <tr>
                  <th scope="col" className="ps-3">Order Number</th>
                  <th scope="col">Date Placed</th>
                  <th scope="col">Customer / Recipient</th>
                  <th scope="col">Destination</th>
                  <th scope="col" className="text-end">Items</th>
                  <th scope="col" className="text-end">Grand Total</th>
                  <th scope="col" className="text-center">Order Status</th>
                  <th scope="col" className="text-center">Payment</th>
                  <th scope="col" className="text-center">Shipment</th>
                  <th scope="col" className="text-end pe-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="text-center py-5" role="status" aria-live="polite">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading orders…</span>
                      </div>
                      <p className="text-muted mt-2 mb-0 small">Loading order records…</p>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-5 text-muted">
                      <i className="bi bi-cart-x fs-1 d-block mb-2 text-secondary" aria-hidden="true"></i>
                      <p className="h6 mb-1">No orders found</p>
                      <p className="small mb-0">Try adjusting your filters or search keywords.</p>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id}>
                      <td className="ps-3 font-monospace fw-bold">
                        <Link href={`/orders/${order.id}`} className="text-primary text-decoration-none">
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="small text-muted tabular-nums">
                        {new Date(order.createdAt).toLocaleDateString()}
                        <div className="text-muted tabular-nums" style={{ fontSize: "0.75rem" }}>
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td>
                        <div className="fw-semibold text-dark">{order.recipientName}</div>
                        <div className="small text-muted">{order.recipientPhone}</div>
                      </td>
                      <td className="small text-muted">
                        {order.shippingCity}
                        {order.shippingState ? `, ${order.shippingState}` : ""}
                      </td>
                      <td className="text-end font-monospace tabular-nums">
                        <span className="badge bg-light text-dark border tabular-nums">
                          {order.items?.length || 0}
                        </span>
                      </td>
                      <td className="text-end fw-bold font-monospace text-dark tabular-nums">
                        ৳{order.grandTotal.toFixed(2)}
                      </td>
                      <td className="text-center">{getOrderStatusBadge(order.orderStatus)}</td>
                      <td className="text-center">
                        <div className="d-flex flex-column align-items-center gap-1">
                          {getPaymentStatusBadge(order.paymentStatus)}
                          {getPaymentMethodBadge(order)}
                        </div>
                      </td>
                      <td className="text-center">{getShipmentStatusBadge(order.shipmentStatus)}</td>
                      <td className="text-end pe-3">
                        <Link
                          href={`/orders/${order.id}`}
                          className="btn btn-sm btn-outline-primary"
                          aria-label={`View details for order ${order.orderNumber}`}
                        >
                          <i className="bi bi-eye me-1" aria-hidden="true"></i> Details
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card Footer with Pagination */}
        {!loading && totalPages > 1 && (
          <div className="card-footer bg-white border-top py-3">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div className="small text-muted tabular-nums">
                Showing {Math.min((page - 1) * limit + 1, total)} to{" "}
                {Math.min(page * limit, total)} of {total} orders
              </div>
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    aria-label="Previous page"
                  >
                    Previous
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                  if (
                    p === 1 ||
                    p === totalPages ||
                    (p >= page - 2 && p <= page + 2)
                  ) {
                    return (
                      <li key={p} className={`page-item ${p === page ? "active" : ""}`}>
                        <button
                          className="page-link tabular-nums"
                          onClick={() => setPage(p)}
                          aria-label={`Page ${p}`}
                          aria-current={p === page ? "page" : undefined}
                        >
                          {p}
                        </button>
                      </li>
                    );
                  }
                  if (p === page - 3 || p === page + 3) {
                    return (
                      <li key={p} className="page-item disabled" aria-hidden="true">
                        <span className="page-link">…</span>
                      </li>
                    );
                  }
                  return null;
                })}
                <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    aria-label="Next page"
                  >
                    Next
                  </button>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
