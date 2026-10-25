"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  couponsApi,
  CouponItem,
  CouponStats,
  CouponComputedStatus,
  DiscountType,
  CreateCouponPayload,
  UpdateCouponPayload,
} from "../../../services/coupons";
import { useAuth } from "@/context/AuthContext";

function formatBDT(amount: number | string | null | undefined): string {
  const num = Number(amount || 0);
  return `BDT ${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function toDatetimeLocalValue(isoString: string): string {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function formatShortDate(isoString: string): string {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(isoString: string): string {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CouponsManagementPage() {
  const { can } = useAuth();

  // Data state
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [stats, setStats] = useState<CouponStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [discountTypeFilter, setDiscountTypeFilter] = useState<
    DiscountType | ""
  >("");
  const [statusFilter, setStatusFilter] = useState<CouponComputedStatus | "">(
    "",
  );

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Alert feedback
  const [alert, setAlert] = useState<{
    type: "success" | "danger" | "info" | "warning";
    text: string;
  } | null>(null);

  // Modals state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCouponDetails, setSelectedCouponDetails] =
    useState<CouponItem | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCoupon, setDeletingCoupon] = useState<CouponItem | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    code: string;
    description: string;
    discountType: DiscountType;
    discountValue: string;
    minOrderAmount: string;
    maxDiscountAmount: string;
    totalUsageLimit: string;
    perCustomerLimit: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
  }>({
    code: "",
    description: "",
    discountType: "FIXED_AMOUNT",
    discountValue: "500",
    minOrderAmount: "1000",
    maxDiscountAmount: "",
    totalUsageLimit: "1000",
    perCustomerLimit: "1",
    startDate: "",
    endDate: "",
    isActive: true,
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch Coupons & KPI stats
  const fetchCouponsAndStats = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        couponsApi.getCoupons({
          page,
          limit,
          search: debouncedSearch || undefined,
          discountType: discountTypeFilter || undefined,
          status: statusFilter || undefined,
        }),
        couponsApi.getStats(),
      ]);
      setCoupons(listRes.items);
      setTotal(listRes.total);
      setTotalPages(listRes.totalPages);
      setStats(statsRes);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to load coupons.";
      setAlert({ type: "danger", text: msg });
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, discountTypeFilter, statusFilter]);

  useEffect(() => {
    fetchCouponsAndStats();
  }, [fetchCouponsAndStats]);

  // Copy coupon code to clipboard
  const handleCopyCode = async (coupon: CouponItem) => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopiedId(coupon.id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // Fallback ignored
    }
  };

  // Generate random promo code
  const handleGenerateRandomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let randomPart = "";
    for (let i = 0; i < 5; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({
      ...prev,
      code: `AZ-${randomPart}`,
    }));
  };

  // Apply quick duration preset relative to startDate
  const handleApplyDatePreset = (days: number) => {
    const base = formData.startDate ? new Date(formData.startDate) : new Date();
    const start = isNaN(base.getTime()) ? new Date() : base;
    const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
    setFormData((prev) => ({
      ...prev,
      startDate: toDatetimeLocalValue(start.toISOString()),
      endDate: toDatetimeLocalValue(end.toISOString()),
    }));
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    setEditingCoupon(null);
    setFormData({
      code: "",
      description: "",
      discountType: "FIXED_AMOUNT",
      discountValue: "500",
      minOrderAmount: "1000",
      maxDiscountAmount: "",
      totalUsageLimit: "500",
      perCustomerLimit: "1",
      startDate: toDatetimeLocalValue(now.toISOString()),
      endDate: toDatetimeLocalValue(nextMonth.toISOString()),
      isActive: true,
    });
    setShowFormModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (coupon: CouponItem) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || "",
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      minOrderAmount:
        coupon.minOrderAmount !== null && coupon.minOrderAmount !== undefined
          ? String(coupon.minOrderAmount)
          : "",
      maxDiscountAmount:
        coupon.maxDiscountAmount !== null &&
        coupon.maxDiscountAmount !== undefined
          ? String(coupon.maxDiscountAmount)
          : "",
      totalUsageLimit:
        coupon.totalUsageLimit !== null && coupon.totalUsageLimit !== undefined
          ? String(coupon.totalUsageLimit)
          : "",
      perCustomerLimit: String(coupon.perCustomerLimit ?? 1),
      startDate: toDatetimeLocalValue(coupon.startDate),
      endDate: toDatetimeLocalValue(coupon.endDate),
      isActive: coupon.isActive,
    });
    setShowFormModal(true);
  };

  // Open Details & Redemptions Modal
  const handleOpenDetails = async (coupon: CouponItem) => {
    setSelectedCouponDetails(coupon);
    setShowDetailsModal(true);
    setLoadingDetails(true);
    try {
      const fullDetails = await couponsApi.getCouponById(coupon.id);
      setSelectedCouponDetails(fullDetails);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to load coupon redemption history.";
      setAlert({ type: "danger", text: msg });
    } finally {
      setLoadingDetails(false);
    }
  };

  // Save (Create or Update) Coupon
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = formData.code.trim().toUpperCase().replace(/\s+/g, "");
    const discountVal = parseFloat(formData.discountValue);

    if (!cleanCode) {
      setAlert({ type: "warning", text: "Please provide a valid coupon code." });
      return;
    }
    if (isNaN(discountVal) || discountVal <= 0) {
      setAlert({
        type: "warning",
        text: "Discount value must be greater than 0.",
      });
      return;
    }
    if (formData.discountType === "PERCENTAGE" && discountVal > 100) {
      setAlert({
        type: "warning",
        text: "Percentage discount cannot exceed 100%.",
      });
      return;
    }

    const startIso = new Date(formData.startDate).toISOString();
    const endIso = new Date(formData.endDate).toISOString();
    if (new Date(endIso) <= new Date(startIso)) {
      setAlert({
        type: "warning",
        text: "Validity end date must be after the start date.",
      });
      return;
    }

    const minOrderVal = formData.minOrderAmount.trim()
      ? parseFloat(formData.minOrderAmount)
      : null;
    const maxDiscVal = formData.maxDiscountAmount.trim()
      ? parseFloat(formData.maxDiscountAmount)
      : null;
    const totalLimitVal = formData.totalUsageLimit.trim()
      ? parseInt(formData.totalUsageLimit, 10)
      : null;
    const perCustomerVal = Math.max(
      1,
      parseInt(formData.perCustomerLimit || "1", 10) || 1,
    );

    setModalSubmitting(true);
    try {
      if (editingCoupon) {
        const payload: UpdateCouponPayload = {
          code: cleanCode,
          description: formData.description.trim() || null,
          discountType: formData.discountType,
          discountValue: discountVal,
          minOrderAmount: minOrderVal,
          maxDiscountAmount: maxDiscVal,
          totalUsageLimit: totalLimitVal,
          perCustomerLimit: perCustomerVal,
          startDate: startIso,
          endDate: endIso,
          isActive: formData.isActive,
        };
        const updated = await couponsApi.updateCoupon(
          editingCoupon.id,
          payload,
        );
        setAlert({
          type: "success",
          text: `Coupon "${updated.code}" updated successfully.`,
        });
      } else {
        const payload: CreateCouponPayload = {
          code: cleanCode,
          description: formData.description.trim() || null,
          discountType: formData.discountType,
          discountValue: discountVal,
          minOrderAmount: minOrderVal,
          maxDiscountAmount: maxDiscVal,
          totalUsageLimit: totalLimitVal,
          perCustomerLimit: perCustomerVal,
          startDate: startIso,
          endDate: endIso,
          isActive: formData.isActive,
        };
        const created = await couponsApi.createCoupon(payload);
        setAlert({
          type: "success",
          text: `Promotional coupon "${created.code}" created successfully.`,
        });
      }
      setShowFormModal(false);
      fetchCouponsAndStats();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to save coupon.";
      setAlert({ type: "danger", text: msg });
    } finally {
      setModalSubmitting(false);
    }
  };

  // Toggle Active status
  const handleToggleStatus = async (coupon: CouponItem) => {
    const nextStatus = !coupon.isActive;
    setCoupons((prev) =>
      prev.map((c) =>
        c.id === coupon.id ? { ...c, isActive: nextStatus } : c,
      ),
    );

    try {
      await couponsApi.toggleStatus(coupon.id, nextStatus);
      setAlert({
        type: "success",
        text: `Coupon "${coupon.code}" is now ${
          nextStatus ? "Active" : "Inactive"
        }.`,
      });
      fetchCouponsAndStats();
    } catch (err: unknown) {
      setCoupons((prev) =>
        prev.map((c) =>
          c.id === coupon.id ? { ...c, isActive: !nextStatus } : c,
        ),
      );
      const msg =
        err instanceof Error ? err.message : "Failed to toggle coupon status.";
      setAlert({ type: "danger", text: msg });
    }
  };

  // Confirm Delete or Deactivate
  const handleConfirmDelete = async () => {
    if (!deletingCoupon) return;
    setModalSubmitting(true);
    try {
      const res = await couponsApi.deleteCoupon(deletingCoupon.id);
      setAlert({
        type: res.deactivated ? "info" : "success",
        text: res.message,
      });
      setShowDeleteModal(false);
      setDeletingCoupon(null);
      fetchCouponsAndStats();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to delete coupon.";
      setAlert({ type: "danger", text: msg });
    } finally {
      setModalSubmitting(false);
    }
  };

  // Render lifecycle status badge
  const renderStatusBadge = (status: CouponComputedStatus) => {
    switch (status) {
      case "LIVE":
        return (
          <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 d-inline-flex align-items-center gap-1">
            <i className="bi bi-check-circle-fill"></i>
            <span>Live</span>
          </span>
        );
      case "SCHEDULED":
        return (
          <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle px-2 py-1 d-inline-flex align-items-center gap-1">
            <i className="bi bi-calendar-event"></i>
            <span>Scheduled</span>
          </span>
        );
      case "EXPIRED":
        return (
          <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-2 py-1 d-inline-flex align-items-center gap-1">
            <i className="bi bi-clock-history"></i>
            <span>Expired</span>
          </span>
        );
      case "EXHAUSTED":
        return (
          <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1 d-inline-flex align-items-center gap-1">
            <i className="bi bi-slash-circle"></i>
            <span>Limit Reached</span>
          </span>
        );
      case "INACTIVE":
      default:
        return (
          <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1 d-inline-flex align-items-center gap-1">
            <i className="bi bi-pause-circle"></i>
            <span>Inactive</span>
          </span>
        );
    }
  };

  return (
    <div className="container-fluid p-4">
      {/* Breadcrumb & Page Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1 small text-secondary">
              <li className="breadcrumb-item">
                <Link href="/" className="text-decoration-none text-secondary">
                  Dashboard
                </Link>
              </li>
              <li className="breadcrumb-item">Marketing</li>
              <li
                className="breadcrumb-item active text-body fw-semibold"
                aria-current="page"
              >
                Coupons & Promotions
              </li>
            </ol>
          </nav>
          <h1 className="h3 fw-bold text-body mb-0 d-flex align-items-center gap-2">
            <i className="bi bi-ticket-perforated text-primary"></i>
            <span>Coupons Management</span>
          </h1>
          <p className="text-secondary small mb-0 mt-1">
            Create and manage promotional discount codes, minimum spend rules,
            per-customer limits, and campaign validity windows.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 shadow-sm"
            onClick={fetchCouponsAndStats}
            title="Refresh coupons"
            disabled={loading}
          >
            <i className={`bi bi-arrow-clockwise ${loading ? "spin" : ""}`}></i>
            <span className="d-none d-sm-inline">Refresh</span>
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm"
            onClick={handleOpenCreate}
            disabled={!can("marketing", "create")}
          >
            <i className="bi bi-plus-lg"></i>
            <span>Create Coupon</span>
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {alert && (
        <div
          className={`alert alert-${alert.type} alert-dismissible fade show shadow-sm d-flex align-items-center gap-2 mb-4`}
          role="alert"
        >
          <i
            className={`bi ${
              alert.type === "success"
                ? "bi-check-circle-fill text-success"
                : alert.type === "warning"
                  ? "bi-exclamation-triangle-fill text-warning"
                  : alert.type === "danger"
                    ? "bi-x-circle-fill text-danger"
                    : "bi-info-circle-fill text-info"
            } fs-5`}
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

      {/* KPI Stat Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-3 h-100 bg-body">
            <div className="card-body d-flex align-items-center gap-3">
              <div
                className="bg-primary bg-opacity-10 text-primary rounded-3 d-flex align-items-center justify-content-center p-3"
                style={{ width: "52px", height: "52px" }}
              >
                <i className="bi bi-ticket-perforated fs-4"></i>
              </div>
              <div>
                <span className="text-secondary small fw-medium text-uppercase">
                  Total Coupons
                </span>
                <h4 className="fw-bold mb-0 text-body">
                  {stats ? stats.totalCoupons : total}
                </h4>
                <small className="text-secondary" style={{ fontSize: "0.75rem" }}>
                  {stats?.scheduledCoupons ?? 0} scheduled ·{" "}
                  {stats?.expiredOrExhaustedCoupons ?? 0} ended
                </small>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-3 h-100 bg-body">
            <div className="card-body d-flex align-items-center gap-3">
              <div
                className="bg-success bg-opacity-10 text-success rounded-3 d-flex align-items-center justify-content-center p-3"
                style={{ width: "52px", height: "52px" }}
              >
                <i className="bi bi-lightning-charge-fill fs-4"></i>
              </div>
              <div>
                <span className="text-secondary small fw-medium text-uppercase">
                  Live Campaigns
                </span>
                <h4 className="fw-bold mb-0 text-body">
                  {stats ? stats.liveCoupons : 0}
                </h4>
                <small className="text-success" style={{ fontSize: "0.75rem" }}>
                  Redeemable at checkout now
                </small>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-3 h-100 bg-body">
            <div className="card-body d-flex align-items-center gap-3">
              <div
                className="bg-info bg-opacity-10 text-info rounded-3 d-flex align-items-center justify-content-center p-3"
                style={{ width: "52px", height: "52px" }}
              >
                <i className="bi bi-bag-check-fill fs-4"></i>
              </div>
              <div>
                <span className="text-secondary small fw-medium text-uppercase">
                  Total Redemptions
                </span>
                <h4 className="fw-bold mb-0 text-body">
                  {stats ? stats.totalRedemptions : 0}
                </h4>
                <small className="text-secondary" style={{ fontSize: "0.75rem" }}>
                  Verified order applications
                </small>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-3 h-100 bg-body">
            <div className="card-body d-flex align-items-center gap-3">
              <div
                className="bg-warning bg-opacity-10 text-warning-emphasis rounded-3 d-flex align-items-center justify-content-center p-3"
                style={{ width: "52px", height: "52px" }}
              >
                <i className="bi bi-piggy-bank-fill fs-4"></i>
              </div>
              <div>
                <span className="text-secondary small fw-medium text-uppercase">
                  Total Savings Granted
                </span>
                <h5 className="fw-bold mb-0 text-body">
                  {formatBDT(stats?.totalDiscountGranted ?? 0)}
                </h5>
                <small className="text-secondary" style={{ fontSize: "0.75rem" }}>
                  Cumulative promotional discount
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card shadow-sm border-0 rounded-3">
        {/* Filter Controls Header */}
        <div className="card-header bg-body border-bottom py-3">
          <div className="row g-2 align-items-center justify-content-between">
            <div className="col-12 col-md-5">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-body-tertiary border-end-0">
                  <i className="bi bi-search text-secondary"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Search by coupon code or campaign description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    className="btn btn-outline-secondary border-start-0"
                    type="button"
                    onClick={() => setSearchTerm("")}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>
            </div>

            <div className="col-12 col-md-7 d-flex flex-wrap align-items-center justify-content-md-end gap-2">
              <select
                className="form-select form-select-sm"
                value={discountTypeFilter}
                onChange={(e) => {
                  setDiscountTypeFilter(e.target.value as DiscountType | "");
                  setPage(1);
                }}
                style={{ maxWidth: "180px" }}
              >
                <option value="">All Discount Types</option>
                <option value="FIXED_AMOUNT">Fixed Amount (BDT)</option>
                <option value="PERCENTAGE">Percentage (%)</option>
              </select>

              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as CouponComputedStatus | "");
                  setPage(1);
                }}
                style={{ maxWidth: "170px" }}
              >
                <option value="">All Lifecycle States</option>
                <option value="LIVE">Live Only</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="EXPIRED">Expired</option>
                <option value="EXHAUSTED">Limit Reached</option>
                <option value="INACTIVE">Inactive</option>
              </select>

              {(searchTerm || discountTypeFilter || statusFilter) && (
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => {
                    setSearchTerm("");
                    setDiscountTypeFilter("");
                    setStatusFilter("");
                    setPage(1);
                  }}
                  title="Reset filters"
                >
                  <i className="bi bi-arrow-counterclockwise"></i>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-secondary small text-uppercase">
              <tr>
                <th scope="col" style={{ minWidth: "220px" }}>
                  Coupon Code & Campaign
                </th>
                <th scope="col" style={{ minWidth: "150px" }}>
                  Discount Rule
                </th>
                <th scope="col" style={{ minWidth: "130px" }}>
                  Min. Order Spend
                </th>
                <th scope="col" style={{ minWidth: "170px" }}>
                  Usage & Limits
                </th>
                <th scope="col" style={{ minWidth: "180px" }}>
                  Validity Window
                </th>
                <th
                  scope="col"
                  style={{ width: "90px" }}
                  className="text-center"
                >
                  Active
                </th>
                <th scope="col" style={{ width: "140px" }} className="text-end">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-secondary">
                    <div
                      className="spinner-border spinner-border-sm text-primary me-2"
                      role="status"
                    ></div>
                    <span>Loading promotional coupons...</span>
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-5">
                    <div className="d-flex flex-column align-items-center justify-content-center">
                      <i className="bi bi-ticket-perforated text-secondary opacity-50 display-4 mb-2"></i>
                      <h6 className="fw-semibold text-secondary">
                        No Promotional Coupons Found
                      </h6>
                      <p className="text-secondary small mb-3">
                        {searchTerm || discountTypeFilter || statusFilter
                          ? "No coupons match your current search or filter criteria."
                          : "No coupons have been created yet. Create your first promo code to boost conversions."}
                      </p>
                      {can("marketing", "create") && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={handleOpenCreate}
                        >
                          <i className="bi bi-plus-lg me-1"></i> Create Coupon
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => {
                  const usagePercent =
                    coupon.totalUsageLimit && coupon.totalUsageLimit > 0
                      ? Math.min(
                          100,
                          Math.round(
                            (coupon.usagesCount / coupon.totalUsageLimit) * 100,
                          ),
                        )
                      : 0;

                  return (
                    <tr key={coupon.id}>
                      {/* Code & Description */}
                      <td>
                        <div className="d-flex flex-column gap-1">
                          <div className="d-flex align-items-center gap-2">
                            <span className="badge font-monospace bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 fs-6 fw-bold">
                              {coupon.code}
                            </span>
                            <button
                              type="button"
                              className="btn btn-link btn-sm p-0 text-secondary text-decoration-none"
                              onClick={() => handleCopyCode(coupon)}
                              title="Copy code"
                            >
                              {copiedId === coupon.id ? (
                                <i className="bi bi-check2 text-success"></i>
                              ) : (
                                <i className="bi bi-clipboard"></i>
                              )}
                            </button>
                          </div>
                          {coupon.description ? (
                            <span
                              className="text-secondary small text-truncate"
                              style={{ maxWidth: "280px" }}
                              title={coupon.description}
                            >
                              {coupon.description}
                            </span>
                          ) : (
                            <span className="text-secondary small fst-italic">
                              No description
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Discount Rule */}
                      <td>
                        {coupon.discountType === "PERCENTAGE" ? (
                          <div className="d-flex flex-column">
                            <span className="fw-bold text-success">
                              {Number(coupon.discountValue).toFixed(0)}% OFF
                            </span>
                            <small className="text-secondary">
                              {coupon.maxDiscountAmount
                                ? `Max cap: ${formatBDT(coupon.maxDiscountAmount)}`
                                : "No max cap"}
                            </small>
                          </div>
                        ) : (
                          <div className="d-flex flex-column">
                            <span className="fw-bold text-primary">
                              {formatBDT(coupon.discountValue)} OFF
                            </span>
                            <small className="text-secondary">
                              Fixed discount
                            </small>
                          </div>
                        )}
                      </td>

                      {/* Min Order Spend */}
                      <td>
                        {coupon.minOrderAmount ? (
                          <span className="fw-semibold text-body small">
                            {formatBDT(coupon.minOrderAmount)}
                          </span>
                        ) : (
                          <span className="badge bg-light text-secondary border">
                            No Minimum
                          </span>
                        )}
                      </td>

                      {/* Usage & Limits */}
                      <td>
                        <div className="d-flex flex-column gap-1">
                          <div className="d-flex align-items-center justify-content-between small">
                            <span className="fw-semibold text-body">
                              {coupon.usagesCount} /{" "}
                              {coupon.totalUsageLimit ?? "∞"} used
                            </span>
                            <span
                              className="badge bg-light text-secondary border"
                              title="Per-customer redemption limit"
                            >
                              {coupon.perCustomerLimit}x / user
                            </span>
                          </div>
                          {coupon.totalUsageLimit && (
                            <div
                              className="progress"
                              style={{ height: "5px" }}
                            >
                              <div
                                className={`progress-bar ${
                                  usagePercent >= 100
                                    ? "bg-danger"
                                    : usagePercent >= 80
                                      ? "bg-warning"
                                      : "bg-primary"
                                }`}
                                role="progressbar"
                                style={{ width: `${usagePercent}%` }}
                              ></div>
                            </div>
                          )}
                          {coupon.totalDiscountGiven > 0 && (
                            <small
                              className="text-secondary"
                              style={{ fontSize: "0.72rem" }}
                            >
                              Saved: {formatBDT(coupon.totalDiscountGiven)}
                            </small>
                          )}
                        </div>
                      </td>

                      {/* Validity Window & Status */}
                      <td>
                        <div className="d-flex flex-column gap-1">
                          <div>{renderStatusBadge(coupon.computedStatus)}</div>
                          <small
                            className="text-secondary"
                            style={{ fontSize: "0.75rem" }}
                          >
                            {formatShortDate(coupon.startDate)} →{" "}
                            {formatShortDate(coupon.endDate)}
                          </small>
                        </div>
                      </td>

                      {/* Active Switch */}
                      <td className="text-center">
                        <div className="form-check form-switch d-inline-block m-0">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            checked={coupon.isActive}
                            onChange={() => handleToggleStatus(coupon)}
                            disabled={!can("marketing", "update")}
                            title="Toggle coupon active status"
                          />
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="text-end">
                        <div className="btn-group btn-group-sm" role="group">
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={() => handleOpenDetails(coupon)}
                            title="View Details & Redemptions"
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => handleOpenEdit(coupon)}
                            title="Edit Coupon"
                            disabled={!can("marketing", "update")}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => {
                              setDeletingCoupon(coupon);
                              setShowDeleteModal(true);
                            }}
                            title="Delete or Deactivate Coupon"
                            disabled={!can("marketing", "delete")}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="card-footer bg-body border-top py-2 d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2">
            <span className="text-secondary small">
              Showing page {page} of {totalPages} ({total} total coupons)
            </span>
            <ul className="pagination pagination-sm m-0">
              <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>
              </li>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <li
                  key={p}
                  className={`page-item ${page === p ? "active" : ""}`}
                >
                  <button className="page-link" onClick={() => setPage(p)}>
                    {p}
                  </button>
                </li>
              ))}
              <li
                className={`page-item ${page === totalPages ? "disabled" : ""}`}
              >
                <button
                  className="page-link"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* CREATE / EDIT COUPON MODAL */}
      {showFormModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content shadow-lg border-0 rounded-3">
              <form onSubmit={handleSaveCoupon}>
                <div className="modal-header bg-body border-bottom">
                  <h5 className="modal-title fw-bold text-body d-flex align-items-center gap-2">
                    <i className="bi bi-ticket-perforated text-primary"></i>
                    <span>
                      {editingCoupon
                        ? `Edit Coupon: ${editingCoupon.code}`
                        : "Create Promotional Coupon"}
                    </span>
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowFormModal(false)}
                    disabled={modalSubmitting}
                  ></button>
                </div>

                <div className="modal-body p-4">
                  {/* Code & Description */}
                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-5">
                      <label className="form-label small fw-semibold text-secondary">
                        Coupon Code <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control font-monospace fw-bold text-uppercase"
                          placeholder="e.g. AZDEAL"
                          value={formData.code}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              code: e.target.value
                                .toUpperCase()
                                .replace(/\s+/g, ""),
                            })
                          }
                          maxLength={50}
                          required
                          autoFocus
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={handleGenerateRandomCode}
                          title="Generate random promo code"
                        >
                          <i className="bi bi-magic me-1"></i>Generate
                        </button>
                      </div>
                      <small
                        className="text-secondary"
                        style={{ fontSize: "0.74rem" }}
                      >
                        Customers enter this uppercase code at cart/checkout.
                      </small>
                    </div>

                    <div className="col-12 col-md-7">
                      <label className="form-label small fw-semibold text-secondary">
                        Campaign Description
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Flat ৳500 discount on orders over ৳1,000"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        maxLength={255}
                      />
                      <small
                        className="text-secondary"
                        style={{ fontSize: "0.74rem" }}
                      >
                        Displayed in admin and checkout coupon summary.
                      </small>
                    </div>
                  </div>

                  {/* Discount Type & Value */}
                  <div className="row g-3 mb-3">
                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-semibold text-secondary">
                        Discount Calculation Type{" "}
                        <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={formData.discountType}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discountType: e.target.value as DiscountType,
                          })
                        }
                      >
                        <option value="FIXED_AMOUNT">
                          Fixed Amount (BDT ৳)
                        </option>
                        <option value="PERCENTAGE">
                          Percentage Discount (%)
                        </option>
                      </select>
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-semibold text-secondary">
                        Discount Value <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        {formData.discountType === "FIXED_AMOUNT" && (
                          <span className="input-group-text">BDT</span>
                        )}
                        <input
                          type="number"
                          className="form-control"
                          placeholder={
                            formData.discountType === "PERCENTAGE"
                              ? "10"
                              : "500.00"
                          }
                          min="0.01"
                          max={
                            formData.discountType === "PERCENTAGE"
                              ? "100"
                              : undefined
                          }
                          step="0.01"
                          value={formData.discountValue}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              discountValue: e.target.value,
                            })
                          }
                          required
                        />
                        {formData.discountType === "PERCENTAGE" && (
                          <span className="input-group-text">%</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Financial Safeguards: Min Order Spend & Max Discount Cap */}
                  <div className="row g-3 mb-3">
                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-semibold text-secondary">
                        Minimum Order Subtotal (Optional)
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">BDT</span>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="No minimum spend"
                          min="0"
                          step="0.01"
                          value={formData.minOrderAmount}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              minOrderAmount: e.target.value,
                            })
                          }
                        />
                      </div>
                      <small
                        className="text-secondary"
                        style={{ fontSize: "0.74rem" }}
                      >
                        Minimum cart subtotal before coupon can be applied.
                      </small>
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-semibold text-secondary">
                        Maximum Discount Cap (Optional)
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">BDT</span>
                        <input
                          type="number"
                          className="form-control"
                          placeholder={
                            formData.discountType === "PERCENTAGE"
                              ? "e.g. 2000.00"
                              : "Not applicable for fixed"
                          }
                          min="0"
                          step="0.01"
                          value={formData.maxDiscountAmount}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              maxDiscountAmount: e.target.value,
                            })
                          }
                        />
                      </div>
                      <small
                        className="text-secondary"
                        style={{ fontSize: "0.74rem" }}
                      >
                        Caps the maximum BDT savings on percentage discounts.
                      </small>
                    </div>
                  </div>

                  {/* Usage Limits */}
                  <div className="row g-3 mb-3">
                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-semibold text-secondary">
                        Total Global Usage Limit (Optional)
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Unlimited redemptions"
                        min="1"
                        step="1"
                        value={formData.totalUsageLimit}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            totalUsageLimit: e.target.value,
                          })
                        }
                      />
                      <small
                        className="text-secondary"
                        style={{ fontSize: "0.74rem" }}
                      >
                        Leave blank for unlimited global redemptions.
                      </small>
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-semibold text-secondary">
                        Per-Customer Usage Limit{" "}
                        <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="1"
                        min="1"
                        step="1"
                        value={formData.perCustomerLimit}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            perCustomerLimit: e.target.value,
                          })
                        }
                        required
                      />
                      <small
                        className="text-secondary"
                        style={{ fontSize: "0.74rem" }}
                      >
                        Maximum redemptions allowed per customer account.
                      </small>
                    </div>
                  </div>

                  {/* Validity Dates & Quick Presets */}
                  <div className="mb-3">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <label className="form-label small fw-semibold text-secondary mb-0">
                        Validity Window <span className="text-danger">*</span>
                      </label>
                      <div className="d-flex align-items-center gap-1">
                        <span
                          className="text-secondary me-1"
                          style={{ fontSize: "0.74rem" }}
                        >
                          Quick duration:
                        </span>
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm py-0 px-2"
                          style={{ fontSize: "0.72rem" }}
                          onClick={() => handleApplyDatePreset(7)}
                        >
                          +7d
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm py-0 px-2"
                          style={{ fontSize: "0.72rem" }}
                          onClick={() => handleApplyDatePreset(30)}
                        >
                          +30d
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm py-0 px-2"
                          style={{ fontSize: "0.72rem" }}
                          onClick={() => handleApplyDatePreset(90)}
                        >
                          +90d
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm py-0 px-2"
                          style={{ fontSize: "0.72rem" }}
                          onClick={() => handleApplyDatePreset(365)}
                        >
                          +1yr
                        </button>
                      </div>
                    </div>

                    <div className="row g-3">
                      <div className="col-12 col-sm-6">
                        <label
                          className="form-label text-secondary"
                          style={{ fontSize: "0.75rem" }}
                        >
                          Start Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          className="form-control"
                          value={formData.startDate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              startDate: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="col-12 col-sm-6">
                        <label
                          className="form-label text-secondary"
                          style={{ fontSize: "0.75rem" }}
                        >
                          End Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          className="form-control"
                          value={formData.endDate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              endDate: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Active Switch */}
                  <div className="bg-body-tertiary p-3 rounded-2 border">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="couponActiveSwitch"
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isActive: e.target.checked,
                          })
                        }
                      />
                      <label
                        className="form-check-label small fw-medium"
                        htmlFor="couponActiveSwitch"
                      >
                        Coupon is Active and Enabled for Redemption
                      </label>
                      <div
                        className="text-secondary"
                        style={{ fontSize: "0.72rem" }}
                      >
                        When enabled, customers can redeem this code during the
                        configured validity dates.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-body border-top">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setShowFormModal(false)}
                    disabled={modalSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                    disabled={modalSubmitting}
                  >
                    {modalSubmitting && (
                      <span
                        className="spinner-border spinner-border-sm"
                        role="status"
                      ></span>
                    )}
                    <span>
                      {editingCoupon ? "Update Coupon" : "Create Coupon"}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* COUPON DETAILS & REDEMPTION HISTORY MODAL */}
      {showDetailsModal && selectedCouponDetails && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content shadow-lg border-0 rounded-3">
              <div className="modal-header bg-body border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge font-monospace bg-primary text-white px-2 py-1 fs-6">
                    {selectedCouponDetails.code}
                  </span>
                  {renderStatusBadge(selectedCouponDetails.computedStatus)}
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedCouponDetails(null);
                  }}
                ></button>
              </div>

              <div className="modal-body p-4">
                {selectedCouponDetails.description && (
                  <p className="text-secondary small mb-3">
                    {selectedCouponDetails.description}
                  </p>
                )}

                {/* Summary Grid */}
                <div className="row g-3 mb-4">
                  <div className="col-6 col-md-3">
                    <div className="p-3 rounded-2 bg-body-tertiary border h-100">
                      <span className="text-secondary small d-block">
                        Discount Value
                      </span>
                      <strong className="text-body">
                        {selectedCouponDetails.discountType === "PERCENTAGE"
                          ? `${selectedCouponDetails.discountValue}% OFF`
                          : formatBDT(selectedCouponDetails.discountValue)}
                      </strong>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="p-3 rounded-2 bg-body-tertiary border h-100">
                      <span className="text-secondary small d-block">
                        Min. Order / Cap
                      </span>
                      <strong className="text-body small">
                        Min:{" "}
                        {selectedCouponDetails.minOrderAmount
                          ? formatBDT(selectedCouponDetails.minOrderAmount)
                          : "None"}
                      </strong>
                      <small className="text-secondary d-block">
                        Cap:{" "}
                        {selectedCouponDetails.maxDiscountAmount
                          ? formatBDT(selectedCouponDetails.maxDiscountAmount)
                          : "None"}
                      </small>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="p-3 rounded-2 bg-body-tertiary border h-100">
                      <span className="text-secondary small d-block">
                        Redemptions
                      </span>
                      <strong className="text-body">
                        {selectedCouponDetails.usagesCount} /{" "}
                        {selectedCouponDetails.totalUsageLimit ?? "∞"}
                      </strong>
                      <small className="text-secondary d-block">
                        {selectedCouponDetails.perCustomerLimit}x per customer
                      </small>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="p-3 rounded-2 bg-body-tertiary border h-100">
                      <span className="text-secondary small d-block">
                        Total Discount Given
                      </span>
                      <strong className="text-success">
                        {formatBDT(selectedCouponDetails.totalDiscountGiven)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Redemptions Table */}
                <h6 className="fw-bold text-body mb-2 d-flex align-items-center gap-2">
                  <i className="bi bi-clock-history text-primary"></i>
                  <span>Customer Redemption History</span>
                </h6>

                {loadingDetails ? (
                  <div className="text-center py-4 text-secondary">
                    <div
                      className="spinner-border spinner-border-sm text-primary me-2"
                      role="status"
                    ></div>
                    <span>Loading redemptions...</span>
                  </div>
                ) : !selectedCouponDetails.usages ||
                  selectedCouponDetails.usages.length === 0 ? (
                  <div className="text-center py-4 bg-body-tertiary rounded-2 border text-secondary small">
                    No customer orders have redeemed this coupon yet.
                  </div>
                ) : (
                  <div className="table-responsive border rounded-2">
                    <table className="table table-sm table-hover align-middle mb-0">
                      <thead className="table-light text-secondary small">
                        <tr>
                          <th>Order #</th>
                          <th>Customer</th>
                          <th>Order Total</th>
                          <th>Discount Applied</th>
                          <th>Redeemed At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCouponDetails.usages.map((u) => (
                          <tr key={u.id}>
                            <td>
                              <Link
                                href={`/orders/${u.orderId}`}
                                className="fw-bold font-monospace text-primary text-decoration-none"
                              >
                                {u.orderNumber}
                              </Link>
                              <span className="badge bg-light text-secondary border ms-2">
                                {u.orderStatus}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex flex-column">
                                <span className="fw-medium text-body small">
                                  {u.customerName}
                                </span>
                                <small className="text-secondary">
                                  {u.customerEmail}
                                </small>
                              </div>
                            </td>
                            <td className="small fw-semibold">
                              {formatBDT(u.orderGrandTotal)}
                            </td>
                            <td className="small fw-bold text-success">
                              -{formatBDT(u.discountApplied)}
                            </td>
                            <td className="small text-secondary">
                              {formatDateTime(u.usedAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="modal-footer bg-body border-top">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedCouponDetails(null);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE / DEACTIVATE CONFIRMATION MODAL */}
      {showDeleteModal && deletingCoupon && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0 rounded-3">
              <div className="modal-header bg-body border-bottom">
                <h5 className="modal-title fw-bold text-danger d-flex align-items-center gap-2">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  <span>
                    {deletingCoupon.usagesCount > 0
                      ? "Deactivate Redeemed Coupon"
                      : "Delete Coupon"}
                  </span>
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingCoupon(null);
                  }}
                  disabled={modalSubmitting}
                ></button>
              </div>

              <div className="modal-body p-4">
                {deletingCoupon.usagesCount > 0 ? (
                  <>
                    <p className="text-body mb-2">
                      Coupon{" "}
                      <strong className="font-monospace">
                        {deletingCoupon.code}
                      </strong>{" "}
                      has already been redeemed in{" "}
                      <strong>{deletingCoupon.usagesCount} order(s)</strong>.
                    </p>
                    <p className="text-secondary small mb-0">
                      To preserve historical order invoices and financial audit
                      trails, this coupon will be{" "}
                      <strong>safely deactivated</strong> rather than
                      permanently deleted from the database.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-body mb-2">
                      Are you sure you want to permanently delete coupon{" "}
                      <strong className="font-monospace">
                        {deletingCoupon.code}
                      </strong>
                      ?
                    </p>
                    <p className="text-secondary small mb-0">
                      This coupon has 0 redemptions and will be permanently
                      removed.
                    </p>
                  </>
                )}
              </div>

              <div className="modal-footer bg-body border-top">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingCoupon(null);
                  }}
                  disabled={modalSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm d-flex align-items-center gap-1"
                  onClick={handleConfirmDelete}
                  disabled={modalSubmitting}
                >
                  {modalSubmitting && (
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                    ></span>
                  )}
                  <span>
                    {deletingCoupon.usagesCount > 0
                      ? "Deactivate Coupon"
                      : "Delete Permanently"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
