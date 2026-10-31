"use client";

import React from "react";
import Link from "next/link";
import { RecentOrderSummary } from "./types";

interface RecentOrdersTableProps {
  orders: RecentOrderSummary[];
  currency?: string;
  isLoading?: boolean;
}

export function RecentOrdersTable({
  orders,
  currency = "৳",
  isLoading = false,
}: RecentOrdersTableProps) {
  const getStatusBadge = (status: RecentOrderSummary["orderStatus"]) => {
    switch (status) {
      case "DELIVERED":
        return <span className="badge bg-success-subtle text-success border border-success-subtle">Delivered</span>;
      case "PROCESSING":
        return <span className="badge bg-primary-subtle text-primary border border-primary-subtle">Processing</span>;
      case "CONFIRMED":
        return <span className="badge bg-info-subtle text-info border border-info-subtle">Confirmed</span>;
      case "SHIPPED":
        return <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">Shipped</span>;
      case "CANCELLED":
        return <span className="badge bg-danger-subtle text-danger border border-danger-subtle">Cancelled</span>;
      case "RETURNED":
        return <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">Returned</span>;
      default:
        return <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">Pending</span>;
    }
  };

  const getPaymentBadge = (status: RecentOrderSummary["paymentStatus"]) => {
    switch (status) {
      case "PAID":
        return <span className="badge bg-success text-white" style={{ fontSize: "0.65rem" }}>PAID</span>;
      case "REFUNDED":
        return <span className="badge bg-secondary text-white" style={{ fontSize: "0.65rem" }}>REFUNDED</span>;
      default:
        return <span className="badge bg-warning text-dark" style={{ fontSize: "0.65rem" }}>UNPAID</span>;
    }
  };

  return (
    <div className="card shadow-sm border-0 h-100 bg-body">
      <div className="card-header bg-body border-bottom py-3 px-3 px-md-4 d-flex align-items-center justify-content-between">
        <div>
          <h5 className="card-title mb-0 fw-semibold text-body" style={{ fontSize: "0.95rem" }}>
            Recent Customer Orders
          </h5>
          <small className="text-secondary" style={{ fontSize: "0.75rem" }}>
            Live transactions and fulfillment pipeline
          </small>
        </div>
        <Link
          href="/orders"
          className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
          style={{ fontSize: "0.75rem" }}
        >
          <span>View all orders</span>
          <i className="bi bi-arrow-right"></i>
        </Link>
      </div>

      <div className="card-body p-0">
        {isLoading ? (
          <div className="d-flex align-items-center justify-content-center py-5">
            <div className="spinner-border text-primary spinner-border-sm me-2" role="status"></div>
            <span className="text-secondary small">Loading orders...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-5 text-secondary">
            <i className="bi bi-inbox fs-3 mb-2 d-block"></i>
            <p className="mb-0 small">No orders recorded in this period</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.825rem" }}>
              <thead className="table-light border-bottom">
                <tr>
                  <th scope="col" className="ps-3 ps-md-4 py-2-5">Order</th>
                  <th scope="col" className="py-2-5">Customer</th>
                  <th scope="col" className="py-2-5">Payment</th>
                  <th scope="col" className="py-2-5 text-end">Amount</th>
                  <th scope="col" className="py-2-5 text-center">Status</th>
                  <th scope="col" className="pe-3 pe-md-4 py-2-5 text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    {/* Order ID & Time */}
                    <td className="ps-3 ps-md-4">
                      <Link href={`/orders/${order.id}`} className="fw-semibold text-primary text-decoration-none">
                        {order.orderNumber}
                      </Link>
                      <div className="text-secondary small" style={{ fontSize: "0.7rem" }}>
                        {order.createdAt}
                      </div>
                    </td>

                    {/* Customer */}
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div
                          className="bg-primary-subtle text-primary fw-bold rounded-circle d-flex align-items-center justify-content-center"
                          style={{ width: "28px", height: "28px", fontSize: "0.7rem", flexShrink: 0 }}
                        >
                          {order.customerName.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-truncate" style={{ maxWidth: "160px" }}>
                          <div className="fw-medium text-body text-truncate">{order.customerName}</div>
                          <div className="text-secondary small text-truncate" style={{ fontSize: "0.7rem" }}>
                            {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Payment */}
                    <td>
                      <div className="d-flex align-items-center gap-1">
                        {getPaymentBadge(order.paymentStatus)}
                        <small className="text-secondary" style={{ fontSize: "0.72rem" }}>
                          {order.paymentMethod}
                        </small>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="text-end tabular-nums fw-semibold text-body">
                      {currency} {order.totalAmount.toLocaleString()}
                    </td>

                    {/* Status */}
                    <td className="text-center">{getStatusBadge(order.orderStatus)}</td>

                    {/* Action */}
                    <td className="pe-3 pe-md-4 text-end">
                      <Link
                        href={`/orders/${order.id}`}
                        className="btn btn-sm btn-light border py-1 px-2"
                        title="View Order Details"
                        style={{ fontSize: "0.75rem" }}
                      >
                        <i className="bi bi-eye"></i>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
