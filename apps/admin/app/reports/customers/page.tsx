"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  reportsService,
  CustomerSummary,
  CustomerTimelinePoint,
  CustomerSegmentMetric,
  CustomerCityMetric,
  TopCustomerItem,
  CustomerReportRecord,
  CustomerSpendingTier,
  CustomerStatusFilter,
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

export default function CustomerReportsPage() {
  // Preset & custom dates state
  const [preset, setPreset] = useState<DatePreset>("last30");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Filter criteria state
  const [customerStatus, setCustomerStatus] =
    useState<CustomerStatusFilter>("ALL");
  const [spendingTier, setSpendingTier] =
    useState<CustomerSpendingTier>("ALL");
  const [cityFilter, setCityFilter] = useState<string>("");
  const [interval, setInterval] = useState<"day" | "week" | "month">("day");

  // Chart Metric state
  const [chartMetric, setChartMetric] = useState<
    "newRegistrations" | "purchasingCustomers" | "ordersPlaced" | "revenue"
  >("newRegistrations");
  const [hoveredPoint, setHoveredPoint] =
    useState<CustomerTimelinePoint | null>(null);

  // Tab state: "breakdowns" | "directory" | "vip"
  const [activeTab, setActiveTab] = useState<
    "breakdowns" | "directory" | "vip"
  >("breakdowns");

  // Customer directory search, sorting & pagination
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(15);
  const [sortBy, setSortBy] = useState<string>("totalSpent");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Analytics data state
  const [summary, setSummary] = useState<CustomerSummary | null>(null);
  const [timeline, setTimeline] = useState<CustomerTimelinePoint[]>([]);
  const [segments, setSegments] = useState<CustomerSegmentMetric[]>([]);
  const [cities, setCities] = useState<CustomerCityMetric[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomerItem[]>([]);

  // Directory records list data state
  const [customers, setCustomers] = useState<CustomerReportRecord[]>([]);
  const [totalCustomers, setTotalCustomers] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Loading & Alert states
  const [loading, setLoading] = useState<boolean>(true);
  const [listLoading, setListLoading] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  const [alert, setAlert] = useState<{
    type: "success" | "danger" | "info";
    text: string;
  } | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Apply Date Preset
  const applyPreset = useCallback((p: DatePreset) => {
    setPreset(p);
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    let start = "";
    let end = "";

    switch (p) {
      case "today": {
        start = fmt(now);
        end = fmt(now);
        break;
      }
      case "yesterday": {
        const y = new Date(now);
        y.setDate(y.getDate() - 1);
        start = fmt(y);
        end = fmt(y);
        break;
      }
      case "last7": {
        const s = new Date(now);
        s.setDate(s.getDate() - 6);
        start = fmt(s);
        end = fmt(now);
        break;
      }
      case "last30": {
        const s = new Date(now);
        s.setDate(s.getDate() - 29);
        start = fmt(s);
        end = fmt(now);
        break;
      }
      case "thisMonth": {
        const s = new Date(now.getFullYear(), now.getMonth(), 1);
        start = fmt(s);
        end = fmt(now);
        break;
      }
      case "lastMonth": {
        const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const e = new Date(now.getFullYear(), now.getMonth(), 0);
        start = fmt(s);
        end = fmt(e);
        break;
      }
      case "thisYear": {
        const s = new Date(now.getFullYear(), 0, 1);
        start = fmt(s);
        end = fmt(now);
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
    setPage(1);
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
    if (customerStatus && customerStatus !== "ALL")
      params.customerStatus = customerStatus;
    if (spendingTier && spendingTier !== "ALL")
      params.spendingTier = spendingTier;
    if (cityFilter.trim()) params.city = cityFilter.trim();
    if (interval) params.interval = interval;
    return params;
  }, [startDate, endDate, customerStatus, spendingTier, cityFilter, interval]);

  // Fetch overview metrics & analytics
  const fetchReportData = useCallback(async () => {
    setLoading(true);
    setAlert(null);
    try {
      const params = buildParams();
      const [sum, time, segs, cityList, top] = await Promise.all([
        reportsService.getCustomerSummary(params),
        reportsService.getCustomerTimeline(params),
        reportsService.getCustomerSegments(params),
        reportsService.getCustomerByCity(params, 10),
        reportsService.getTopCustomers(params, 10),
      ]);

      setSummary(sum);
      setTimeline(time.timeline || []);
      setSegments(segs || []);
      setCities(cityList || []);
      setTopCustomers(top || []);
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text:
          err instanceof Error
            ? err.message
            : "Failed to load customer report analytics data",
      });
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  // Fetch paginated customer records for the Directory Table
  const fetchDirectory = useCallback(async () => {
    setListLoading(true);
    try {
      const params = {
        ...buildParams(),
        page,
        limit,
        search: debouncedSearch || undefined,
        sortBy,
        sortOrder,
      };
      const res = await reportsService.getCustomerList(params);
      setCustomers(res.items || []);
      setTotalCustomers(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err: unknown) {
      console.error("Failed to load customer directory:", err);
    } finally {
      setListLoading(false);
    }
  }, [buildParams, page, limit, debouncedSearch, sortBy, sortOrder]);

  // Trigger data fetches
  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  useEffect(() => {
    fetchDirectory();
  }, [fetchDirectory]);

  // Download CSV Handler
  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const params = {
        ...buildParams(),
        search: debouncedSearch || undefined,
        sortBy,
        sortOrder,
      };
      const blob = await reportsService.downloadCustomerCsv(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `customer-report-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setAlert({
        type: "success",
        text: "Customer report CSV exported successfully.",
      });
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text:
          err instanceof Error
            ? err.message
            : "Failed to export customer report CSV",
      });
    } finally {
      setExporting(false);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    applyPreset("last30");
    setCustomerStatus("ALL");
    setSpendingTier("ALL");
    setCityFilter("");
    setSearch("");
    setDebouncedSearch("");
    setInterval("day");
    setSortBy("totalSpent");
    setSortOrder("desc");
    setPage(1);
  };

  // Timeline Max Value for Chart Scaling
  const maxChartValue = useMemo(() => {
    if (!timeline.length) return 10;
    const vals = timeline.map((p) => {
      switch (chartMetric) {
        case "newRegistrations":
          return p.newRegistrations;
        case "purchasingCustomers":
          return p.purchasingCustomers;
        case "ordersPlaced":
          return p.ordersPlaced;
        case "revenue":
          return p.revenue;
      }
    });
    return Math.max(...vals, 1);
  }, [timeline, chartMetric]);

  // Spending Tier Badge Helper
  const renderTierBadge = (tier: string) => {
    switch (tier) {
      case "VIP":
        return (
          <span className="badge bg-warning text-dark px-2 py-1 fw-semibold">
            <i className="bi bi-star-fill me-1 text-dark"></i> VIP
          </span>
        );
      case "REGULAR":
        return (
          <span className="badge bg-primary px-2 py-1 fw-semibold">
            <i className="bi bi-arrow-repeat me-1"></i> Repeat Buyer
          </span>
        );
      case "ONE_TIME":
        return (
          <span className="badge bg-info text-dark px-2 py-1 fw-semibold">
            <i className="bi bi-bag-check me-1"></i> One-Time
          </span>
        );
      case "ZERO_ORDER":
      default:
        return (
          <span className="badge bg-secondary px-2 py-1 fw-semibold">
            <i className="bi bi-person me-1"></i> Zero Orders
          </span>
        );
    }
  };

  return (
    <div className="container-fluid px-3 py-4">
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb breadcrumb-chevron small text-secondary mb-1">
              <li className="breadcrumb-item">
                <Link
                  href="/"
                  className="text-decoration-none text-secondary"
                >
                  <i className="bi bi-house-door me-1"></i> Dashboard
                </Link>
              </li>
              <li className="breadcrumb-item">
                <span className="text-secondary">Reports</span>
              </li>
              <li
                className="breadcrumb-item active text-dark fw-semibold"
                aria-current="page"
              >
                Customer Reports
              </li>
            </ol>
          </nav>
          <h1 className="h3 fw-bold mb-1 text-dark d-flex align-items-center gap-2">
            <i className="bi bi-person-check text-primary"></i> Customer Reports
            & Analytics
          </h1>
          <p className="text-secondary mb-0 small">
            Customer acquisition trends, segment retention, lifetime value, and
            order engagement analytics
          </p>
        </div>

        {/* Global Page Actions */}
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 shadow-sm"
            onClick={() => {
              fetchReportData();
              fetchDirectory();
            }}
            disabled={loading || listLoading}
            title="Refresh Report Data"
          >
            <i
              className={`bi bi-arrow-clockwise ${
                loading || listLoading ? "spin" : ""
              }`}
            ></i>
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="btn btn-success btn-sm d-flex align-items-center gap-1 shadow-sm text-white"
            onClick={handleExportCsv}
            disabled={exporting || loading}
          >
            {exporting ? (
              <span
                className="spinner-border spinner-border-sm"
                role="status"
              ></span>
            ) : (
              <i className="bi bi-download"></i>
            )}
            <span>{exporting ? "Exporting..." : "Export CSV"}</span>
          </button>
        </div>
      </div>

      {/* Alert Notification */}
      {alert && (
        <div
          className={`alert alert-${alert.type} alert-dismissible fade show shadow-sm mb-4`}
          role="alert"
        >
          <div className="d-flex align-items-center gap-2">
            <i
              className={`bi ${
                alert.type === "success"
                  ? "bi-check-circle-fill"
                  : "bi-exclamation-triangle-fill"
              }`}
            ></i>
            <span>{alert.text}</span>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={() => setAlert(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Preset & Filters Card */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          {/* Quick Date Presets Row */}
          <div className="d-flex flex-wrap align-items-center gap-2 pb-3 mb-3 border-bottom">
            <span className="small text-secondary fw-semibold d-flex align-items-center gap-1 me-1">
              <i className="bi bi-calendar3"></i> Date Presets:
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
              ] as { id: DatePreset; label: string }[]
            ).map((btn) => (
              <button
                key={btn.id}
                type="button"
                className={`btn btn-sm ${
                  preset === btn.id
                    ? "btn-primary text-white"
                    : "btn-outline-secondary"
                }`}
                onClick={() => applyPreset(btn.id)}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Granular Filtering Controls */}
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

            {/* Account Status Filter */}
            <div className="col-6 col-md-2">
              <label className="form-label small text-secondary fw-semibold mb-1">
                Account Status
              </label>
              <select
                className="form-select form-select-sm"
                value={customerStatus}
                onChange={(e) => {
                  setCustomerStatus(
                    e.target.value as CustomerStatusFilter
                  );
                  setPage(1);
                }}
              >
                <option value="ALL">All Accounts</option>
                <option value="ACTIVE">Active Accounts</option>
                <option value="INACTIVE">Deactivated Accounts</option>
              </select>
            </div>

            {/* Spending Tier Filter */}
            <div className="col-6 col-md-2">
              <label className="form-label small text-secondary fw-semibold mb-1">
                Customer Segment
              </label>
              <select
                className="form-select form-select-sm"
                value={spendingTier}
                onChange={(e) => {
                  setSpendingTier(e.target.value as CustomerSpendingTier);
                  setPage(1);
                }}
              >
                <option value="ALL">All Segments</option>
                <option value="VIP">VIP (&gt; ৳10,000)</option>
                <option value="REGULAR">Repeat Customers (2+)</option>
                <option value="ONE_TIME">One-Time Buyers</option>
                <option value="ZERO_ORDER">Zero Orders / Inactive</option>
              </select>
            </div>

            {/* Shipping City Filter */}
            <div className="col-6 col-md-2">
              <label className="form-label small text-secondary fw-semibold mb-1">
                Shipping City
              </label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="e.g. Dhaka, Chittagong..."
                value={cityFilter}
                onChange={(e) => {
                  setCityFilter(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Filter Action Buttons */}
            <div className="col-6 col-md-2 d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm w-100"
                onClick={handleResetFilters}
                title="Reset all filter parameters"
              >
                <i className="bi bi-x-circle me-1"></i> Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards Grid (6 Highlights) */}
      <div className="row g-3 mb-4">
        {/* Total Registered Customers */}
        <div className="col-12 col-sm-6 col-lg-4 col-xl-2">
          <div className="card border-0 shadow-sm h-100 position-relative overflow-hidden">
            <div
              className="position-absolute top-0 start-0 h-100 bg-primary"
              style={{ width: "4px" }}
            ></div>
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-secondary small fw-semibold">
                  Total Customers
                </span>
                <span className="badge bg-primary-subtle text-primary p-2 rounded-circle">
                  <i className="bi bi-people"></i>
                </span>
              </div>
              <h3 className="fw-bold text-dark mb-1">
                {loading ? (
                  <span className="placeholder col-4 placeholder-wave"></span>
                ) : (
                  summary?.totalCustomers.toLocaleString() || 0
                )}
              </h3>
              <div className="d-flex align-items-center justify-content-between small text-secondary">
                <span>Active Accounts:</span>
                <span className="fw-semibold text-success">
                  {loading
                    ? "..."
                    : (summary?.totalCustomers || 0) -
                      (summary?.inactiveCustomersCount || 0)}
                </span>
              </div>
              <div className="d-flex align-items-center justify-content-between small text-secondary mt-1">
                <span>Deactivated:</span>
                <span className="fw-semibold text-danger">
                  {loading ? "..." : summary?.inactiveCustomersCount || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* New Registrations */}
        <div className="col-12 col-sm-6 col-lg-4 col-xl-2">
          <div className="card border-0 shadow-sm h-100 position-relative overflow-hidden">
            <div
              className="position-absolute top-0 start-0 h-100 bg-success"
              style={{ width: "4px" }}
            ></div>
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-secondary small fw-semibold">
                  New Signups
                </span>
                <span className="badge bg-success-subtle text-success p-2 rounded-circle">
                  <i className="bi bi-person-plus"></i>
                </span>
              </div>
              <h3 className="fw-bold text-dark mb-1">
                {loading ? (
                  <span className="placeholder col-4 placeholder-wave"></span>
                ) : (
                  summary?.newCustomers.toLocaleString() || 0
                )}
              </h3>
              <div className="small text-secondary">
                <span>In selected date window</span>
              </div>
              <div className="small text-success mt-1 fw-semibold">
                <i className="bi bi-graph-up-arrow me-1"></i>
                {summary && summary.totalCustomers > 0
                  ? `${(
                      (summary.newCustomers / summary.totalCustomers) *
                      100
                    ).toFixed(1)}% of total`
                  : "0%"}
              </div>
            </div>
          </div>
        </div>

        {/* Purchasing Customers & Repeat Rate */}
        <div className="col-12 col-sm-6 col-lg-4 col-xl-2">
          <div className="card border-0 shadow-sm h-100 position-relative overflow-hidden">
            <div
              className="position-absolute top-0 start-0 h-100 bg-info"
              style={{ width: "4px" }}
            ></div>
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-secondary small fw-semibold">
                  Active Buyers
                </span>
                <span className="badge bg-info-subtle text-info p-2 rounded-circle">
                  <i className="bi bi-bag-check"></i>
                </span>
              </div>
              <h3 className="fw-bold text-dark mb-1">
                {loading ? (
                  <span className="placeholder col-4 placeholder-wave"></span>
                ) : (
                  summary?.purchasingCustomers.toLocaleString() || 0
                )}
              </h3>
              <div className="d-flex align-items-center justify-content-between small text-secondary">
                <span>Repeat Buyers:</span>
                <span className="fw-semibold text-primary">
                  {loading ? "..." : summary?.repeatCustomers || 0}
                </span>
              </div>
              <div className="d-flex align-items-center justify-content-between small text-secondary mt-1">
                <span>Repeat Rate:</span>
                <span className="fw-semibold text-info">
                  {loading ? "..." : `${summary?.repeatCustomerRate || 0}%`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Total Customer Revenue */}
        <div className="col-12 col-sm-6 col-lg-4 col-xl-2">
          <div className="card border-0 shadow-sm h-100 position-relative overflow-hidden">
            <div
              className="position-absolute top-0 start-0 h-100 bg-warning"
              style={{ width: "4px" }}
            ></div>
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-secondary small fw-semibold">
                  Cumulative Revenue
                </span>
                <span className="badge bg-warning-subtle text-warning p-2 rounded-circle">
                  <i className="bi bi-cash-stack"></i>
                </span>
              </div>
              <h3 className="fw-bold text-dark mb-1">
                {loading ? (
                  <span className="placeholder col-6 placeholder-wave"></span>
                ) : (
                  `৳${(summary?.totalRevenue || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                )}
              </h3>
              <div className="d-flex align-items-center justify-content-between small text-secondary">
                <span>Total Orders:</span>
                <span className="fw-semibold text-dark">
                  {loading ? "..." : summary?.totalOrders || 0} orders
                </span>
              </div>
              <div className="d-flex align-items-center justify-content-between small text-secondary mt-1">
                <span>Avg Orders/User:</span>
                <span className="fw-semibold text-dark">
                  {loading ? "..." : summary?.averageOrdersPerCustomer || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Average Customer Value (LTV / ARPU) */}
        <div className="col-12 col-sm-6 col-lg-4 col-xl-2">
          <div className="card border-0 shadow-sm h-100 position-relative overflow-hidden">
            <div
              className="position-absolute top-0 start-0 h-100 bg-secondary"
              style={{ width: "4px" }}
            ></div>
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-secondary small fw-semibold">
                  Avg Customer Value
                </span>
                <span className="badge bg-secondary-subtle text-secondary p-2 rounded-circle">
                  <i className="bi bi-gem"></i>
                </span>
              </div>
              <h3 className="fw-bold text-dark mb-1">
                {loading ? (
                  <span className="placeholder col-6 placeholder-wave"></span>
                ) : (
                  `৳${(summary?.averageCustomerValue || 0).toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}`
                )}
              </h3>
              <div className="small text-secondary">
                <span>Revenue per purchasing customer</span>
              </div>
              <div className="small text-primary mt-1 fw-semibold">
                <i className="bi bi-info-circle me-1"></i> LTV Indicator
              </div>
            </div>
          </div>
        </div>

        {/* Zero-Order Customers */}
        <div className="col-12 col-sm-6 col-lg-4 col-xl-2">
          <div className="card border-0 shadow-sm h-100 position-relative overflow-hidden">
            <div
              className="position-absolute top-0 start-0 h-100 bg-danger"
              style={{ width: "4px" }}
            ></div>
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-secondary small fw-semibold">
                  Zero Orders
                </span>
                <span className="badge bg-danger-subtle text-danger p-2 rounded-circle">
                  <i className="bi bi-person-dash"></i>
                </span>
              </div>
              <h3 className="fw-bold text-dark mb-1">
                {loading ? (
                  <span className="placeholder col-4 placeholder-wave"></span>
                ) : (
                  summary?.zeroOrderCustomers.toLocaleString() || 0
                )}
              </h3>
              <div className="small text-secondary">
                <span>Registered without purchase</span>
              </div>
              <div className="small text-danger mt-1 fw-semibold">
                {summary && summary.totalCustomers > 0
                  ? `${(
                      (summary.zeroOrderCustomers / summary.totalCustomers) *
                      100
                    ).toFixed(1)}% untapped`
                  : "0%"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Acquisition & Engagement Timeline Chart */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white border-bottom p-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
          <div>
            <h6 className="fw-bold mb-0 text-dark">
              Customer Acquisition & Activity Timeline
            </h6>
            <small className="text-secondary">
              Chronological registrations and engagement trends grouped by{" "}
              {interval}
            </small>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2">
            {/* Metric Switcher */}
            <div className="btn-group btn-group-sm" role="group">
              <button
                type="button"
                className={`btn ${
                  chartMetric === "newRegistrations"
                    ? "btn-primary"
                    : "btn-outline-secondary"
                }`}
                onClick={() => setChartMetric("newRegistrations")}
              >
                Signups
              </button>
              <button
                type="button"
                className={`btn ${
                  chartMetric === "purchasingCustomers"
                    ? "btn-success"
                    : "btn-outline-secondary"
                }`}
                onClick={() => setChartMetric("purchasingCustomers")}
              >
                Active Buyers
              </button>
              <button
                type="button"
                className={`btn ${
                  chartMetric === "ordersPlaced"
                    ? "btn-info"
                    : "btn-outline-secondary"
                }`}
                onClick={() => setChartMetric("ordersPlaced")}
              >
                Orders Placed
              </button>
              <button
                type="button"
                className={`btn ${
                  chartMetric === "revenue"
                    ? "btn-warning"
                    : "btn-outline-secondary"
                }`}
                onClick={() => setChartMetric("revenue")}
              >
                Revenue
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
              <i className="bi bi-people display-5 mb-2 opacity-50"></i>
              <p className="mb-0">
                No customer activity recorded for the selected date range.
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
                      id="signupBarGrad"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#0d6efd" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#0d6efd" stopOpacity="0.4" />
                    </linearGradient>
                    <linearGradient
                      id="buyersBarGrad"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#198754" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#198754" stopOpacity="0.4" />
                    </linearGradient>
                    <linearGradient
                      id="ordersBarGrad"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#0dcaf0" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#0dcaf0" stopOpacity="0.4" />
                    </linearGradient>
                    <linearGradient
                      id="revenueBarGrad"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#ffc107" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#ffc107" stopOpacity="0.4" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid lines */}
                  <line
                    x1="0"
                    y1="40"
                    x2={Math.max(timeline.length * 40, 600)}
                    y2="40"
                    stroke="#e9ecef"
                    strokeDasharray="4"
                  />
                  <line
                    x1="0"
                    y1="110"
                    x2={Math.max(timeline.length * 40, 600)}
                    y2="110"
                    stroke="#e9ecef"
                    strokeDasharray="4"
                  />
                  <line
                    x1="0"
                    y1="180"
                    x2={Math.max(timeline.length * 40, 600)}
                    y2="180"
                    stroke="#e9ecef"
                    strokeDasharray="4"
                  />
                  <line
                    x1="0"
                    y1="220"
                    x2={Math.max(timeline.length * 40, 600)}
                    y2="220"
                    stroke="#ced4da"
                  />

                  {/* Render timeline bars */}
                  {timeline.map((point, i) => {
                    const totalWidth = Math.max(timeline.length * 40, 600);
                    const slotWidth = totalWidth / timeline.length;
                    const barWidth = Math.max(slotWidth * 0.55, 12);
                    const x = i * slotWidth + (slotWidth - barWidth) / 2;

                    let rawVal = 0;
                    let fillGrad = "url(#signupBarGrad)";
                    switch (chartMetric) {
                      case "newRegistrations":
                        rawVal = point.newRegistrations;
                        fillGrad = "url(#signupBarGrad)";
                        break;
                      case "purchasingCustomers":
                        rawVal = point.purchasingCustomers;
                        fillGrad = "url(#buyersBarGrad)";
                        break;
                      case "ordersPlaced":
                        rawVal = point.ordersPlaced;
                        fillGrad = "url(#ordersBarGrad)";
                        break;
                      case "revenue":
                        rawVal = point.revenue;
                        fillGrad = "url(#revenueBarGrad)";
                        break;
                    }

                    const barHeight = Math.max(
                      (rawVal / maxChartValue) * 190,
                      rawVal > 0 ? 4 : 0
                    );
                    const y = 220 - barHeight;

                    return (
                      <g
                        key={point.date}
                        className="timeline-bar-group"
                        style={{ cursor: "pointer" }}
                        onMouseEnter={() => setHoveredPoint(point)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      >
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={barHeight}
                          rx="3"
                          fill={fillGrad}
                          className="transition-all"
                        />
                        {/* Point label at bottom every few steps or if small set */}
                        {(timeline.length <= 15 || i % 2 === 0) && (
                          <text
                            x={x + barWidth / 2}
                            y="236"
                            fontSize="9"
                            fill="#6c757d"
                            textAnchor="middle"
                          >
                            {point.label}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Floating tooltip on hover */}
                {hoveredPoint && (
                  <div
                    className="position-absolute bg-dark text-white p-2 rounded shadow-sm small"
                    style={{
                      top: "10px",
                      right: "15px",
                      zIndex: 10,
                      pointerEvents: "none",
                      minWidth: "200px",
                    }}
                  >
                    <div className="fw-bold border-bottom border-secondary pb-1 mb-1">
                      {hoveredPoint.label} ({hoveredPoint.date})
                    </div>
                    <div className="d-flex justify-content-between text-info">
                      <span>New Registrations:</span>
                      <span className="fw-semibold">
                        {hoveredPoint.newRegistrations}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between text-success">
                      <span>Purchasing Customers:</span>
                      <span className="fw-semibold">
                        {hoveredPoint.purchasingCustomers}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between text-light">
                      <span>Orders Placed:</span>
                      <span className="fw-semibold">
                        {hoveredPoint.ordersPlaced}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between text-warning">
                      <span>Revenue:</span>
                      <span className="fw-semibold">
                        ৳
                        {hoveredPoint.revenue.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <ul className="nav nav-pills mb-3 gap-2" role="tablist">
        <li className="nav-item" role="presentation">
          <button
            type="button"
            className={`nav-link d-flex align-items-center gap-2 fw-semibold px-3 py-2 ${
              activeTab === "breakdowns" ? "active shadow-sm" : ""
            }`}
            onClick={() => setActiveTab("breakdowns")}
          >
            <i className="bi bi-pie-chart"></i>
            <span>Segments & Geography</span>
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            type="button"
            className={`nav-link d-flex align-items-center gap-2 fw-semibold px-3 py-2 ${
              activeTab === "directory" ? "active shadow-sm" : ""
            }`}
            onClick={() => setActiveTab("directory")}
          >
            <i className="bi bi-table"></i>
            <span>Customer Directory ({totalCustomers})</span>
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            type="button"
            className={`nav-link d-flex align-items-center gap-2 fw-semibold px-3 py-2 ${
              activeTab === "vip" ? "active shadow-sm" : ""
            }`}
            onClick={() => setActiveTab("vip")}
          >
            <i className="bi bi-trophy"></i>
            <span>VIP Leaderboard</span>
          </button>
        </li>
      </ul>

      {/* TAB 1: SEGMENTS & GEOGRAPHY */}
      {activeTab === "breakdowns" && (
        <div className="row g-4">
          {/* Customer Spending & Loyalty Segments */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-bottom p-3">
                <h6 className="fw-bold mb-0 text-dark">
                  Customer Value & Loyalty Segments
                </h6>
                <small className="text-secondary">
                  Customer distribution classified by cumulative spend and order
                  frequency
                </small>
              </div>
              <div className="card-body p-3">
                {loading ? (
                  <div className="text-center py-4">
                    <div
                      className="spinner-border spinner-border-sm text-primary"
                      role="status"
                    ></div>
                  </div>
                ) : segments.length === 0 ? (
                  <p className="text-secondary text-center my-4">
                    No customer data available.
                  </p>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {segments.map((seg) => {
                      let color = "secondary";
                      if (seg.segment === "VIP") color = "warning";
                      if (seg.segment === "REGULAR") color = "primary";
                      if (seg.segment === "ONE_TIME") color = "info";

                      return (
                        <div
                          key={seg.segment}
                          className="p-3 rounded border border-light-subtle bg-light-subtle"
                        >
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="fw-bold text-dark d-flex align-items-center gap-2">
                              {renderTierBadge(seg.segment)}
                              <span>{seg.label}</span>
                            </span>
                            <span className="fw-bold text-dark">
                              {seg.customerCount} customers ({seg.percentage}%)
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div
                            className="progress my-2"
                            style={{ height: "7px" }}
                          >
                            <div
                              className={`progress-bar bg-${color}`}
                              role="progressbar"
                              style={{ width: `${Math.min(seg.percentage, 100)}%` }}
                              aria-valuenow={seg.percentage}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            ></div>
                          </div>

                          <div className="d-flex justify-content-between small text-secondary">
                            <span>
                              Total Revenue:{" "}
                              <strong className="text-dark">
                                ৳
                                {seg.totalRevenue.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                })}
                              </strong>
                            </span>
                            <span>
                              Avg Spend/User:{" "}
                              <strong className="text-dark">
                                ৳
                                {seg.averageSpent.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                })}
                              </strong>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Geographic Destination Distribution */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-bottom p-3">
                <h6 className="fw-bold mb-0 text-dark">
                  Top Customer Destinations (Shipping City)
                </h6>
                <small className="text-secondary">
                  Customer density and revenue volume across delivery cities
                </small>
              </div>
              <div className="card-body p-3">
                {loading ? (
                  <div className="text-center py-4">
                    <div
                      className="spinner-border spinner-border-sm text-primary"
                      role="status"
                    ></div>
                  </div>
                ) : cities.length === 0 ? (
                  <p className="text-secondary text-center my-4">
                    No geographic order data available.
                  </p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr className="small text-secondary">
                          <th>City</th>
                          <th className="text-center">Unique Customers</th>
                          <th className="text-center">Orders</th>
                          <th className="text-end">Revenue Volume</th>
                          <th className="text-end">Share</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cities.map((city, idx) => (
                          <tr key={city.city}>
                            <td className="fw-semibold text-dark">
                              <span className="badge bg-light text-dark border me-2">
                                #{idx + 1}
                              </span>
                              <i className="bi bi-geo-alt me-1 text-danger"></i>
                              {city.city}
                            </td>
                            <td className="text-center">
                              <span className="badge bg-primary-subtle text-primary">
                                {city.customerCount}
                              </span>
                            </td>
                            <td className="text-center">
                              {city.orderCount}
                            </td>
                            <td className="text-end fw-semibold text-dark">
                              ৳
                              {city.totalRevenue.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                            <td className="text-end text-secondary small">
                              {city.percentage}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOMER DIRECTORY TABLE */}
      {activeTab === "directory" && (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-bottom p-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
            <div>
              <h6 className="fw-bold mb-0 text-dark">
                Customer Record Directory
              </h6>
              <small className="text-secondary">
                Search, filter, and inspect customer lifetime orders and value
              </small>
            </div>

            {/* Search & Sort Controls */}
            <div className="d-flex flex-wrap align-items-center gap-2">
              <div
                className="input-group input-group-sm"
                style={{ width: "240px" }}
              >
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-secondary"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search name, email, phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setSearch("")}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>

              {/* Sort By Dropdown */}
              <select
                className="form-select form-select-sm"
                style={{ width: "160px" }}
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
              >
                <option value="totalSpent">Sort: Total Spend</option>
                <option value="ordersCount">Sort: Orders Count</option>
                <option value="createdAt">Sort: Join Date</option>
                <option value="name">Sort: Name (A-Z)</option>
              </select>

              {/* Sort Direction Toggle */}
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                title={`Sort ${sortOrder === "asc" ? "Ascending" : "Descending"}`}
              >
                <i
                  className={`bi bi-sort-${
                    sortOrder === "asc" ? "up" : "down"
                  }`}
                ></i>
              </button>
            </div>
          </div>

          <div className="card-body p-0">
            {listLoading ? (
              <div className="text-center py-5">
                <div
                  className="spinner-border text-primary"
                  role="status"
                ></div>
                <p className="text-secondary small mt-2">
                  Loading customer records...
                </p>
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-5 text-secondary">
                <i className="bi bi-person-x display-5 opacity-50 mb-2"></i>
                <p className="mb-0">
                  No customers found matching your filter criteria.
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr className="small text-secondary">
                      <th>Customer Profile</th>
                      <th>Status</th>
                      <th>Segment</th>
                      <th className="text-center">Orders (Delivered)</th>
                      <th className="text-end">Total Spent</th>
                      <th className="text-end">Avg Order Value</th>
                      <th>Last Order</th>
                      <th>Primary City</th>
                      <th className="text-center">Reviews</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center fw-bold"
                              style={{ width: "36px", height: "36px" }}
                            >
                              {c.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="fw-semibold text-dark">
                                {c.name}
                              </div>
                              <div className="small text-secondary">
                                {c.email}
                              </div>
                              {c.phone && (
                                <div className="small text-secondary">
                                  <i className="bi bi-telephone me-1"></i>
                                  {c.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          {c.isActive ? (
                            <span className="badge bg-success-subtle text-success">
                              Active
                            </span>
                          ) : (
                            <span className="badge bg-danger-subtle text-danger">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td>{renderTierBadge(c.spendingTier)}</td>
                        <td className="text-center">
                          <span className="fw-semibold text-dark">
                            {c.ordersCount}
                          </span>{" "}
                          <span className="text-success small">
                            ({c.deliveredOrdersCount})
                          </span>
                          {c.cancelledOrdersCount > 0 && (
                            <div className="text-danger small">
                              {c.cancelledOrdersCount} cancelled
                            </div>
                          )}
                        </td>
                        <td className="text-end fw-bold text-dark">
                          ৳
                          {c.totalSpent.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="text-end text-dark">
                          ৳
                          {c.averageOrderValue.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="small text-secondary">
                          {c.lastOrderDate ? (
                            c.lastOrderDate.slice(0, 10)
                          ) : (
                            <span className="text-muted">Never</span>
                          )}
                        </td>
                        <td>
                          {c.primaryCity ? (
                            <span className="badge bg-light text-dark border">
                              <i className="bi bi-geo-alt me-1 text-danger"></i>
                              {c.primaryCity}
                            </span>
                          ) : (
                            <span className="text-muted small">N/A</span>
                          )}
                        </td>
                        <td className="text-center">
                          <span className="badge bg-secondary-subtle text-secondary">
                            <i className="bi bi-star me-1"></i>
                            {c.reviewsCount}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          {!listLoading && totalPages > 1 && (
            <div className="card-footer bg-white border-top p-3 d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
              <span className="small text-secondary">
                Showing page <strong>{page}</strong> of{" "}
                <strong>{totalPages}</strong> ({totalCustomers} total customers)
              </span>

              <nav aria-label="Customer Directory Pagination">
                <ul className="pagination pagination-sm mb-0">
                  <li
                    className={`page-item ${page <= 1 ? "disabled" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    >
                      Previous
                    </button>
                  </li>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, idx) => {
                    const pageNum = idx + 1;
                    return (
                      <li
                        key={pageNum}
                        className={`page-item ${
                          page === pageNum ? "active" : ""
                        }`}
                      >
                        <button
                          className="page-link"
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      </li>
                    );
                  })}
                  <li
                    className={`page-item ${
                      page >= totalPages ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: VIP LEADERBOARD */}
      {activeTab === "vip" && (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-bottom p-3">
            <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
              <i className="bi bi-trophy text-warning"></i> Top Spending VIP
              Customers
            </h6>
            <small className="text-secondary">
              Highest lifetime contribution ranked by cumulative order expenditure
            </small>
          </div>
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5">
                <div
                  className="spinner-border text-primary"
                  role="status"
                ></div>
              </div>
            ) : topCustomers.length === 0 ? (
              <div className="text-center py-5 text-secondary">
                <i className="bi bi-trophy display-5 opacity-50 mb-2"></i>
                <p className="mb-0">
                  No VIP customer data available for this range.
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr className="small text-secondary">
                      <th style={{ width: "80px" }}>Rank</th>
                      <th>Customer Details</th>
                      <th className="text-center">Orders Count</th>
                      <th className="text-end">Total Spend</th>
                      <th className="text-end">Avg Basket (AOV)</th>
                      <th>Last Purchase</th>
                      <th>Primary City</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCustomers.map((cust, idx) => {
                      let medal = null;
                      if (idx === 0) medal = "🥇";
                      else if (idx === 1) medal = "🥈";
                      else if (idx === 2) medal = "🥉";

                      return (
                        <tr key={cust.id}>
                          <td>
                            {medal ? (
                              <span className="fs-5">{medal}</span>
                            ) : (
                              <span className="badge bg-secondary-subtle text-secondary">
                                #{idx + 1}
                              </span>
                            )}
                          </td>
                          <td>
                            <div className="fw-bold text-dark">
                              {cust.name}
                            </div>
                            <div className="small text-secondary">
                              {cust.email}
                            </div>
                            {cust.phone && (
                              <div className="small text-muted">
                                {cust.phone}
                              </div>
                            )}
                          </td>
                          <td className="text-center">
                            <span className="badge bg-primary px-2 py-1">
                              {cust.ordersCount} orders
                            </span>
                          </td>
                          <td className="text-end fw-bold text-dark fs-6">
                            ৳
                            {cust.totalSpent.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td className="text-end text-dark">
                            ৳
                            {cust.averageOrderValue.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td className="small text-secondary">
                            {cust.lastOrderDate ? (
                              cust.lastOrderDate.slice(0, 10)
                            ) : (
                              "N/A"
                            )}
                          </td>
                          <td>
                            {cust.primaryCity ? (
                              <span className="badge bg-light text-dark border">
                                <i className="bi bi-geo-alt me-1 text-danger"></i>
                                {cust.primaryCity}
                              </span>
                            ) : (
                              <span className="text-muted small">N/A</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
