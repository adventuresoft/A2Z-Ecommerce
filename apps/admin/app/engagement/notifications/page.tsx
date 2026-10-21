"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  AdminNotification,
  NotificationType,
  NotificationStats,
  engagementService,
} from "../../../services/engagement";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<NotificationType | "">("");
  const [readFilter, setReadFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Alert feedback
  const [alert, setAlert] = useState<{
    type: "success" | "danger" | "info";
    text: string;
  } | null>(null);

  // Modals
  const [selectedNotif, setSelectedNotif] = useState<AdminNotification | null>(null);
  const [notifToDelete, setNotifToDelete] = useState<AdminNotification | null>(null);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Dispatch Form State
  const [dispatchAudience, setDispatchAudience] = useState<"BROADCAST_ALL" | "BROADCAST_ROLE" | "DIRECT_USER">("BROADCAST_ALL");
  const [targetRole, setTargetRole] = useState("CUSTOMER");
  const [targetUserId, setTargetUserId] = useState("");
  const [dispatchType, setDispatchType] = useState<NotificationType>("PROMOTION");
  const [dispatchTitle, setDispatchTitle] = useState("");
  const [dispatchMessage, setDispatchMessage] = useState("");
  const [dispatchLinkUrl, setDispatchLinkUrl] = useState("");
  const [submittingDispatch, setSubmittingDispatch] = useState(false);

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
        engagementService.getNotifications({
          page,
          limit,
          search: debouncedSearch || undefined,
          type: typeFilter || undefined,
          isRead:
            readFilter === "true"
              ? true
              : readFilter === "false"
              ? false
              : undefined,
          dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
          dateTo: dateTo ? new Date(dateTo).toISOString() : undefined,
          sortBy: "createdAt",
          sortOrder: "desc",
        }),
        engagementService.getNotificationStats().catch(() => null),
      ]);

      setNotifications(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      if (statsRes) {
        setStats(statsRes);
      }
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to load notifications",
      });
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, typeFilter, readFilter, dateFrom, dateTo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMarkAsRead = async (id: string) => {
    setActionLoading(true);
    try {
      await engagementService.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      if (selectedNotif?.id === id) {
        setSelectedNotif((prev) => (prev ? { ...prev, isRead: true } : null));
      }
      setAlert({
        type: "success",
        text: "Notification marked as read.",
      });
      // Refresh stats
      engagementService.getNotificationStats().then((s) => setStats(s)).catch(() => {});
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to mark as read",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    setActionLoading(true);
    try {
      const res = await engagementService.markAllNotificationsAsRead();
      setAlert({
        type: "success",
        text: `Successfully marked ${res.count} notifications as read!`,
      });
      loadData();
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to mark all as read",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteNotification = async () => {
    if (!notifToDelete) return;
    setActionLoading(true);
    try {
      await engagementService.deleteNotification(notifToDelete.id);
      setAlert({
        type: "success",
        text: "Notification deleted successfully!",
      });
      setNotifToDelete(null);
      if (selectedNotif?.id === notifToDelete.id) {
        setSelectedNotif(null);
      }
      loadData();
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to delete notification",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchTitle || !dispatchMessage) {
      setAlert({ type: "danger", text: "Please enter both Title and Message." });
      return;
    }

    setSubmittingDispatch(true);
    try {
      if (dispatchAudience === "DIRECT_USER") {
        if (!targetUserId) {
          throw new Error("Recipient User ID is required for direct notifications.");
        }
        await engagementService.createNotification({
          userId: targetUserId.trim(),
          type: dispatchType,
          title: dispatchTitle.trim(),
          message: dispatchMessage.trim(),
          linkUrl: dispatchLinkUrl.trim() || undefined,
        });
        setAlert({
          type: "success",
          text: "Direct notification dispatched successfully!",
        });
      } else {
        const payloadTargetRole =
          dispatchAudience === "BROADCAST_ROLE" ? targetRole : undefined;
        const res = await engagementService.broadcastNotification({
          targetRole: payloadTargetRole,
          type: dispatchType,
          title: dispatchTitle.trim(),
          message: dispatchMessage.trim(),
          linkUrl: dispatchLinkUrl.trim() || undefined,
        });
        setAlert({
          type: "success",
          text: `Broadcast dispatched to ${res.dispatchedCount} users successfully!`,
        });
      }

      setShowDispatchModal(false);
      setDispatchTitle("");
      setDispatchMessage("");
      setDispatchLinkUrl("");
      setTargetUserId("");
      loadData();
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to dispatch notification",
      });
    } finally {
      setSubmittingDispatch(false);
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setTypeFilter("");
    setReadFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const getTypeBadge = (type: NotificationType) => {
    switch (type) {
      case "ORDER_STATUS":
        return (
          <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1">
            <i className="bi bi-box-seam me-1"></i>Order Status
          </span>
        );
      case "PAYMENT":
        return (
          <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
            <i className="bi bi-cash-coin me-1"></i>Payment
          </span>
        );
      case "LOW_STOCK":
        return (
          <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1">
            <i className="bi bi-exclamation-triangle-fill me-1"></i>Low Stock
          </span>
        );
      case "PROMOTION":
        return (
          <span className="badge bg-info-subtle text-info border border-info-subtle px-2 py-1">
            <i className="bi bi-megaphone-fill me-1"></i>Promotion
          </span>
        );
      case "SYSTEM":
        return (
          <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-2 py-1">
            <i className="bi bi-gear-fill me-1"></i>System
          </span>
        );
      default:
        return <span className="badge bg-light text-dark">{type}</span>;
    }
  };

  return (
    <div className="container-fluid p-3">
      {/* Page Header */}
      <div className="row mb-3 align-items-center">
        <div className="col-sm-6">
          <h1 className="h3 mb-0 text-dark font-weight-bold">
            <i className="bi bi-bell-fill me-2 text-primary"></i>Notifications Management
          </h1>
          <p className="text-muted small mb-0 mt-1">
            Operational alert logs, low-stock notifications, order status dispatches, and promotional broadcasts.
          </p>
        </div>
        <div className="col-sm-6 text-sm-end mt-2 mt-sm-0">
          <div className="d-flex justify-content-sm-end gap-2 align-items-center">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={handleMarkAllRead}
              disabled={actionLoading}
            >
              <i className="bi bi-check2-all me-1"></i>Mark All as Read
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm shadow-sm"
              onClick={() => setShowDispatchModal(true)}
            >
              <i className="bi bi-send-plus-fill me-1"></i>Dispatch / Broadcast
            </button>
          </div>
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
                  <div className="text-uppercase text-muted small fw-bold">Total Notifications</div>
                  <h3 className="mb-0 fw-bold text-dark mt-1">
                    {stats ? stats.totalCount.toLocaleString() : "..."}
                  </h3>
                  <div className="small text-muted mt-1">
                    Across all customers & staff
                  </div>
                </div>
                <div
                  className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: "48px", height: "48px" }}
                >
                  <i className="bi bi-bell-fill fs-4"></i>
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
                  <div className="text-uppercase text-muted small fw-bold">Unread Alerts</div>
                  <h3 className="mb-0 fw-bold text-warning mt-1">
                    {stats ? stats.unreadCount.toLocaleString() : "..."}
                  </h3>
                  <div className="small text-muted mt-1">
                    Pending review or receipt
                  </div>
                </div>
                <div
                  className="bg-warning-subtle text-warning rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: "48px", height: "48px" }}
                >
                  <i className="bi bi-envelope-exclamation-fill fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6">
          <div className="card border-0 shadow-sm rounded-3 h-100 border-start border-danger border-4">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-uppercase text-muted small fw-bold">Low Stock & Payment</div>
                  <h3 className="mb-0 fw-bold text-danger mt-1">
                    {stats ? (stats.byType.lowStock + stats.byType.payment).toLocaleString() : "..."}
                  </h3>
                  <div className="small text-muted mt-1">
                    Critical operational notices
                  </div>
                </div>
                <div
                  className="bg-danger-subtle text-danger rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: "48px", height: "48px" }}
                >
                  <i className="bi bi-shield-exclamation fs-4"></i>
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
                  <div className="text-uppercase text-muted small fw-bold">Promotions & System</div>
                  <h3 className="mb-0 fw-bold text-info mt-1">
                    {stats ? (stats.byType.promotion + stats.byType.system).toLocaleString() : "..."}
                  </h3>
                  <div className="small text-muted mt-1">
                    Broadcast campaigns & logs
                  </div>
                </div>
                <div
                  className="bg-info-subtle text-info rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: "48px", height: "48px" }}
                >
                  <i className="bi bi-broadcast fs-4"></i>
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
                  placeholder="Search title, message, recipient..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="col-lg-2 col-md-3 col-6">
              <select
                className="form-select bg-light"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value as NotificationType | "");
                  setPage(1);
                }}
              >
                <option value="">All Categories</option>
                <option value="ORDER_STATUS">Order Status</option>
                <option value="PAYMENT">Payment</option>
                <option value="LOW_STOCK">Low Stock</option>
                <option value="PROMOTION">Promotion</option>
                <option value="SYSTEM">System</option>
              </select>
            </div>

            {/* Read Filter */}
            <div className="col-lg-2 col-md-3 col-6">
              <select
                className="form-select bg-light"
                value={readFilter}
                onChange={(e) => {
                  setReadFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="false">Unread Only</option>
                <option value="true">Read Receipts</option>
              </select>
            </div>

            {/* Date From */}
            <div className="col-lg-2 col-md-4 col-6">
              <input
                type="date"
                className="form-control bg-light"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Date To */}
            <div className="col-lg-2 col-md-4 col-6">
              <input
                type="date"
                className="form-control bg-light"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Reset */}
            <div className="col-lg-1 col-md-4 col-12 d-flex justify-content-end">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                onClick={resetFilters}
                title="Reset filters"
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
                  <th style={{ width: "16%" }}>Category</th>
                  <th style={{ width: "20%" }}>Recipient</th>
                  <th style={{ width: "32%" }}>Headline & Message</th>
                  <th style={{ width: "12%" }}>Status</th>
                  <th style={{ width: "10%" }}>Dispatched</th>
                  <th style={{ width: "10%" }} className="text-end pe-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5 text-muted">
                      <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                      Loading notifications...
                    </td>
                  </tr>
                ) : notifications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5">
                      <div className="text-muted">
                        <i className="bi bi-bell-slash fs-1 d-block mb-2 text-secondary"></i>
                        <h5>No Notifications Found</h5>
                        <p className="small mb-2">No notification records match the current filter criteria.</p>
                        <button className="btn btn-sm btn-outline-primary" onClick={resetFilters}>
                          Clear Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  notifications.map((notif) => (
                    <tr
                      key={notif.id}
                      className={notif.isRead ? "" : "bg-primary-subtle bg-opacity-10"}
                    >
                      {/* Category */}
                      <td>{getTypeBadge(notif.type)}</td>

                      {/* Recipient */}
                      <td>
                        <div className="fw-medium text-dark">{notif.user?.name || "System User"}</div>
                        <div className="text-muted small" style={{ fontSize: "0.75rem" }}>
                          {notif.user?.email || notif.userId}
                        </div>
                        {notif.user?.role && (
                          <span
                            className="badge bg-light text-muted border mt-1"
                            style={{ fontSize: "0.65rem" }}
                          >
                            {notif.user.role}
                          </span>
                        )}
                      </td>

                      {/* Headline & Message */}
                      <td>
                        <div className="fw-semibold text-dark small mb-1">{notif.title}</div>
                        <div
                          className="text-secondary small"
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                          title={notif.message}
                        >
                          {notif.message}
                        </div>
                        {notif.linkUrl && (
                          <div className="mt-1">
                            <a
                              href={notif.linkUrl}
                              className="text-decoration-none small text-primary"
                              style={{ fontSize: "0.75rem" }}
                            >
                              <i className="bi bi-link-45deg me-1"></i>
                              {notif.linkUrl}
                            </a>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td>
                        {notif.isRead ? (
                          <span className="badge bg-light text-muted border">
                            <i className="bi bi-check2 me-1"></i>Read
                          </span>
                        ) : (
                          <span className="badge bg-primary">
                            <i className="bi bi-dot"></i>Unread
                          </span>
                        )}
                      </td>

                      {/* Dispatched Date */}
                      <td>
                        <small className="text-muted d-block">
                          {new Date(notif.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </small>
                        <small className="text-muted" style={{ fontSize: "0.7rem" }}>
                          {new Date(notif.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </small>
                      </td>

                      {/* Actions */}
                      <td className="text-end pe-3">
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setSelectedNotif(notif)}
                            title="View Full Details"
                          >
                            <i className="bi bi-eye"></i>
                          </button>

                          {!notif.isRead && (
                            <button
                              type="button"
                              className="btn btn-outline-primary"
                              onClick={() => handleMarkAsRead(notif.id)}
                              title="Mark as Read"
                              disabled={actionLoading}
                            >
                              <i className="bi bi-check2"></i>
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => setNotifToDelete(notif)}
                            title="Delete Notification"
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
            Showing {notifications.length} of {total} total notifications
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

      {/* Dispatch / Broadcast Modal */}
      {showDispatchModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-broadcast me-2"></i>Dispatch / Broadcast Notification
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowDispatchModal(false)}
                ></button>
              </div>
              <form onSubmit={handleDispatchSubmit}>
                <div className="modal-body p-4">
                  {/* Audience Selection */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-uppercase text-muted">
                      Target Audience
                    </label>
                    <div className="btn-group w-100" role="group">
                      <input
                        type="radio"
                        className="btn-check"
                        name="audience"
                        id="aud_all"
                        checked={dispatchAudience === "BROADCAST_ALL"}
                        onChange={() => setDispatchAudience("BROADCAST_ALL")}
                      />
                      <label className="btn btn-outline-primary" htmlFor="aud_all">
                        <i className="bi bi-people-fill me-1"></i>All Active Users
                      </label>

                      <input
                        type="radio"
                        className="btn-check"
                        name="audience"
                        id="aud_role"
                        checked={dispatchAudience === "BROADCAST_ROLE"}
                        onChange={() => setDispatchAudience("BROADCAST_ROLE")}
                      />
                      <label className="btn btn-outline-primary" htmlFor="aud_role">
                        <i className="bi bi-person-gear me-1"></i>Specific Role
                      </label>

                      <input
                        type="radio"
                        className="btn-check"
                        name="audience"
                        id="aud_user"
                        checked={dispatchAudience === "DIRECT_USER"}
                        onChange={() => setDispatchAudience("DIRECT_USER")}
                      />
                      <label className="btn btn-outline-primary" htmlFor="aud_user">
                        <i className="bi bi-person me-1"></i>Single User ID
                      </label>
                    </div>
                  </div>

                  {dispatchAudience === "BROADCAST_ROLE" && (
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Select Target Role</label>
                      <select
                        className="form-select"
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                      >
                        <option value="CUSTOMER">Customers (Storefront Shoppers)</option>
                        <option value="ADMIN">Administrators</option>
                        <option value="SHOP_MANAGER">Shop Managers</option>
                        <option value="SUPER_ADMIN">Super Admins</option>
                      </select>
                    </div>
                  )}

                  {dispatchAudience === "DIRECT_USER" && (
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Target User UUID</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
                        value={targetUserId}
                        onChange={(e) => setTargetUserId(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Category Type</label>
                      <select
                        className="form-select"
                        value={dispatchType}
                        onChange={(e) => setDispatchType(e.target.value as NotificationType)}
                      >
                        <option value="PROMOTION">Promotion</option>
                        <option value="SYSTEM">System Announcement</option>
                        <option value="ORDER_STATUS">Order Status</option>
                        <option value="PAYMENT">Payment</option>
                        <option value="LOW_STOCK">Low Stock Alert</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">In-App Destination Link (Optional)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. /catalog/products or /orders"
                        value={dispatchLinkUrl}
                        onChange={(e) => setDispatchLinkUrl(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Headline / Title *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 24-Hour Flash Sale or Scheduled Maintenance"
                      value={dispatchTitle}
                      onChange={(e) => setDispatchTitle(e.target.value)}
                      maxLength={200}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Message Body *</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      placeholder="Enter the full notification message to be delivered to recipient(s)..."
                      value={dispatchMessage}
                      onChange={(e) => setDispatchMessage(e.target.value)}
                      required
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowDispatchModal(false)}
                    disabled={submittingDispatch}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submittingDispatch}
                  >
                    {submittingDispatch ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Dispatching...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send-fill me-1"></i>Confirm & Dispatch
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Notification Detail Modal */}
      {selectedNotif && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-light">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-bell me-2 text-primary"></i>Notification Details
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedNotif(null)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>{getTypeBadge(selectedNotif.type)}</div>
                  <div>
                    {selectedNotif.isRead ? (
                      <span className="badge bg-light text-muted border">Read</span>
                    ) : (
                      <span className="badge bg-primary">Unread</span>
                    )}
                  </div>
                </div>

                <h5 className="fw-bold text-dark mb-2">{selectedNotif.title}</h5>
                <p className="text-secondary mb-3" style={{ whiteSpace: "pre-wrap" }}>
                  {selectedNotif.message}
                </p>

                {selectedNotif.linkUrl && (
                  <div className="mb-3 p-2 bg-light rounded border">
                    <small className="text-muted d-block">Destination Link:</small>
                    <a href={selectedNotif.linkUrl} className="fw-medium text-primary">
                      {selectedNotif.linkUrl}
                    </a>
                  </div>
                )}

                <div className="border-top pt-3 small text-muted">
                  <div className="row g-2">
                    <div className="col-6">
                      <strong>Recipient:</strong> {selectedNotif.user?.name || "User"}
                    </div>
                    <div className="col-6">
                      <strong>Email:</strong> {selectedNotif.user?.email || "N/A"}
                    </div>
                    <div className="col-12">
                      <strong>Dispatched At:</strong> {new Date(selectedNotif.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-light">
                {!selectedNotif.isRead && (
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() => handleMarkAsRead(selectedNotif.id)}
                    disabled={actionLoading}
                  >
                    <i className="bi bi-check2 me-1"></i>Mark as Read
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedNotif(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {notifToDelete && (
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
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>Delete Notification
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setNotifToDelete(null)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <p>Are you sure you want to permanently delete this notification record?</p>
                <div className="card bg-light border-0 p-3 mb-0 small">
                  <strong>{notifToDelete.title}</strong>
                  <div className="text-muted mt-1">{notifToDelete.message}</div>
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setNotifToDelete(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDeleteNotification}
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
