"use client";

import React from "react";
import Link from "next/link";
import { DashboardKpiData } from "./types";

interface DashboardKpiCardsProps {
  data: DashboardKpiData;
  isLoading?: boolean;
}

export function DashboardKpiCards({ data, isLoading = false }: DashboardKpiCardsProps) {
  const formatCurrency = (val: number) => {
    return `${data.currency} ${val.toLocaleString("en-US")}`;
  };

  return (
    <div className="row g-3 mb-4">
      {/* 1. Gross Sales KPI Card */}
      <div className="col-12 col-sm-6 col-xl-3">
        <div className="card card-glass hover-lift border-0 border-start border-primary border-4 h-100">
          <div className="card-body p-3 d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-secondary text-uppercase fw-semibold" style={{ fontSize: "0.72rem", letterSpacing: "0.04em" }}>
                  Total Gross Sales
                </span>
                <span
                  className={`badge d-inline-flex align-items-center gap-1 ${
                    data.salesGrowth >= 0 ? "bg-success-subtle text-success" : "bg-danger-subtle text-danger"
                  }`}
                  style={{ fontSize: "0.72rem" }}
                >
                  <i className={`bi ${data.salesGrowth >= 0 ? "bi-arrow-up-right" : "bi-arrow-down-right"}`}></i>
                  <span>{Math.abs(data.salesGrowth)}%</span>
                </span>
              </div>

              <div className="d-flex align-items-baseline gap-2">
                <h3 className="fw-bold mb-0 text-body tabular-nums" style={{ fontSize: "1.45rem" }}>
                  {isLoading ? "..." : formatCurrency(data.grossSales)}
                </h3>
              </div>
            </div>

            <div className="mt-3 pt-2 border-top border-light-subtle d-flex align-items-center justify-content-between">
              <small className="text-secondary" style={{ fontSize: "0.72rem" }}>
                Net: <span className="fw-semibold text-body tabular-nums">{formatCurrency(data.netSales)}</span>
              </small>
              <Link href="/reports" className="text-primary text-decoration-none fw-medium d-flex align-items-center gap-1" style={{ fontSize: "0.72rem" }}>
                <span>Sales report</span>
                <i className="bi bi-chevron-right" style={{ fontSize: "0.65rem" }}></i>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Total Orders KPI Card */}
      <div className="col-12 col-sm-6 col-xl-3">
        <div className="card card-glass hover-lift border-0 border-start border-success border-4 h-100">
          <div className="card-body p-3 d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-secondary text-uppercase fw-semibold" style={{ fontSize: "0.72rem", letterSpacing: "0.04em" }}>
                  Total Orders
                </span>
                <span
                  className={`badge d-inline-flex align-items-center gap-1 ${
                    data.ordersGrowth >= 0 ? "bg-success-subtle text-success" : "bg-danger-subtle text-danger"
                  }`}
                  style={{ fontSize: "0.72rem" }}
                >
                  <i className={`bi ${data.ordersGrowth >= 0 ? "bi-arrow-up-right" : "bi-arrow-down-right"}`}></i>
                  <span>{Math.abs(data.ordersGrowth)}%</span>
                </span>
              </div>

              <div className="d-flex align-items-baseline gap-2">
                <h3 className="fw-bold mb-0 text-body tabular-nums" style={{ fontSize: "1.45rem" }}>
                  {isLoading ? "..." : data.totalOrders.toLocaleString("en-US")}
                </h3>
              </div>
            </div>

            <div className="mt-3 pt-2 border-top border-light-subtle d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-warning-subtle text-warning-emphasis" style={{ fontSize: "0.68rem" }}>
                  {data.pendingOrders} pending
                </span>
                <span className="badge bg-info-subtle text-info-emphasis" style={{ fontSize: "0.68rem" }}>
                  {data.processingOrders} active
                </span>
              </div>
              <Link href="/orders" className="text-success text-decoration-none fw-medium d-flex align-items-center gap-1" style={{ fontSize: "0.72rem" }}>
                <span>Orders</span>
                <i className="bi bi-chevron-right" style={{ fontSize: "0.65rem" }}></i>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Inventory Stock Alerts Card */}
      <div className="col-12 col-sm-6 col-xl-3">
        <div className="card card-glass hover-lift border-0 border-start border-warning border-4 h-100">
          <div className="card-body p-3 d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-secondary text-uppercase fw-semibold" style={{ fontSize: "0.72rem", letterSpacing: "0.04em" }}>
                  Inventory Health
                </span>
                {data.outOfStockCount > 0 ? (
                  <span className="badge bg-danger-subtle text-danger border border-danger-subtle" style={{ fontSize: "0.72rem" }}>
                    {data.outOfStockCount} Out of stock
                  </span>
                ) : (
                  <span className="badge bg-success-subtle text-success border border-success-subtle" style={{ fontSize: "0.72rem" }}>
                    Healthy
                  </span>
                )}
              </div>

              <div className="d-flex align-items-baseline gap-2">
                <h3 className="fw-bold mb-0 text-body tabular-nums" style={{ fontSize: "1.45rem" }}>
                  {isLoading ? "..." : data.totalProducts.toLocaleString("en-US")}
                </h3>
                <small className="text-secondary" style={{ fontSize: "0.75rem" }}>
                  SKUs registered
                </small>
              </div>
            </div>

            <div className="mt-3 pt-2 border-top border-light-subtle d-flex align-items-center justify-content-between">
              <small className="text-warning-emphasis fw-medium d-flex align-items-center gap-1" style={{ fontSize: "0.72rem" }}>
                <i className="bi bi-exclamation-triangle-fill text-warning"></i>
                <span>{data.lowStockCount} items low stock</span>
              </small>
              <Link href="/inventory" className="text-warning-emphasis text-decoration-none fw-medium d-flex align-items-center gap-1" style={{ fontSize: "0.72rem" }}>
                <span>Stock audit</span>
                <i className="bi bi-chevron-right" style={{ fontSize: "0.65rem" }}></i>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Customer Growth & AOV Card */}
      <div className="col-12 col-sm-6 col-xl-3">
        <div className="card card-glass hover-lift border-0 border-start border-info border-4 h-100">
          <div className="card-body p-3 d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-secondary text-uppercase fw-semibold" style={{ fontSize: "0.72rem", letterSpacing: "0.04em" }}>
                  Avg Order Value (AOV)
                </span>
                <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle" style={{ fontSize: "0.72rem" }}>
                  +{data.newCustomers} new buyers
                </span>
              </div>

              <div className="d-flex align-items-baseline gap-2">
                <h3 className="fw-bold mb-0 text-body tabular-nums" style={{ fontSize: "1.45rem" }}>
                  {isLoading ? "..." : formatCurrency(data.averageOrderValue)}
                </h3>
              </div>
            </div>

            <div className="mt-3 pt-2 border-top border-light-subtle d-flex align-items-center justify-content-between">
              <small className="text-secondary" style={{ fontSize: "0.72rem" }}>
                Total Shoppers: <span className="fw-semibold text-body tabular-nums">{data.totalCustomers.toLocaleString("en-US")}</span>
              </small>
              <Link href="/customers" className="text-info text-decoration-none fw-medium d-flex align-items-center gap-1" style={{ fontSize: "0.72rem" }}>
                <span>Customers</span>
                <i className="bi bi-chevron-right" style={{ fontSize: "0.65rem" }}></i>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
