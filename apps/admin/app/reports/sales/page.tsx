"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  reportsService,
  SalesSummary,
  SalesTimelinePoint,
  PaymentMethodBreakdown,
  OrderStatusBreakdown,
  TopSellingProduct,
  CategorySalesBreakdown,
  SalesOrderRecord,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
} from "../../../services/reports";

type DatePreset =
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "thisMonth"
  | "lastMonth"
  | "thisYear"
  | "all";

export default function SalesReportPage() {
  // Preset & custom dates state
  const [preset, setPreset] = useState<DatePreset>("last30");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Filters state
  const [orderStatus, setOrderStatus] = useState<OrderStatus | "">("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | "">("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [interval, setInterval] = useState<"day" | "week" | "month">("day");

  // Chart Metric state
  const [chartMetric, setChartMetric] = useState<"grossSales" | "netSales" | "orderCount">("grossSales");
  const [hoveredPoint, setHoveredPoint] = useState<SalesTimelinePoint | null>(null);

  // Active Tab state
  const [activeTab, setActiveTab] = useState<"products" | "categories" | "orders">("products");

  // Order list search & pagination
  const [orderSearch, setOrderSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [orderPage, setOrderPage] = useState<number>(1);
  const [orderLimit] = useState<number>(10);

  // Data states
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [timeline, setTimeline] = useState<SalesTimelinePoint[]>([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentMethodBreakdown[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<OrderStatusBreakdown[]>([]);
  const [topProducts, setTopProducts] = useState<TopSellingProduct[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategorySalesBreakdown[]>([]);
  const [orders, setOrders] = useState<SalesOrderRecord[]>([]);
  const [ordersTotal, setOrdersTotal] = useState<number>(0);
  const [ordersTotalPages, setOrdersTotalPages] = useState<number>(1);

  // Loading & Alert states
  const [loading, setLoading] = useState<boolean>(true);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  const [alert, setAlert] = useState<{ type: "success" | "danger" | "info"; text: string } | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(orderSearch);
      setOrderPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [orderSearch]);

  // Compute dates based on preset
  const applyPreset = useCallback((p: DatePreset) => {
    setPreset(p);
    const now = new Date();
    const toIsoDateString = (d: Date) => d.toISOString().slice(0, 10);

    let start = "";
    let end = toIsoDateString(now);

    switch (p) {
      case "today": {
        start = toIsoDateString(now);
        break;
      }
      case "yesterday": {
        const y = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        start = toIsoDateString(y);
        end = toIsoDateString(y);
        break;
      }
      case "last7": {
        const d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        start = toIsoDateString(d);
        break;
      }
      case "last30": {
        const d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        start = toIsoDateString(d);
        break;
      }
      case "thisMonth": {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        start = toIsoDateString(firstDay);
        break;
      }
      case "lastMonth": {
        const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
        start = toIsoDateString(firstDay);
        end = toIsoDateString(lastDay);
        break;
      }
      case "thisYear": {
        const firstDay = new Date(now.getFullYear(), 0, 1);
        start = toIsoDateString(firstDay);
        break;
      }
      case "all": {
        start = "";
        end = "";
        break;
      }
    }

    setStartDate(start);
    setEndDate(end);
    setOrderPage(1);
  }, []);

  // Initialize with last 30 days
  useEffect(() => {
    applyPreset("last30");
  }, [applyPreset]);

  // Query parameters builder
  const buildParams = useCallback(() => {
    const params: Record<string, any> = {};
    if (startDate) params.startDate = new Date(startDate + "T00:00:00.000Z").toISOString();
    if (endDate) params.endDate = new Date(endDate + "T23:59:59.999Z").toISOString();
    if (orderStatus) params.orderStatus = orderStatus;
    if (paymentStatus) params.paymentStatus = paymentStatus;
    if (paymentMethod) params.paymentMethod = paymentMethod;
    if (interval) params.interval = interval;
    return params;
  }, [startDate, endDate, orderStatus, paymentStatus, paymentMethod, interval]);

  // Fetch overview metrics & analytics
  const fetchReportData = useCallback(async () => {
    setLoading(true);
    setAlert(null);
    try {
      const params = buildParams();
      const [sum, time, pay, stat, prod, cat] = await Promise.all([
        reportsService.getSalesSummary(params),
        reportsService.getSalesTimeline(params),
        reportsService.getSalesByPaymentMethod(params),
        reportsService.getSalesByOrderStatus(params),
        reportsService.getTopSellingProducts(params, 10),
        reportsService.getSalesByCategory(params),
      ]);

      setSummary(sum);
      setTimeline(time.timeline || []);
      setPaymentBreakdown(pay || []);
      setStatusBreakdown(stat || []);
      setTopProducts(prod || []);
      setCategoryBreakdown(cat || []);
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to load sales report data",
      });
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  // Fetch paginated order transactions for Table Tab
  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const params = {
        ...buildParams(),
        page: orderPage,
        limit: orderLimit,
        search: debouncedSearch || undefined,
      };
      const res = await reportsService.getSalesOrders(params);
      setOrders(res.items || []);
      setOrdersTotal(res.total || 0);
      setOrdersTotalPages(res.totalPages || 1);
    } catch (err: unknown) {
      console.error("Failed to load orders for report tab:", err);
    } finally {
      setOrdersLoading(false);
    }
  }, [buildParams, orderPage, orderLimit, debouncedSearch]);

  useEffect(() => {
    if (startDate !== undefined) {
      fetchReportData();
    }
  }, [fetchReportData, startDate]);

  useEffect(() => {
    if (startDate !== undefined) {
      fetchOrders();
    }
  }, [fetchOrders, startDate]);

  // Format currency helper
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || isNaN(amount)) return "৳ 0.00";
    return `৳ ${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // CSV Export Handler
  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const params = buildParams();
      const blob = await reportsService.downloadSalesCsv(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sales-report-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setAlert({
        type: "success",
        text: "Sales report CSV exported successfully.",
      });
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to export sales report",
      });
    } finally {
      setExporting(false);
    }
  };

  // Clear all filters
  const resetFilters = () => {
    setOrderStatus("");
    setPaymentStatus("");
    setPaymentMethod("");
    setInterval("day");
    setOrderSearch("");
    applyPreset("last30");
  };

  // Timeline chart calculation helpers
  const maxChartValue = useMemo(() => {
    if (!timeline || timeline.length === 0) return 100;
    const values = timeline.map((p) => p[chartMetric] || 0);
    const max = Math.max(...values, 0);
    return max === 0 ? 100 : max * 1.15; // 15% headroom
  }, [timeline, chartMetric]);

  const getOrderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "PENDING":
        return <span className="badge bg-warning text-dark">Pending</span>;
      case "CONFIRMED":
        return <span className="badge bg-info text-dark">Confirmed</span>;
      case "PROCESSING":
        return <span className="badge bg-primary">Processing</span>;
      case "SHIPPED":
        return <span className="badge bg-secondary">Shipped</span>;
      case "DELIVERED":
        return <span className="badge bg-success">Delivered</span>;
      case "CANCELLED":
        return <span className="badge bg-danger">Cancelled</span>;
      case "RETURNED":
        return <span className="badge bg-dark">Returned</span>;
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
      case "REFUNDED":
        return <span className="badge bg-danger">Refunded</span>;
      case "FAILED":
        return <span className="badge bg-secondary">Failed</span>;
      default:
        return <span className="badge bg-light text-dark">{status}</span>;
    }
  };

  const formatPaymentMethodName = (method: PaymentMethod | string | null) => {
    if (!method) return "Unknown";
    switch (method) {
      case "CASH_ON_DELIVERY":
        return "Cash on Delivery";
      case "MOBILE_BANKING":
        return "Mobile Banking (bKash/Nagad)";
      case "CREDIT_CARD":
        return "Card / Gateway";
      default:
        return method;
    }
  };

  return (
    <div className="d-flex flex-column gap-4 pb-5">
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h4 className="fw-bold mb-0 text-dark">Sales Reports & Financial Analytics</h4>
            <span className="badge bg-success-subtle text-success border border-success-subtle" style={{ fontSize: "0.72rem" }}>
              Live Data
            </span>
          </div>
          <p className="text-secondary small mb-0">
            Real-time revenue performance, timeline sales trends, payment distribution, and granular transaction ledgers.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 shadow-sm"
            onClick={() => {
              fetchReportData();
              fetchOrders();
            }}
            disabled={loading}
          >
            <i className={`bi bi-arrow-clockwise ${loading ? "spin" : ""}`}></i>
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1 shadow-sm"
            onClick={() => window.print()}
          >
            <i className="bi bi-printer"></i>
            <span>Print Report</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm"
            onClick={handleExportCsv}
            disabled={exporting}
          >
            <i className={`bi ${exporting ? "bi-hourglass-split" : "bi-download"}`}></i>
            <span>{exporting ? "Exporting..." : "Export CSV"}</span>
          </button>
        </div>
      </div>

      {/* Alert Notice */}
      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show shadow-sm mb-0`} role="alert">
          <div className="d-flex align-items-center gap-2">
            <i className={`bi ${alert.type === "success" ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill"}`}></i>
            <span>{alert.text}</span>
          </div>
          <button type="button" className="btn-close" onClick={() => setAlert(null)} aria-label="Close"></button>
        </div>
      )}

      {/* Filter & Date Selection Bar */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-3">
          {/* Preset Buttons Row */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 border-bottom pb-3 mb-3">
            <div className="d-flex flex-wrap align-items-center gap-1">
              <span className="text-secondary small fw-semibold me-2">Date Presets:</span>
              {[
                { key: "today", label: "Today" },
                { key: "yesterday", label: "Yesterday" },
                { key: "last7", label: "Last 7 Days" },
                { key: "last30", label: "Last 30 Days" },
                { key: "thisMonth", label: "This Month" },
                { key: "lastMonth", label: "Last Month" },
                { key: "thisYear", label: "This Year" },
                { key: "all", label: "All Time" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => applyPreset(item.key as DatePreset)}
                  className={`btn btn-sm ${
                    preset === item.key ? "btn-primary text-white" : "btn-light text-secondary border-0"
                  }`}
                  style={{ fontSize: "0.78rem", padding: "4px 10px" }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {(orderStatus || paymentStatus || paymentMethod || preset !== "last30") && (
              <button
                type="button"
                onClick={resetFilters}
                className="btn btn-link btn-sm text-decoration-none text-danger p-0"
                style={{ fontSize: "0.75rem" }}
              >
                <i className="bi bi-x-circle me-1"></i>
                Reset all filters
              </button>
            )}
          </div>

          {/* Granular Filter Dropdowns Row */}
          <div className="row g-2 align-items-center">
            {/* Custom Date Range */}
            <div className="col-12 col-md-3">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-body-tertiary text-secondary" style={{ fontSize: "0.75rem" }}>
                  From
                </span>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPreset("all");
                  }}
                />
              </div>
            </div>

            <div className="col-12 col-md-3">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-body-tertiary text-secondary" style={{ fontSize: "0.75rem" }}>
                  To
                </span>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPreset("all");
                  }}
                />
              </div>
            </div>

            {/* Order Status */}
            <div className="col-6 col-md-2">
              <select
                className="form-select form-select-sm"
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value as OrderStatus | "")}
              >
                <option value="">Order: All Statuses</option>
                <option value="DELIVERED">Delivered</option>
                <option value="PROCESSING">Processing</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PENDING">Pending</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="RETURNED">Returned</option>
              </select>
            </div>

            {/* Payment Status */}
            <div className="col-6 col-md-2">
              <select
                className="form-select form-select-sm"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus | "")}
              >
                <option value="">Payment: All</option>
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending</option>
                <option value="REFUNDED">Refunded</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>

            {/* Payment Method */}
            <div className="col-12 col-md-2">
              <select
                className="form-select form-select-sm"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod | "")}
              >
                <option value="">Method: All</option>
                <option value="CASH_ON_DELIVERY">Cash on Delivery</option>
                <option value="MOBILE_BANKING">Mobile Banking</option>
                <option value="CREDIT_CARD">Card / Gateway</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards (AdminLTE Modern Card Pattern) */}
      <div className="row g-3">
        {/* Gross Sales */}
        <div className="col-12 col-sm-6 col-xl-2">
          <div className="card shadow-sm border-0 border-start border-primary border-4 h-100">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-secondary text-uppercase fw-semibold" style={{ fontSize: "0.68rem", letterSpacing: "0.04em" }}>
                    Gross Sales
                  </div>
                  <h4 className="fw-bold mb-0 text-dark mt-1">
                    {loading ? <span className="placeholder col-6"></span> : formatCurrency(summary?.grossSales)}
                  </h4>
                  <small className="text-muted d-block mt-1" style={{ fontSize: "0.72rem" }}>
                    <i className="bi bi-cart3 me-1"></i>
                    {summary?.totalOrders ?? 0} Total Orders
                  </small>
                </div>
                <div
                  className="bg-primary-subtle text-primary rounded-3 d-flex align-items-center justify-content-center"
                  style={{ width: "38px", height: "38px" }}
                >
                  <i className="bi bi-cash-stack fs-5"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Net Revenue */}
        <div className="col-12 col-sm-6 col-xl-2">
          <div className="card shadow-sm border-0 border-start border-success border-4 h-100">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-secondary text-uppercase fw-semibold" style={{ fontSize: "0.68rem", letterSpacing: "0.04em" }}>
                    Net Revenue
                  </div>
                  <h4 className="fw-bold mb-0 text-dark mt-1">
                    {loading ? <span className="placeholder col-6"></span> : formatCurrency(summary?.netSales)}
                  </h4>
                  <small className="text-success d-block mt-1" style={{ fontSize: "0.72rem" }}>
                    <i className="bi bi-shield-check me-1"></i>
                    After refunds deducted
                  </small>
                </div>
                <div
                  className="bg-success-subtle text-success rounded-3 d-flex align-items-center justify-content-center"
                  style={{ width: "38px", height: "38px" }}
                >
                  <i className="bi bi-wallet2 fs-5"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="col-12 col-sm-6 col-xl-2">
          <div className="card shadow-sm border-0 border-start border-info border-4 h-100">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-secondary text-uppercase fw-semibold" style={{ fontSize: "0.68rem", letterSpacing: "0.04em" }}>
                    Average Order (AOV)
                  </div>
                  <h4 className="fw-bold mb-0 text-dark mt-1">
                    {loading ? <span className="placeholder col-6"></span> : formatCurrency(summary?.averageOrderValue)}
                  </h4>
                  <small className="text-muted d-block mt-1" style={{ fontSize: "0.72rem" }}>
                    <i className="bi bi-receipt me-1"></i>
                    Gross / Orders
                  </small>
                </div>
                <div
                  className="bg-info-subtle text-info rounded-3 d-flex align-items-center justify-content-center"
                  style={{ width: "38px", height: "38px" }}
                >
                  <i className="bi bi-calculator fs-5"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Units Sold */}
        <div className="col-12 col-sm-6 col-xl-2">
          <div className="card shadow-sm border-0 border-start border-warning border-4 h-100">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-secondary text-uppercase fw-semibold" style={{ fontSize: "0.68rem", letterSpacing: "0.04em" }}>
                    Units Sold
                  </div>
                  <h4 className="fw-bold mb-0 text-dark mt-1">
                    {loading ? <span className="placeholder col-4"></span> : summary?.totalItemsSold ?? 0}
                  </h4>
                  <small className="text-muted d-block mt-1" style={{ fontSize: "0.72rem" }}>
                    <i className="bi bi-box-seam me-1"></i>
                    Physical items
                  </small>
                </div>
                <div
                  className="bg-warning-subtle text-warning rounded-3 d-flex align-items-center justify-content-center"
                  style={{ width: "38px", height: "38px" }}
                >
                  <i className="bi bi-boxes fs-5"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Discounts */}
        <div className="col-12 col-sm-6 col-xl-2">
          <div className="card shadow-sm border-0 border-start border-secondary border-4 h-100">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-secondary text-uppercase fw-semibold" style={{ fontSize: "0.68rem", letterSpacing: "0.04em" }}>
                    Total Discounts
                  </div>
                  <h4 className="fw-bold mb-0 text-dark mt-1">
                    {loading ? <span className="placeholder col-6"></span> : formatCurrency(summary?.totalDiscounts)}
                  </h4>
                  <small className="text-muted d-block mt-1" style={{ fontSize: "0.72rem" }}>
                    <i className="bi bi-ticket-perforated me-1"></i>
                    Coupons & Promos
                  </small>
                </div>
                <div
                  className="bg-secondary-subtle text-secondary rounded-3 d-flex align-items-center justify-content-center"
                  style={{ width: "38px", height: "38px" }}
                >
                  <i className="bi bi-tag fs-5"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Total Refunds */}
        <div className="col-12 col-sm-6 col-xl-2">
          <div className="card shadow-sm border-0 border-start border-danger border-4 h-100">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-secondary text-uppercase fw-semibold" style={{ fontSize: "0.68rem", letterSpacing: "0.04em" }}>
                    Refunds Issued
                  </div>
                  <h4 className="fw-bold mb-0 text-danger mt-1">
                    {loading ? <span className="placeholder col-6"></span> : formatCurrency(summary?.totalRefunds)}
                  </h4>
                  <small className="text-danger d-block mt-1" style={{ fontSize: "0.72rem" }}>
                    <i className="bi bi-arrow-counterclockwise me-1"></i>
                    {summary?.cancelledOrdersCount ?? 0} cancelled / {summary?.returnedOrdersCount ?? 0} ret
                  </small>
                </div>
                <div
                  className="bg-danger-subtle text-danger rounded-3 d-flex align-items-center justify-content-center"
                  style={{ width: "38px", height: "38px" }}
                >
                  <i className="bi bi-arrow-return-left fs-5"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Sales Trend Timeline Chart */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-body border-bottom py-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div className="d-flex align-items-center gap-2">
            <h5 className="card-title mb-0 fw-semibold d-flex align-items-center gap-2" style={{ fontSize: "0.95rem" }}>
              <i className="bi bi-graph-up text-primary"></i>
              <span>Revenue & Performance Trend</span>
            </h5>
            <span className="badge bg-light text-secondary border" style={{ fontSize: "0.7rem" }}>
              {timeline.length} Intervals
            </span>
          </div>

          <div className="d-flex align-items-center gap-2">
            {/* Metric Toggle */}
            <div className="btn-group btn-group-sm shadow-none" role="group">
              <button
                type="button"
                className={`btn btn-sm ${chartMetric === "grossSales" ? "btn-primary text-white" : "btn-light text-secondary"}`}
                onClick={() => setChartMetric("grossSales")}
              >
                Gross Sales
              </button>
              <button
                type="button"
                className={`btn btn-sm ${chartMetric === "netSales" ? "btn-primary text-white" : "btn-light text-secondary"}`}
                onClick={() => setChartMetric("netSales")}
              >
                Net Revenue
              </button>
              <button
                type="button"
                className={`btn btn-sm ${chartMetric === "orderCount" ? "btn-primary text-white" : "btn-light text-secondary"}`}
                onClick={() => setChartMetric("orderCount")}
              >
                Orders
              </button>
            </div>

            {/* Interval Selector */}
            <select
              className="form-select form-select-sm"
              style={{ width: "auto" }}
              value={interval}
              onChange={(e) => setInterval(e.target.value as "day" | "week" | "month")}
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </select>
          </div>
        </div>

        <div className="card-body p-4">
          {loading ? (
            <div className="d-flex flex-column align-items-center justify-content-center py-5 text-secondary">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading chart...</span>
              </div>
              <small>Calculating timeline revenue aggregations...</small>
            </div>
          ) : timeline.length === 0 ? (
            <div className="text-center py-5 text-secondary">
              <i className="bi bi-bar-chart-steps fs-1 text-muted mb-2 d-block"></i>
              <h6 className="fw-semibold text-dark">No sales data in this date range</h6>
              <p className="small text-muted mb-3">Adjust your date range or filters to view revenue trends.</p>
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={resetFilters}>
                Reset Filters
              </button>
            </div>
          ) : (
            <div>
              {/* Hover Details Banner */}
              <div
                className="p-2 px-3 rounded-2 bg-body-tertiary mb-3 d-flex flex-wrap align-items-center justify-content-between gap-2 border"
                style={{ fontSize: "0.8rem", minHeight: "38px" }}
              >
                {hoveredPoint ? (
                  <>
                    <span className="fw-bold text-dark">
                      <i className="bi bi-calendar-check me-1 text-primary"></i>
                      {hoveredPoint.label}
                    </span>
                    <div className="d-flex flex-wrap align-items-center gap-3">
                      <span>
                        Gross: <strong className="text-primary">{formatCurrency(hoveredPoint.grossSales)}</strong>
                      </span>
                      <span>
                        Net: <strong className="text-success">{formatCurrency(hoveredPoint.netSales)}</strong>
                      </span>
                      <span>
                        Orders: <strong>{hoveredPoint.orderCount}</strong> (Paid: {hoveredPoint.paidOrderCount})
                      </span>
                      {hoveredPoint.refunds > 0 && (
                        <span>
                          Refunds: <strong className="text-danger">{formatCurrency(hoveredPoint.refunds)}</strong>
                        </span>
                      )}
                      <span>
                        Items Sold: <strong>{hoveredPoint.itemsSold}</strong>
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="text-muted">
                    <i className="bi bi-info-circle me-1"></i>
                    Hover over any bar to inspect date-specific revenue, order counts, and refund details.
                  </span>
                )}
              </div>

              {/* Native Responsive SVG Chart */}
              <div className="position-relative" style={{ height: "240px", width: "100%" }}>
                <svg
                  className="w-100 h-100"
                  viewBox={`0 0 ${timeline.length * 40 + 40} 220`}
                  preserveAspectRatio="none"
                  style={{ overflow: "visible" }}
                >
                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                    const y = 190 - ratio * 160;
                    return (
                      <g key={i}>
                        <line x1="20" y1={y} x2={timeline.length * 40 + 20} y2={y} stroke="#e9ecef" strokeDasharray="3 3" />
                      </g>
                    );
                  })}

                  {/* Bars & Interactive Rects */}
                  {timeline.map((point, index) => {
                    const value = point[chartMetric] || 0;
                    const barHeight = maxChartValue > 0 ? (value / maxChartValue) * 160 : 0;
                    const x = 30 + index * 40;
                    const y = 190 - barHeight;
                    const isHovered = hoveredPoint?.date === point.date;

                    return (
                      <g
                        key={point.date}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPoint(point)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      >
                        {/* Background Hit Target */}
                        <rect x={x - 14} y={15} width="36" height="190" fill="transparent" />

                        {/* Bar */}
                        <rect
                          x={x - 10}
                          y={y}
                          width="24"
                          height={Math.max(barHeight, 3)}
                          rx="4"
                          fill={
                            isHovered
                              ? "#0d6efd"
                              : chartMetric === "netSales"
                              ? "#198754"
                              : chartMetric === "orderCount"
                              ? "#6f42c1"
                              : "#3b82f6"
                          }
                          opacity={isHovered ? 1 : 0.85}
                          style={{ transition: "all 0.15s ease" }}
                        />

                        {/* Small Date Label */}
                        <text
                          x={x + 2}
                          y="208"
                          textAnchor="middle"
                          fill="#6c757d"
                          fontSize="9.5"
                          fontWeight={isHovered ? "bold" : "normal"}
                        >
                          {point.date.slice(5)}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Breakdown Cards Section (2 Columns) */}
      <div className="row g-4">
        {/* Payment Methods Breakdown */}
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-body border-bottom py-3 d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0 fw-semibold d-flex align-items-center gap-2" style={{ fontSize: "0.95rem" }}>
                <i className="bi bi-credit-card text-primary"></i>
                <span>Sales by Payment Method</span>
              </h5>
              <span className="badge bg-light text-secondary border" style={{ fontSize: "0.7rem" }}>
                {paymentBreakdown.length} Channels
              </span>
            </div>
            <div className="card-body p-3">
              {loading ? (
                <div className="p-3 text-center text-muted small">Loading channel breakdowns...</div>
              ) : paymentBreakdown.length === 0 ? (
                <div className="p-3 text-center text-muted small">No payment data recorded in this period.</div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {paymentBreakdown.map((item) => (
                    <div key={item.method} className="p-2 rounded-2 bg-body-tertiary border">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="fw-semibold text-dark small">
                          <i
                            className={`bi me-2 ${
                              item.method === "CASH_ON_DELIVERY"
                                ? "bi-cash text-success"
                                : item.method === "MOBILE_BANKING"
                                ? "bi-phone text-warning"
                                : "bi-credit-card text-primary"
                            }`}
                          ></i>
                          {formatPaymentMethodName(item.method)}
                        </span>
                        <div className="text-end">
                          <span className="fw-bold text-dark small">{formatCurrency(item.totalAmount)}</span>
                          <span className="text-muted ms-2" style={{ fontSize: "0.72rem" }}>
                            ({item.orderCount} orders)
                          </span>
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <div className="progress flex-grow-1" style={{ height: "6px" }}>
                          <div
                            className={`progress-bar ${
                              item.method === "CASH_ON_DELIVERY"
                                ? "bg-success"
                                : item.method === "MOBILE_BANKING"
                                ? "bg-warning"
                                : "bg-primary"
                            }`}
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                        <span className="fw-semibold text-secondary" style={{ fontSize: "0.72rem", width: "42px", textAlign: "right" }}>
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-body border-bottom py-3 d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0 fw-semibold d-flex align-items-center gap-2" style={{ fontSize: "0.95rem" }}>
                <i className="bi bi-pie-chart text-primary"></i>
                <span>Sales by Order Status</span>
              </h5>
              <span className="badge bg-light text-secondary border" style={{ fontSize: "0.7rem" }}>
                {statusBreakdown.length} Statuses
              </span>
            </div>
            <div className="card-body p-3">
              {loading ? (
                <div className="p-3 text-center text-muted small">Loading status distribution...</div>
              ) : statusBreakdown.length === 0 ? (
                <div className="p-3 text-center text-muted small">No status distribution records.</div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {statusBreakdown.map((item) => (
                    <div key={item.status} className="p-2 rounded-2 bg-body-tertiary border">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <div className="d-flex align-items-center gap-2">
                          {getOrderStatusBadge(item.status)}
                          <span className="text-muted small">({item.orderCount} orders)</span>
                        </div>
                        <span className="fw-bold text-dark small">{formatCurrency(item.totalAmount)}</span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <div className="progress flex-grow-1" style={{ height: "6px" }}>
                          <div
                            className={`progress-bar ${
                              item.status === "DELIVERED"
                                ? "bg-success"
                                : item.status === "CONFIRMED" || item.status === "PROCESSING"
                                ? "bg-primary"
                                : item.status === "PENDING"
                                ? "bg-warning"
                                : "bg-danger"
                            }`}
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                        <span className="fw-semibold text-secondary" style={{ fontSize: "0.72rem", width: "42px", textAlign: "right" }}>
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabbed Drill-Down Reports */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-body border-bottom pt-3 pb-0">
          <ul className="nav nav-tabs card-header-tabs" role="tablist">
            <li className="nav-item">
              <button
                className={`nav-link pb-3 fw-semibold ${activeTab === "products" ? "active text-primary border-bottom border-primary border-3" : "text-secondary"}`}
                onClick={() => setActiveTab("products")}
              >
                <i className="bi bi-trophy me-2"></i>
                Best-Selling Products ({topProducts.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link pb-3 fw-semibold ${activeTab === "categories" ? "active text-primary border-bottom border-primary border-3" : "text-secondary"}`}
                onClick={() => setActiveTab("categories")}
              >
                <i className="bi bi-tags me-2"></i>
                Category Performance ({categoryBreakdown.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link pb-3 fw-semibold ${activeTab === "orders" ? "active text-primary border-bottom border-primary border-3" : "text-secondary"}`}
                onClick={() => setActiveTab("orders")}
              >
                <i className="bi bi-receipt-cutoff me-2"></i>
                Sales Orders Ledger ({ordersTotal})
              </button>
            </li>
          </ul>
        </div>

        <div className="card-body p-0">
          {/* TAB 1: Best-Selling Products */}
          {activeTab === "products" && (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.85rem" }}>
                <thead className="table-light text-secondary text-uppercase" style={{ fontSize: "0.72rem" }}>
                  <tr>
                    <th style={{ width: "48px" }} className="text-center">#</th>
                    <th>Product & SKU</th>
                    <th>Category</th>
                    <th className="text-center">Units Sold</th>
                    <th className="text-end">Realized Price</th>
                    <th className="text-end">Total Revenue</th>
                    <th style={{ width: "140px" }}>Revenue Share</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-muted">
                        Loading top products...
                      </td>
                    </tr>
                  ) : topProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-muted">
                        No product sales recorded in this period.
                      </td>
                    </tr>
                  ) : (
                    topProducts.map((item, idx) => {
                      const totalGross = summary?.grossSales || 1;
                      const share = Math.round((item.totalRevenue / totalGross) * 1000) / 10;
                      return (
                        <tr key={item.sku || idx}>
                          <td className="text-center fw-bold text-secondary">{idx + 1}</td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              {item.thumbnailUrl ? (
                                <img
                                  src={item.thumbnailUrl}
                                  alt={item.productTitle}
                                  className="rounded border"
                                  style={{ width: "32px", height: "32px", objectFit: "cover" }}
                                />
                              ) : (
                                <div
                                  className="bg-light rounded border d-flex align-items-center justify-content-center text-muted"
                                  style={{ width: "32px", height: "32px" }}
                                >
                                  <i className="bi bi-box"></i>
                                </div>
                              )}
                              <div>
                                <span className="fw-semibold text-dark d-block">{item.productTitle}</span>
                                <small className="text-muted font-monospace" style={{ fontSize: "0.72rem" }}>
                                  {item.sku}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border">{item.categoryName}</span>
                          </td>
                          <td className="text-center">
                            <span className="badge bg-primary-subtle text-primary fw-bold" style={{ fontSize: "0.8rem" }}>
                              {item.quantitySold}
                            </span>
                          </td>
                          <td className="text-end">{formatCurrency(item.averagePrice)}</td>
                          <td className="text-end fw-bold text-dark">{formatCurrency(item.totalRevenue)}</td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div className="progress flex-grow-1" style={{ height: "6px" }}>
                                <div className="progress-bar bg-primary" style={{ width: `${Math.min(share, 100)}%` }}></div>
                              </div>
                              <small className="text-muted" style={{ fontSize: "0.72rem" }}>
                                {share}%
                              </small>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: Category Breakdown */}
          {activeTab === "categories" && (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.85rem" }}>
                <thead className="table-light text-secondary text-uppercase" style={{ fontSize: "0.72rem" }}>
                  <tr>
                    <th style={{ width: "48px" }} className="text-center">#</th>
                    <th>Category Name</th>
                    <th className="text-center">Orders Count</th>
                    <th className="text-center">Units Sold</th>
                    <th className="text-end">Total Revenue</th>
                    <th style={{ width: "160px" }}>Contribution Share</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-muted">
                        Loading category performance...
                      </td>
                    </tr>
                  ) : categoryBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-muted">
                        No category sales data for selected dates.
                      </td>
                    </tr>
                  ) : (
                    categoryBreakdown.map((cat, idx) => (
                      <tr key={cat.categoryId}>
                        <td className="text-center fw-bold text-secondary">{idx + 1}</td>
                        <td>
                          <span className="fw-semibold text-dark">{cat.categoryName}</span>
                        </td>
                        <td className="text-center">{cat.orderCount}</td>
                        <td className="text-center">
                          <span className="badge bg-info-subtle text-info fw-bold">{cat.quantitySold}</span>
                        </td>
                        <td className="text-end fw-bold text-dark">{formatCurrency(cat.totalRevenue)}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="progress flex-grow-1" style={{ height: "6px" }}>
                              <div className="progress-bar bg-success" style={{ width: `${cat.percentage}%` }}></div>
                            </div>
                            <small className="text-muted" style={{ fontSize: "0.72rem" }}>
                              {cat.percentage}%
                            </small>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: Sales Orders Ledger */}
          {activeTab === "orders" && (
            <div>
              {/* Order Search Bar */}
              <div className="p-3 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div className="input-group input-group-sm" style={{ maxWidth: "340px" }}>
                  <span className="input-group-text bg-body-tertiary">
                    <i className="bi bi-search text-secondary"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by Order # or Customer..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                  />
                  {orderSearch && (
                    <button className="btn btn-outline-secondary" type="button" onClick={() => setOrderSearch("")}>
                      <i className="bi bi-x"></i>
                    </button>
                  )}
                </div>

                <small className="text-muted">
                  Showing {(orderPage - 1) * orderLimit + (orders.length > 0 ? 1 : 0)} -{" "}
                  {Math.min(orderPage * orderLimit, ordersTotal)} of {ordersTotal} orders
                </small>
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.85rem" }}>
                  <thead className="table-light text-secondary text-uppercase" style={{ fontSize: "0.72rem" }}>
                    <tr>
                      <th>Order #</th>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Status</th>
                      <th>Payment</th>
                      <th className="text-end">Subtotal</th>
                      <th className="text-end">Discount</th>
                      <th className="text-end">Shipping</th>
                      <th className="text-end">Grand Total</th>
                      <th className="text-end">Refunded</th>
                      <th className="text-end">Net Revenue</th>
                      <th className="text-center" style={{ width: "60px" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersLoading ? (
                      <tr>
                        <td colSpan={12} className="text-center py-4 text-muted">
                          Loading orders ledger...
                        </td>
                      </tr>
                    ) : orders.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="text-center py-4 text-muted">
                          No orders match the current filter criteria.
                        </td>
                      </tr>
                    ) : (
                      orders.map((ord) => (
                        <tr key={ord.id}>
                          <td>
                            <Link href={`/orders/${ord.id}`} className="fw-semibold text-primary text-decoration-none">
                              {ord.orderNumber}
                            </Link>
                          </td>
                          <td className="text-muted" style={{ fontSize: "0.78rem" }}>
                            {new Date(ord.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </td>
                          <td>
                            <span className="fw-medium text-dark d-block">{ord.customerName}</span>
                            <small className="text-muted" style={{ fontSize: "0.72rem" }}>
                              {ord.recipientPhone}
                            </small>
                          </td>
                          <td>{getOrderStatusBadge(ord.orderStatus)}</td>
                          <td>
                            <div className="d-flex flex-column align-items-start gap-1">
                              {getPaymentStatusBadge(ord.paymentStatus)}
                              <small className="text-muted" style={{ fontSize: "0.7rem" }}>
                                {formatPaymentMethodName(ord.paymentMethod)}
                              </small>
                            </div>
                          </td>
                          <td className="text-end">{formatCurrency(ord.subtotal)}</td>
                          <td className="text-end text-secondary">
                            {ord.discountAmount > 0 ? `-${formatCurrency(ord.discountAmount)}` : "—"}
                          </td>
                          <td className="text-end text-secondary">
                            {ord.shippingFee > 0 ? formatCurrency(ord.shippingFee) : "—"}
                          </td>
                          <td className="text-end fw-bold text-dark">{formatCurrency(ord.grandTotal)}</td>
                          <td className="text-end text-danger">
                            {ord.refundAmount > 0 ? `-${formatCurrency(ord.refundAmount)}` : "—"}
                          </td>
                          <td className="text-end fw-bold text-success">{formatCurrency(ord.netAmount)}</td>
                          <td className="text-center">
                            <Link href={`/orders/${ord.id}`} className="btn btn-sm btn-light border p-1 px-2" title="View details">
                              <i className="bi bi-arrow-right"></i>
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {ordersTotalPages > 1 && (
                <div className="p-3 border-top d-flex justify-content-between align-items-center">
                  <small className="text-muted">
                    Page {orderPage} of {ordersTotalPages}
                  </small>
                  <nav aria-label="Order pagination">
                    <ul className="pagination pagination-sm mb-0">
                      <li className={`page-item ${orderPage <= 1 ? "disabled" : ""}`}>
                        <button className="page-link" onClick={() => setOrderPage((p) => Math.max(1, p - 1))}>
                          Previous
                        </button>
                      </li>
                      {Array.from({ length: Math.min(5, ordersTotalPages) }).map((_, i) => {
                        const pageNum = i + 1;
                        return (
                          <li key={pageNum} className={`page-item ${orderPage === pageNum ? "active" : ""}`}>
                            <button className="page-link" onClick={() => setOrderPage(pageNum)}>
                              {pageNum}
                            </button>
                          </li>
                        );
                      })}
                      <li className={`page-item ${orderPage >= ordersTotalPages ? "disabled" : ""}`}>
                        <button className="page-link" onClick={() => setOrderPage((p) => Math.min(ordersTotalPages, p + 1))}>
                          Next
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
