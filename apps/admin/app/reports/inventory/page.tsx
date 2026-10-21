"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  reportsService,
  InventorySummary,
  InventoryTimelinePoint,
  InventoryStockStatusMetric,
  InventoryCategoryMetric,
  InventoryBrandMetric,
  StockMovementTypeMetric,
  TopMoverItem,
  CriticalAlertItem,
  InventoryReportRecord,
  InventoryStockStatus,
} from "../../../services/reports";
import { categoriesApi, CategoryItem } from "../../../services/categories";
import { brandsApi, BrandItem } from "../../../services/brands";

type DatePreset =
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "thisMonth"
  | "lastMonth"
  | "thisYear"
  | "all";

export default function InventoryReportPage() {
  // Preset & custom dates state (for timeline movement tracking)
  const [preset, setPreset] = useState<DatePreset>("last30");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Filter criteria state
  const [stockStatus, setStockStatus] = useState<InventoryStockStatus | "ALL">("ALL");
  const [categoryId, setCategoryId] = useState<string>("");
  const [brandId, setBrandId] = useState<string>("");
  const [minQty, setMinQty] = useState<string>("");
  const [maxQty, setMaxQty] = useState<string>("");
  const [interval, setInterval] = useState<"day" | "week" | "month">("day");

  // Chart Metric state
  const [chartMetric, setChartMetric] = useState<
    "netChange" | "inflowUnits" | "outflowUnits" | "movementEventsCount"
  >("netChange");
  const [hoveredPoint, setHoveredPoint] = useState<InventoryTimelinePoint | null>(null);

  // Tab state: "breakdowns" | "inventory" | "alerts"
  const [activeTab, setActiveTab] = useState<"breakdowns" | "inventory" | "alerts">(
    "breakdowns"
  );

  // Inventory list search, sorting & pagination
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(15);
  const [sortBy, setSortBy] = useState<string>("updatedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Analytics data state
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [timeline, setTimeline] = useState<InventoryTimelinePoint[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<InventoryStockStatusMetric[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<InventoryCategoryMetric[]>([]);
  const [brandBreakdown, setBrandBreakdown] = useState<InventoryBrandMetric[]>([]);
  const [movementsByType, setMovementsByType] = useState<StockMovementTypeMetric[]>([]);
  const [topMovers, setTopMovers] = useState<TopMoverItem[]>([]);
  const [criticalAlerts, setCriticalAlerts] = useState<CriticalAlertItem[]>([]);

  // Detailed records list data state
  const [items, setItems] = useState<InventoryReportRecord[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Reference options for dropdowns
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);

  // Quick Adjustment Modal state
  const [adjustModalItem, setAdjustModalItem] = useState<InventoryReportRecord | null>(null);
  const [adjustType, setAdjustType] = useState<"RESTOCK" | "MANUAL_ADJUSTMENT" | "DAMAGED">("RESTOCK");
  const [adjustQty, setAdjustQty] = useState<number>(10);
  const [adjustNotes, setAdjustNotes] = useState<string>("");
  const [adjustSubmitting, setAdjustSubmitting] = useState<boolean>(false);

  // Loading & Alert states
  const [loading, setLoading] = useState<boolean>(true);
  const [itemsLoading, setItemsLoading] = useState<boolean>(false);
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

  // Load Categories & Brands options on mount
  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const [catsRes, brandsRes] = await Promise.all([
          categoriesApi.getCategories({ limit: 100 }),
          brandsApi.getBrands({ limit: 100 }),
        ]);
        setCategories(catsRes.items || []);
        setBrands(brandsRes.items || []);
      } catch {
        // Options non-blocking
      }
    }
    loadFilterOptions();
  }, []);

  // Compute preset dates
  const applyPreset = (selectedPreset: DatePreset) => {
    setPreset(selectedPreset);
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    let start = "";
    let end = todayStr;

    switch (selectedPreset) {
      case "today":
        start = todayStr;
        break;
      case "yesterday": {
        const y = new Date(now);
        y.setDate(y.getDate() - 1);
        start = y.toISOString().slice(0, 10);
        end = start;
        break;
      }
      case "last7": {
        const d = new Date(now);
        d.setDate(d.getDate() - 6);
        start = d.toISOString().slice(0, 10);
        break;
      }
      case "last30": {
        const d = new Date(now);
        d.setDate(d.getDate() - 29);
        start = d.toISOString().slice(0, 10);
        break;
      }
      case "thisMonth": {
        const d = new Date(now.getFullYear(), now.getMonth(), 1);
        start = d.toISOString().slice(0, 10);
        break;
      }
      case "lastMonth": {
        const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const e = new Date(now.getFullYear(), now.getMonth(), 0);
        start = s.toISOString().slice(0, 10);
        end = e.toISOString().slice(0, 10);
        break;
      }
      case "thisYear": {
        const s = new Date(now.getFullYear(), 0, 1);
        start = s.toISOString().slice(0, 10);
        break;
      }
      case "all":
        start = "";
        end = "";
        break;
    }

    setStartDate(start);
    setEndDate(end);
    setPage(1);
  };

  // Set default preset on mount
  useEffect(() => {
    applyPreset("last30");
  }, []);

  // Build current query params
  const buildParams = useCallback(() => {
    return {
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate: endDate
        ? new Date(`${endDate}T23:59:59.999Z`).toISOString()
        : undefined,
      stockStatus: stockStatus !== "ALL" ? stockStatus : undefined,
      categoryId: categoryId || undefined,
      brandId: brandId || undefined,
      minQuantity: minQty ? Number(minQty) : undefined,
      maxQuantity: maxQty ? Number(maxQty) : undefined,
      interval,
    };
  }, [startDate, endDate, stockStatus, categoryId, brandId, minQty, maxQty, interval]);

  // Fetch Summary & Breakdown Analytics
  const fetchReportData = useCallback(async () => {
    setLoading(true);
    setAlert(null);
    try {
      const params = buildParams();
      const [
        summaryRes,
        timelineRes,
        statusRes,
        categoryRes,
        brandRes,
        movementsRes,
        topMoversRes,
        alertsRes,
      ] = await Promise.all([
        reportsService.getInventorySummary(params),
        reportsService.getInventoryTimeline(params),
        reportsService.getInventoryByStatus(params),
        reportsService.getInventoryByCategory(params),
        reportsService.getInventoryByBrand(params),
        reportsService.getInventoryMovementsByType(params),
        reportsService.getInventoryTopMovers(params),
        reportsService.getInventoryCriticalAlerts(params),
      ]);

      setSummary(summaryRes);
      setTimeline(timelineRes.timeline || []);
      setStatusBreakdown(statusRes || []);
      setCategoryBreakdown(categoryRes || []);
      setBrandBreakdown(brandRes || []);
      setMovementsByType(movementsRes || []);
      setTopMovers(topMoversRes || []);
      setCriticalAlerts(alertsRes || []);
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to load inventory report data",
      });
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  // Fetch Paginated Detailed Inventory Table Records
  const fetchInventoryList = useCallback(async () => {
    setItemsLoading(true);
    try {
      const params = {
        ...buildParams(),
        search: debouncedSearch || undefined,
        page,
        limit,
        sortBy,
        sortOrder,
      };

      const res = await reportsService.getInventoryList(params);
      setItems(res.items || []);
      setTotalItems(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to load inventory list",
      });
    } finally {
      setItemsLoading(false);
    }
  }, [buildParams, page, limit, debouncedSearch, sortBy, sortOrder]);

  useEffect(() => {
    if (startDate !== undefined) {
      fetchReportData();
    }
  }, [fetchReportData, startDate]);

  useEffect(() => {
    if (startDate !== undefined) {
      fetchInventoryList();
    }
  }, [fetchInventoryList, startDate]);

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
      const blob = await reportsService.downloadInventoryCsv(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `inventory-report-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setAlert({
        type: "success",
        text: "Inventory report CSV exported successfully.",
      });
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to export inventory report CSV",
      });
    } finally {
      setExporting(false);
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setStockStatus("ALL");
    setCategoryId("");
    setBrandId("");
    setMinQty("");
    setMaxQty("");
    setInterval("day");
    setSearch("");
    setSortBy("updatedAt");
    setSortOrder("desc");
    applyPreset("last30");
  };

  // Handle Quick Stock Adjustment submission
  const handleStockAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalItem) return;
    setAdjustSubmitting(true);
    try {
      const token = typeof window !== "undefined"
        ? localStorage.getItem("az_admin_access_token") || localStorage.getItem("accessToken")
        : null;

      const change = adjustType === "DAMAGED" ? -Math.abs(adjustQty) : Math.abs(adjustQty);

      const res = await fetch("http://localhost:3001/api/v1/admin/inventory/adjust", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          variantId: adjustModalItem.variantId,
          type: adjustType,
          quantityChange: change,
          notes: adjustNotes || `Quick adjustment from Inventory Report (${adjustType})`,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "Failed to adjust stock");
      }

      setAlert({
        type: "success",
        text: `Stock for ${adjustModalItem.sku} adjusted successfully (${change > 0 ? `+${change}` : change} units).`,
      });
      setAdjustModalItem(null);
      setAdjustNotes("");
      fetchReportData();
      fetchInventoryList();
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to execute stock adjustment",
      });
    } finally {
      setAdjustSubmitting(false);
    }
  };

  // Stock Status badge helper
  const getStockStatusBadge = (status: InventoryStockStatus) => {
    switch (status) {
      case "IN_STOCK":
        return <span className="badge bg-success-subtle text-success border border-success-subtle">In Stock</span>;
      case "LOW_STOCK":
        return <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">Low Stock</span>;
      case "OUT_OF_STOCK":
        return <span className="badge bg-danger-subtle text-danger border border-danger-subtle">Out of Stock</span>;
      default:
        return <span className="badge bg-secondary">Unknown</span>;
    }
  };

  // Timeline chart calculation helpers
  const maxChartValue = useMemo(() => {
    if (!timeline || timeline.length === 0) return 100;
    const values = timeline.map((p) => Math.abs(p[chartMetric] || 0));
    const max = Math.max(...values, 0);
    return max === 0 ? 100 : max * 1.2; // 20% headroom
  }, [timeline, chartMetric]);

  return (
    <div className="container-fluid py-4 px-md-4">
      {/* Page Header & Navigation Breadcrumb */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1 text-secondary small">
              <li className="breadcrumb-item">
                <Link href="/" className="text-decoration-none text-secondary">
                  Dashboard
                </Link>
              </li>
              <li className="breadcrumb-item">Reports</li>
              <li className="breadcrumb-item active text-dark fw-semibold" aria-current="page">
                Inventory Report
              </li>
            </ol>
          </nav>
          <div className="d-flex align-items-center gap-2">
            <h1 className="h3 fw-bold mb-0 text-dark">Inventory Valuation & Stock Health Report</h1>
            <span className="badge bg-success-subtle text-success border border-success-subtle">
              Live
            </span>
          </div>
          <p className="text-secondary small mb-0 mt-1">
            Real-time warehouse stock valuation, reservation balances, inventory turnover trends, and restock alerts.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="d-flex flex-wrap align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 shadow-sm"
            onClick={() => {
              fetchReportData();
              fetchInventoryList();
            }}
            disabled={loading || itemsLoading}
          >
            <i className={`bi bi-arrow-clockwise ${loading || itemsLoading ? "spin" : ""}`}></i>
            Refresh Data
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm"
            onClick={handleExportCsv}
            disabled={exporting}
          >
            {exporting ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Generating CSV...
              </>
            ) : (
              <>
                <i className="bi bi-file-earmark-spreadsheet"></i>
                Export Report CSV
              </>
            )}
          </button>
        </div>
      </div>

      {/* Global Alert Notification */}
      {alert && (
        <div
          className={`alert alert-${alert.type} alert-dismissible fade show d-flex align-items-center gap-2 mb-4 shadow-sm`}
          role="alert"
        >
          <i
            className={`bi ${
              alert.type === "success"
                ? "bi-check-circle-fill text-success"
                : alert.type === "danger"
                ? "bi-exclamation-triangle-fill text-danger"
                : "bi-info-circle-fill text-info"
            }`}
          ></i>
          <div className="flex-grow-1 small">{alert.text}</div>
          <button
            type="button"
            className="btn-close"
            onClick={() => setAlert(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Filter Toolbar Card */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          {/* Preset Buttons */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 pb-3 mb-3 border-bottom">
            <div className="d-flex flex-wrap align-items-center gap-1">
              <span className="text-secondary small fw-semibold me-2 d-none d-md-inline">
                <i className="bi bi-calendar3 me-1"></i>Turnover Window:
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
            {/* Search SKU/Product */}
            <div className="col-12 col-md-3">
              <label className="form-label small text-secondary fw-semibold mb-1">
                Search SKU / Title / Barcode
              </label>
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light text-secondary">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. iPhone, IPH15, 19425..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setSearch("")}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Stock Status Filter */}
            <div className="col-6 col-md-2">
              <label className="form-label small text-secondary fw-semibold mb-1">
                Stock Condition
              </label>
              <select
                className="form-select form-select-sm"
                value={stockStatus}
                onChange={(e) => {
                  setStockStatus(e.target.value as InventoryStockStatus | "ALL");
                  setPage(1);
                }}
              >
                <option value="ALL">All Conditions</option>
                <option value="IN_STOCK">Healthy In Stock</option>
                <option value="LOW_STOCK">Low Stock Warning</option>
                <option value="OUT_OF_STOCK">Depleted (Out of Stock)</option>
              </select>
            </div>

            {/* Category Dropdown */}
            <div className="col-6 col-md-2">
              <label className="form-label small text-secondary fw-semibold mb-1">
                Category
              </label>
              <select
                className="form-select form-select-sm"
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand Dropdown */}
            <div className="col-6 col-md-2">
              <label className="form-label small text-secondary fw-semibold mb-1">
                Brand
              </label>
              <select
                className="form-select form-select-sm"
                value={brandId}
                onChange={(e) => {
                  setBrandId(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Brands</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Min Quantity */}
            <div className="col-3 col-md-1">
              <label className="form-label small text-secondary fw-semibold mb-1">
                Min Qty
              </label>
              <input
                type="number"
                min="0"
                className="form-control form-control-sm"
                placeholder="0"
                value={minQty}
                onChange={(e) => {
                  setMinQty(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Max Quantity */}
            <div className="col-3 col-md-1">
              <label className="form-label small text-secondary fw-semibold mb-1">
                Max Qty
              </label>
              <input
                type="number"
                min="0"
                className="form-control form-control-sm"
                placeholder="Max"
                value={maxQty}
                onChange={(e) => {
                  setMaxQty(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Quick Filter Apply button */}
            <div className="col-12 col-md-1">
              <button
                type="button"
                className="btn btn-secondary btn-sm w-100"
                onClick={() => {
                  fetchReportData();
                  fetchInventoryList();
                }}
              >
                Filter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Overview Cards (Top Executive Row) */}
      <div className="row g-3 mb-4">
        {/* Total Stock Valuation */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100 position-relative overflow-hidden">
            <div
              className="position-absolute top-0 start-0 h-100 bg-primary"
              style={{ width: "4px" }}
            ></div>
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-secondary small fw-semibold">
                  Total Stock Valuation
                </span>
                <span className="badge bg-primary-subtle text-primary p-2 rounded-circle">
                  <i className="bi bi-cash-stack"></i>
                </span>
              </div>
              <h3 className="fw-bold text-dark mb-1">
                {loading ? (
                  <span className="placeholder col-6 placeholder-wave"></span>
                ) : (
                  formatCurrency(summary?.totalValuationRegular)
                )}
              </h3>
              <div className="d-flex align-items-center justify-content-between small text-secondary">
                <span>At Selling Price:</span>
                <span className="fw-semibold text-dark">
                  {loading ? "..." : formatCurrency(summary?.totalValuationSelling)}
                </span>
              </div>
              <div className="d-flex align-items-center justify-content-between small text-secondary mt-1">
                <span>Avg Unit Value:</span>
                <span className="fw-semibold text-dark">
                  {loading ? "..." : formatCurrency(summary?.averageUnitValue)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Total Warehouse Units */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100 position-relative overflow-hidden">
            <div
              className="position-absolute top-0 start-0 h-100 bg-info"
              style={{ width: "4px" }}
            ></div>
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-secondary small fw-semibold">
                  Warehouse Stock Units
                </span>
                <span className="badge bg-info-subtle text-info p-2 rounded-circle">
                  <i className="bi bi-boxes"></i>
                </span>
              </div>
              <h3 className="fw-bold text-dark mb-1">
                {loading ? (
                  <span className="placeholder col-4 placeholder-wave"></span>
                ) : (
                  (summary?.totalPhysicalUnits || 0).toLocaleString()
                )}
              </h3>
              <div className="d-flex align-items-center justify-content-between small text-secondary">
                <span>Available for Sale:</span>
                <span className="fw-semibold text-success">
                  {loading ? "..." : (summary?.totalAvailableUnits || 0).toLocaleString()}
                </span>
              </div>
              <div className="d-flex align-items-center justify-content-between small text-secondary mt-1">
                <span>Committed / Reserved:</span>
                <span className="fw-semibold text-warning">
                  {loading ? "..." : (summary?.totalReservedUnits || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Catalog SKUs Tracked */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100 position-relative overflow-hidden">
            <div
              className="position-absolute top-0 start-0 h-100 bg-secondary"
              style={{ width: "4px" }}
            ></div>
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-secondary small fw-semibold">
                  Catalog Variants & SKUs
                </span>
                <span className="badge bg-secondary-subtle text-secondary p-2 rounded-circle">
                  <i className="bi bi-tags"></i>
                </span>
              </div>
              <h3 className="fw-bold text-dark mb-1">
                {loading ? (
                  <span className="placeholder col-4 placeholder-wave"></span>
                ) : (
                  (summary?.totalSkus || 0).toLocaleString()
                )}
              </h3>
              <div className="d-flex align-items-center justify-content-between small text-secondary">
                <span>Master Products:</span>
                <span className="fw-semibold text-dark">
                  {loading ? "..." : summary?.totalProducts || 0}
                </span>
              </div>
              <div className="d-flex align-items-center justify-content-between small text-secondary mt-1">
                <span>Potential Sales:</span>
                <span className="fw-semibold text-success">
                  {loading ? "..." : formatCurrency(summary?.potentialRevenue)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stock Health Condition */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100 position-relative overflow-hidden">
            <div
              className="position-absolute top-0 start-0 h-100 bg-warning"
              style={{ width: "4px" }}
            ></div>
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-secondary small fw-semibold">
                  Stock Health & Alerts
                </span>
                <span className="badge bg-warning-subtle text-warning-emphasis p-2 rounded-circle">
                  <i className="bi bi-shield-exclamation"></i>
                </span>
              </div>
              <h3 className="fw-bold text-dark mb-1">
                {loading ? (
                  <span className="placeholder col-4 placeholder-wave"></span>
                ) : (
                  `${summary?.inStockPercentage || 0}% Healthy`
                )}
              </h3>
              {/* Stacked Progress Bar */}
              <div className="progress mb-2" style={{ height: "6px" }}>
                <div
                  className="progress-bar bg-success"
                  role="progressbar"
                  style={{ width: `${summary?.inStockPercentage || 0}%` }}
                  title="In Stock"
                ></div>
                <div
                  className="progress-bar bg-warning"
                  role="progressbar"
                  style={{ width: `${summary?.lowStockPercentage || 0}%` }}
                  title="Low Stock"
                ></div>
                <div
                  className="progress-bar bg-danger"
                  role="progressbar"
                  style={{ width: `${summary?.outOfStockPercentage || 0}%` }}
                  title="Out of Stock"
                ></div>
              </div>
              <div className="d-flex align-items-center justify-content-between small text-secondary">
                <span>Low Stock Warning:</span>
                <span className="fw-semibold text-warning">
                  {loading ? "..." : `${summary?.lowStockCount || 0} SKUs`}
                </span>
              </div>
              <div className="d-flex align-items-center justify-content-between small text-secondary mt-1">
                <span>Depleted (Out of Stock):</span>
                <span className="fw-semibold text-danger">
                  {loading ? "..." : `${summary?.outOfStockCount || 0} SKUs`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Stock Movement Flow Timeline Chart */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white border-bottom p-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
          <div>
            <h6 className="fw-bold mb-0 text-dark">
              Stock Movement & Inventory Flow Timeline
            </h6>
            <small className="text-secondary">
              Chronological ledger tracking restocks/inflows vs orders/outflows grouped by {interval}
            </small>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2">
            {/* Metric Switcher */}
            <div className="btn-group btn-group-sm" role="group">
              <button
                type="button"
                className={`btn ${
                  chartMetric === "netChange"
                    ? "btn-primary"
                    : "btn-outline-secondary"
                }`}
                onClick={() => setChartMetric("netChange")}
              >
                Net Stock Change
              </button>
              <button
                type="button"
                className={`btn ${
                  chartMetric === "inflowUnits"
                    ? "btn-success"
                    : "btn-outline-secondary"
                }`}
                onClick={() => setChartMetric("inflowUnits")}
              >
                Inflow (Restocks)
              </button>
              <button
                type="button"
                className={`btn ${
                  chartMetric === "outflowUnits"
                    ? "btn-danger"
                    : "btn-outline-secondary"
                }`}
                onClick={() => setChartMetric("outflowUnits")}
              >
                Outflow (Orders)
              </button>
              <button
                type="button"
                className={`btn ${
                  chartMetric === "movementEventsCount"
                    ? "btn-info"
                    : "btn-outline-secondary"
                }`}
                onClick={() => setChartMetric("movementEventsCount")}
              >
                Movement Events
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
                No stock movements logged for the selected turnover window.
              </p>
            </div>
          ) : (
            <div>
              {/* SVG Trend Bar Chart */}
              <div className="position-relative" style={{ height: "260px" }}>
                <svg
                  width="100%"
                  height="100%"
                  viewBox={`0 0 ${Math.max(timeline.length * 48, 600)} 240`}
                  preserveAspectRatio="none"
                  style={{ overflow: "visible" }}
                >
                  <defs>
                    <linearGradient id="netChangeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#0d6efd" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#0d6efd" stopOpacity="0.3" />
                    </linearGradient>
                    <linearGradient id="inflowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#198754" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#198754" stopOpacity="0.3" />
                    </linearGradient>
                    <linearGradient id="outflowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#dc3545" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#dc3545" stopOpacity="0.3" />
                    </linearGradient>
                    <linearGradient id="eventGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#0dcaf0" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#0dcaf0" stopOpacity="0.3" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Guide Lines */}
                  {[0, 60, 120, 180].map((y) => (
                    <line
                      key={y}
                      x1="0"
                      y1={y}
                      x2={Math.max(timeline.length * 48, 600)}
                      y2={y}
                      stroke="#e9ecef"
                      strokeDasharray="4 4"
                    />
                  ))}

                  {/* Bars */}
                  {timeline.map((point, index) => {
                    const barWidth = 24;
                    const x = index * 48 + 12;
                    const val = point[chartMetric] || 0;
                    const isNegative = val < 0;
                    const normalizedHeight = Math.min(
                      Math.max((Math.abs(val) / maxChartValue) * 190, 4),
                      190
                    );
                    const y = 200 - normalizedHeight;

                    const fillGrad =
                      chartMetric === "inflowUnits"
                        ? "url(#inflowGrad)"
                        : chartMetric === "outflowUnits"
                        ? "url(#outflowGrad)"
                        : chartMetric === "movementEventsCount"
                        ? "url(#eventGrad)"
                        : isNegative
                        ? "url(#outflowGrad)"
                        : "url(#netChangeGrad)";

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
                          height={normalizedHeight}
                          fill={fillGrad}
                          rx={3}
                          style={{
                            transition: "all 0.2s ease",
                            cursor: "pointer",
                          }}
                        />
                        {/* Point Label */}
                        <text
                          x={x + barWidth / 2}
                          y="225"
                          textAnchor="middle"
                          fontSize="9"
                          fill="#6c757d"
                        >
                          {point.label}
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
                      minWidth: "190px",
                    }}
                  >
                    <div className="fw-bold border-bottom pb-1 mb-1 text-warning">
                      {hoveredPoint.label}
                    </div>
                    <div className="d-flex justify-content-between text-success">
                      <span>Restocks / Inflow:</span>
                      <span className="fw-semibold">+{hoveredPoint.inflowUnits}</span>
                    </div>
                    <div className="d-flex justify-content-between text-danger">
                      <span>Fulfillments / Outflow:</span>
                      <span className="fw-semibold">-{hoveredPoint.outflowUnits}</span>
                    </div>
                    <div className="d-flex justify-content-between text-info">
                      <span>Adjustments Delta:</span>
                      <span className="fw-semibold">
                        {hoveredPoint.adjustmentsUnits > 0
                          ? `+${hoveredPoint.adjustmentsUnits}`
                          : hoveredPoint.adjustmentsUnits}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between border-top pt-1 mt-1">
                      <span>Net Balance Delta:</span>
                      <span className="fw-bold">
                        {hoveredPoint.netChange > 0
                          ? `+${hoveredPoint.netChange}`
                          : hoveredPoint.netChange} units
                      </span>
                    </div>
                    <div className="d-flex justify-content-between text-secondary mt-1">
                      <span>Ledger Transactions:</span>
                      <span>{hoveredPoint.movementEventsCount} events</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <ul className="nav nav-pills bg-white p-1 rounded border shadow-sm mb-4">
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link small py-2 px-3 fw-semibold ${
              activeTab === "breakdowns" ? "active" : "text-secondary"
            }`}
            onClick={() => setActiveTab("breakdowns")}
          >
            <i className="bi bi-pie-chart me-1"></i>Stock Breakdown Analytics
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link small py-2 px-3 fw-semibold ${
              activeTab === "inventory" ? "active" : "text-secondary"
            }`}
            onClick={() => setActiveTab("inventory")}
          >
            <i className="bi bi-table me-1"></i>Detailed Valuation Audit Table ({totalItems})
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link small py-2 px-3 fw-semibold ${
              activeTab === "alerts" ? "active" : "text-secondary"
            }`}
            onClick={() => setActiveTab("alerts")}
          >
            <i className="bi bi-exclamation-octagon me-1"></i>Depletion & Restock Alerts (
            {criticalAlerts.length})
          </button>
        </li>
      </ul>

      {/* TAB 1: BREAKDOWNS & ANALYTICS */}
      {activeTab === "breakdowns" && (
        <div className="row g-4">
          {/* Stock Condition Distribution */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-bottom p-3">
                <h6 className="fw-bold mb-0 text-dark">
                  Stock Condition Breakdown
                </h6>
                <small className="text-secondary">
                  Distribution of SKUs across Healthy, Low Stock, and Depleted stages
                </small>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr style={{ fontSize: "0.8rem" }}>
                        <th>Condition</th>
                        <th className="text-center">SKUs</th>
                        <th className="text-center">Physical Units</th>
                        <th className="text-end">Total Valuation</th>
                        <th className="text-end">Share</th>
                      </tr>
                    </thead>
                    <tbody style={{ fontSize: "0.85rem" }}>
                      {statusBreakdown.map((row) => (
                        <tr key={row.status}>
                          <td>{getStockStatusBadge(row.status)}</td>
                          <td className="text-center fw-semibold">{row.count}</td>
                          <td className="text-center">{row.totalUnits.toLocaleString()}</td>
                          <td className="text-end fw-semibold">{formatCurrency(row.totalValuation)}</td>
                          <td className="text-end">
                            <span className="badge bg-light text-dark border">
                              {row.percentage}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Movement Types Audit Summary */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-bottom p-3">
                <h6 className="fw-bold mb-0 text-dark">
                  Stock Movements by Ledger Reason
                </h6>
                <small className="text-secondary">
                  Total audit transactions and unit volume by operation type
                </small>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr style={{ fontSize: "0.8rem" }}>
                        <th>Movement Reason</th>
                        <th className="text-center">Events</th>
                        <th className="text-center">Units Added</th>
                        <th className="text-center">Units Deducted</th>
                        <th className="text-end">Net Impact</th>
                      </tr>
                    </thead>
                    <tbody style={{ fontSize: "0.85rem" }}>
                      {movementsByType.map((row) => (
                        <tr key={row.type}>
                          <td className="fw-semibold text-secondary">
                            <code>{row.type}</code>
                          </td>
                          <td className="text-center">{row.count}</td>
                          <td className="text-center text-success">
                            {row.quantityIn > 0 ? `+${row.quantityIn}` : "-"}
                          </td>
                          <td className="text-center text-danger">
                            {row.quantityOut > 0 ? `-${row.quantityOut}` : "-"}
                          </td>
                          <td className="text-end fw-bold">
                            <span
                              className={
                                row.netQuantity > 0
                                  ? "text-success"
                                  : row.netQuantity < 0
                                  ? "text-danger"
                                  : "text-muted"
                              }
                            >
                              {row.netQuantity > 0 ? `+${row.netQuantity}` : row.netQuantity}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Inventory by Category */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-bottom p-3">
                <h6 className="fw-bold mb-0 text-dark">
                  Inventory Valuation by Category
                </h6>
                <small className="text-secondary">
                  Categorized asset value, SKU count, and available units
                </small>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr style={{ fontSize: "0.8rem" }}>
                        <th>Category</th>
                        <th className="text-center">SKUs</th>
                        <th className="text-center">Available Units</th>
                        <th className="text-end">Valuation</th>
                        <th className="text-end">Share</th>
                      </tr>
                    </thead>
                    <tbody style={{ fontSize: "0.85rem" }}>
                      {categoryBreakdown.slice(0, 8).map((row) => (
                        <tr key={row.categoryId}>
                          <td className="fw-semibold text-dark">{row.categoryName}</td>
                          <td className="text-center">{row.skuCount}</td>
                          <td className="text-center">{row.availableUnits.toLocaleString()}</td>
                          <td className="text-end fw-semibold">{formatCurrency(row.totalValuation)}</td>
                          <td className="text-end">
                            <span className="badge bg-light text-dark border">
                              {row.percentage}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Inventory by Brand */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-bottom p-3">
                <h6 className="fw-bold mb-0 text-dark">
                  Inventory Valuation by Brand
                </h6>
                <small className="text-secondary">
                  Brand asset value and warehouse units distribution
                </small>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr style={{ fontSize: "0.8rem" }}>
                        <th>Brand</th>
                        <th className="text-center">SKUs</th>
                        <th className="text-center">Available Units</th>
                        <th className="text-end">Valuation</th>
                        <th className="text-end">Share</th>
                      </tr>
                    </thead>
                    <tbody style={{ fontSize: "0.85rem" }}>
                      {brandBreakdown.slice(0, 8).map((row) => (
                        <tr key={row.brandName}>
                          <td className="fw-semibold text-dark">{row.brandName}</td>
                          <td className="text-center">{row.skuCount}</td>
                          <td className="text-center">{row.availableUnits.toLocaleString()}</td>
                          <td className="text-end fw-semibold">{formatCurrency(row.totalValuation)}</td>
                          <td className="text-end">
                            <span className="badge bg-light text-dark border">
                              {row.percentage}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Top Fast-Moving SKUs */}
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-bottom p-3">
                <h6 className="fw-bold mb-0 text-dark">
                  Top Fast-Moving SKUs (Highest Order Deductions)
                </h6>
                <small className="text-secondary">
                  SKUs with highest units fulfilled/reserved in the selected turnover window
                </small>
              </div>
              <div className="card-body p-0">
                {topMovers.length === 0 ? (
                  <div className="p-4 text-center text-muted small">
                    No order fulfillments recorded during this turnover window.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr style={{ fontSize: "0.8rem" }}>
                          <th>SKU</th>
                          <th>Product & Category</th>
                          <th className="text-center">Units Sold/Deducted</th>
                          <th className="text-center">Order Events</th>
                          <th className="text-center">Current Available</th>
                          <th className="text-end">Action</th>
                        </tr>
                      </thead>
                      <tbody style={{ fontSize: "0.85rem" }}>
                        {topMovers.map((m) => (
                          <tr key={m.variantId}>
                            <td>
                              <span className="badge bg-light text-dark border font-monospace">
                                {m.sku}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                {m.thumbnailUrl && (
                                  <img
                                    src={m.thumbnailUrl}
                                    alt={m.productTitle}
                                    className="rounded border"
                                    style={{ width: "32px", height: "32px", objectFit: "cover" }}
                                  />
                                )}
                                <div>
                                  <div className="fw-semibold text-dark">{m.productTitle}</div>
                                  <small className="text-muted">{m.categoryName}</small>
                                </div>
                              </div>
                            </td>
                            <td className="text-center fw-bold text-success">
                              -{m.unitsDeducted} units
                            </td>
                            <td className="text-center">{m.movementCount}</td>
                            <td className="text-center">
                              <span
                                className={`badge ${
                                  m.currentQuantity <= 0
                                    ? "bg-danger"
                                    : m.currentQuantity <= 5
                                    ? "bg-warning text-dark"
                                    : "bg-success"
                                }`}
                              >
                                {m.currentQuantity} avail
                              </span>
                            </td>
                            <td className="text-end">
                              <Link
                                href={`/inventory`}
                                className="btn btn-outline-primary btn-xs py-1 px-2"
                              >
                                View in Inventory
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
          </div>
        </div>
      )}

      {/* TAB 2: DETAILED VALUATION AUDIT TABLE */}
      {activeTab === "inventory" && (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-bottom p-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
            <div>
              <h6 className="fw-bold mb-0 text-dark">Inventory Valuation & Unit Audit Ledger</h6>
              <small className="text-secondary">
                Showing {items.length} of {totalItems} filtered physical SKUs
              </small>
            </div>

            {/* Sorting controls */}
            <div className="d-flex align-items-center gap-2">
              <span className="small text-secondary">Sort:</span>
              <select
                className="form-select form-select-sm"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                style={{ width: "160px" }}
              >
                <option value="updatedAt">Last Updated</option>
                <option value="totalValuation">Total Valuation</option>
                <option value="quantity">Physical On-Hand</option>
                <option value="availableQuantity">Available Units</option>
                <option value="reservedQuantity">Reserved Units</option>
                <option value="regularPrice">Unit Price</option>
                <option value="productTitle">Product Name</option>
                <option value="sku">SKU Code</option>
              </select>

              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                title="Toggle sort direction"
              >
                <i className={`bi bi-sort-${sortOrder === "asc" ? "up" : "down"}`}></i>
              </button>
            </div>
          </div>

          <div className="card-body p-0">
            {itemsLoading ? (
              <div
                className="d-flex justify-content-center align-items-center"
                style={{ height: "300px" }}
              >
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : items.length === 0 ? (
              <div className="p-5 text-center text-muted">
                <i className="bi bi-box-seam display-5 opacity-50 mb-2"></i>
                <p className="mb-0">No inventory records matching your filter criteria.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr style={{ fontSize: "0.8rem" }}>
                      <th>SKU & Barcode</th>
                      <th>Product & Options</th>
                      <th>Category & Brand</th>
                      <th className="text-end">Unit Price</th>
                      <th className="text-center">Stock Breakdown</th>
                      <th className="text-center">Condition</th>
                      <th className="text-end">Line Valuation</th>
                      <th className="text-center">Last Updated</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: "0.85rem" }}>
                    {items.map((it) => (
                      <tr key={it.variantId}>
                        <td>
                          <div className="font-monospace fw-bold text-dark">{it.sku}</div>
                          {it.barcode && (
                            <small className="text-muted font-monospace">{it.barcode}</small>
                          )}
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            {it.thumbnailUrl && (
                              <img
                                src={it.thumbnailUrl}
                                alt={it.productTitle}
                                className="rounded border flex-shrink-0"
                                style={{ width: "36px", height: "36px", objectFit: "cover" }}
                              />
                            )}
                            <div>
                              <div className="fw-semibold text-dark">{it.productTitle}</div>
                              {it.attributes && (
                                <small className="text-secondary">{it.attributes}</small>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div>{it.categoryName}</div>
                          {it.brandName && (
                            <small className="text-muted">{it.brandName}</small>
                          )}
                        </td>
                        <td className="text-end">
                          <div className="fw-bold">{formatCurrency(it.regularPrice)}</div>
                          {it.salePrice !== undefined && it.salePrice < it.regularPrice && (
                            <small className="badge bg-success-subtle text-success">
                              Sale: {formatCurrency(it.salePrice)}
                            </small>
                          )}
                        </td>
                        <td className="text-center">
                          <div className="d-flex align-items-center justify-content-center gap-1">
                            <span className="badge bg-light text-dark border" title="Physical on hand">
                              {it.quantity} on hand
                            </span>
                            <span className="badge bg-success" title="Available for immediate sale">
                              {it.availableQuantity} avail
                            </span>
                            {it.reservedQuantity > 0 && (
                              <span className="badge bg-warning text-dark" title="Committed to pending orders">
                                {it.reservedQuantity} res
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="text-center">
                          {getStockStatusBadge(it.stockStatus)}
                        </td>
                        <td className="text-end fw-bold text-dark">
                          {formatCurrency(it.totalValuation)}
                        </td>
                        <td className="text-center small text-secondary">
                          {new Date(it.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-xs py-1 px-2"
                            onClick={() => {
                              setAdjustModalItem(it);
                              setAdjustQty(10);
                            }}
                          >
                            <i className="bi bi-pencil-square me-1"></i>Adjust
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="card-footer bg-white border-top p-3 d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
              <span className="small text-secondary">
                Page {page} of {totalPages} ({totalItems} records)
              </span>

              <div className="btn-group btn-group-sm" role="group">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  <i className="bi bi-chevron-left me-1"></i>Prev
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                  const startPage = Math.max(1, Math.min(page - 2, totalPages - 4));
                  const pNum = startPage + idx;
                  if (pNum > totalPages) return null;
                  return (
                    <button
                      key={pNum}
                      type="button"
                      className={`btn ${pNum === page ? "btn-primary" : "btn-outline-secondary"}`}
                      onClick={() => setPage(pNum)}
                    >
                      {pNum}
                    </button>
                  );
                })}
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next<i className="bi bi-chevron-right ms-1"></i>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DEPLETION & RESTOCK ALERTS */}
      {activeTab === "alerts" && (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-bottom p-3">
            <h6 className="fw-bold mb-0 text-dark">
              Critical Depletion & Restock Reorder Alerts
            </h6>
            <small className="text-secondary">
              Items at or below safe threshold ({criticalAlerts.length} urgent replenishment requirements)
            </small>
          </div>
          <div className="card-body p-0">
            {criticalAlerts.length === 0 ? (
              <div className="p-5 text-center text-success">
                <i className="bi bi-check-circle display-4 mb-2"></i>
                <h6 className="fw-bold">All Inventory Healthy!</h6>
                <p className="text-secondary small mb-0">
                  No SKUs currently breached their low-stock threshold.
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr style={{ fontSize: "0.8rem" }}>
                      <th>Condition</th>
                      <th>SKU</th>
                      <th>Product & Category</th>
                      <th className="text-center">Physical Stock</th>
                      <th className="text-center">Committed/Reserved</th>
                      <th className="text-center">Available Units</th>
                      <th className="text-center">Threshold</th>
                      <th className="text-center text-danger">Stock Deficit</th>
                      <th className="text-end">Restock Action</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: "0.85rem" }}>
                    {criticalAlerts.map((alt) => (
                      <tr key={alt.variantId}>
                        <td>
                          {alt.status === "OUT_OF_STOCK" ? (
                            <span className="badge bg-danger">DEPLETED</span>
                          ) : (
                            <span className="badge bg-warning text-dark">LOW STOCK</span>
                          )}
                        </td>
                        <td>
                          <span className="font-monospace fw-bold">{alt.sku}</span>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            {alt.thumbnailUrl && (
                              <img
                                src={alt.thumbnailUrl}
                                alt={alt.productTitle}
                                className="rounded border"
                                style={{ width: "32px", height: "32px", objectFit: "cover" }}
                              />
                            )}
                            <div>
                              <div className="fw-semibold text-dark">{alt.productTitle}</div>
                              <small className="text-muted">{alt.categoryName}</small>
                            </div>
                          </div>
                        </td>
                        <td className="text-center">{alt.quantity}</td>
                        <td className="text-center text-warning fw-semibold">
                          {alt.reservedQuantity}
                        </td>
                        <td className="text-center fw-bold">
                          <span className={alt.availableQuantity <= 0 ? "text-danger" : "text-dark"}>
                            {alt.availableQuantity}
                          </span>
                        </td>
                        <td className="text-center">{alt.lowStockThreshold}</td>
                        <td className="text-center fw-bold text-danger">
                          +{alt.deficit} units required
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-success btn-xs py-1 px-2"
                            onClick={() => {
                              setAdjustModalItem({
                                variantId: alt.variantId,
                                sku: alt.sku,
                                productTitle: alt.productTitle,
                                categoryName: alt.categoryName,
                                regularPrice: 0,
                                effectivePrice: 0,
                                quantity: alt.quantity,
                                reservedQuantity: alt.reservedQuantity,
                                availableQuantity: alt.availableQuantity,
                                lowStockThreshold: alt.lowStockThreshold,
                                stockStatus: alt.status === "OUT_OF_STOCK" ? "OUT_OF_STOCK" : "LOW_STOCK",
                                totalValuation: 0,
                                productId: "",
                                productSlug: "",
                                updatedAt: new Date().toISOString(),
                              });
                              setAdjustType("RESTOCK");
                              setAdjustQty(Math.max(10, alt.deficit * 2));
                            }}
                          >
                            <i className="bi bi-plus-circle me-1"></i>Quick Restock
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Stock Adjustment Modal */}
      {adjustModalItem && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-light">
                <h5 className="modal-title fw-bold text-dark">
                  <i className="bi bi-box-arrow-in-down me-2 text-primary"></i>
                  Quick Stock Adjustment
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setAdjustModalItem(null)}
                ></button>
              </div>

              <form onSubmit={handleStockAdjustSubmit}>
                <div className="modal-body p-4">
                  {/* SKU & Product Header */}
                  <div className="bg-light p-3 rounded mb-3">
                    <div className="text-secondary small">Product & SKU:</div>
                    <div className="fw-bold text-dark">{adjustModalItem.productTitle}</div>
                    <div className="font-monospace small text-primary">{adjustModalItem.sku}</div>
                    <div className="d-flex align-items-center gap-3 mt-2 small text-secondary">
                      <span>On-Hand: <strong>{adjustModalItem.quantity}</strong></span>
                      <span>Reserved: <strong>{adjustModalItem.reservedQuantity}</strong></span>
                      <span>Available: <strong className="text-success">{adjustModalItem.availableQuantity}</strong></span>
                    </div>
                  </div>

                  {/* Operation Type */}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">
                      Adjustment Type
                    </label>
                    <select
                      className="form-select form-select-sm"
                      value={adjustType}
                      onChange={(e) => setAdjustType(e.target.value as any)}
                    >
                      <option value="RESTOCK">RESTOCK (Warehouse Supply Addition)</option>
                      <option value="MANUAL_ADJUSTMENT">MANUAL_ADJUSTMENT (Audit Correction)</option>
                      <option value="DAMAGED">DAMAGED (Write-off / Loss Deduction)</option>
                    </select>
                  </div>

                  {/* Quantity */}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">
                      Quantity {adjustType === "DAMAGED" ? "to Deduct" : "to Add"}
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="form-control form-control-sm"
                      value={adjustQty}
                      onChange={(e) => setAdjustQty(Math.max(1, Number(e.target.value)))}
                      required
                    />
                  </div>

                  {/* Notes */}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">
                      Audit Note / Explanation
                    </label>
                    <textarea
                      className="form-control form-control-sm"
                      rows={2}
                      placeholder="e.g. Supplier delivery invoice #INV-492..."
                      value={adjustNotes}
                      onChange={(e) => setAdjustNotes(e.target.value)}
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer bg-light p-3">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setAdjustModalItem(null)}
                    disabled={adjustSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={adjustSubmitting}
                  >
                    {adjustSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                        Recording...
                      </>
                    ) : (
                      "Confirm Adjustment"
                    )}
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
