/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  AdminFreelancerItem,
  AdminFreelancerDetail,
  FreelancerStatus,
  adminFreelancersService,
} from "../../services/freelancers";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
const ASSET_BASE = API_BASE.replace("/api/v1", "");

export default function FreelancersManagementPage() {
  const [freelancers, setFreelancers] = useState<AdminFreelancerItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Summary Metrics Counters
  const [metrics, setMetrics] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    revisions: 0,
    suspended: 0,
  });
  const [metricsLoading, setMetricsLoading] = useState(true);

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"createdAt" | "experience" | "price" | "name">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Selection & Detail Modal
  const [selectedDetail, setSelectedDetail] = useState<AdminFreelancerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<"overview" | "locations" | "services" | "portfolio" | "moderation">("overview");

  // Action Modals State
  const [targetFreelancer, setTargetFreelancer] = useState<AdminFreelancerItem | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [suspendReason, setSuspendReason] = useState("");

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Global Notification Alert
  const [notification, setNotification] = useState<{
    type: "success" | "danger" | "info" | "warning";
    text: string;
  } | null>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Load Metrics
  const loadMetrics = useCallback(async () => {
    setMetricsLoading(true);
    try {
      const [allRes, pendingRes, approvedRes, suspendedRes, revisionsRes] = await Promise.allSettled([
        adminFreelancersService.getFreelancers({ limit: 1 }),
        adminFreelancersService.getFreelancers({ status: "PENDING", limit: 1 }),
        adminFreelancersService.getFreelancers({ status: "APPROVED", limit: 1 }),
        adminFreelancersService.getFreelancers({ status: "SUSPENDED", limit: 1 }),
        adminFreelancersService.getRevisions({ status: "PENDING", limit: 1 }),
      ]);

      setMetrics({
        total: allRes.status === "fulfilled" ? allRes.value.total : 0,
        pending: pendingRes.status === "fulfilled" ? pendingRes.value.total : 0,
        approved: approvedRes.status === "fulfilled" ? approvedRes.value.total : 0,
        suspended: suspendedRes.status === "fulfilled" ? suspendedRes.value.total : 0,
        revisions: revisionsRes.status === "fulfilled" ? revisionsRes.value.total : 0,
      });
    } catch {
      // Non-fatal
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  // Load Freelancers List
  const loadFreelancers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFreelancersService.getFreelancers({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        search: debouncedSearch.trim() || undefined,
        limit,
        offset: (page - 1) * limit,
      });
      setFreelancers(data.items);
      setTotal(data.total);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load freelancers list";
      setNotification({
        type: "danger",
        text: msg,
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch, page, limit]);

  useEffect(() => {
    loadFreelancers();
  }, [loadFreelancers]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  // Open Full Detail Modal
  const handleOpenDetail = async (freelancer: AdminFreelancerItem) => {
    setDetailLoading(true);
    setShowDetailModal(true);
    setActiveDetailTab("overview");
    try {
      const detail = await adminFreelancersService.getFreelancerById(freelancer.id);
      setSelectedDetail(detail);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load freelancer profile detail";
      setNotification({
        type: "danger",
        text: msg,
      });
      setShowDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // Moderation Actions
  const handleApprove = async () => {
    if (!targetFreelancer) return;
    setActionLoading(true);
    try {
      await adminFreelancersService.approveFreelancer(targetFreelancer.id);
      setNotification({
        type: "success",
        text: `Freelancer "${targetFreelancer.displayName}" was approved successfully and is now active on the marketplace!`,
      });
      setShowApproveModal(false);
      setTargetFreelancer(null);
      loadFreelancers();
      loadMetrics();
      if (selectedDetail && selectedDetail.id === targetFreelancer.id) {
        setShowDetailModal(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Approval failed";
      setNotification({ type: "danger", text: msg });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!targetFreelancer || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await adminFreelancersService.rejectFreelancer(targetFreelancer.id, rejectReason.trim());
      setNotification({
        type: "info",
        text: `Application for "${targetFreelancer.displayName}" was rejected with feedback recorded.`,
      });
      setShowRejectModal(false);
      setRejectReason("");
      setTargetFreelancer(null);
      loadFreelancers();
      loadMetrics();
      if (selectedDetail && selectedDetail.id === targetFreelancer.id) {
        setShowDetailModal(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Rejection failed";
      setNotification({ type: "danger", text: msg });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!targetFreelancer || !suspendReason.trim()) return;
    setActionLoading(true);
    try {
      await adminFreelancersService.suspendFreelancer(targetFreelancer.id, suspendReason.trim());
      setNotification({
        type: "warning",
        text: `Freelancer profile for "${targetFreelancer.displayName}" has been suspended from marketplace visibility.`,
      });
      setShowSuspendModal(false);
      setSuspendReason("");
      setTargetFreelancer(null);
      loadFreelancers();
      loadMetrics();
      if (selectedDetail && selectedDetail.id === targetFreelancer.id) {
        setShowDetailModal(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Suspension failed";
      setNotification({ type: "danger", text: msg });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReinstate = async (freelancer: AdminFreelancerItem) => {
    setActionLoading(true);
    try {
      await adminFreelancersService.reinstateFreelancer(freelancer.id);
      setNotification({
        type: "success",
        text: `Freelancer "${freelancer.displayName}" has been reinstated to Approved status.`,
      });
      loadFreelancers();
      loadMetrics();
      if (selectedDetail && selectedDetail.id === freelancer.id) {
        setSelectedDetail({ ...selectedDetail, status: "APPROVED" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Reinstate failed";
      setNotification({ type: "danger", text: msg });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyPhone = (phone: string, id: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(phone);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const resolveImageUrl = (path: string | null | undefined): string | null => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `${ASSET_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  };

  const totalPages = Math.ceil(total / limit) || 1;

  // Sorting
  const sortedFreelancers = useMemo(() => {
    const list = [...freelancers];
    return list.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") {
        comparison = (a.displayName || "").localeCompare(b.displayName || "");
      } else if (sortBy === "experience") {
        comparison = (a.experienceYears || 0) - (b.experienceYears || 0);
      } else if (sortBy === "price") {
        comparison = (a.startingPrice || 0) - (b.startingPrice || 0);
      } else {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [freelancers, sortBy, sortOrder]);

  const renderStatusBadge = (status: FreelancerStatus) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 d-inline-flex align-items-center gap-1">
            <i className="bi bi-patch-check-fill text-success" aria-hidden="true"></i>
            Approved
          </span>
        );
      case "PENDING":
        return (
          <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1 d-inline-flex align-items-center gap-1">
            <span
              className="spinner-grow spinner-grow-sm text-warning"
              style={{ width: "0.55rem", height: "0.55rem" }}
              role="status"
              aria-hidden="true"
            ></span>
            Pending Review
          </span>
        );
      case "REJECTED":
        return (
          <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1 d-inline-flex align-items-center gap-1">
            <i className="bi bi-x-circle-fill text-danger" aria-hidden="true"></i>
            Rejected
          </span>
        );
      case "SUSPENDED":
        return (
          <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-2 py-1 d-inline-flex align-items-center gap-1">
            <i className="bi bi-slash-circle-fill" aria-hidden="true"></i>
            Suspended
          </span>
        );
      case "DRAFT":
      default:
        return (
          <span className="badge bg-light text-dark border px-2 py-1 d-inline-flex align-items-center gap-1">
            <i className="bi bi-file-earmark-text" aria-hidden="true"></i>
            Draft
          </span>
        );
    }
  };

  const renderAvailabilityPill = (avail: string) => {
    switch (avail) {
      case "AVAILABLE":
        return (
          <span className="badge bg-success bg-opacity-10 text-success border border-success-subtle rounded-pill font-monospace" style={{ fontSize: "0.68rem" }}>
            ● Available
          </span>
        );
      case "BUSY":
        return (
          <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary-subtle rounded-pill font-monospace" style={{ fontSize: "0.68rem" }}>
            ● Busy
          </span>
        );
      case "UNAVAILABLE":
      default:
        return (
          <span className="badge bg-danger bg-opacity-10 text-danger border border-danger-subtle rounded-pill font-monospace" style={{ fontSize: "0.68rem" }}>
            ● Unavailable
          </span>
        );
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "FP";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const rejectionPresets = [
    "Clear, well-lit portrait photo is required for marketplace trust.",
    "Please add at least 1 verified service title with an accurate starting rate.",
    "Provided phone number could not be reached or verified.",
    "Primary coverage address is incomplete; please select your district and thana.",
    "Bio text is insufficient; please describe your professional background and tools.",
  ];

  return (
    <div className="container-fluid py-3 px-3 px-md-4">
      {/* Breadcrumb & Navigation Bar */}
      <div className="row align-items-center mb-3 g-2">
        <div className="col-12 col-md-7">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1">
              <li className="breadcrumb-item">
                <Link href="/" className="text-decoration-none">
                  Dashboard
                </Link>
              </li>
              <li className="breadcrumb-item">Marketplace</li>
              <li className="breadcrumb-item active" aria-current="page">
                Freelancers Directory
              </li>
            </ol>
          </nav>
          <div className="d-flex align-items-center gap-2">
            <div
              className="d-inline-flex align-items-center justify-content-center text-primary bg-primary bg-opacity-10 rounded-3 p-2"
              style={{ width: "38px", height: "38px" }}
            >
              <i className="bi bi-person-badge fs-5" aria-hidden="true"></i>
            </div>
            <div>
              <h1 className="h4 fw-bold text-dark mb-0 tracking-tight">
                Freelancers Directory & Moderation
              </h1>
              <p className="text-secondary small mb-0">
                Review verified professional profiles, manage Bangladesh service areas, and moderate applications.
              </p>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-5 text-md-end d-flex flex-wrap align-items-center justify-content-md-end gap-2 mt-2 mt-md-0">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary shadow-sm"
            onClick={() => {
              loadFreelancers();
              loadMetrics();
            }}
            disabled={loading}
            title="Refresh list and metrics"
          >
            <i className={`bi bi-arrow-clockwise me-1 ${loading ? "spinner-border spinner-border-sm" : ""}`}></i>
            Refresh
          </button>
          <Link
            href="/freelancers/approvals"
            className="btn btn-sm btn-outline-warning text-dark shadow-sm position-relative d-inline-flex align-items-center gap-1"
          >
            <i className="bi bi-hourglass-split text-warning me-1"></i>
            Approvals Queue
            {metrics.pending > 0 && (
              <span className="badge rounded-pill bg-warning text-dark ms-1">
                {metrics.pending}
              </span>
            )}
          </Link>
          <Link
            href="/freelancers/revisions"
            className="btn btn-sm btn-outline-info text-dark shadow-sm position-relative d-inline-flex align-items-center gap-1"
          >
            <i className="bi bi-arrow-repeat text-info me-1"></i>
            Revisions Queue
            {metrics.revisions > 0 && (
              <span className="badge rounded-pill bg-info text-white ms-1">
                {metrics.revisions}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Global Alert Notification */}
      {notification && (
        <div
          className={`alert alert-${notification.type} alert-dismissible fade show shadow-sm mb-3`}
          role="alert"
        >
          <div className="d-flex align-items-center gap-2">
            <i
              className={`bi ${
                notification.type === "success"
                  ? "bi-check-circle-fill text-success fs-5"
                  : notification.type === "danger"
                  ? "bi-exclamation-triangle-fill text-danger fs-5"
                  : notification.type === "warning"
                  ? "bi-shield-exclamation text-warning fs-5"
                  : "bi-info-circle-fill text-info fs-5"
              }`}
            ></i>
            <span className="fw-medium">{notification.text}</span>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={() => setNotification(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Metric Counters (Executive KPI Grid) */}
      <div className="row g-3 mb-3">
        {/* Total Profiles */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 border-start border-primary border-4 h-100 card-glass">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-uppercase fw-bold text-primary small" style={{ fontSize: "0.72rem", letterSpacing: "0.05em" }}>
                    Total Professionals
                  </div>
                  <div className="h4 mb-0 fw-bold text-dark tabular-nums">
                    {metricsLoading ? "..." : metrics.total}
                  </div>
                  <div className="text-secondary small mt-1">
                    Registered accounts across Bangladesh
                  </div>
                </div>
                <div
                  className="rounded-3 bg-primary bg-opacity-10 p-3 text-primary d-flex align-items-center justify-content-center"
                  style={{ width: "48px", height: "48px" }}
                >
                  <i className="bi bi-people-fill fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className={`card shadow-sm border-0 border-start border-warning border-4 h-100 card-glass ${
              metrics.pending > 0 ? "border-warning" : ""
            }`}
            style={{ cursor: "pointer" }}
            onClick={() => {
              setStatusFilter("PENDING");
              setPage(1);
            }}
            title="Click to filter by Pending"
          >
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-uppercase fw-bold text-warning small" style={{ fontSize: "0.72rem", letterSpacing: "0.05em" }}>
                    Pending Approvals
                  </div>
                  <div className="h4 mb-0 fw-bold text-dark tabular-nums d-flex align-items-center gap-2">
                    {metricsLoading ? "..." : metrics.pending}
                    {metrics.pending > 0 && (
                      <span className="badge rounded-pill bg-warning text-dark font-monospace" style={{ fontSize: "0.68rem" }}>
                        Action Needed
                      </span>
                    )}
                  </div>
                  <div className="text-secondary small mt-1">
                    Awaiting verification review
                  </div>
                </div>
                <div
                  className="rounded-3 bg-warning bg-opacity-10 p-3 text-warning d-flex align-items-center justify-content-center"
                  style={{ width: "48px", height: "48px" }}
                >
                  <i className="bi bi-hourglass-top fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Approved & Live */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="card shadow-sm border-0 border-start border-success border-4 h-100 card-glass"
            style={{ cursor: "pointer" }}
            onClick={() => {
              setStatusFilter("APPROVED");
              setPage(1);
            }}
            title="Click to filter by Approved"
          >
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-uppercase fw-bold text-success small" style={{ fontSize: "0.72rem", letterSpacing: "0.05em" }}>
                    Approved & Active
                  </div>
                  <div className="h4 mb-0 fw-bold text-dark tabular-nums">
                    {metricsLoading ? "..." : metrics.approved}
                  </div>
                  <div className="text-secondary small mt-1">
                    Publicly visible in hire catalog
                  </div>
                </div>
                <div
                  className="rounded-3 bg-success bg-opacity-10 p-3 text-success d-flex align-items-center justify-content-center"
                  style={{ width: "48px", height: "48px" }}
                >
                  <i className="bi bi-patch-check-fill fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Revisions & Suspended */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 border-start border-info border-4 h-100 card-glass">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-uppercase fw-bold text-info small" style={{ fontSize: "0.72rem", letterSpacing: "0.05em" }}>
                    Revisions & Watchlist
                  </div>
                  <div className="h4 mb-0 fw-bold text-dark tabular-nums">
                    {metricsLoading ? "..." : metrics.revisions}{" "}
                    <span className="text-secondary fw-normal fs-6">
                      / {metricsLoading ? "..." : metrics.suspended} susp.
                    </span>
                  </div>
                  <div className="text-secondary small mt-1">
                    Pending diffs & suspended
                  </div>
                </div>
                <div
                  className="rounded-3 bg-info bg-opacity-10 p-3 text-info d-flex align-items-center justify-content-center"
                  style={{ width: "48px", height: "48px" }}
                >
                  <i className="bi bi-shield-check fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Toolbar: Status Tabs & Filter Bar */}
      <div className="card shadow-sm border-0 mb-3 card-glass">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            {/* Status Pills */}
            <div className="col-12 col-lg-7">
              <div className="d-flex flex-wrap gap-1 align-items-center">
                <span className="text-secondary small fw-bold me-1 d-none d-sm-inline">
                  Status:
                </span>
                {[
                  { key: "ALL", label: "All Profiles", icon: "bi-grid" },
                  { key: "PENDING", label: "Pending", icon: "bi-clock-history", badge: metrics.pending },
                  { key: "APPROVED", label: "Approved", icon: "bi-patch-check" },
                  { key: "REJECTED", label: "Rejected", icon: "bi-x-circle" },
                  { key: "SUSPENDED", label: "Suspended", icon: "bi-slash-circle" },
                  { key: "DRAFT", label: "Draft", icon: "bi-pencil" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setStatusFilter(tab.key);
                      setPage(1);
                    }}
                    className={`btn btn-sm d-inline-flex align-items-center gap-1 ${
                      statusFilter === tab.key
                        ? "btn-primary shadow-sm"
                        : "btn-outline-secondary border-0 bg-body-tertiary text-dark"
                    }`}
                    style={{ fontSize: "0.78rem" }}
                  >
                    <i className={`bi ${tab.icon}`}></i>
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span
                        className={`badge rounded-pill ms-1 ${
                          statusFilter === tab.key
                            ? "bg-white text-primary"
                            : "bg-warning text-dark"
                        }`}
                        style={{ fontSize: "0.68rem" }}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input & Sort */}
            <div className="col-12 col-lg-5">
              <div className="d-flex gap-2 align-items-center justify-content-lg-end">
                <div className="input-group input-group-sm flex-grow-1" style={{ maxWidth: "260px" }}>
                  <span className="input-group-text bg-body-tertiary border-end-0">
                    <i className="bi bi-search text-secondary"></i>
                  </span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search name, phone, title..."
                    className="form-control border-start-0"
                    aria-label="Search freelancers"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary border-start-0"
                      onClick={() => setSearchTerm("")}
                      title="Clear search"
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  )}
                </div>

                <div className="d-flex align-items-center gap-1">
                  <select
                    className="form-select form-select-sm"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    style={{ width: "125px", fontSize: "0.78rem" }}
                    aria-label="Sort by"
                  >
                    <option value="createdAt">Date Joined</option>
                    <option value="name">Name (A-Z)</option>
                    <option value="experience">Experience</option>
                    <option value="price">Starting Rate</option>
                  </select>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    title={`Sort direction: ${sortOrder === "asc" ? "Ascending" : "Descending"}`}
                  >
                    <i className={`bi bi-sort-${sortOrder === "asc" ? "up" : "down"}`}></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Freelancers Directory Table */}
      <div className="card shadow-sm border-0 card-glass overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-secondary border-bottom">
              <tr>
                <th scope="col" style={{ minWidth: "240px" }} className="ps-3 py-3">
                  Professional Identity
                </th>
                <th scope="col" style={{ minWidth: "180px" }}>
                  Contact & Account
                </th>
                <th scope="col" style={{ minWidth: "170px" }}>
                  Primary Coverage
                </th>
                <th scope="col" style={{ minWidth: "140px" }}>
                  Experience & Rate
                </th>
                <th scope="col" style={{ minWidth: "125px" }}>
                  Status
                </th>
                <th scope="col" style={{ minWidth: "140px" }} className="text-end pe-3">
                  Moderation Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading professionals...</span>
                    </div>
                    <p className="mt-2 text-secondary small mb-0">
                      Loading marketplace professionals...
                    </p>
                  </td>
                </tr>
              ) : sortedFreelancers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-5">
                    <div
                      className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center p-3 text-secondary mb-2"
                      style={{ width: "54px", height: "54px" }}
                    >
                      <i className="bi bi-inbox fs-3"></i>
                    </div>
                    <h6 className="fw-bold text-dark mb-1">No Freelancers Found</h6>
                    <p className="text-secondary small mb-3">
                      {searchTerm || statusFilter !== "ALL"
                        ? "No profiles match your current search and filter criteria."
                        : "There are currently no registered freelancer profiles."}
                    </p>
                    {(searchTerm || statusFilter !== "ALL") && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => {
                          setSearchTerm("");
                          setStatusFilter("ALL");
                          setPage(1);
                        }}
                      >
                        <i className="bi bi-arrow-counterclockwise me-1"></i> Reset Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                sortedFreelancers.map((f) => {
                  const primaryLoc = f.locations?.find((l) => l.isPrimary);
                  const otherLocsCount = (f.locations?.length || 0) - (primaryLoc ? 1 : 0);
                  const avatarUrl = resolveImageUrl(f.photoUrl);

                  return (
                    <tr key={f.id} className="align-middle">
                      {/* Identity: Photo, Name, Profession */}
                      <td className="ps-3 py-3">
                        <div className="d-flex align-items-center gap-2-5">
                          <div
                            className="position-relative rounded-circle overflow-hidden flex-shrink-0 border bg-light d-flex align-items-center justify-content-center"
                            style={{ width: "44px", height: "44px" }}
                          >
                            {avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt={f.displayName}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            ) : (
                              <span className="fw-bold text-primary small">
                                {getInitials(f.displayName)}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="d-flex align-items-center gap-1">
                              <span
                                className="fw-bold text-dark text-truncate text-decoration-none"
                                title={f.displayName}
                                style={{ maxWidth: "200px" }}
                              >
                                {f.displayName}
                              </span>
                              {f.status === "APPROVED" && (
                                <i
                                  className="bi bi-patch-check-fill text-primary"
                                  title="Approved Marketplace Professional"
                                  style={{ fontSize: "0.85rem" }}
                                ></i>
                              )}
                            </div>
                            <div className="text-secondary small text-truncate" style={{ fontSize: "0.78rem" }}>
                              {f.profession?.name || f.title || "Specialist"}
                              {f.profession?.bnName && (
                                <span className="text-muted ms-1">({f.profession.bnName})</span>
                              )}
                            </div>
                            <div className="d-flex align-items-center gap-1 mt-0-5">
                              {renderAvailabilityPill(f.availability)}
                              <span
                                className="text-muted font-monospace"
                                style={{ fontSize: "0.68rem" }}
                                title={`Profile ID: ${f.id}`}
                              >
                                #{f.id.slice(0, 8)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact & Account */}
                      <td>
                        <div className="d-flex align-items-center gap-1">
                          <span className="fw-semibold text-dark font-monospace small">
                            {f.user?.phone || "No phone"}
                          </span>
                          {f.user?.phone && (
                            <button
                              type="button"
                              className="btn btn-link btn-sm p-0 text-secondary"
                              onClick={() => handleCopyPhone(f.user.phone!, f.id)}
                              title="Copy phone number"
                              style={{ lineHeight: 1 }}
                            >
                              <i
                                className={`bi ${
                                  copiedId === f.id
                                    ? "bi-check2 text-success fw-bold"
                                    : "bi-clipboard"
                                }`}
                                style={{ fontSize: "0.78rem" }}
                              ></i>
                            </button>
                          )}
                        </div>
                        <div className="text-secondary small text-truncate" style={{ fontSize: "0.75rem", maxWidth: "160px" }}>
                          {f.email || f.user?.email || "No email registered"}
                        </div>
                        <div className="text-muted" style={{ fontSize: "0.7rem" }}>
                          User: <span className="text-dark">{f.user?.name}</span>
                        </div>
                      </td>

                      {/* Coverage Locations */}
                      <td>
                        {primaryLoc ? (
                          <div>
                            <div className="fw-medium text-dark small d-flex align-items-center gap-1">
                              <i className="bi bi-geo-alt-fill text-danger small"></i>
                              <span className="text-truncate" style={{ maxWidth: "150px" }}>
                                {primaryLoc.thana?.name || ""}, {primaryLoc.district?.name || ""}
                              </span>
                            </div>
                            <div className="text-secondary" style={{ fontSize: "0.72rem" }}>
                              {primaryLoc.division?.name || ""}
                              {otherLocsCount > 0 && (
                                <span className="badge bg-light text-secondary border rounded-pill ms-1 font-monospace">
                                  +{otherLocsCount} more
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted small fst-italic">Not specified</span>
                        )}
                      </td>

                      {/* Experience & Pricing */}
                      <td>
                        <div className="fw-bold text-dark small tabular-nums">
                          {f.experienceYears} {f.experienceYears === 1 ? "year" : "years"} exp
                        </div>
                        <div className="text-primary small fw-semibold tabular-nums">
                          {f.startingPrice ? `৳${f.startingPrice.toLocaleString()}` : "Negotiable"}
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <div>{renderStatusBadge(f.status)}</div>
                        {f.rejectionCount > 0 && (
                          <div className="text-danger mt-1" style={{ fontSize: "0.68rem" }}>
                            <i className="bi bi-arrow-repeat me-1"></i>
                            {f.rejectionCount} {f.rejectionCount === 1 ? "rejection" : "rejections"}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="text-end pe-3">
                        <div className="btn-group btn-group-sm" role="group">
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => handleOpenDetail(f)}
                            title="Inspect complete application profile"
                          >
                            <i className="bi bi-eye me-1"></i> Details
                          </button>

                          {f.status === "PENDING" && (
                            <>
                              <button
                                type="button"
                                className="btn btn-success"
                                onClick={() => {
                                  setTargetFreelancer(f);
                                  setShowApproveModal(true);
                                }}
                                title="Approve candidate application"
                              >
                                <i className="bi bi-check-lg"></i>
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-danger"
                                onClick={() => {
                                  setTargetFreelancer(f);
                                  setRejectReason("");
                                  setShowRejectModal(true);
                                }}
                                title="Reject candidate with feedback"
                              >
                                <i className="bi bi-x-lg"></i>
                              </button>
                            </>
                          )}

                          {f.status === "APPROVED" && (
                            <button
                              type="button"
                              className="btn btn-outline-warning text-dark"
                              onClick={() => {
                                setTargetFreelancer(f);
                                setSuspendReason("");
                                setShowSuspendModal(true);
                              }}
                              title="Suspend this professional"
                            >
                              <i className="bi bi-slash-circle"></i>
                            </button>
                          )}

                          {f.status === "SUSPENDED" && (
                            <button
                              type="button"
                              className="btn btn-outline-success"
                              onClick={() => handleReinstate(f)}
                              title="Reinstate to Approved"
                            >
                              <i className="bi bi-arrow-counterclockwise"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="card-footer bg-body-tertiary border-top py-2 px-3">
          <div className="d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2">
            <div className="text-secondary small">
              Showing{" "}
              <span className="fw-semibold text-dark tabular-nums">
                {total === 0 ? 0 : (page - 1) * limit + 1}
              </span>{" "}
              to{" "}
              <span className="fw-semibold text-dark tabular-nums">
                {Math.min(page * limit, total)}
              </span>{" "}
              of <span className="fw-semibold text-dark tabular-nums">{total}</span> professionals
            </div>

            <div className="d-flex align-items-center gap-2">
              <div className="d-flex align-items-center gap-1">
                <span className="text-secondary small d-none d-md-inline">Rows:</span>
                <select
                  className="form-select form-select-sm"
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  style={{ width: "70px", fontSize: "0.78rem" }}
                  aria-label="Rows per page"
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => setPage(1)}
                    disabled={page <= 1}
                    aria-label="First page"
                  >
                    <i className="bi bi-chevron-double-left"></i>
                  </button>
                </li>
                <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page <= 1}
                    aria-label="Previous page"
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                </li>
                <li className="page-item disabled">
                  <span className="page-link text-dark fw-medium px-2">
                    {page} / {totalPages}
                  </span>
                </li>
                <li className={`page-item ${page >= totalPages ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page >= totalPages}
                    aria-label="Next page"
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </li>
                <li className={`page-item ${page >= totalPages ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => setPage(totalPages)}
                    disabled={page >= totalPages}
                    aria-label="Last page"
                  >
                    <i className="bi bi-chevron-double-right"></i>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Comprehensive Profile Detail Modal */}
      {showDetailModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", zIndex: 1055 }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div className="modal-content shadow-lg border-0 card-glass">
              {detailLoading || !selectedDetail ? (
                <div className="modal-body text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading details...</span>
                  </div>
                  <p className="mt-2 text-secondary small">Loading complete candidate record...</p>
                </div>
              ) : (
                <>
                  {/* Modal Header */}
                  <div className="modal-header border-bottom pb-3">
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="rounded-circle overflow-hidden border bg-light d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ width: "54px", height: "54px" }}
                      >
                        {resolveImageUrl(selectedDetail.photoUrl) ? (
                          <img
                            src={resolveImageUrl(selectedDetail.photoUrl)!}
                            alt={selectedDetail.displayName}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <span className="fw-bold text-primary fs-5">
                            {getInitials(selectedDetail.displayName)}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="d-flex align-items-center gap-2">
                          <h5 className="modal-title fw-bold text-dark mb-0">
                            {selectedDetail.displayName}
                          </h5>
                          {renderStatusBadge(selectedDetail.status)}
                        </div>
                        <div className="text-secondary small mt-0-5">
                          <span className="fw-medium text-primary">
                            {selectedDetail.profession?.name || selectedDetail.title || "Specialist"}
                          </span>{" "}
                          • {selectedDetail.experienceYears} Years Experience
                          {selectedDetail.startingPrice && ` • From ৳${selectedDetail.startingPrice.toLocaleString()}`}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setShowDetailModal(false)}
                      aria-label="Close"
                    ></button>
                  </div>

                  {/* Tab Navigation */}
                  <div className="border-bottom bg-light px-3 pt-2">
                    <ul className="nav nav-tabs border-bottom-0" style={{ fontSize: "0.82rem" }}>
                      <li className="nav-item">
                        <button
                          type="button"
                          className={`nav-link ${activeDetailTab === "overview" ? "active fw-bold" : "text-secondary"}`}
                          onClick={() => setActiveDetailTab("overview")}
                        >
                          <i className="bi bi-person me-1"></i> Identity & Bio
                        </button>
                      </li>
                      <li className="nav-item">
                        <button
                          type="button"
                          className={`nav-link ${activeDetailTab === "locations" ? "active fw-bold" : "text-secondary"}`}
                          onClick={() => setActiveDetailTab("locations")}
                        >
                          <i className="bi bi-geo-alt me-1"></i> Coverage Areas ({selectedDetail.locations.length})
                        </button>
                      </li>
                      <li className="nav-item">
                        <button
                          type="button"
                          className={`nav-link ${activeDetailTab === "services" ? "active fw-bold" : "text-secondary"}`}
                          onClick={() => setActiveDetailTab("services")}
                        >
                          <i className="bi bi-briefcase me-1"></i> Services ({selectedDetail.services.length})
                        </button>
                      </li>
                      <li className="nav-item">
                        <button
                          type="button"
                          className={`nav-link ${activeDetailTab === "portfolio" ? "active fw-bold" : "text-secondary"}`}
                          onClick={() => setActiveDetailTab("portfolio")}
                        >
                          <i className="bi bi-images me-1"></i> Skills & Portfolio
                        </button>
                      </li>
                      <li className="nav-item">
                        <button
                          type="button"
                          className={`nav-link ${activeDetailTab === "moderation" ? "active fw-bold" : "text-secondary"}`}
                          onClick={() => setActiveDetailTab("moderation")}
                        >
                          <i className="bi bi-shield-check me-1"></i> Audit & History
                        </button>
                      </li>
                    </ul>
                  </div>

                  {/* Modal Body */}
                  <div className="modal-body p-4">
                    {/* Tab 1: Overview */}
                    {activeDetailTab === "overview" && (
                      <div className="space-y-4">
                        <div className="row g-3 mb-3">
                          <div className="col-12 col-sm-6">
                            <div className="p-3 bg-light rounded-3 border">
                              <span className="text-secondary small fw-bold d-block text-uppercase" style={{ fontSize: "0.7rem" }}>
                                Verified Contact Phone
                              </span>
                              <span className="fw-bold text-dark font-monospace fs-6">
                                {selectedDetail.user?.phone || "N/A"}
                              </span>
                            </div>
                          </div>
                          <div className="col-12 col-sm-6">
                            <div className="p-3 bg-light rounded-3 border">
                              <span className="text-secondary small fw-bold d-block text-uppercase" style={{ fontSize: "0.7rem" }}>
                                Registered Email
                              </span>
                              <span className="fw-semibold text-dark small">
                                {selectedDetail.email || selectedDetail.user?.email || "N/A"}
                              </span>
                            </div>
                          </div>
                          <div className="col-12 col-sm-6">
                            <div className="p-3 bg-light rounded-3 border">
                              <span className="text-secondary small fw-bold d-block text-uppercase" style={{ fontSize: "0.7rem" }}>
                                Street / Locality Address
                              </span>
                              <span className="text-dark small">
                                {selectedDetail.address || "No street address provided"}
                              </span>
                            </div>
                          </div>
                          <div className="col-12 col-sm-6">
                            <div className="p-3 bg-light rounded-3 border">
                              <span className="text-secondary small fw-bold d-block text-uppercase" style={{ fontSize: "0.7rem" }}>
                                Marketplace Availability
                              </span>
                              <div className="mt-1">
                                {renderAvailabilityPill(selectedDetail.availability)}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="fw-bold text-dark small d-block mb-1">
                            About / Professional Bio
                          </label>
                          <div className="p-3 bg-light rounded-3 border small text-dark lh-base">
                            {selectedDetail.about || (
                              <span className="text-muted fst-italic">No biography submitted.</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tab 2: Locations Coverage */}
                    {activeDetailTab === "locations" && (
                      <div>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="fw-bold text-dark small">
                            Verified Coverage Zones ({selectedDetail.locations.length} of 5 max)
                          </span>
                        </div>
                        {selectedDetail.locations.length === 0 ? (
                          <div className="text-center py-4 text-muted small">
                            No service locations configured.
                          </div>
                        ) : (
                          <div className="d-flex flex-column gap-2">
                            {selectedDetail.locations.map((loc) => (
                              <div
                                key={loc.id}
                                className={`p-3 rounded-3 border ${
                                  loc.isPrimary
                                    ? "border-primary bg-primary bg-opacity-10"
                                    : "bg-light"
                                }`}
                              >
                                <div className="d-flex align-items-center justify-content-between mb-1">
                                  <div className="fw-bold text-dark small d-flex align-items-center gap-1">
                                    <i className="bi bi-geo-alt-fill text-danger"></i>
                                    <span>
                                      {loc.division.name} &gt; {loc.district.name} &gt; {loc.thana.name}
                                    </span>
                                  </div>
                                  {loc.isPrimary && (
                                    <span className="badge bg-primary text-white font-monospace" style={{ fontSize: "0.68rem" }}>
                                      PRIMARY LOCATION
                                    </span>
                                  )}
                                </div>
                                <div className="text-secondary small">
                                  <span>Post Office: </span>
                                  <span className="text-dark fw-medium">
                                    {loc.postOffice.name} ({loc.postOffice.postalCode})
                                  </span>
                                  {loc.cityCorporation && (
                                    <span> • City Corp: {loc.cityCorporation.name}</span>
                                  )}
                                  {loc.ward && (
                                    <span> • Ward #{loc.ward.wardNo}</span>
                                  )}
                                  {loc.paurashava && (
                                    <span> • Paurashava: {loc.paurashava.name}</span>
                                  )}
                                  {loc.union && (
                                    <span> • Union: {loc.union.name}</span>
                                  )}
                                  {loc.localityText && (
                                    <span> • Locality: {loc.localityText}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab 3: Services & Pricing */}
                    {activeDetailTab === "services" && (
                      <div>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="fw-bold text-dark small">
                            Listed Services & Rates ({selectedDetail.services.length})
                          </span>
                        </div>
                        {selectedDetail.services.length === 0 ? (
                          <div className="text-center py-4 text-muted small">
                            No individual services listed.
                          </div>
                        ) : (
                          <div className="row g-2">
                            {selectedDetail.services.map((svc) => (
                              <div key={svc.id} className="col-12 col-md-6">
                                <div className="p-3 rounded-3 border bg-light h-100 d-flex flex-column justify-content-between">
                                  <div>
                                    <div className="d-flex align-items-start justify-content-between gap-2 mb-1">
                                      <h6 className="fw-bold text-dark mb-0 small">{svc.title}</h6>
                                      <span className="badge bg-primary bg-opacity-10 text-primary border border-primary-subtle font-monospace" style={{ fontSize: "0.68rem" }}>
                                        {svc.priceType}
                                      </span>
                                    </div>
                                    {svc.description && (
                                      <p className="text-secondary small mb-2 lh-sm">
                                        {svc.description}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-end pt-2 border-top">
                                    <span className="text-secondary small me-1">Rate:</span>
                                    <span className="fw-bold text-dark tabular-nums">
                                      {svc.amount ? `৳${svc.amount.toLocaleString()}` : "Negotiable"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab 4: Skills & Portfolio */}
                    {activeDetailTab === "portfolio" && (
                      <div>
                        {/* Skills Cloud */}
                        <div className="mb-4">
                          <label className="fw-bold text-dark small d-block mb-2">
                            Skills & Capabilities ({selectedDetail.skills.length})
                          </label>
                          <div className="d-flex flex-wrap gap-1">
                            {selectedDetail.skills.length === 0 ? (
                              <span className="text-muted small">No specific skills tagged.</span>
                            ) : (
                              selectedDetail.skills.map((sk) => (
                                <span
                                  key={sk.skillId}
                                  className="badge bg-body-secondary text-dark border px-2 py-1"
                                >
                                  {sk.skill.name}
                                  {sk.skill.bnName && (
                                    <span className="text-muted ms-1 font-monospace">
                                      ({sk.skill.bnName})
                                    </span>
                                  )}
                                </span>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Portfolio Gallery */}
                        <div>
                          <label className="fw-bold text-dark small d-block mb-2">
                            Portfolio Work Showcase ({selectedDetail.portfolio.length})
                          </label>
                          {selectedDetail.portfolio.length === 0 ? (
                            <div className="text-center py-4 bg-light rounded-3 border text-muted small">
                              No portfolio images uploaded.
                            </div>
                          ) : (
                            <div className="row g-2">
                              {selectedDetail.portfolio.map((item) => {
                                const pUrl = resolveImageUrl(item.imageUrl);
                                return (
                                  <div key={item.id} className="col-6 col-sm-4 col-md-3">
                                    <div className="card shadow-sm border overflow-hidden h-100">
                                      <div style={{ height: "110px" }} className="bg-light">
                                        {pUrl ? (
                                          <img
                                            src={pUrl}
                                            alt={item.caption || "Portfolio item"}
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                          />
                                        ) : (
                                          <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                                            <i className="bi bi-image"></i>
                                          </div>
                                        )}
                                      </div>
                                      {item.caption && (
                                        <div className="p-1-5 bg-white border-top text-truncate small text-secondary" style={{ fontSize: "0.72rem" }}>
                                          {item.caption}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tab 5: Moderation History */}
                    {activeDetailTab === "moderation" && (
                      <div className="space-y-3">
                        <div className="p-3 bg-light rounded-3 border small space-y-2">
                          <div className="d-flex justify-content-between py-1 border-bottom">
                            <span className="text-secondary">Current Status:</span>
                            <span>{renderStatusBadge(selectedDetail.status)}</span>
                          </div>
                          <div className="d-flex justify-content-between py-1 border-bottom">
                            <span className="text-secondary">Profile Registered:</span>
                            <span className="text-dark font-monospace">
                              {new Date(selectedDetail.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between py-1 border-bottom">
                            <span className="text-secondary">Last Updated:</span>
                            <span className="text-dark font-monospace">
                              {new Date(selectedDetail.updatedAt).toLocaleString()}
                            </span>
                          </div>
                          {selectedDetail.approvedAt && (
                            <div className="d-flex justify-content-between py-1 border-bottom">
                              <span className="text-secondary">Approved Date:</span>
                              <span className="text-success font-monospace">
                                {new Date(selectedDetail.approvedAt).toLocaleString()}
                              </span>
                            </div>
                          )}
                          <div className="d-flex justify-content-between py-1 border-bottom">
                            <span className="text-secondary">Rejection Counter:</span>
                            <span className="text-dark tabular-nums fw-bold">
                              {selectedDetail.rejectionCount}
                            </span>
                          </div>
                          {selectedDetail.rejectionReason && (
                            <div className="py-2 border-bottom">
                              <span className="text-danger fw-bold d-block mb-1">
                                Last Rejection Reason:
                              </span>
                              <div className="p-2 bg-danger bg-opacity-10 border border-danger-subtle rounded text-danger small">
                                {selectedDetail.rejectionReason}
                              </div>
                            </div>
                          )}
                          {selectedDetail.suspendReason && (
                            <div className="py-2">
                              <span className="text-warning-emphasis fw-bold d-block mb-1">
                                Suspension Notice:
                              </span>
                              <div className="p-2 bg-warning bg-opacity-10 border border-warning-subtle rounded text-dark small">
                                {selectedDetail.suspendReason}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Modal Footer with Actions */}
                  <div className="modal-footer border-top bg-light d-flex align-items-center justify-content-between">
                    <div>
                      <span className="text-muted small">
                        User ID: <code className="font-monospace small">{selectedDetail.userId}</code>
                      </span>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => setShowDetailModal(false)}
                      >
                        Close
                      </button>

                      {selectedDetail.status === "PENDING" && (
                        <>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => {
                              setTargetFreelancer(selectedDetail);
                              setRejectReason("");
                              setShowRejectModal(true);
                            }}
                          >
                            <i className="bi bi-x-circle me-1"></i> Reject...
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-success"
                            onClick={() => {
                              setTargetFreelancer(selectedDetail);
                              setShowApproveModal(true);
                            }}
                          >
                            <i className="bi bi-check2-circle me-1"></i> Approve Profile
                          </button>
                        </>
                      )}

                      {selectedDetail.status === "APPROVED" && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-warning text-dark"
                          onClick={() => {
                            setTargetFreelancer(selectedDetail);
                            setSuspendReason("");
                            setShowSuspendModal(true);
                          }}
                        >
                          <i className="bi bi-slash-circle me-1"></i> Suspend Profile
                        </button>
                      )}

                      {selectedDetail.status === "SUSPENDED" && (
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => handleReinstate(selectedDetail)}
                        >
                          <i className="bi bi-arrow-counterclockwise me-1"></i> Reinstate Profile
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Approve */}
      {showApproveModal && targetFreelancer && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", zIndex: 1060 }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0 card-glass">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <i className="bi bi-patch-check-fill text-success fs-5"></i>
                  Approve Marketplace Professional
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowApproveModal(false)}
                  aria-label="Close"
                  disabled={actionLoading}
                ></button>
              </div>
              <div className="modal-body p-4">
                <p className="text-secondary small mb-3">
                  Are you sure you want to approve{" "}
                  <strong className="text-dark">{targetFreelancer.displayName}</strong>?
                </p>
                <div className="p-3 bg-success bg-opacity-10 border border-success-subtle rounded-3 text-success small mb-0">
                  <div className="fw-bold mb-1">What happens after approval:</div>
                  <ul className="mb-0 ps-3">
                    <li>Profile is published live to the public `/hire` marketplace directory.</li>
                    <li>Subscribed members can view services and reveal contact details.</li>
                    <li>Candidate receives approval notification on their dashboard.</li>
                  </ul>
                </div>
              </div>
              <div className="modal-footer border-top bg-light">
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setShowApproveModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-success"
                  onClick={handleApprove}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                      Approving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg me-1"></i> Yes, Approve Profile
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Reject with Presets */}
      {showRejectModal && targetFreelancer && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", zIndex: 1060 }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow-lg border-0 card-glass">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <i className="bi bi-x-circle-fill text-danger fs-5"></i>
                  Reject Freelancer Application
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowRejectModal(false)}
                  aria-label="Close"
                  disabled={actionLoading}
                ></button>
              </div>
              <div className="modal-body p-4">
                <p className="text-secondary small mb-2">
                  Provide actionable feedback for{" "}
                  <strong className="text-dark">{targetFreelancer.displayName}</strong>.
                  This feedback is displayed on the candidate&apos;s onboarding screen so they can update and resubmit.
                </p>

                {/* Preset Chips */}
                <div className="mb-3">
                  <span className="text-secondary small fw-bold d-block mb-1">
                    Quick Preset Feedback Reasons:
                  </span>
                  <div className="d-flex flex-wrap gap-1">
                    {rejectionPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="btn btn-sm btn-outline-secondary text-dark text-start"
                        style={{ fontSize: "0.72rem" }}
                        onClick={() => setRejectReason(preset)}
                      >
                        {preset.slice(0, 42)}...
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="form-label fw-bold text-dark small">
                    Mandatory Rejection Reason *
                  </label>
                  <textarea
                    rows={4}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Enter precise feedback for what the applicant needs to change..."
                    className="form-control"
                    required
                  />
                  <div className="form-text small">
                    Minimum 5 characters. Be clear and constructive.
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top bg-light">
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setShowRejectModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={handleReject}
                  disabled={actionLoading || !rejectReason.trim()}
                >
                  {actionLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-x-circle me-1"></i> Confirm Rejection
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Suspend */}
      {showSuspendModal && targetFreelancer && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", zIndex: 1060 }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0 card-glass">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <i className="bi bi-shield-slash text-warning fs-5"></i>
                  Suspend Freelancer Profile
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowSuspendModal(false)}
                  aria-label="Close"
                  disabled={actionLoading}
                ></button>
              </div>
              <div className="modal-body p-4">
                <p className="text-secondary small mb-3">
                  Suspending will hide{" "}
                  <strong className="text-dark">{targetFreelancer.displayName}</strong> from marketplace search and disable client phone reveals.
                </p>
                <div>
                  <label className="form-label fw-bold text-dark small">
                    Reason for Suspension *
                  </label>
                  <textarea
                    rows={3}
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    placeholder="E.g., Client abuse complaint, policy breach, or inactive number."
                    className="form-control"
                    required
                  />
                </div>
              </div>
              <div className="modal-footer border-top bg-light">
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setShowSuspendModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-warning text-dark"
                  onClick={handleSuspend}
                  disabled={actionLoading || !suspendReason.trim()}
                >
                  {actionLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                      Suspending...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-shield-slash me-1"></i> Confirm Suspension
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
