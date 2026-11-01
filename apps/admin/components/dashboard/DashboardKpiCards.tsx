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
    <div className="row g-3 mb-3 animate-stagger-2">
      {/* 1. Gross Sales 3D KPI Card */}
      <div className="col-12 col-sm-6 col-xl-3">
        <div className="card card-3d h-100">
          <div className="card-body p-3-5 d-flex flex-column justify-content-between" style={{ padding: "1.15rem" }}>
            <div className="d-flex align-items-start justify-content-between gap-2">
              <div>
                <span
                  className="text-secondary text-uppercase fw-bold d-block mb-1"
                  style={{ fontSize: "0.68rem", letterSpacing: "0.06em" }}
                >
                  Total Gross Sales
                </span>
                <h3 className="fw-bold mb-1 text-body tabular-nums" style={{ fontSize: "1.5rem", letterSpacing: "-0.02em" }}>
                  {isLoading ? "..." : formatCurrency(data.grossSales)}
                </h3>
                <span
                  className={`badge d-inline-flex align-items-center gap-1 ${
                    data.salesGrowth >= 0 ? "bg-success-subtle text-success" : "bg-danger-subtle text-danger"
                  }`}
                  style={{ fontSize: "0.68rem" }}
                >
                  <i className={`bi ${data.salesGrowth >= 0 ? "bi-graph-up-arrow" : "bi-graph-down-arrow"}`}></i>
                  <span>{data.salesGrowth >= 0 ? "+" : "-"}{Math.abs(data.salesGrowth)}% vs last period</span>
                </span>
              </div>

              <div
                className="icon-3d-orb text-white"
                style={{ background: "var(--az-accent-gradient)" }}
              >
                <i className="bi bi-wallet2 fs-5" aria-hidden="true"></i>
              </div>
            </div>

            <div className="mt-3 pt-2-5 border-top d-flex align-items-center justify-content-between" style={{ paddingTop: "0.65rem" }}>
              <small className="text-secondary" style={{ fontSize: "0.73rem" }}>
                Net Revenue: <span className="fw-semibold text-body tabular-nums">{formatCurrency(data.netSales)}</span>
              </small>
              <Link
                href="/reports/sales"
                className="text-primary text-decoration-none fw-semibold d-flex align-items-center gap-1"
                style={{ fontSize: "0.73rem" }}
              >
                <span>Analytics</span>
                <i className="bi bi-arrow-up-right" style={{ fontSize: "0.65rem" }}></i>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Total Orders 3D KPI Card */}
      <div className="col-12 col-sm-6 col-xl-3">
        <div className="card card-3d h-100">
          <div className="card-body p-3-5 d-flex flex-column justify-content-between" style={{ padding: "1.15rem" }}>
            <div className="d-flex align-items-start justify-content-between gap-2">
              <div>
                <span
                  className="text-secondary text-uppercase fw-bold d-block mb-1"
                  style={{ fontSize: "0.68rem", letterSpacing: "0.06em" }}
                >
                  Order Fulfillment
                </span>
                <h3 className="fw-bold mb-1 text-body tabular-nums" style={{ fontSize: "1.5rem", letterSpacing: "-0.02em" }}>
                  {isLoading ? "..." : data.totalOrders.toLocaleString("en-US")}
                </h3>
                <span
                  className={`badge d-inline-flex align-items-center gap-1 ${
                    data.ordersGrowth >= 0 ? "bg-success-subtle text-success" : "bg-danger-subtle text-danger"
                  }`}
                  style={{ fontSize: "0.68rem" }}
                >
                  <i className={`bi ${data.ordersGrowth >= 0 ? "bi-arrow-up-right" : "bi-arrow-down-right"}`}></i>
                  <span>{Math.abs(data.ordersGrowth)}% volume growth</span>
                </span>
              </div>

              <div
                className="icon-3d-orb text-white"
                style={{ background: "var(--az-emerald-gradient)" }}
              >
                <i className="bi bi-bag-check-fill fs-5" aria-hidden="true"></i>
              </div>
            </div>

            <div className="mt-3 pt-2-5 border-top d-flex align-items-center justify-content-between" style={{ paddingTop: "0.65rem" }}>
              <div className="d-flex align-items-center gap-1">
                <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle" style={{ fontSize: "0.65rem" }}>
                  {data.pendingOrders} pending
                </span>
                <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle" style={{ fontSize: "0.65rem" }}>
                  {data.processingOrders} active
                </span>
              </div>
              <Link
                href="/orders"
                className="text-success text-decoration-none fw-semibold d-flex align-items-center gap-1"
                style={{ fontSize: "0.73rem" }}
              >
                <span>Pipeline</span>
                <i className="bi bi-arrow-up-right" style={{ fontSize: "0.65rem" }}></i>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Inventory Stock Health 3D Card */}
      <div className="col-12 col-sm-6 col-xl-3">
        <div className="card card-3d h-100">
          <div className="card-body p-3-5 d-flex flex-column justify-content-between" style={{ padding: "1.15rem" }}>
            <div className="d-flex align-items-start justify-content-between gap-2">
              <div>
                <span
                  className="text-secondary text-uppercase fw-bold d-block mb-1"
                  style={{ fontSize: "0.68rem", letterSpacing: "0.06em" }}
                >
                  Inventory Health
                </span>
                <div className="d-flex align-items-baseline gap-1-5 mb-1">
                  <h3 className="fw-bold mb-0 text-body tabular-nums" style={{ fontSize: "1.5rem", letterSpacing: "-0.02em" }}>
                    {isLoading ? "..." : data.totalProducts.toLocaleString("en-US")}
                  </h3>
                  <small className="text-secondary fw-medium" style={{ fontSize: "0.73rem" }}>
                    SKUs
                  </small>
                </div>
                {data.outOfStockCount > 0 ? (
                  <span className="badge bg-danger-subtle text-danger border border-danger-subtle" style={{ fontSize: "0.68rem" }}>
                    {data.outOfStockCount} Out of Stock Alert
                  </span>
                ) : (
                  <span className="badge bg-success-subtle text-success border border-success-subtle" style={{ fontSize: "0.68rem" }}>
                    100% In-Stock Coverage
                  </span>
                )}
              </div>

              <div
                className="icon-3d-orb text-white"
                style={{ background: "var(--az-amber-gradient)" }}
              >
                <i className="bi bi-boxes fs-5" aria-hidden="true"></i>
              </div>
            </div>

            <div className="mt-3 pt-2-5 border-top d-flex align-items-center justify-content-between" style={{ paddingTop: "0.65rem" }}>
              <small className="text-warning-emphasis fw-semibold d-flex align-items-center gap-1" style={{ fontSize: "0.73rem" }}>
                <i className="bi bi-exclamation-triangle-fill text-warning"></i>
                <span>{data.lowStockCount} low-stock variants</span>
              </small>
              <Link
                href="/inventory/low-stock"
                className="text-warning-emphasis text-decoration-none fw-semibold d-flex align-items-center gap-1"
                style={{ fontSize: "0.73rem" }}
              >
                <span>Audit</span>
                <i className="bi bi-arrow-up-right" style={{ fontSize: "0.65rem" }}></i>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Customer Growth & AOV 3D Card */}
      <div className="col-12 col-sm-6 col-xl-3">
        <div className="card card-3d h-100">
          <div className="card-body p-3-5 d-flex flex-column justify-content-between" style={{ padding: "1.15rem" }}>
            <div className="d-flex align-items-start justify-content-between gap-2">
              <div>
                <span
                  className="text-secondary text-uppercase fw-bold d-block mb-1"
                  style={{ fontSize: "0.68rem", letterSpacing: "0.06em" }}
                >
                  Avg Order Value (AOV)
                </span>
                <h3 className="fw-bold mb-1 text-body tabular-nums" style={{ fontSize: "1.5rem", letterSpacing: "-0.02em" }}>
                  {isLoading ? "..." : formatCurrency(data.averageOrderValue)}
                </h3>
                <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle" style={{ fontSize: "0.68rem" }}>
                  <i className="bi bi-person-plus-fill me-1"></i>
                  +{data.newCustomers} new shoppers
                </span>
              </div>

              <div
                className="icon-3d-orb text-white"
                style={{ background: "var(--az-cyan-gradient)" }}
              >
                <i className="bi bi-people-fill fs-5" aria-hidden="true"></i>
              </div>
            </div>

            <div className="mt-3 pt-2-5 border-top d-flex align-items-center justify-content-between" style={{ paddingTop: "0.65rem" }}>
              <small className="text-secondary" style={{ fontSize: "0.73rem" }}>
                Total Accounts: <span className="fw-semibold text-body tabular-nums">{data.totalCustomers.toLocaleString("en-US")}</span>
              </small>
              <Link
                href="/customers"
                className="text-info text-decoration-none fw-semibold d-flex align-items-center gap-1"
                style={{ fontSize: "0.73rem" }}
              >
                <span>Directory</span>
                <i className="bi bi-arrow-up-right" style={{ fontSize: "0.65rem" }}></i>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
