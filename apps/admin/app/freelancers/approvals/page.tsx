/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  AdminFreelancerItem,
  AdminFreelancerDetail,
  adminFreelancersService,
} from "../../../services/freelancers";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
const ASSET_BASE = API_BASE.replace("/api/v1", "");

export default function FreelancerApprovalsQueuePage() {
  const [items, setItems] = useState<AdminFreelancerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Inspect Modal
  const [selectedDetail, setSelectedDetail] = useState<AdminFreelancerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<"overview" | "locations" | "services" | "portfolio">("overview");

  // Moderation Dialogs
  const [target, setTarget] = useState<AdminFreelancerItem | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const [notification, setNotification] = useState<{
    type: "success" | "danger" | "info";
    text: string;
  } | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFreelancersService.getFreelancers({
        status: "PENDING",
        limit: 100,
      });
      setItems(data.items);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load approval queue";
      setNotification({ type: "danger", text: msg });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const handleOpenDetail = async (freelancer: AdminFreelancerItem) => {
    setDetailLoading(true);
    setShowDetailModal(true);
    setActiveDetailTab("overview");
    try {
      const detail = await adminFreelancersService.getFreelancerById(freelancer.id);
      setSelectedDetail(detail);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load candidate application";
      setNotification({ type: "danger", text: msg });
      setShowDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!target) return;
    setActionLoading(true);
    try {
      await adminFreelancersService.approveFreelancer(target.id);
      setNotification({
        type: "success",
        text: `Freelancer "${target.displayName}" approved successfully! Published to marketplace.`,
      });
      setShowApproveModal(false);
      setTarget(null);
      if (showDetailModal) setShowDetailModal(false);
      loadQueue();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Approval failed";
      setNotification({ type: "danger", text: msg });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!target || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await adminFreelancersService.rejectFreelancer(target.id, rejectReason.trim());
      setNotification({
        type: "info",
        text: `Application for "${target.displayName}" was rejected with feedback.`,
      });
      setShowRejectModal(false);
      setTarget(null);
      setRejectReason("");
      if (showDetailModal) setShowDetailModal(false);
      loadQueue();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Rejection failed";
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

  const getInitials = (name: string) => {
    if (!name) return "FP";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        item.displayName.toLowerCase().includes(term) ||
        (item.user?.phone && item.user.phone.includes(term)) ||
        (item.profession?.name && item.profession.name.toLowerCase().includes(term)) ||
        (item.email && item.email.toLowerCase().includes(term))
    );
  }, [items, searchTerm]);

  const rejectionPresets = [
    "Clear, professional portrait photo is required.",
    "Please add at least 1 verified service title with an accurate starting rate.",
    "Provided phone number could not be reached or verified.",
    "Primary coverage address is incomplete; please select your district and thana.",
    "Bio text is insufficient; please describe your professional background and tools.",
  ];

  return (
    <div className="container-fluid py-3 px-3 px-md-4">
      {/* Header & Breadcrumb */}
      <div className="row align-items-center mb-3 g-2">
        <div className="col-12 col-md-7">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1">
              <li className="breadcrumb-item">
                <Link href="/" className="text-decoration-none">
                  Dashboard
                </Link>
              </li>
              <li className="breadcrumb-item">
                <Link href="/freelancers" className="text-decoration-none">
                  Freelancers
                </Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Pending Approvals
              </li>
            </ol>
          </nav>
          <div className="d-flex align-items-center gap-2">
            <div
              className="d-inline-flex align-items-center justify-content-center text-warning bg-warning bg-opacity-10 rounded-3 p-2"
              style={{ width: "38px", height: "38px" }}
            >
              <i className="bi bi-hourglass-split fs-5" aria-hidden="true"></i>
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h1 className="h4 fw-bold text-dark mb-0 tracking-tight">
                  Pending Approvals Queue
                </h1>
                <span className="badge rounded-pill bg-warning text-dark font-monospace">
                  {items.length} Awaiting Review
                </span>
              </div>
              <p className="text-secondary small mb-0">
                Fast-triage moderation: verify identity credentials, coverage areas, and services before marketplace publishing.
              </p>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-5 text-md-end d-flex align-items-center justify-content-md-end gap-2 mt-2 mt-md-0">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary shadow-sm"
            onClick={loadQueue}
            disabled={loading}
          >
            <i className={`bi bi-arrow-clockwise me-1 ${loading ? "spinner-border spinner-border-sm" : ""}`}></i>
            Refresh Queue
          </button>
          <Link
            href="/freelancers"
            className="btn btn-sm btn-outline-primary shadow-sm d-inline-flex align-items-center gap-1"
          >
            <i className="bi bi-people me-1"></i>
            All Freelancers Directory
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

      {/* Filter / Search Bar */}
      {items.length > 0 && (
        <div className="card shadow-sm border-0 mb-3 card-glass">
          <div className="card-body p-3">
            <div className="row g-2 align-items-center justify-content-between">
              <div className="col-12 col-sm-6 col-md-4">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-body-tertiary border-end-0">
                    <i className="bi bi-search text-secondary"></i>
                  </span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Filter by name, phone, or profession..."
                    className="form-control border-start-0"
                    aria-label="Filter queue"
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
              </div>

              <div className="col-12 col-sm-6 col-md-5 text-sm-end text-secondary small">
                Showing <span className="fw-bold text-dark">{filteredItems.length}</span> of{" "}
                <span className="fw-bold text-dark">{items.length}</span> applications in queue
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Applications List */}
      {loading ? (
        <div className="card shadow-sm border-0 card-glass text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading applications...</span>
          </div>
          <p className="mt-2 text-secondary small mb-0">Fetching pending applications queue...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="card shadow-sm border-0 card-glass text-center py-5 px-3">
          <div
            className="rounded-circle bg-success bg-opacity-10 text-success d-inline-flex align-items-center justify-content-center p-3 mb-3 mx-auto"
            style={{ width: "64px", height: "64px" }}
          >
            <i className="bi bi-check2-all fs-2"></i>
          </div>
          <h5 className="fw-bold text-dark mb-1">All Caught Up!</h5>
          <p className="text-secondary small mb-3 max-w-md mx-auto">
            There are currently no pending freelancer registration applications awaiting moderation.
            New registrations will appear here for verification.
          </p>
          <div>
            <Link href="/freelancers" className="btn btn-sm btn-primary">
              <i className="bi bi-arrow-left me-1"></i> Back to Freelancers Directory
            </Link>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card shadow-sm border-0 card-glass text-center py-5">
          <i className="bi bi-search text-secondary fs-3 mb-2"></i>
          <h6 className="fw-bold text-dark mb-1">No matching applications</h6>
          <p className="text-secondary small mb-3">
            No pending candidate matches &quot;{searchTerm}&quot;.
          </p>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setSearchTerm("")}
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {filteredItems.map((item) => {
            const avatarUrl = resolveImageUrl(item.photoUrl);
            const primaryLoc = item.locations?.find((l) => l.isPrimary);

            return (
              <div
                key={item.id}
                className="card shadow-sm border-0 card-glass overflow-hidden"
              >
                <div className="card-body p-3 p-md-4">
                  <div className="row g-3 align-items-center">
                    {/* Identity & Avatar */}
                    <div className="col-12 col-md-5">
                      <div className="d-flex align-items-start gap-3">
                        <div
                          className="rounded-circle overflow-hidden border bg-light d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{ width: "54px", height: "54px" }}
                        >
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={item.displayName}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            <span className="fw-bold text-primary fs-5">
                              {getInitials(item.displayName)}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="d-flex align-items-center gap-2">
                            <h5 className="fw-bold text-dark mb-0 text-truncate">
                              {item.displayName}
                            </h5>
                            <span className="badge bg-warning bg-opacity-10 text-warning-emphasis border border-warning-subtle font-monospace" style={{ fontSize: "0.68rem" }}>
                              PENDING
                            </span>
                          </div>
                          <div className="text-primary small fw-medium mt-0-5">
                            {item.profession?.name || item.title || "Specialist"}
                            {item.profession?.bnName && (
                              <span className="text-muted ms-1">({item.profession.bnName})</span>
                            )}
                            <span className="text-secondary fw-normal"> • {item.experienceYears} yrs experience</span>
                          </div>
                          <div className="text-secondary small mt-1 d-flex flex-wrap align-items-center gap-2">
                            <span className="font-monospace text-dark fw-semibold">
                              {item.user?.phone || "No phone"}
                            </span>
                            {item.user?.phone && (
                              <button
                                type="button"
                                className="btn btn-link btn-sm p-0 text-secondary"
                                onClick={() => handleCopyPhone(item.user.phone!, item.id)}
                                title="Copy phone"
                              >
                                <i
                                  className={`bi ${
                                    copiedId === item.id
                                      ? "bi-check2 text-success fw-bold"
                                      : "bi-clipboard"
                                  }`}
                                  style={{ fontSize: "0.78rem" }}
                                ></i>
                              </button>
                            )}
                            <span>•</span>
                            <span>{item.email || item.user?.email || "No email"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Coverage & Bio Summary */}
                    <div className="col-12 col-md-4">
                      {primaryLoc && (
                        <div className="small mb-1 d-flex align-items-center gap-1 text-dark fw-medium">
                          <i className="bi bi-geo-alt-fill text-danger"></i>
                          <span>
                            {primaryLoc.division?.name} &gt; {primaryLoc.district?.name} &gt; {primaryLoc.thana?.name}
                          </span>
                        </div>
                      )}
                      {item.startingPrice && (
                        <div className="small text-secondary mb-1">
                          Starting Rate:{" "}
                          <span className="fw-bold text-dark tabular-nums">
                            ৳{item.startingPrice.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {item.about && (
                        <p className="text-secondary small mb-0 lh-sm line-clamp-2" style={{ maxHeight: "2.6rem", overflow: "hidden" }}>
                          &quot;{item.about}&quot;
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="col-12 col-md-3 text-md-end d-flex flex-wrap align-items-center justify-content-md-end gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => handleOpenDetail(item)}
                      >
                        <i className="bi bi-eye me-1"></i> Full Application
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-success"
                        onClick={() => {
                          setTarget(item);
                          setShowApproveModal(true);
                        }}
                      >
                        <i className="bi bi-check-lg me-1"></i> Approve
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => {
                          setTarget(item);
                          setRejectReason("");
                          setShowRejectModal(true);
                        }}
                      >
                        <i className="bi bi-x-lg me-1"></i> Reject...
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Detail Modal */}
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
                    <span className="visually-hidden">Loading application...</span>
                  </div>
                  <p className="mt-2 text-secondary small">Loading full candidate record...</p>
                </div>
              ) : (
                <>
                  <div className="modal-header border-bottom">
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="rounded-circle overflow-hidden border bg-light d-flex align-items-center justify-content-center"
                        style={{ width: "50px", height: "50px" }}
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
                        <h5 className="modal-title fw-bold text-dark mb-0">
                          {selectedDetail.displayName}
                        </h5>
                        <div className="text-secondary small">
                          {selectedDetail.profession?.name || selectedDetail.title || "Specialist"} • {selectedDetail.experienceYears} Years Exp
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

                  {/* Tabs */}
                  <div className="border-bottom bg-light px-3 pt-2">
                    <ul className="nav nav-tabs border-bottom-0" style={{ fontSize: "0.82rem" }}>
                      <li className="nav-item">
                        <button
                          type="button"
                          className={`nav-link ${activeDetailTab === "overview" ? "active fw-bold" : "text-secondary"}`}
                          onClick={() => setActiveDetailTab("overview")}
                        >
                          Overview & Bio
                        </button>
                      </li>
                      <li className="nav-item">
                        <button
                          type="button"
                          className={`nav-link ${activeDetailTab === "locations" ? "active fw-bold" : "text-secondary"}`}
                          onClick={() => setActiveDetailTab("locations")}
                        >
                          Coverage ({selectedDetail.locations.length})
                        </button>
                      </li>
                      <li className="nav-item">
                        <button
                          type="button"
                          className={`nav-link ${activeDetailTab === "services" ? "active fw-bold" : "text-secondary"}`}
                          onClick={() => setActiveDetailTab("services")}
                        >
                          Services ({selectedDetail.services.length})
                        </button>
                      </li>
                      <li className="nav-item">
                        <button
                          type="button"
                          className={`nav-link ${activeDetailTab === "portfolio" ? "active fw-bold" : "text-secondary"}`}
                          onClick={() => setActiveDetailTab("portfolio")}
                        >
                          Portfolio ({selectedDetail.portfolio.length})
                        </button>
                      </li>
                    </ul>
                  </div>

                  <div className="modal-body p-4">
                    {activeDetailTab === "overview" && (
                      <div className="space-y-3">
                        <div className="row g-2 mb-3">
                          <div className="col-12 col-sm-4">
                            <div className="p-2-5 bg-light rounded-3 border">
                              <span className="text-secondary small fw-bold d-block">Verified Mobile</span>
                              <span className="fw-bold font-monospace text-dark">{selectedDetail.user?.phone}</span>
                            </div>
                          </div>
                          <div className="col-12 col-sm-4">
                            <div className="p-2-5 bg-light rounded-3 border">
                              <span className="text-secondary small fw-bold d-block">NID Number</span>
                              <span className="fw-bold font-monospace text-primary">{selectedDetail.nidNumber || "N/A"}</span>
                            </div>
                          </div>
                          <div className="col-12 col-sm-4">
                            <div className="p-2-5 bg-light rounded-3 border">
                              <span className="text-secondary small fw-bold d-block">Email</span>
                              <span className="text-dark small">{selectedDetail.email || selectedDetail.user?.email || "N/A"}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="fw-bold text-dark small d-block mb-1">Bio / Statement</label>
                          <div className="p-3 bg-light rounded-3 border small lh-base">
                            {selectedDetail.about || "No bio provided."}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeDetailTab === "locations" && (
                      <div className="d-flex flex-column gap-2">
                        {selectedDetail.locations.map((loc) => (
                          <div key={loc.id} className="p-3 bg-light rounded-3 border small">
                            <div className="fw-bold text-dark d-flex align-items-center gap-1 mb-1">
                              <i className="bi bi-geo-alt-fill text-danger"></i>
                              <span>{loc.division.name} &gt; {loc.district.name} &gt; {loc.thana.name}</span>
                              {loc.isPrimary && (
                                <span className="badge bg-primary ms-auto">PRIMARY</span>
                              )}
                            </div>
                            <div className="text-secondary">
                              Post Office: {loc.postOffice.name} ({loc.postOffice.postalCode})
                              {loc.localityText && ` • Locality: ${loc.localityText}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeDetailTab === "services" && (
                      <div className="row g-2">
                        {selectedDetail.services.map((svc) => (
                          <div key={svc.id} className="col-12 col-md-6">
                            <div className="p-3 bg-light rounded-3 border h-100">
                              <div className="d-flex justify-content-between align-items-start mb-1">
                                <h6 className="fw-bold text-dark mb-0 small">{svc.title}</h6>
                                <span className="badge bg-primary bg-opacity-10 text-primary font-monospace" style={{ fontSize: "0.68rem" }}>
                                  {svc.priceType}
                                </span>
                              </div>
                              <p className="text-secondary small mb-2">{svc.description}</p>
                              <div className="text-dark fw-bold small text-end">
                                {svc.amount ? `৳${svc.amount.toLocaleString()}` : "Negotiable"}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeDetailTab === "portfolio" && (
                      <div>
                        {selectedDetail.portfolio.length === 0 ? (
                          <div className="text-center py-4 text-muted small">No portfolio items uploaded.</div>
                        ) : (
                          <div className="row g-2">
                            {selectedDetail.portfolio.map((item) => (
                              <div key={item.id} className="col-6 col-sm-4">
                                <div className="card shadow-sm border overflow-hidden">
                                  <img
                                    src={resolveImageUrl(item.imageUrl)!}
                                    alt={item.caption || "Portfolio"}
                                    style={{ width: "100%", height: "100px", objectFit: "cover" }}
                                  />
                                  {item.caption && (
                                    <div className="p-1 text-truncate small text-secondary" style={{ fontSize: "0.72rem" }}>
                                      {item.caption}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="modal-footer border-top bg-light d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => setShowDetailModal(false)}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => {
                        setTarget(selectedDetail);
                        setRejectReason("");
                        setShowRejectModal(true);
                      }}
                    >
                      Reject...
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-success"
                      onClick={() => {
                        setTarget(selectedDetail);
                        setShowApproveModal(true);
                      }}
                    >
                      Approve Candidate
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Approve */}
      {showApproveModal && target && (
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
                  Approve Freelancer
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
                  Approve application for <strong className="text-dark">{target.displayName}</strong>?
                </p>
                <div className="p-3 bg-success bg-opacity-10 border border-success-subtle rounded-3 text-success small mb-0">
                  Profile will immediately become live in the marketplace search and hire directory.
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
                  {actionLoading ? "Approving..." : "Yes, Approve Profile"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Reject with Presets */}
      {showRejectModal && target && (
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
                  Reject Candidate Application
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
                  Feedback for <strong className="text-dark">{target.displayName}</strong>:
                </p>

                {/* Quick Presets */}
                <div className="mb-3">
                  <span className="text-secondary small fw-bold d-block mb-1">
                    Select quick reason:
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
                    Mandatory Rejection Feedback *
                  </label>
                  <textarea
                    rows={4}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Specific instructions for what the applicant needs to correct..."
                    className="form-control"
                    required
                  />
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
                  {actionLoading ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
