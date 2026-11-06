/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  AdminRevisionItem,
  adminFreelancersService,
} from "../../../services/freelancers";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
const ASSET_BASE = API_BASE.replace("/api/v1", "");

export default function FreelancerRevisionsQueuePage() {
  const [items, setItems] = useState<AdminRevisionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Target item for moderation action
  const [target, setTarget] = useState<AdminRevisionItem | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const [notification, setNotification] = useState<{
    type: "success" | "danger" | "info";
    text: string;
  } | null>(null);

  const loadRevisions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFreelancersService.getRevisions({
        status: "PENDING",
        limit: 100,
      });
      setItems(data.items);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load revisions";
      setNotification({ type: "danger", text: msg });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRevisions();
  }, [loadRevisions]);

  const handleApprove = async () => {
    if (!target) return;
    setActionLoading(true);
    try {
      await adminFreelancersService.approveRevision(target.id);
      setNotification({
        type: "success",
        text: `Profile revision for "${target.freelancer?.displayName}" was approved and applied live!`,
      });
      setShowApproveModal(false);
      setTarget(null);
      loadRevisions();
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
      await adminFreelancersService.rejectRevision(target.id, rejectReason.trim());
      setNotification({
        type: "info",
        text: `Revision rejected with feedback recorded.`,
      });
      setShowRejectModal(false);
      setTarget(null);
      setRejectReason("");
      loadRevisions();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Rejection failed";
      setNotification({ type: "danger", text: msg });
    } finally {
      setActionLoading(false);
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

  const filteredItems = items.filter((rev) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (rev.freelancer?.displayName && rev.freelancer.displayName.toLowerCase().includes(term)) ||
      (rev.freelancer?.user?.phone && rev.freelancer.user.phone.includes(term)) ||
      (rev.payload?.displayName && rev.payload.displayName.toLowerCase().includes(term))
    );
  });

  const revisionRejectPresets = [
    "Proposed profile photo violates marketplace community guidelines.",
    "Proposed display name does not match legal or professional identity.",
    "Proposed bio contains prohibited contact numbers, links, or advertising.",
    "Portfolio images do not demonstrate relevant professional workmanship.",
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
                Sensitive Revisions
              </li>
            </ol>
          </nav>
          <div className="d-flex align-items-center gap-2">
            <div
              className="d-inline-flex align-items-center justify-content-center text-info bg-info bg-opacity-10 rounded-3 p-2"
              style={{ width: "38px", height: "38px" }}
            >
              <i className="bi bi-arrow-repeat fs-5" aria-hidden="true"></i>
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h1 className="h4 fw-bold text-dark mb-0 tracking-tight">
                  Sensitive Field Revisions
                </h1>
                <span className="badge rounded-pill bg-info text-white font-monospace">
                  {items.length} Pending Diffs
                </span>
              </div>
              <p className="text-secondary small mb-0">
                Visual diff inspector: review sensitive field edits (name, photo, bio, portfolio) from active professionals before changes go live.
              </p>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-5 text-md-end d-flex align-items-center justify-content-md-end gap-2 mt-2 mt-md-0">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary shadow-sm"
            onClick={loadRevisions}
            disabled={loading}
          >
            <i className={`bi bi-arrow-clockwise me-1 ${loading ? "spinner-border spinner-border-sm" : ""}`}></i>
            Refresh Diffs
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

      {/* Search / Filter Toolbar */}
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
                    placeholder="Search by candidate name or phone..."
                    className="form-control border-start-0"
                    aria-label="Search diffs"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary border-start-0"
                      onClick={() => setSearchTerm("")}
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  )}
                </div>
              </div>
              <div className="col-12 col-sm-6 col-md-4 text-sm-end text-secondary small">
                Showing <span className="fw-bold text-dark">{filteredItems.length}</span> of{" "}
                <span className="fw-bold text-dark">{items.length}</span> pending diffs
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revisions Diff List */}
      {loading ? (
        <div className="card shadow-sm border-0 card-glass text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading revisions...</span>
          </div>
          <p className="mt-2 text-secondary small mb-0">Fetching pending profile revisions...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="card shadow-sm border-0 card-glass text-center py-5 px-3">
          <div
            className="rounded-circle bg-info bg-opacity-10 text-info d-inline-flex align-items-center justify-content-center p-3 mb-3 mx-auto"
            style={{ width: "64px", height: "64px" }}
          >
            <i className="bi bi-shield-check fs-2"></i>
          </div>
          <h5 className="fw-bold text-dark mb-1">No Pending Revisions</h5>
          <p className="text-secondary small mb-3 max-w-md mx-auto">
            All submitted profile revisions have been moderated. When an approved professional updates sensitive profile fields, their proposed changes will appear here for side-by-side diff review.
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
          <h6 className="fw-bold text-dark mb-1">No matching diffs</h6>
          <p className="text-secondary small mb-3">
            No pending revision matches &quot;{searchTerm}&quot;.
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
        <div className="d-flex flex-column gap-4">
          {filteredItems.map((rev) => {
            const currentPhoto = resolveImageUrl(rev.freelancer?.photoUrl);
            const proposedPhoto = resolveImageUrl(rev.payload.photoUrl);

            return (
              <div
                key={rev.id}
                className="card shadow-sm border-0 card-glass overflow-hidden"
              >
                {/* Revision Header */}
                <div className="card-header bg-light border-bottom py-3 px-3 px-md-4">
                  <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="rounded-circle overflow-hidden border bg-white d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ width: "42px", height: "42px" }}
                      >
                        {currentPhoto ? (
                          <img
                            src={currentPhoto}
                            alt={rev.freelancer?.displayName || "Freelancer"}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <span className="fw-bold text-primary small">
                            {getInitials(rev.freelancer?.displayName || "FP")}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="d-flex align-items-center gap-2">
                          <h6 className="fw-bold text-dark mb-0">
                            {rev.freelancer?.displayName || "Freelancer"}
                          </h6>
                          <span className="badge bg-info bg-opacity-10 text-info border border-info-subtle font-monospace" style={{ fontSize: "0.68rem" }}>
                            DIFF AWAITING APPROVAL
                          </span>
                        </div>
                        <div className="text-secondary small mt-0-5">
                          Submitted:{" "}
                          <span className="text-dark font-monospace">
                            {new Date(rev.createdAt).toLocaleString()}
                          </span>{" "}
                          • Phone: <span className="text-dark fw-medium">{rev.freelancer?.user?.phone || "N/A"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => {
                          setTarget(rev);
                          setRejectReason("");
                          setShowRejectModal(true);
                        }}
                      >
                        <i className="bi bi-x-circle me-1"></i> Reject Diff...
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-success"
                        onClick={() => {
                          setTarget(rev);
                          setShowApproveModal(true);
                        }}
                      >
                        <i className="bi bi-check2-circle me-1"></i> Approve & Publish Diff
                      </button>
                    </div>
                  </div>
                </div>

                {/* Side-by-side Visual Diff Body */}
                <div className="card-body p-3 p-md-4">
                  <div className="row g-3">
                    {/* Left: Current Live Profile */}
                    <div className="col-12 col-md-6">
                      <div className="p-3 rounded-3 border bg-light h-100">
                        <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-3">
                          <div className="fw-bold text-secondary text-uppercase small d-flex align-items-center gap-1.5" style={{ fontSize: "0.72rem", letterSpacing: "0.05em" }}>
                            <i className="bi bi-clock-history text-secondary"></i>
                            Current Live Profile
                          </div>
                          <span className="badge bg-secondary-subtle text-secondary font-monospace" style={{ fontSize: "0.68rem" }}>
                            PUBLIC / LIVE
                          </span>
                        </div>

                        {/* Name */}
                        <div className="mb-3">
                          <span className="text-secondary small fw-bold d-block text-uppercase" style={{ fontSize: "0.68rem" }}>
                            Display Name
                          </span>
                          <span className="fw-semibold text-dark small">
                            {rev.freelancer?.displayName || "N/A"}
                          </span>
                        </div>

                        {/* Photo */}
                        <div className="mb-3">
                          <span className="text-secondary small fw-bold d-block text-uppercase mb-1" style={{ fontSize: "0.68rem" }}>
                            Live Avatar Photo
                          </span>
                          {currentPhoto ? (
                            <div
                              className="rounded-circle overflow-hidden border bg-white"
                              style={{ width: "64px", height: "64px" }}
                            >
                              <img
                                src={currentPhoto}
                                alt="Current Live"
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            </div>
                          ) : (
                            <span className="text-muted small fst-italic">No photo currently live</span>
                          )}
                        </div>

                        {/* Bio Note */}
                        <div className="mb-2">
                          <span className="text-secondary small fw-bold d-block text-uppercase" style={{ fontSize: "0.68rem" }}>
                            Bio Description
                          </span>
                          <span className="text-muted small fst-italic">
                            (Refer to candidate details for full current biography)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Proposed Changes */}
                    <div className="col-12 col-md-6">
                      <div className="p-3 rounded-3 border border-info bg-info bg-opacity-10 h-100">
                        <div className="d-flex align-items-center justify-content-between border-bottom border-info-subtle pb-2 mb-3">
                          <div className="fw-bold text-info text-uppercase small d-flex align-items-center gap-1.5" style={{ fontSize: "0.72rem", letterSpacing: "0.05em" }}>
                            <i className="bi bi-arrow-repeat text-info"></i>
                            Proposed Updates (Pending)
                          </div>
                          <span className="badge bg-info text-white font-monospace" style={{ fontSize: "0.68rem" }}>
                            PROPOSED CHANGES
                          </span>
                        </div>

                        {/* Proposed Name */}
                        <div className="mb-3">
                          <span className="text-info small fw-bold d-block text-uppercase" style={{ fontSize: "0.68rem" }}>
                            Proposed Display Name
                          </span>
                          {rev.payload.displayName ? (
                            <div className="d-flex align-items-center gap-2">
                              <span className="badge bg-info bg-opacity-25 text-info-emphasis border border-info-subtle font-monospace px-2 py-1 fs-6">
                                {rev.payload.displayName}
                              </span>
                              <span className="badge bg-warning text-dark font-monospace" style={{ fontSize: "0.65rem" }}>
                                MODIFIED
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted small fst-italic">No change proposed</span>
                          )}
                        </div>

                        {/* Proposed NID */}
                        {rev.payload.nidNumber && (
                          <div className="mb-3">
                            <span className="text-info small fw-bold d-block text-uppercase" style={{ fontSize: "0.68rem" }}>
                              Proposed NID Number
                            </span>
                            <div className="d-flex align-items-center gap-2">
                              <span className="badge bg-info bg-opacity-25 text-info-emphasis border border-info-subtle font-monospace px-2 py-1 fs-6">
                                {rev.payload.nidNumber}
                              </span>
                              <span className="badge bg-warning text-dark font-monospace" style={{ fontSize: "0.65rem" }}>
                                MODIFIED
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Proposed Photo */}
                        <div className="mb-3">
                          <span className="text-info small fw-bold d-block text-uppercase mb-1" style={{ fontSize: "0.68rem" }}>
                            Proposed Avatar Photo
                          </span>
                          {proposedPhoto ? (
                            <div className="d-flex align-items-center gap-2">
                              <div
                                className="rounded-circle overflow-hidden border border-info border-2 bg-white"
                                style={{ width: "64px", height: "64px" }}
                              >
                                <img
                                  src={proposedPhoto}
                                  alt="Proposed"
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                              </div>
                              <span className="badge bg-warning text-dark font-monospace" style={{ fontSize: "0.65rem" }}>
                                NEW PHOTO
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted small fst-italic">No photo change proposed</span>
                          )}
                        </div>

                        {/* Proposed Bio */}
                        {rev.payload.about && (
                          <div className="mb-3">
                            <span className="text-info small fw-bold d-block text-uppercase mb-1" style={{ fontSize: "0.68rem" }}>
                              Proposed Bio Update
                            </span>
                            <div className="p-2-5 bg-white rounded-3 border border-info-subtle small text-dark lh-base">
                              {rev.payload.about}
                            </div>
                          </div>
                        )}

                        {/* Proposed Portfolio */}
                        {rev.payload.portfolio && rev.payload.portfolio.length > 0 && (
                          <div className="mb-2">
                            <span className="text-info small fw-bold d-block text-uppercase mb-1" style={{ fontSize: "0.68rem" }}>
                              Proposed Portfolio Updates ({rev.payload.portfolio.length} items)
                            </span>
                            <div className="row g-1">
                              {rev.payload.portfolio.map((item, idx) => {
                                const itmUrl = resolveImageUrl(item.imageUrl);
                                return (
                                  <div key={idx} className="col-4 col-sm-3">
                                    <div className="card shadow-sm border border-info overflow-hidden">
                                      <img
                                        src={itmUrl!}
                                        alt={item.caption || "Portfolio item"}
                                        style={{ width: "100%", height: "60px", objectFit: "cover" }}
                                      />
                                      {item.caption && (
                                        <div className="p-1 text-truncate text-secondary" style={{ fontSize: "0.65rem" }}>
                                          {item.caption}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Approve Confirmation Modal */}
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
                  <i className="bi bi-check2-circle text-success fs-5"></i>
                  Approve Profile Diff
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
                  Approve proposed changes for <strong className="text-dark">{target.freelancer?.displayName}</strong>?
                </p>
                <div className="p-3 bg-success bg-opacity-10 border border-success-subtle rounded-3 text-success small mb-0">
                  Approved fields will immediately overwrite the active profile and become visible across marketplace search.
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
                  {actionLoading ? "Applying Diff..." : "Yes, Approve & Publish"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal with Presets */}
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
                  <i className="bi bi-x-circle text-danger fs-5"></i>
                  Reject Sensitive Diff
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
                  Feedback for <strong className="text-dark">{target.freelancer?.displayName}</strong>:
                </p>

                {/* Presets */}
                <div className="mb-3">
                  <span className="text-secondary small fw-bold d-block mb-1">
                    Select quick reason:
                  </span>
                  <div className="d-flex flex-wrap gap-1">
                    {revisionRejectPresets.map((preset, idx) => (
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
                    placeholder="Specify why these proposed changes cannot be accepted..."
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
