"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  AdminReview,
  ReviewStatus,
  ReviewStats,
  engagementService,
} from "../../../services/engagement";

export default function ProductReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | "">("");
  const [ratingFilter, setRatingFilter] = useState<number | "">("");
  const [verifiedFilter, setVerifiedFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Alert feedback
  const [alert, setAlert] = useState<{
    type: "success" | "danger" | "info";
    text: string;
  } | null>(null);

  // Modals state
  const [selectedReview, setSelectedReview] = useState<AdminReview | null>(null);
  const [reviewToDelete, setReviewToDelete] = useState<AdminReview | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [res, statsRes] = await Promise.all([
        engagementService.getReviews({
          page,
          limit,
          search: debouncedSearch || undefined,
          status: statusFilter || undefined,
          rating: ratingFilter !== "" ? Number(ratingFilter) : undefined,
          isVerifiedPurchase:
            verifiedFilter === "true"
              ? true
              : verifiedFilter === "false"
              ? false
              : undefined,
          dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
          dateTo: dateTo ? new Date(dateTo).toISOString() : undefined,
          sortBy: "createdAt",
          sortOrder: "desc",
        }),
        engagementService.getReviewStats().catch(() => null),
      ]);

      setReviews(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      if (statsRes) {
        setStats(statsRes);
      }
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to load product reviews",
      });
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter, ratingFilter, verifiedFilter, dateFrom, dateTo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (reviewId: string, newStatus: ReviewStatus) => {
    setActionLoading(true);
    try {
      await engagementService.updateReviewStatus(reviewId, newStatus);
      setAlert({
        type: "success",
        text: `Review marked as ${newStatus} successfully!`,
      });
      if (selectedReview && selectedReview.id === reviewId) {
        setSelectedReview((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      loadData();
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to update review status",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!reviewToDelete) return;
    setActionLoading(true);
    try {
      await engagementService.deleteReview(reviewToDelete.id);
      setAlert({
        type: "success",
        text: "Review deleted successfully!",
      });
      setReviewToDelete(null);
      if (selectedReview?.id === reviewToDelete.id) {
        setSelectedReview(null);
      }
      loadData();
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to delete review",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setStatusFilter("");
    setRatingFilter("");
    setVerifiedFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="d-inline-flex align-items-center text-warning" title={`${rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <i
            key={star}
            className={`bi ${star <= rating ? "bi-star-fill" : "bi-star"} me-1`}
            style={{ fontSize: "0.85rem" }}
          ></i>
        ))}
        <span className="ms-1 text-muted fw-semibold small">({rating}.0)</span>
      </div>
    );
  };

  const getStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="badge bg-success-subtle text-success-emphasis border border-success-subtle px-2 py-1">
            <i className="bi bi-check-circle-fill me-1"></i>Approved
          </span>
        );
      case "PENDING":
        return (
          <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1">
            <i className="bi bi-hourglass-split me-1"></i>Pending Review
          </span>
        );
      case "REJECTED":
        return (
          <span className="badge bg-danger-subtle text-danger-emphasis border border-danger-subtle px-2 py-1">
            <i className="bi bi-x-circle-fill me-1"></i>Rejected
          </span>
        );
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  return (
    <div className="container-fluid p-3">
      {/* Page Header */}
      <div className="row mb-3 align-items-center">
        <div className="col-sm-6">
          <h1 className="h3 mb-0 text-dark font-weight-bold">
            <i className="bi bi-star-half me-2 text-primary"></i>Product Reviews Management
          </h1>
          <p className="text-muted small mb-0 mt-1">
            Moderate customer feedback, manage rating approvals, and inspect verified purchase statuses.
          </p>
        </div>
        <div className="col-sm-6 text-sm-end mt-2 mt-sm-0">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb float-sm-end mb-0 bg-transparent p-0 small">
              <li className="breadcrumb-item">
                <Link href="/" className="text-decoration-none">
                  <i className="bi bi-speedometer2 me-1"></i>Dashboard
                </Link>
              </li>
              <li className="breadcrumb-item">Engagement</li>
              <li className="breadcrumb-item active" aria-current="page">
                Product Reviews
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Alert Banner */}
      {alert && (
        <div
          className={`alert alert-${alert.type} alert-dismissible fade show shadow-sm`}
          role="alert"
        >
          <div className="d-flex align-items-center">
            <i
              className={`bi ${
                alert.type === "success"
                  ? "bi-check-circle-fill"
                  : alert.type === "danger"
                  ? "bi-exclamation-octagon-fill"
                  : "bi-info-circle-fill"
              } me-2 fs-5`}
            ></i>
            <div>{alert.text}</div>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={() => setAlert(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Metrics Counters */}
      <div className="row g-3 mb-4">
        <div className="col-xl-3 col-sm-6">
          <div className="card border-0 shadow-sm rounded-3 h-100 border-start border-primary border-4">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-uppercase text-muted small fw-bold">Total Reviews</div>
                  <h3 className="mb-0 fw-bold text-dark mt-1">
                    {stats ? stats.totalReviews.toLocaleString() : "..."}
                  </h3>
                  <div className="small text-muted mt-1">
                    <span className="text-success fw-medium">
                      <i className="bi bi-patch-check-fill me-1"></i>
                      {stats ? stats.verifiedPurchaseCount : 0}
                    </span>{" "}
                    verified buyers
                  </div>
                </div>
                <div
                  className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: "48px", height: "48px" }}
                >
                  <i className="bi bi-chat-square-quote-fill fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6">
          <div className="card border-0 shadow-sm rounded-3 h-100 border-start border-warning border-4">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-uppercase text-muted small fw-bold">Pending Moderation</div>
                  <h3 className="mb-0 fw-bold text-warning mt-1">
                    {stats ? stats.pendingCount.toLocaleString() : "..."}
                  </h3>
                  <div className="small text-muted mt-1">
                    <i className="bi bi-clock-history me-1"></i>Requires admin action
                  </div>
                </div>
                <div
                  className="bg-warning-subtle text-warning rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: "48px", height: "48px" }}
                >
                  <i className="bi bi-hourglass-split fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6">
          <div className="card border-0 shadow-sm rounded-3 h-100 border-start border-success border-4">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-uppercase text-muted small fw-bold">Approved Live</div>
                  <h3 className="mb-0 fw-bold text-success mt-1">
                    {stats ? stats.approvedCount.toLocaleString() : "..."}
                  </h3>
                  <div className="small text-muted mt-1">
                    <i className="bi bi-eye me-1"></i>Visible on storefront
                  </div>
                </div>
                <div
                  className="bg-success-subtle text-success rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: "48px", height: "48px" }}
                >
                  <i className="bi bi-check2-circle fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6">
          <div className="card border-0 shadow-sm rounded-3 h-100 border-start border-info border-4">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-uppercase text-muted small fw-bold">Average Store Rating</div>
                  <div className="d-flex align-items-baseline gap-2 mt-1">
                    <h3 className="mb-0 fw-bold text-dark">
                      {stats ? stats.averageRating.toFixed(1) : "0.0"}
                    </h3>
                    <small className="text-warning">
                      <i className="bi bi-star-fill"></i>
                    </small>
                  </div>
                  <div className="small text-muted mt-1">
                    5-Star: {stats ? stats.ratingDistribution.star5 : 0} | 1-Star: {stats ? stats.ratingDistribution.star1 : 0}
                  </div>
                </div>
                <div
                  className="bg-info-subtle text-info rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: "48px", height: "48px" }}
                >
                  <i className="bi bi-award-fill fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Control Card */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-header bg-white py-3 border-0">
          <div className="row g-2 align-items-center">
            {/* Search */}
            <div className="col-lg-3 col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control bg-light border-start-0"
                  placeholder="Search product, author, comment..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Moderation Status */}
            <div className="col-lg-2 col-md-3 col-6">
              <select
                className="form-select bg-light"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as ReviewStatus | "");
                  setPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending Moderation</option>
                <option value="APPROVED">Approved (Live)</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {/* Rating Filter */}
            <div className="col-lg-2 col-md-3 col-6">
              <select
                className="form-select bg-light"
                value={ratingFilter}
                onChange={(e) => {
                  setRatingFilter(e.target.value ? Number(e.target.value) : "");
                  setPage(1);
                }}
              >
                <option value="">All Ratings</option>
                <option value="5">5 Stars (★★★★★)</option>
                <option value="4">4 Stars (★★★★☆)</option>
                <option value="3">3 Stars (★★★☆☆)</option>
                <option value="2">2 Stars (★★☆☆☆)</option>
                <option value="1">1 Star (★☆☆☆☆)</option>
              </select>
            </div>

            {/* Verified Buyer */}
            <div className="col-lg-2 col-md-4 col-6">
              <select
                className="form-select bg-light"
                value={verifiedFilter}
                onChange={(e) => {
                  setVerifiedFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Buyer Status (All)</option>
                <option value="true">Verified Purchase Only</option>
                <option value="false">Unverified Purchase</option>
              </select>
            </div>

            {/* Date Range Start */}
            <div className="col-lg-2 col-md-4 col-6">
              <input
                type="date"
                className="form-control bg-light"
                placeholder="From Date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Reset Actions */}
            <div className="col-lg-1 col-md-4 col-12 d-flex justify-content-end">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                onClick={resetFilters}
                title="Reset all filters"
              >
                <i className="bi bi-arrow-counterclockwise"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light text-muted small text-uppercase">
                <tr>
                  <th style={{ width: "22%" }}>Product</th>
                  <th style={{ width: "16%" }}>Reviewer</th>
                  <th style={{ width: "14%" }}>Rating</th>
                  <th style={{ width: "24%" }}>Review Content</th>
                  <th style={{ width: "10%" }}>Status</th>
                  <th style={{ width: "14%" }} className="text-end pe-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5 text-muted">
                      <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                      Loading reviews...
                    </td>
                  </tr>
                ) : reviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5">
                      <div className="text-muted">
                        <i className="bi bi-chat-square-dots fs-1 d-block mb-2 text-secondary"></i>
                        <h5>No Product Reviews Found</h5>
                        <p className="small mb-2">No reviews match the current filters or query criteria.</p>
                        <button className="btn btn-sm btn-outline-primary" onClick={resetFilters}>
                          Clear Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  reviews.map((rev) => (
                    <tr key={rev.id}>
                      {/* Product */}
                      <td>
                        <div className="d-flex align-items-center">
                          {rev.product?.thumbnailUrl ? (
                            <img
                              src={rev.product.thumbnailUrl}
                              alt={rev.product.title}
                              className="rounded me-2 object-fit-cover border shadow-xs"
                              style={{ width: "42px", height: "42px" }}
                            />
                          ) : (
                            <div
                              className="rounded me-2 bg-light border d-flex align-items-center justify-content-center text-muted"
                              style={{ width: "42px", height: "42px" }}
                            >
                              <i className="bi bi-box-seam"></i>
                            </div>
                          )}
                          <div className="overflow-hidden">
                            <div
                              className="fw-semibold text-dark text-truncate"
                              style={{ maxWidth: "200px" }}
                              title={rev.product?.title || "Unknown Product"}
                            >
                              {rev.product?.title || "Product"}
                            </div>
                            <small className="text-muted text-truncate d-block" style={{ fontSize: "0.75rem" }}>
                              {rev.product?.slug || rev.productId}
                            </small>
                          </div>
                        </div>
                      </td>

                      {/* Reviewer */}
                      <td>
                        <div className="fw-medium text-dark">{rev.user?.name || "Anonymous Customer"}</div>
                        <div className="text-muted small" style={{ fontSize: "0.75rem" }}>
                          {rev.user?.email || "N/A"}
                        </div>
                        {rev.isVerifiedPurchase ? (
                          <span
                            className="badge bg-success-subtle text-success border border-success-subtle mt-1"
                            style={{ fontSize: "0.7rem" }}
                          >
                            <i className="bi bi-patch-check-fill me-1"></i>Verified Buyer
                          </span>
                        ) : (
                          <span
                            className="badge bg-light text-secondary border mt-1"
                            style={{ fontSize: "0.7rem" }}
                          >
                            Standard Review
                          </span>
                        )}
                      </td>

                      {/* Rating */}
                      <td>
                        {renderStars(rev.rating)}
                        <div className="text-muted small mt-1" style={{ fontSize: "0.75rem" }}>
                          {new Date(rev.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </td>

                      {/* Content */}
                      <td>
                        {rev.title && <div className="fw-semibold text-dark small mb-1">{rev.title}</div>}
                        <div
                          className="text-secondary small"
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                          title={rev.comment}
                        >
                          {rev.comment}
                        </div>
                        {rev.order && (
                          <div className="mt-1">
                            <span className="badge bg-light text-muted border" style={{ fontSize: "0.7rem" }}>
                              Order: #{rev.order.orderNumber}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td>{getStatusBadge(rev.status)}</td>

                      {/* Actions */}
                      <td className="text-end pe-3">
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setSelectedReview(rev)}
                            title="Inspect Review Details"
                          >
                            <i className="bi bi-eye"></i>
                          </button>

                          {rev.status !== "APPROVED" && (
                            <button
                              type="button"
                              className="btn btn-outline-success"
                              onClick={() => handleStatusChange(rev.id, "APPROVED")}
                              title="Approve Review"
                              disabled={actionLoading}
                            >
                              <i className="bi bi-check-lg"></i>
                            </button>
                          )}

                          {rev.status !== "REJECTED" && (
                            <button
                              type="button"
                              className="btn btn-outline-warning"
                              onClick={() => handleStatusChange(rev.id, "REJECTED")}
                              title="Reject Review"
                              disabled={actionLoading}
                            >
                              <i className="bi bi-slash-circle"></i>
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => setReviewToDelete(rev)}
                            title="Delete Review"
                            disabled={actionLoading}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Footer */}
        <div className="card-footer bg-white py-3 border-0 d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2">
          <small className="text-muted">
            Showing {reviews.length} of {total} total reviews
          </small>
          {totalPages > 1 && (
            <nav aria-label="Page navigation">
              <ul className="pagination pagination-sm mb-0">
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
                  <li key={p} className={`page-item ${p === page ? "active" : ""}`}>
                    <button className="page-link" onClick={() => setPage(p)}>
                      {p}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </div>
      </div>

      {/* Review Details Modal */}
      {selectedReview && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-light">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-card-text me-2 text-primary"></i>Review Moderation Details
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedReview(null)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <div className="row g-3 mb-4">
                  <div className="col-md-6 border-end">
                    <h6 className="text-muted text-uppercase small fw-bold mb-2">Product Information</h6>
                    <div className="d-flex align-items-center gap-3">
                      {selectedReview.product?.thumbnailUrl ? (
                        <img
                          src={selectedReview.product.thumbnailUrl}
                          alt={selectedReview.product.title}
                          className="rounded border"
                          style={{ width: "60px", height: "60px", objectFit: "cover" }}
                        />
                      ) : (
                        <div
                          className="rounded bg-light border d-flex align-items-center justify-content-center text-muted"
                          style={{ width: "60px", height: "60px" }}
                        >
                          <i className="bi bi-box-seam fs-3"></i>
                        </div>
                      )}
                      <div>
                        <div className="fw-bold text-dark">{selectedReview.product?.title}</div>
                        <div className="text-muted small">{selectedReview.product?.slug}</div>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <h6 className="text-muted text-uppercase small fw-bold mb-2">Customer & Order</h6>
                    <div>
                      <div className="fw-bold">{selectedReview.user?.name}</div>
                      <div className="text-muted small">{selectedReview.user?.email}</div>
                      <div className="mt-2 d-flex gap-2">
                        {selectedReview.isVerifiedPurchase ? (
                          <span className="badge bg-success-subtle text-success border border-success-subtle">
                            <i className="bi bi-patch-check-fill me-1"></i>Verified Purchase
                          </span>
                        ) : (
                          <span className="badge bg-light text-secondary border">Unverified</span>
                        )}
                        {selectedReview.order && (
                          <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                            Order #{selectedReview.order.orderNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card bg-light border-0 p-3 mb-3 rounded-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div>{renderStars(selectedReview.rating)}</div>
                    <div>{getStatusBadge(selectedReview.status)}</div>
                  </div>
                  {selectedReview.title && (
                    <h5 className="fw-bold text-dark mb-2">{selectedReview.title}</h5>
                  )}
                  <p className="text-secondary mb-0" style={{ whiteSpace: "pre-wrap" }}>
                    {selectedReview.comment}
                  </p>
                  <div className="text-muted small text-end mt-2">
                    Submitted on {new Date(selectedReview.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                  <div>
                    <span className="text-muted small">Change Moderation Status:</span>
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-warning"
                      onClick={() => handleStatusChange(selectedReview.id, "PENDING")}
                      disabled={selectedReview.status === "PENDING" || actionLoading}
                    >
                      <i className="bi bi-hourglass me-1"></i>Pending
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => handleStatusChange(selectedReview.id, "REJECTED")}
                      disabled={selectedReview.status === "REJECTED" || actionLoading}
                    >
                      <i className="bi bi-x-circle me-1"></i>Reject
                    </button>
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={() => handleStatusChange(selectedReview.id, "APPROVED")}
                      disabled={selectedReview.status === "APPROVED" || actionLoading}
                    >
                      <i className="bi bi-check2-circle me-1"></i>Approve & Publish
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {reviewToDelete && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>Delete Product Review
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setReviewToDelete(null)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <p>
                  Are you sure you want to permanently delete this review for{" "}
                  <strong>{reviewToDelete.product?.title || "this product"}</strong> by{" "}
                  <strong>{reviewToDelete.user?.name || "customer"}</strong>?
                </p>
                <div className="card bg-light border-0 p-3 mb-0 small">
                  <em>&ldquo;{reviewToDelete.comment}&rdquo;</em>
                </div>
                <p className="text-danger small mt-2 mb-0">
                  <i className="bi bi-info-circle me-1"></i>This action is irreversible.
                </p>
              </div>
              <div className="modal-footer bg-light">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setReviewToDelete(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDeleteReview}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
