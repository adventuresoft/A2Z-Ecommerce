"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  reportsService,
  OrdersSummary,
  OrdersTimelinePoint,
  OrderStatusMetric,
  ShipmentStatusMetric,
  PaymentStatusMetric,
  ShippingCityMetric,
  ShippingMethodMetric,
  OrdersReportRecord,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  ShipmentStatus,
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

export default function OrdersReportPage() {
  // Preset & custom dates state
  const [preset, setPreset] = useState<DatePreset>("last30");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Filter criteria state
  const [orderStatus, setOrderStatus] = useState<OrderStatus | "">("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | "">("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [shipmentStatus, setShipmentStatus] = useState<ShipmentStatus | "">("");
  const [cityFilter, setCityFilter] = useState<string>("");
  const [interval, setInterval] = useState<"day" | "week" | "month">("day");

  // Chart Metric state
  const [chartMetric, setChartMetric] = useState<
    "totalOrders" | "deliveredOrders" | "totalValue" | "cancelledOrders"
  >("totalOrders");
  const [hoveredPoint, setHoveredPoint] =
    useState<OrdersTimelinePoint | null>(null);

  // Tab state: "breakdowns" | "orders"
  const [activeTab, setActiveTab] = useState<"breakdowns" | "orders">(
    "breakdowns"
  );

  // Orders list search, sorting & pagination
  const [orderSearch, setOrderSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [orderPage, setOrderPage] = useState<number>(1);
  const [orderLimit] = useState<number>(15);
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Analytics data state
  const [summary, setSummary] = useState<OrdersSummary | null>(null);
  const [timeline, setTimeline] = useState<OrdersTimelinePoint[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<OrderStatusMetric[]>(
    []
  );
  const [shipmentBreakdown, setShipmentBreakdown] = useState<
    ShipmentStatusMetric[]
  >([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState<
    PaymentStatusMetric[]
  >([]);
  const [cityBreakdown, setCityBreakdown] = useState<ShippingCityMetric[]>([]);
  const [methodBreakdown, setMethodBreakdown] = useState<
    ShippingMethodMetric[]
  >([]);

  // Orders list data state
  const [orders, setOrders] = useState<OrdersReportRecord[]>([]);
  const [ordersTotal, setOrdersTotal] = useState<number>(0);
  const [ordersTotalPages, setOrdersTotalPages] = useState<number>(1);

  // Loading & Alert states
  const [loading, setLoading] = useState<boolean>(true);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  const [alert, setAlert] = useState<{
    type: "success" | "danger" | "info";
    text: string;
  } | null>(null);

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
    if (startDate)
      params.startDate = new Date(startDate + "T00:00:00.000Z").toISOString();
    if (endDate)
      params.endDate = new Date(endDate + "T23:59:59.999Z").toISOString();
    if (orderStatus) params.orderStatus = orderStatus;
    if (paymentStatus) params.paymentStatus = paymentStatus;
    if (paymentMethod) params.paymentMethod = paymentMethod;
    if (shipmentStatus) params.shipmentStatus = shipmentStatus;
    if (cityFilter.trim()) params.city = cityFilter.trim();
    if (interval) params.interval = interval;
    return params;
  }, [
    startDate,
    endDate,
    orderStatus,
    paymentStatus,
    paymentMethod,
    shipmentStatus,
    cityFilter,
    interval,
  ]);

  // Fetch overview metrics & analytics
  const fetchReportData = useCallback(async () => {
    setLoading(true);
    setAlert(null);
    try {
      const params = buildParams();
      const [sum, time, stat, ship, pay, cities, methods] = await Promise.all([
        reportsService.getOrdersSummary(params),
        reportsService.getOrdersTimeline(params),
        reportsService.getOrdersByStatus(params),
        reportsService.getOrdersByShipmentStatus(params),
        reportsService.getOrdersByPaymentStatus(params),
        reportsService.getOrdersByShippingCity(params, 10),
        reportsService.getOrdersByShippingMethod(params),
      ]);

      setSummary(sum);
      setTimeline(time.timeline || []);
      setStatusBreakdown(stat || []);
      setShipmentBreakdown(ship || []);
      setPaymentBreakdown(pay || []);
      setCityBreakdown(cities || []);
      setMethodBreakdown(methods || []);
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text:
          err instanceof Error
            ? err.message
            : "Failed to load orders report data",
      });
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  // Fetch paginated orders for the Drill-Down Table
  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const params = {
        ...buildParams(),
        page: orderPage,
        limit: orderLimit,
        search: debouncedSearch || undefined,
        sortBy,
        sortOrder,
      };
      const res = await reportsService.getOrdersList(params);
      setOrders(res.items || []);
      setOrdersTotal(res.total || 0);
      setOrdersTotalPages(res.totalPages || 1);
    } catch (err: unknown) {
      console.error("Failed to load orders for report tab:", err);
    } finally {
      setOrdersLoading(false);
    }
  }, [buildParams, orderPage, orderLimit, debouncedSearch, sortBy, sortOrder]);

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

  // Currency formatter
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
      const params = {
        ...buildParams(),
        search: debouncedSearch || undefined,
        sortBy,
        sortOrder,
      };
      const blob = await reportsService.downloadOrdersCsv(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orders-report-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setAlert({
        type: "success",
        text: "Orders report CSV exported successfully.",
      });
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text:
          err instanceof Error
            ? err.message
            : "Failed to export orders report CSV",
      });
    } finally {
      setExporting(false);
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setOrderStatus("");
    setPaymentStatus("");
    setPaymentMethod("");
    setShipmentStatus("");
    setCityFilter("");
    setInterval("day");
    setOrderSearch("");
    setSortBy("createdAt");
    setSortOrder("desc");
    applyPreset("last30");
  };

  // Timeline chart calculation helpers
  const maxChartValue = useMemo(() => {
    if (!timeline || timeline.length === 0) return 100;
    const values = timeline.map((p) => p[chartMetric] || 0);
    const max = Math.max(...values, 0);
    return max === 0 ? 100 : max * 1.15; // 15% headroom
  }, [timeline, chartMetric]);

  // Order status badge helper
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

  // Payment status badge helper
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

  // Shipment status badge helper
  const getShipmentStatusBadge = (status: ShipmentStatus) => {
    switch (status) {
      case "UNFULFILLED":
        return (
          <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
            Unfulfilled
          </span>
        );
      case "PREPARING":
        return <span className="badge bg-warning text-dark">Preparing</span>;
      case "DISPATCHED":
        return <span className="badge bg-info text-dark">Dispatched</span>;
      case "IN_TRANSIT":
        return <span className="badge bg-primary">In Transit</span>;
      case "OUT_FOR_DELIVERY":
        return <span className="badge bg-primary text-light">Out For Delivery</span>;
      case "DELIVERED":
        return <span className="badge bg-success">Delivered</span>;
      case "FAILED_DELIVERY":
        return <span className="badge bg-danger">Failed Delivery</span>;
      case "RETURNED":
        return <span className="badge bg-dark">Returned</span>;
      default:
        return <span className="badge bg-light text-dark">{status}</span>;
    }
  };

  const formatPaymentMethodName = (method: PaymentMethod | string | null) => {
    if (!method) return "Not specified";
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

  // Active in-flight order count
  const inFlightCount =
    (summary?.confirmedOrdersCount || 0) +
    (summary?.processingOrdersCount || 0) +
    (summary?.shippedOrdersCount || 0);

  return (
    <div className="d-flex flex-column gap-4 pb-5">
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h4 className="fw-bold mb-0 text-dark">Orders Report Management</h4>
            <span
              className="badge bg-success-subtle text-success border border-success-subtle"
              style={{ fontSize: "0.72rem" }}
            >
              Live Pipeline
            </span>
          </div>
          <p className="text-secondary small mb-0">
            Order volume KPIs, delivery fulfillment rates, shipment pipeline
            tracking, regional distribution, and complete order transaction audits.
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
            <span>Print</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm"
            onClick={handleExportCsv}
            disabled={exporting}
          >
            <i
              className={`bi ${exporting ? "bi-hourglass-split" : "bi-download"}`}
            ></i>
            <span>{exporting ? "Exporting..." : "Export CSV"}</span>
          </button>
        </div>
      </div>

      {/* Alert Notice */}
      {alert && (
        <div
          className={`alert alert-${alert.type} alert-dismissible fade show shadow-sm mb-0`}
          role="alert"
        >
          <div className="d-flex align-items-center gap-2">
            <i
              className={`bi ${
                alert.type === "success"
                  ? "bi-check-circle-fill text-success"
                  : alert.type === "danger"
                  ? "bi-exclamation-octagon-fill text-danger"
                  : "bi-info-circle-fill text-info"
              }`}
            ></i>
            <span className="small">{alert.text}</span>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={() => setAlert(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Filter Toolbar Card */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-3">
          {/* Preset Buttons */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 pb-3 mb-3 border-bottom">
            <div className="d-flex flex-wrap align-items-center gap-1">
              <span className="text-secondary small fw-semibold me-2 d-none d-md-inline">
                <i className="bi bi-calendar3 me-1"></i>Date Preset:
              </span>
              {(
                [
                  { id: "today", label: "Today" },
                  { id: "yesterday", label: "Yesterday" },
                  { id: "last7", label: "Last 7 Days" },
                  { id: "last30", label: "Last 30 Days" },
                  { id: "thisMonth", label: "This Month" },
                  { id: "lastMonth", label: "Last Month" },
                  { id: "thisYear", label: "This Year" },
                  { id: "all", label: "All Time" },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`btn btn-xs px-2 py-1 rounded ${
                    preset === p.id
                      ? "btn-primary text-white"
                      : "btn-light text-secondary border"
                  }`}
                  style={{ fontSize: "0.78rem" }}
                  onClick={() => applyPreset(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="btn btn-link text-decoration-none text-danger btn-xs p-0 small"
              onClick={resetFilters}
            >
              <i className="bi bi-x-circle me-1"></i>Reset Filters
            </button>
          </div>

          {/* Granular Filters Grid */}
          <div className="row g-2 align-items-end">
            {/* Custom Start Date */}
            <div className="col-6 col-md-2">
              <label className="form-label small text-secondary fw-semibold mb-1">
                From Date
              </label>
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

            {/* Custom End Date */}
            <div className="col-6 col-md-2">
              <label className="form-label small text-secondary fw-semibold mb-1">
                To Date
              </label>
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

            {/* Order Status */}
            <div className="col-6 col-md-2">
              <label className="form-label small text-secondary fw-semibold mb-1">
                Order Status
              </label>
              <select
                className="form-select form-select-sm"
                value={orderStatus}
                onChange={(e) => {
                  setOrderStatus(e.target.value as OrderStatus | "");
                  setOrderPage(1);
                }}
              >
                <option value="">All Lifecycle Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="RETURNED">Returned</option>
              </select>
            </div>

            {/* Shipment Status */}
            <div className="col-6 col-md-2">
              <label className="form-label small text-secondary fw-semibold mb-1">
                Shipment Status
              </label>
              <select
                className="form-select form-select-sm"
                value={shipmentStatus}
                onChange={(e) => {
                  setShipmentStatus(e.target.value as ShipmentStatus | "");
                  setOrderPage(1);
                }}
              >
                <option value="">All Fulfillment Statuses</option>
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

            {/* Payment Status */}
            <div className="col-6 col-md-2">
              <label className="form-label small text-secondary fw-semibold mb-1">
                Payment Status
              </label>
              <select
                className="form-select form-select-sm"
                value={paymentStatus}
                onChange={(e) => {
                  setPaymentStatus(e.target.value as PaymentStatus | "");
                  setOrderPage(1);
                }}
              >
                <option value="">All Payments</option>
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending (COD/Gateway)</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>

            {/* Payment Method */}
            <div className="col-6 col-md-2">
              <label className="form-label small text-secondary fw-semibold mb-1">
                Payment Method
              </label>
              <select
                className="form-select form-select-sm"
                value={paymentMethod}
                onChange={(e) => {
                  setPaymentMethod(e.target.value as PaymentMethod | "");
                  setOrderPage(1);
                }}
              >
                <option value="">All Methods</option>
                <option value="CASH_ON_DELIVERY">Cash on Delivery</option>
                <option value="MOBILE_BANKING">Mobile Banking</option>
                <option value="CREDIT_CARD">Credit / Debit Card</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="row g-3">
        {/* Total Orders & Order Value */}
        <div className="col-12 col-sm-6 col-lg-4 col-xl">
          <div className="card border-0 shadow-sm h-100 position-relative overflow-hidden">
            <div
              className="position-absolute top-0 start-0 h-100 bg-primary"
              style={{ width: "4px" }}
            ></div>
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-secondary small fw-semibold">
                  Total Orders Placed
                </span>
                <span className="badge bg-primary-subtle text-primary p-2 rounded-circle">
                  <i className="bi bi-cart-check"></i>
                </span>
              </div>
              <h3 className="fw-bold text-dark mb-1">
                {loading ? (
                  <span className="placeholder col-4 placeholder-wave"></span>
                ) : (
                  summary?.totalOrders.toLocaleString() || "0"
                )}
              </h3>
              <div className="d-flex align-items-center justify-content-between small text-secondary">
                <span>Value:</span>
                <span className="fw-semibold text-dark">
                  {loading ? "..." : formatCurrency(summary?.totalOrderValue)}
                </span>
              </div>
              <div className="d-flex align-items-center justify-content-between small text-secondary mt-1">
                <span>Avg Basket Size:</span>
                <span className="fw-semibold text-dark">
                  {loading
                    ? "..."
                    : `${summary?.averageItemsPerOrder || 0} items`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Fulfillment Rate */}
        <div className="col-12 col-sm-6 col-lg-4 col-xl">
          <div className="card border-0 shadow-sm h-100 position-relative overflow-hidden">
            <div
              className="position-absolute top-0 start-0 h-100 bg-success"
              style={{ width: "4px" }}
            ></div>
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-secondary small fw-semibold">
                  Fulfillment Rate
                </span>
                <span className="badge bg-success-subtle text-success p-2 rounded-circle">
                  <i className="bi bi-check2-circle"></i>
                </span>
              </div>
              <h3 className="fw-bold text-success mb-1">
                {loading ? (
                  <span className="placeholder col-4 placeholder-wave"></span>
                ) : (
                  `${summary?.fulfillmentRate || 0}%`
                )}
              </h3>
              <div className="progress mb-2" style={{ height: "4px" }}>
                <div
                  className="progress-bar bg-success"
                  role="progressbar"
                  style={{ width: `${summary?.fulfillmentRate || 0}%` }}
                ></div>
              </div>
              <div className="d-flex align-items-center justify-content-between small text-secondary">
                <span>Delivered:</span>
                <span className="fw-semibold text-success">
                  {loading ? "..." : summary?.deliveredOrdersCount || 0} orders
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* In-Flight Orders */}
        <div className="col-12 col-sm-6 col-lg-4 col-xl">
          <div className="card border-0 shadow-sm h-100 position-relative overflow-hidden">
            <div
              className="position-absolute top-0 start-0 h-100 bg-info"
              style={{ width: "4px" }}
            ></div>
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-secondary small fw-semibold">
                  In-Flight Pipeline
                </span>
                <span className="badge bg-info-subtle text-info p-2 rounded-circle">
                  <i className="bi bi-truck"></i>
                </span>
              </div>
              <h3 className="fw-bold text-dark mb-1">
                {loading ? (
                  <span className="placeholder col-4 placeholder-wave"></span>
                ) : (
                  inFlightCount.toLocaleString()
                )}
              </h3>
              <div className="d-flex align-items-center justify-content-between small text-secondary">
                <span>Processing / Shipped:</span>
                <span className="fw-semibold text-primary">
                  {loading
                    ? "..."
                    : `${summary?.processingOrdersCount || 0} / ${
                        summary?.shippedOrdersCount || 0
                      }`}
                </span>
              </div>
              <div className="d-flex align-items-center justify-content-between small text-secondary mt-1">
                <span>Pending Action:</span>
                <span className="fw-semibold text-warning">
                  {loading ? "..." : summary?.pendingOrdersCount || 0} orders
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cancellation & Return Rate */}
        <div className="col-12 col-sm-6 col-lg-4 col-xl">
          <div className="card border-0 shadow-sm h-100 position-relative overflow-hidden">
            <div
              className="position-absolute top-0 start-0 h-100 bg-danger"
              style={{ width: "4px" }}
            ></div>
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-secondary small fw-semibold">
                  Cancellation & Return
                </span>
                <span className="badge bg-danger-subtle text-danger p-2 rounded-circle">
                  <i className="bi bi-x-octagon"></i>
                </span>
              </div>
              <h3 className="fw-bold text-dark mb-1">
                {loading ? (
                  <span className="placeholder col-4 placeholder-wave"></span>
                ) : (
                  `${(
                    (summary?.cancellationRate || 0) +
                    (summary?.returnRate || 0)
                  ).toFixed(1)}%`
                )}
              </h3>
              <div className="d-flex align-items-center justify-content-between small text-secondary">
                <span>Cancelled:</span>
                <span className="fw-semibold text-danger">
                  {loading ? "..." : summary?.cancelledOrdersCount || 0} (
                  {summary?.cancellationRate || 0}%)
                </span>
              </div>
              <div className="d-flex align-items-center justify-content-between small text-secondary mt-1">
                <span>Returned:</span>
                <span className="fw-semibold text-dark">
                  {loading ? "..." : summary?.returnedOrdersCount || 0} (
                  {summary?.returnRate || 0}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Realization */}
        <div className="col-12 col-sm-6 col-lg-4 col-xl">
          <div className="card border-0 shadow-sm h-100 position-relative overflow-hidden">
            <div
              className="position-absolute top-0 start-0 h-100 bg-warning"
              style={{ width: "4px" }}
            ></div>
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-secondary small fw-semibold">
                  Payment Collection
                </span>
                <span className="badge bg-warning-subtle text-warning p-2 rounded-circle">
                  <i className="bi bi-wallet2"></i>
                </span>
              </div>
              <h3 className="fw-bold text-dark mb-1">
                {loading ? (
                  <span className="placeholder col-4 placeholder-wave"></span>
                ) : (
                  `${
                    summary?.totalOrders && summary.totalOrders > 0
                      ? (
                          (summary.paidOrdersCount / summary.totalOrders) *
                          100
                        ).toFixed(1)
                      : "0"
                  }%`
                )}
              </h3>
              <div className="d-flex align-items-center justify-content-between small text-secondary">
                <span>Paid Orders:</span>
                <span className="fw-semibold text-success">
                  {loading ? "..." : summary?.paidOrdersCount || 0}
                </span>
              </div>
              <div className="d-flex align-items-center justify-content-between small text-secondary mt-1">
                <span>Pending Collection:</span>
                <span className="fw-semibold text-warning">
                  {loading ? "..." : summary?.pendingPaymentCount || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Orders Timeline Chart */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-bottom p-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
          <div>
            <h6 className="fw-bold mb-0 text-dark">
              Order Volume & Fulfillment Trend Timeline
            </h6>
            <small className="text-secondary">
              Chronological orders distribution grouped by {interval}
            </small>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2">
            {/* Metric Switcher */}
            <div className="btn-group btn-group-sm" role="group">
              <button
                type="button"
                className={`btn ${
                  chartMetric === "totalOrders"
                    ? "btn-primary"
                    : "btn-outline-secondary"
                }`}
                onClick={() => setChartMetric("totalOrders")}
              >
                Total Orders
              </button>
              <button
                type="button"
                className={`btn ${
                  chartMetric === "deliveredOrders"
                    ? "btn-success"
                    : "btn-outline-secondary"
                }`}
                onClick={() => setChartMetric("deliveredOrders")}
              >
                Delivered
              </button>
              <button
                type="button"
                className={`btn ${
                  chartMetric === "totalValue"
                    ? "btn-info"
                    : "btn-outline-secondary"
                }`}
                onClick={() => setChartMetric("totalValue")}
              >
                Order Value
              </button>
              <button
                type="button"
                className={`btn ${
                  chartMetric === "cancelledOrders"
                    ? "btn-danger"
                    : "btn-outline-secondary"
                }`}
                onClick={() => setChartMetric("cancelledOrders")}
              >
                Cancelled
              </button>
            </div>

            {/* Interval Toggle */}
            <div className="btn-group btn-group-sm" role="group">
              <button
                type="button"
                className={`btn ${
                  interval === "day"
                    ? "btn-secondary"
                    : "btn-outline-secondary"
                }`}
                onClick={() => setInterval("day")}
              >
                Daily
              </button>
              <button
                type="button"
                className={`btn ${
                  interval === "week"
                    ? "btn-secondary"
                    : "btn-outline-secondary"
                }`}
                onClick={() => setInterval("week")}
              >
                Weekly
              </button>
              <button
                type="button"
                className={`btn ${
                  interval === "month"
                    ? "btn-secondary"
                    : "btn-outline-secondary"
                }`}
                onClick={() => setInterval("month")}
              >
                Monthly
              </button>
            </div>
          </div>
        </div>

        <div className="card-body p-3">
          {loading ? (
            <div
              className="d-flex justify-content-center align-items-center"
              style={{ height: "260px" }}
            >
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : timeline.length === 0 ? (
            <div
              className="d-flex flex-column justify-content-center align-items-center text-secondary py-5"
              style={{ height: "260px" }}
            >
              <i className="bi bi-bar-chart display-5 mb-2 opacity-50"></i>
              <p className="mb-0">
                No orders recorded for the selected date range.
              </p>
            </div>
          ) : (
            <div>
              {/* SVG Trend Bar Chart */}
              <div className="position-relative" style={{ height: "260px" }}>
                <svg
                  width="100%"
                  height="100%"
                  viewBox={`0 0 ${Math.max(timeline.length * 40, 600)} 240`}
                  preserveAspectRatio="none"
                  style={{ overflow: "visible" }}
                >
                  <defs>
                    <linearGradient
                      id="orderBarGrad"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#0d6efd" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#0d6efd" stopOpacity="0.4" />
                    </linearGradient>
                    <linearGradient
                      id="deliveredGrad"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#198754" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#198754" stopOpacity="0.4" />
                    </linearGradient>
                    <linearGradient
                      id="cancelledGrad"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#dc3545" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#dc3545" stopOpacity="0.4" />
                    </linearGradient>
                    <linearGradient
                      id="valueGrad"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#0dcaf0" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#0dcaf0" stopOpacity="0.4" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Guideline grid */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                    <line
                      key={ratio}
                      x1="0"
                      y1={200 - ratio * 180}
                      x2={Math.max(timeline.length * 40, 600)}
                      y2={200 - ratio * 180}
                      stroke="#e9ecef"
                      strokeDasharray="4 4"
                    />
                  ))}

                  {/* SVG Bars */}
                  {timeline.map((point, idx) => {
                    const totalWidth = Math.max(timeline.length * 40, 600);
                    const barWidth = Math.min(
                      24,
                      Math.max(8, totalWidth / timeline.length - 8)
                    );
                    const x =
                      (idx + 0.5) * (totalWidth / timeline.length) -
                      barWidth / 2;
                    const val = point[chartMetric] || 0;
                    const barHeight = Math.max(
                      3,
                      (val / maxChartValue) * 180
                    );
                    const y = 200 - barHeight;

                    const fillGrad =
                      chartMetric === "deliveredOrders"
                        ? "url(#deliveredGrad)"
                        : chartMetric === "cancelledOrders"
                        ? "url(#cancelledGrad)"
                        : chartMetric === "totalValue"
                        ? "url(#valueGrad)"
                        : "url(#orderBarGrad)";

                    return (
                      <g
                        key={point.date}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPoint(point)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      >
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={barHeight}
                          rx={3}
                          fill={fillGrad}
                          className="transition-all"
                        />
                        {/* Hover line indicator */}
                        {hoveredPoint?.date === point.date && (
                          <rect
                            x={x - 2}
                            y={y - 2}
                            width={barWidth + 4}
                            height={barHeight + 4}
                            rx={4}
                            fill="none"
                            stroke="#000"
                            strokeWidth={1.5}
                          />
                        )}
                        {/* Date label at bottom */}
                        <text
                          x={x + barWidth / 2}
                          y="225"
                          textAnchor="middle"
                          fontSize="9"
                          fill="#6c757d"
                        >
                          {point.label.split(",")[0]}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Hover Tooltip Overlay */}
                {hoveredPoint && (
                  <div
                    className="position-absolute bg-dark text-white p-2 rounded shadow-lg"
                    style={{
                      top: "10px",
                      right: "15px",
                      fontSize: "0.78rem",
                      zIndex: 10,
                      minWidth: "180px",
                    }}
                  >
                    <div className="fw-bold border-bottom pb-1 mb-1 text-warning">
                      {hoveredPoint.label}
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Total Placed:</span>
                      <span className="fw-semibold">
                        {hoveredPoint.totalOrders}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between text-success">
                      <span>Delivered:</span>
                      <span className="fw-semibold">
                        {hoveredPoint.deliveredOrders}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between text-info">
                      <span>In-Flight:</span>
                      <span className="fw-semibold">
                        {hoveredPoint.processingOrders}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between text-danger">
                      <span>Cancelled:</span>
                      <span className="fw-semibold">
                        {hoveredPoint.cancelledOrders}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between border-top pt-1 mt-1">
                      <span>Total Value:</span>
                      <span className="fw-bold">
                        {formatCurrency(hoveredPoint.totalValue)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs: Breakdown Analytics vs Detailed Orders Drill-down */}
      <ul className="nav nav-pills bg-white p-1 rounded border shadow-sm">
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link small py-2 px-3 fw-semibold ${
              activeTab === "breakdowns" ? "active" : "text-secondary"
            }`}
            onClick={() => setActiveTab("breakdowns")}
          >
            <i className="bi bi-pie-chart me-1"></i>Order Lifecycle &
            Fulfillment Breakdowns
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link small py-2 px-3 fw-semibold ${
              activeTab === "orders" ? "active" : "text-secondary"
            }`}
            onClick={() => setActiveTab("orders")}
          >
            <i className="bi bi-table me-1"></i>Detailed Orders Audit Ledger (
            {ordersTotal})
          </button>
        </li>
      </ul>

      {/* Tab 1: Breakdown Panels */}
      {activeTab === "breakdowns" && (
        <div className="row g-4">
          {/* Order Lifecycle Status Distribution */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-bottom p-3">
                <h6 className="fw-bold mb-0 text-dark">
                  Order Lifecycle Status Breakdown
                </h6>
                <small className="text-secondary">
                  Distribution of customer orders across lifecycle stages
                </small>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr style={{ fontSize: "0.8rem" }}>
                        <th>Status</th>
                        <th className="text-center">Count</th>
                        <th>Distribution</th>
                        <th className="text-end">Total Amount</th>
                        <th className="text-end">Avg Value</th>
                      </tr>
                    </thead>
                    <tbody style={{ fontSize: "0.85rem" }}>
                      {loading ? (
                        <tr>
                          <td colSpan={5} className="text-center py-4">
                            <div className="spinner-border spinner-border-sm text-primary"></div>
                          </td>
                        </tr>
                      ) : statusBreakdown.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="text-center py-4 text-secondary"
                          >
                            No data available
                          </td>
                        </tr>
                      ) : (
                        statusBreakdown.map((row) => (
                          <tr key={row.status}>
                            <td>{getOrderStatusBadge(row.status)}</td>
                            <td className="text-center fw-semibold">
                              {row.count}
                            </td>
                            <td style={{ minWidth: "120px" }}>
                              <div className="d-flex align-items-center gap-2">
                                <div
                                  className="progress flex-grow-1"
                                  style={{ height: "6px" }}
                                >
                                  <div
                                    className={`progress-bar ${
                                      row.status === "DELIVERED"
                                        ? "bg-success"
                                        : row.status === "CANCELLED"
                                        ? "bg-danger"
                                        : row.status === "RETURNED"
                                        ? "bg-dark"
                                        : "bg-primary"
                                    }`}
                                    style={{ width: `${row.percentage}%` }}
                                  ></div>
                                </div>
                                <span
                                  className="small text-secondary"
                                  style={{ width: "36px" }}
                                >
                                  {row.percentage}%
                                </span>
                              </div>
                            </td>
                            <td className="text-end fw-semibold">
                              {formatCurrency(row.totalAmount)}
                            </td>
                            <td className="text-end text-secondary">
                              {formatCurrency(row.averageAmount)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Shipment Fulfillment Breakdown */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-bottom p-3">
                <h6 className="fw-bold mb-0 text-dark">
                  Shipment Fulfillment Pipeline
                </h6>
                <small className="text-secondary">
                  Fulfillment progression from warehouse packaging to final
                  delivery
                </small>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr style={{ fontSize: "0.8rem" }}>
                        <th>Fulfillment Stage</th>
                        <th className="text-center">Orders</th>
                        <th>Fulfillment Ratio</th>
                        <th className="text-end">Value</th>
                      </tr>
                    </thead>
                    <tbody style={{ fontSize: "0.85rem" }}>
                      {loading ? (
                        <tr>
                          <td colSpan={4} className="text-center py-4">
                            <div className="spinner-border spinner-border-sm text-primary"></div>
                          </td>
                        </tr>
                      ) : shipmentBreakdown.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="text-center py-4 text-secondary"
                          >
                            No shipment data available
                          </td>
                        </tr>
                      ) : (
                        shipmentBreakdown.map((row) => (
                          <tr key={row.status}>
                            <td>{getShipmentStatusBadge(row.status)}</td>
                            <td className="text-center fw-semibold">
                              {row.count}
                            </td>
                            <td style={{ minWidth: "120px" }}>
                              <div className="d-flex align-items-center gap-2">
                                <div
                                  className="progress flex-grow-1"
                                  style={{ height: "6px" }}
                                >
                                  <div
                                    className={`progress-bar ${
                                      row.status === "DELIVERED"
                                        ? "bg-success"
                                        : row.status === "FAILED_DELIVERY"
                                        ? "bg-danger"
                                        : "bg-info"
                                    }`}
                                    style={{ width: `${row.percentage}%` }}
                                  ></div>
                                </div>
                                <span
                                  className="small text-secondary"
                                  style={{ width: "36px" }}
                                >
                                  {row.percentage}%
                                </span>
                              </div>
                            </td>
                            <td className="text-end fw-semibold">
                              {formatCurrency(row.totalAmount)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Regional & Geographic Breakdown */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-bottom p-3">
                <h6 className="fw-bold mb-0 text-dark">
                  Top Destination Cities (Geographic Distribution)
                </h6>
                <small className="text-secondary">
                  Cities generating the highest order volume and shipment
                  demand
                </small>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr style={{ fontSize: "0.8rem" }}>
                        <th>Destination City</th>
                        <th className="text-center">Orders</th>
                        <th>Volume Share</th>
                        <th className="text-end">Revenue Volume</th>
                      </tr>
                    </thead>
                    <tbody style={{ fontSize: "0.85rem" }}>
                      {loading ? (
                        <tr>
                          <td colSpan={4} className="text-center py-4">
                            <div className="spinner-border spinner-border-sm text-primary"></div>
                          </td>
                        </tr>
                      ) : cityBreakdown.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="text-center py-4 text-secondary"
                          >
                            No regional data recorded
                          </td>
                        </tr>
                      ) : (
                        cityBreakdown.map((row) => (
                          <tr key={row.city}>
                            <td className="fw-semibold text-dark">
                              <i className="bi bi-geo-alt-fill text-danger me-1"></i>
                              {row.city}
                            </td>
                            <td className="text-center">{row.count}</td>
                            <td style={{ minWidth: "120px" }}>
                              <div className="d-flex align-items-center gap-2">
                                <div
                                  className="progress flex-grow-1"
                                  style={{ height: "6px" }}
                                >
                                  <div
                                    className="progress-bar bg-primary"
                                    style={{ width: `${row.percentage}%` }}
                                  ></div>
                                </div>
                                <span
                                  className="small text-secondary"
                                  style={{ width: "36px" }}
                                >
                                  {row.percentage}%
                                </span>
                              </div>
                            </td>
                            <td className="text-end fw-semibold">
                              {formatCurrency(row.totalAmount)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Status & Shipping Methods */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-bottom p-3">
                <h6 className="fw-bold mb-0 text-dark">
                  Payment Collection & Shipping Channels
                </h6>
                <small className="text-secondary">
                  Breakdown across payment statuses and courier services
                </small>
              </div>
              <div className="card-body p-3">
                <h6 className="fw-semibold small text-secondary mb-2 text-uppercase">
                  Payment Status Breakdown
                </h6>
                <div className="row g-2 mb-4">
                  {paymentBreakdown.map((pay) => (
                    <div key={pay.status} className="col-6 col-sm-3">
                      <div className="border rounded p-2 text-center bg-light">
                        <div className="mb-1">
                          {getPaymentStatusBadge(pay.status)}
                        </div>
                        <div className="fw-bold text-dark">{pay.count}</div>
                        <div
                          className="text-secondary"
                          style={{ fontSize: "0.75rem" }}
                        >
                          {pay.percentage}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <h6 className="fw-semibold small text-secondary mb-2 text-uppercase">
                  Courier Shipping Methods
                </h6>
                <div className="table-responsive">
                  <table className="table table-sm table-borderless align-middle mb-0">
                    <tbody style={{ fontSize: "0.85rem" }}>
                      {methodBreakdown.map((m) => (
                        <tr key={m.methodName} className="border-bottom">
                          <td>
                            <div className="fw-semibold text-dark">
                              {m.methodName}
                            </div>
                            {m.zoneName && (
                              <div
                                className="text-secondary"
                                style={{ fontSize: "0.75rem" }}
                              >
                                Zone: {m.zoneName}
                              </div>
                            )}
                          </td>
                          <td className="text-center fw-semibold">
                            {m.count} orders
                          </td>
                          <td className="text-end text-secondary">
                            Fees: {formatCurrency(m.totalShippingFee)}
                          </td>
                        </tr>
                      ))}
                      {methodBreakdown.length === 0 && (
                        <tr>
                          <td colSpan={3} className="text-secondary py-2">
                            No courier breakdown available.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Detailed Orders Drill-down Ledger */}
      {activeTab === "orders" && (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-bottom p-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
            <div>
              <h6 className="fw-bold mb-0 text-dark">
                Order Transactions Drill-Down Audit Ledger
              </h6>
              <small className="text-secondary">
                Showing {orders.length} of {ordersTotal} orders matching active
                filters
              </small>
            </div>

            {/* Table Search & Controls */}
            <div className="d-flex align-items-center gap-2">
              <div className="input-group input-group-sm" style={{ width: "240px" }}>
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-search text-secondary"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Order #, name, phone, city..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                />
              </div>

              {/* City Quick Filter */}
              <select
                className="form-select form-select-sm"
                style={{ width: "130px" }}
                value={cityFilter}
                onChange={(e) => {
                  setCityFilter(e.target.value);
                  setOrderPage(1);
                }}
              >
                <option value="">All Cities</option>
                {cityBreakdown.map((c) => (
                  <option key={c.city} value={c.city}>
                    {c.city}
                  </option>
                ))}
              </select>

              {/* Sort selector */}
              <select
                className="form-select form-select-sm"
                style={{ width: "130px" }}
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split("-");
                  setSortBy(field);
                  setSortOrder(order as "asc" | "desc");
                }}
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="grandTotal-desc">Highest Total</option>
                <option value="grandTotal-asc">Lowest Total</option>
              </select>
            </div>
          </div>

          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr style={{ fontSize: "0.8rem" }}>
                    <th>Order #</th>
                    <th>Date & Time</th>
                    <th>Customer</th>
                    <th>Destination</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Fulfillment</th>
                    <th className="text-center">Items</th>
                    <th className="text-end">Grand Total</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: "0.85rem" }}>
                  {ordersLoading ? (
                    <tr>
                      <td colSpan={10} className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="text-center py-5 text-secondary"
                      >
                        <i className="bi bi-inbox display-6 d-block mb-2 opacity-50"></i>
                        No orders match the specified filters.
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o.id}>
                        {/* Order Number */}
                        <td>
                          <Link
                            href={`/orders/${o.id}`}
                            className="fw-bold text-primary text-decoration-none"
                          >
                            {o.orderNumber}
                          </Link>
                        </td>

                        {/* Date */}
                        <td className="text-secondary" style={{ fontSize: "0.8rem" }}>
                          {new Date(o.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                          <div style={{ fontSize: "0.72rem" }}>
                            {new Date(o.createdAt).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>

                        {/* Customer */}
                        <td>
                          <div className="fw-semibold text-dark">
                            {o.customerName}
                          </div>
                          <div
                            className="text-secondary"
                            style={{ fontSize: "0.75rem" }}
                          >
                            {o.recipientPhone || o.customerEmail}
                          </div>
                        </td>

                        {/* Destination */}
                        <td>
                          <div className="fw-semibold text-dark">
                            <i className="bi bi-geo-alt text-danger me-1"></i>
                            {o.shippingCity || "Dhaka"}
                          </div>
                          {o.shippingPostalCode && (
                            <div
                              className="text-secondary"
                              style={{ fontSize: "0.72rem" }}
                            >
                              Post: {o.shippingPostalCode}
                            </div>
                          )}
                        </td>

                        {/* Order Status */}
                        <td>{getOrderStatusBadge(o.orderStatus)}</td>

                        {/* Payment */}
                        <td>
                          <div className="mb-1">
                            {getPaymentStatusBadge(o.paymentStatus)}
                          </div>
                          <div
                            className="text-secondary"
                            style={{ fontSize: "0.72rem" }}
                          >
                            {formatPaymentMethodName(o.paymentMethod)}
                          </div>
                        </td>

                        {/* Fulfillment */}
                        <td>
                          <div className="mb-1">
                            {getShipmentStatusBadge(o.shipmentStatus)}
                          </div>
                          {o.courierName && (
                            <div
                              className="text-secondary"
                              style={{ fontSize: "0.72rem" }}
                            >
                              {o.courierName}{" "}
                              {o.trackingNumber && `(${o.trackingNumber})`}
                            </div>
                          )}
                        </td>

                        {/* Items */}
                        <td className="text-center">
                          <span
                            className="badge bg-light text-dark border"
                            title={
                              o.items?.map((it) => it.productTitle).join(", ") ||
                              ""
                            }
                          >
                            {o.itemsCount} {o.itemsCount === 1 ? "item" : "items"}
                          </span>
                        </td>

                        {/* Grand Total */}
                        <td className="text-end fw-bold text-dark">
                          {formatCurrency(o.grandTotal)}
                        </td>

                        {/* Action Link */}
                        <td className="text-center">
                          <Link
                            href={`/orders/${o.id}`}
                            className="btn btn-outline-primary btn-xs py-1 px-2"
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

            {/* Pagination Controls */}
            {ordersTotalPages > 1 && (
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center p-3 border-top gap-2">
                <span className="small text-secondary">
                  Page {orderPage} of {ordersTotalPages} (Total {ordersTotal}{" "}
                  orders)
                </span>

                <div className="btn-group btn-group-sm">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    disabled={orderPage <= 1}
                    onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
                  >
                    <i className="bi bi-chevron-left me-1"></i>Previous
                  </button>

                  {Array.from(
                    { length: Math.min(5, ordersTotalPages) },
                    (_, i) => {
                      let pageNum = i + 1;
                      if (ordersTotalPages > 5) {
                        const start = Math.max(
                          1,
                          Math.min(orderPage - 2, ordersTotalPages - 4)
                        );
                        pageNum = start + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          className={`btn ${
                            orderPage === pageNum
                              ? "btn-primary"
                              : "btn-outline-secondary"
                          }`}
                          onClick={() => setOrderPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                  )}

                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    disabled={orderPage >= ordersTotalPages}
                    onClick={() =>
                      setOrderPage((p) => Math.min(ordersTotalPages, p + 1))
                    }
                  >
                    Next<i className="bi bi-chevron-right ms-1"></i>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
