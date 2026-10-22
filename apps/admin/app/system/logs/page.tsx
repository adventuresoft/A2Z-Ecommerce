"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  AuditLogItem,
  AuditLogFilterOptions,
  logsService,
} from "../../../services/logs";

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [selectedEntityType, setSelectedEntityType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterOptions, setFilterOptions] = useState<AuditLogFilterOptions>({
    actions: [],
    entityTypes: [],
  });

  // Modal State
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Alert State
  const [alert, setAlert] = useState<{
    type: "success" | "danger" | "info";
    text: string;
  } | null>(null);

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load filter options
  useEffect(() => {
    logsService
      .getFilterOptions()
      .then((opts) => setFilterOptions(opts))
      .catch((err) => console.error("Failed to load audit filter options", err));
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await logsService.getAuditLogs({
        page,
        limit,
        search: debouncedSearch || undefined,
        action: selectedAction || undefined,
        entityType: selectedEntityType || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });

      setLogs(res.data || []);
      setTotal(res.meta?.total || 0);
      setTotalPages(res.meta?.totalPages || 1);
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to load activity logs",
      });
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, selectedAction, selectedEntityType, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Badge styler for Actions
  const getActionBadge = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("CREATE") || act.includes("REGISTER") || act.includes("RESTOCK")) {
      return <span className="badge bg-success-subtle text-success border border-success-subtle">{action}</span>;
    }
    if (act.includes("UPDATE") || act.includes("STATUS") || act.includes("ADJUST")) {
      return <span className="badge bg-primary-subtle text-primary border border-primary-subtle">{action}</span>;
    }
    if (act.includes("REFUND") || act.includes("RETURN")) {
      return <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">{action}</span>;
    }
    if (act.includes("DELETE") || act.includes("CANCEL") || act.includes("FAIL")) {
      return <span className="badge bg-danger-subtle text-danger border border-danger-subtle">{action}</span>;
    }
    return <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">{action}</span>;
  };

  // Badge styler for Roles
  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return <span className="badge bg-danger">Super Admin</span>;
      case "ADMIN":
        return <span className="badge bg-primary">Admin</span>;
      case "SHOP_MANAGER":
        return <span className="badge bg-info text-dark">Manager</span>;
      default:
        return <span className="badge bg-light text-muted border">System</span>;
    }
  };

  // Open Inspector Modal
  const handleInspect = (log: AuditLogItem) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  return (
    <div className="container-fluid px-3 py-3">
      {/* Page Header */}
      <div className="row align-items-center mb-3">
        <div className="col-sm-6">
          <h4 className="m-0 fw-semibold text-dark d-flex align-items-center gap-2">
            <i className="bi bi-clock-history text-primary"></i> Activity & Audit Logs
          </h4>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0 small text-muted">
              <li className="breadcrumb-item">
                <Link href="/">Home</Link>
              </li>
              <li className="breadcrumb-item">
                <Link href="/system/users">System</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Activity Logs
              </li>
            </ol>
          </nav>
        </div>
        <div className="col-sm-6 text-sm-end mt-2 mt-sm-0 d-flex align-items-center justify-content-sm-end gap-2">
          <Link href="/system/users" className="btn btn-outline-secondary btn-sm">
            <i className="bi bi-shield-lock me-1"></i> Admin Users
          </Link>
          <Link href="/system/settings" className="btn btn-outline-secondary btn-sm">
            <i className="bi bi-sliders2 me-1"></i> Store Settings
          </Link>
          <button
            onClick={() => fetchLogs()}
            className="btn btn-outline-secondary btn-sm"
            title="Refresh logs"
          >
            <i className="bi bi-arrow-clockwise me-1"></i> Refresh
          </button>
        </div>
      </div>

      {/* Alert banner */}
      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
          <i className="bi bi-info-circle me-2"></i>
          {alert.text}
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
          <div className="card shadow-sm border-0 border-start border-primary border-4">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-secondary small fw-medium text-uppercase">Total Audited Events</span>
                  <h4 className="fw-bold mb-0 text-dark mt-1">{total}</h4>
                </div>
                <div className="bg-primary-subtle text-primary p-3 rounded-circle">
                  <i className="bi bi-journal-text fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 border-start border-success border-4">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-secondary small fw-medium text-uppercase">Order & Checkout Operations</span>
                  <h4 className="fw-bold mb-0 text-dark mt-1">
                    {logs.filter((l) => l.entityType === "Order" || l.action.includes("ORDER")).length}
                  </h4>
                </div>
                <div className="bg-success-subtle text-success p-3 rounded-circle">
                  <i className="bi bi-cart-check fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 border-start border-warning border-4">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-secondary small fw-medium text-uppercase">Inventory Operations</span>
                  <h4 className="fw-bold mb-0 text-dark mt-1">
                    {logs.filter((l) => l.entityType === "Inventory" || l.action.includes("STOCK")).length}
                  </h4>
                </div>
                <div className="bg-warning-subtle text-warning p-3 rounded-circle">
                  <i className="bi bi-boxes fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 border-start border-info border-4">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-secondary small fw-medium text-uppercase">Audit Integrity Status</span>
                  <h4 className="fw-bold mb-0 text-success mt-1">Active</h4>
                </div>
                <div className="bg-info-subtle text-info p-3 rounded-circle">
                  <i className="bi bi-shield-check fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body bg-light rounded">
          <div className="row g-2 align-items-center">
            {/* Search */}
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Search by action, entity ID, user, IP..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    className="btn btn-outline-secondary bg-white border-start-0"
                    type="button"
                    onClick={() => setSearchTerm("")}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>
            </div>

            {/* Action Filter */}
            <div className="col-md-2">
              <select
                className="form-select"
                value={selectedAction}
                onChange={(e) => {
                  setSelectedAction(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Action: All</option>
                <option value="ORDER_CREATE">ORDER_CREATE</option>
                <option value="ORDER_STATUS_UPDATE">ORDER_STATUS_UPDATE</option>
                <option value="STOCK_ADJUST">STOCK_ADJUST</option>
                <option value="REFUND_PROCESSED">REFUND_PROCESSED</option>
                <option value="USER_CREATE">USER_CREATE</option>
                {filterOptions.actions
                  .filter((a) => !["ORDER_CREATE", "ORDER_STATUS_UPDATE", "STOCK_ADJUST", "REFUND_PROCESSED", "USER_CREATE"].includes(a))
                  .map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
              </select>
            </div>

            {/* Entity Type Filter */}
            <div className="col-md-2">
              <select
                className="form-select"
                value={selectedEntityType}
                onChange={(e) => {
                  setSelectedEntityType(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Entity: All</option>
                <option value="Order">Order</option>
                <option value="Inventory">Inventory</option>
                <option value="Product">Product</option>
                <option value="User">User</option>
                <option value="Payment">Payment</option>
                <option value="Setting">Setting</option>
                {filterOptions.entityTypes
                  .filter((e) => !["Order", "Inventory", "Product", "User", "Payment", "Setting"].includes(e))
                  .map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
              </select>
            </div>

            {/* Date From */}
            <div className="col-md-2">
              <input
                type="date"
                className="form-control"
                title="Date From"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Date To */}
            <div className="col-md-2">
              <input
                type="date"
                className="form-control"
                title="Date To"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Activity Logs Table */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light text-secondary small">
                <tr>
                  <th style={{ width: "170px" }}>Timestamp</th>
                  <th style={{ width: "220px" }}>Performed By</th>
                  <th style={{ width: "180px" }}>Action</th>
                  <th>Entity & Reference</th>
                  <th style={{ width: "140px" }}>IP Address</th>
                  <th className="text-center" style={{ width: "100px" }}>
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5">
                      <div className="spinner-border text-primary spinner-border-sm me-2" role="status"></div>
                      <span className="text-muted">Loading audit records...</span>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5">
                      <div className="text-secondary opacity-50 mb-2">
                        <i className="bi bi-clock-history fs-1 text-muted"></i>
                      </div>
                      <h6 className="fw-semibold text-dark">No Activity Records Found</h6>
                      <p className="text-muted small mb-0">
                        {debouncedSearch || selectedAction || selectedEntityType
                          ? "No logs matched your applied search and filters."
                          : "Administrative operations such as order creations, status adjustments, and inventory movements will automatically log here."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td className="text-secondary small">
                        <div className="fw-semibold text-dark">
                          {new Date(log.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                        <div className="text-muted">
                          {new Date(log.createdAt).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </div>
                      </td>
                      <td>
                        {log.user ? (
                          <div>
                            <div className="fw-semibold text-dark">{log.user.name}</div>
                            <div className="text-muted small">{log.user.email}</div>
                            <div className="mt-1">{getRoleBadge(log.user.role)}</div>
                          </div>
                        ) : (
                          <div>
                            <span className="badge bg-light text-muted border">System Automated</span>
                          </div>
                        )}
                      </td>
                      <td>{getActionBadge(log.action)}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge bg-secondary-subtle text-secondary-emphasis">
                            {log.entityType}
                          </span>
                          <code className="text-dark small">{log.entityId}</code>
                        </div>
                        {log.newValues && typeof log.newValues === "object" && (
                          <div className="text-muted small mt-1 text-truncate" style={{ maxWidth: "340px" }}>
                            {JSON.stringify(log.newValues)}
                          </div>
                        )}
                      </td>
                      <td className="text-secondary small">
                        <code>{log.ipAddress || "127.0.0.1"}</code>
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => handleInspect(log)}
                          title="Inspect Payload"
                        >
                          <i className="bi bi-code-slash me-1"></i> View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="card-footer bg-white border-top py-3 d-flex align-items-center justify-content-between">
            <span className="small text-muted">
              Page {page} of {totalPages} ({total} total logs)
            </span>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
                <button className="page-link" onClick={() => setPage(page - 1)}>
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
              <li className={`page-item ${page >= totalPages ? "disabled" : ""}`}>
                <button className="page-link" onClick={() => setPage(page + 1)}>
                  Next
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Inspect Detail Modal */}
      {showDetailModal && selectedLog && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content shadow border-0">
              <div className="modal-header bg-light">
                <h5 className="modal-title fw-semibold text-dark d-flex align-items-center gap-2">
                  <i className="bi bi-shield-check text-primary"></i> Activity Event Payload Inspector
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDetailModal(false)}
                ></button>
              </div>

              <div className="modal-body p-4">
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="text-secondary small fw-medium">Log Record ID</label>
                    <div className="fw-semibold text-dark">
                      <code>{selectedLog.id}</code>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="text-secondary small fw-medium">Timestamp</label>
                    <div className="fw-semibold text-dark">
                      {new Date(selectedLog.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="text-secondary small fw-medium">Action Performed</label>
                    <div>{getActionBadge(selectedLog.action)}</div>
                  </div>

                  <div className="col-md-6">
                    <label className="text-secondary small fw-medium">Target Entity</label>
                    <div className="fw-semibold text-dark">
                      <span className="badge bg-secondary-subtle text-secondary-emphasis me-2">
                        {selectedLog.entityType}
                      </span>
                      <code>{selectedLog.entityId}</code>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="text-secondary small fw-medium">Operator / User</label>
                    <div className="fw-semibold text-dark">
                      {selectedLog.user ? (
                        <>
                          {selectedLog.user.name} ({selectedLog.user.email}) &bull;{" "}
                          {selectedLog.user.role}
                        </>
                      ) : (
                        "System Automated Service"
                      )}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="text-secondary small fw-medium">Client Network</label>
                    <div className="fw-semibold text-dark">
                      IP: <code>{selectedLog.ipAddress || "127.0.0.1"}</code>
                    </div>
                  </div>
                </div>

                <hr className="my-3" />

                {/* State Diff / JSON View */}
                <div className="row g-3">
                  {selectedLog.oldValues && (
                    <div className="col-md-6">
                      <label className="text-secondary small fw-semibold d-flex align-items-center gap-1 mb-1">
                        <i className="bi bi-arrow-left-circle text-danger"></i> Previous State (oldValues)
                      </label>
                      <pre
                        className="bg-light p-3 rounded border small text-dark mb-0"
                        style={{ maxHeight: "280px", overflow: "auto" }}
                      >
                        {JSON.stringify(selectedLog.oldValues, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className={selectedLog.oldValues ? "col-md-6" : "col-12"}>
                    <label className="text-secondary small fw-semibold d-flex align-items-center gap-1 mb-1">
                      <i className="bi bi-arrow-right-circle text-success"></i> Modified State / Payload (newValues)
                    </label>
                    <pre
                      className="bg-light p-3 rounded border small text-dark mb-0"
                      style={{ maxHeight: "280px", overflow: "auto" }}
                    >
                      {selectedLog.newValues
                        ? JSON.stringify(selectedLog.newValues, null, 2)
                        : "No payload modifications stored."}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="modal-footer bg-light">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowDetailModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
