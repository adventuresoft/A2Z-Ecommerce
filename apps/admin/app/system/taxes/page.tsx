"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  taxesApi,
  TaxClassItem,
  CreateTaxClassPayload,
  UpdateTaxClassPayload,
} from "../../../services/taxes";
import { useAuth } from "@/context/AuthContext";

export default function TaxesManagementPage() {
  const { can } = useAuth();
  const [taxes, setTaxes] = useState<TaxClassItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Alert feedback
  const [alert, setAlert] = useState<{
    type: "success" | "danger" | "info" | "warning";
    text: string;
  } | null>(null);

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [editingTax, setEditingTax] = useState<TaxClassItem | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTax, setDeletingTax] = useState<TaxClassItem | null>(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    code: string;
    rate: number;
    isDefault: boolean;
    isActive: boolean;
    description: string;
  }>({
    name: "",
    code: "",
    rate: 5.0,
    isDefault: false,
    isActive: true,
    description: "",
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch taxes list
  const fetchTaxes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await taxesApi.getTaxes({
        page,
        limit,
        search: debouncedSearch || undefined,
        isActive: statusFilter === "" ? undefined : statusFilter === "true",
      });
      setTaxes(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to load tax classes.";
      setAlert({ type: "danger", text: msg });
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchTaxes();
  }, [fetchTaxes]);

  // Handle open create modal
  const handleOpenCreate = () => {
    setEditingTax(null);
    setFormData({
      name: "",
      code: "",
      rate: 5.0,
      isDefault: false,
      isActive: true,
      description: "",
    });
    setShowModal(true);
  };

  // Handle open edit modal
  const handleOpenEdit = (tax: TaxClassItem) => {
    setEditingTax(tax);
    setFormData({
      name: tax.name,
      code: tax.code,
      rate: Number(tax.rate),
      isDefault: tax.isDefault,
      isActive: tax.isActive,
      description: tax.description || "",
    });
    setShowModal(true);
  };

  // Handle form submit (Create or Update)
  const handleSaveTax = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      setAlert({
        type: "warning",
        text: "Please provide both a Name and unique Code for the tax class.",
      });
      return;
    }

    setModalSubmitting(true);
    try {
      if (editingTax) {
        const payload: UpdateTaxClassPayload = {
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          rate: Number(formData.rate),
          isDefault: formData.isDefault,
          isActive: formData.isActive,
          description: formData.description.trim() || undefined,
        };
        const updated = await taxesApi.updateTax(editingTax.id, payload);
        setAlert({
          type: "success",
          text: `Tax class "${updated.name}" updated successfully.`,
        });
      } else {
        const payload: CreateTaxClassPayload = {
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          rate: Number(formData.rate),
          isDefault: formData.isDefault,
          isActive: formData.isActive,
          description: formData.description.trim() || undefined,
        };
        const created = await taxesApi.createTax(payload);
        setAlert({
          type: "success",
          text: `Tax class "${created.name}" created successfully.`,
        });
      }
      setShowModal(false);
      fetchTaxes();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to save tax class.";
      setAlert({ type: "danger", text: msg });
    } finally {
      setModalSubmitting(false);
    }
  };

  // Toggle active status
  const handleToggleStatus = async (tax: TaxClassItem) => {
    const updatedStatus = !tax.isActive;

    // Optimistic UI update
    setTaxes((prev) =>
      prev.map((item) =>
        item.id === tax.id ? { ...item, isActive: updatedStatus } : item,
      ),
    );

    try {
      await taxesApi.toggleStatus(tax.id, updatedStatus);
      setAlert({
        type: "success",
        text: `Tax class "${tax.name}" is now ${
          updatedStatus ? "Active" : "Inactive"
        }.`,
      });
    } catch (err: unknown) {
      // Revert on failure
      setTaxes((prev) =>
        prev.map((item) =>
          item.id === tax.id ? { ...item, isActive: !updatedStatus } : item,
        ),
      );
      const msg =
        err instanceof Error ? err.message : "Failed to toggle status.";
      setAlert({ type: "danger", text: msg });
    }
  };

  // Set as store default
  const handleSetDefault = async (tax: TaxClassItem) => {
    if (tax.isDefault) return;

    try {
      await taxesApi.setDefault(tax.id);
      setAlert({
        type: "success",
        text: `Tax class "${tax.name}" is now the store default.`,
      });
      fetchTaxes();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to set default tax class.";
      setAlert({ type: "danger", text: msg });
    }
  };

  // Delete / Soft-deactivate tax class
  const handleConfirmDelete = async () => {
    if (!deletingTax) return;

    setModalSubmitting(true);
    try {
      const res = await taxesApi.deleteTax(deletingTax.id);
      setAlert({
        type: "success",
        text: res.message || `Tax class "${deletingTax.name}" removed.`,
      });
      setShowDeleteModal(false);
      setDeletingTax(null);
      fetchTaxes();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to delete tax class.";
      setAlert({ type: "danger", text: msg });
    } finally {
      setModalSubmitting(false);
    }
  };

  const defaultTax = taxes.find((t) => t.isDefault);
  const activeCount = taxes.filter((t) => t.isActive).length;

  return (
    <div className="container-fluid p-4">
      {/* Breadcrumb & Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1 small text-secondary">
              <li className="breadcrumb-item">
                <Link href="/" className="text-decoration-none text-secondary">
                  Dashboard
                </Link>
              </li>
              <li className="breadcrumb-item">System</li>
              <li className="breadcrumb-item active text-body fw-semibold" aria-current="page">
                Taxes & VAT
              </li>
            </ol>
          </nav>
          <h1 className="h3 fw-bold text-body mb-0 d-flex align-items-center gap-2">
            <i className="bi bi-receipt text-primary"></i>
            <span>Taxes & VAT Management</span>
          </h1>
          <p className="text-secondary small mb-0 mt-1">
            Configure tax classes, VAT rates, tax-inclusive reverse extraction, and category/product inheritance.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 shadow-sm"
            onClick={fetchTaxes}
            title="Refresh list"
            disabled={loading}
          >
            <i className={`bi bi-arrow-clockwise ${loading ? "spin" : ""}`}></i>
            <span className="d-none d-sm-inline">Refresh</span>
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm"
            onClick={handleOpenCreate}
            disabled={!can("settings", "create")}
          >
            <i className="bi bi-plus-lg"></i>
            <span>Add Tax Class</span>
          </button>
        </div>
      </div>

      {/* Alert Notification */}
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

      {/* Overview Stat Cards (AdminLTE 4 Info-boxes) */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-3 h-100 bg-body">
            <div className="card-body d-flex align-items-center gap-3">
              <div
                className="bg-primary bg-opacity-10 text-primary rounded-3 d-flex align-items-center justify-content-center p-3"
                style={{ width: "50px", height: "50px" }}
              >
                <i className="bi bi-receipt fs-4"></i>
              </div>
              <div>
                <span className="text-secondary small fw-medium text-uppercase tracking-wider">
                  Total Tax Classes
                </span>
                <h4 className="fw-bold mb-0 text-body">{total}</h4>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-3 h-100 bg-body">
            <div className="card-body d-flex align-items-center gap-3">
              <div
                className="bg-success bg-opacity-10 text-success rounded-3 d-flex align-items-center justify-content-center p-3"
                style={{ width: "50px", height: "50px" }}
              >
                <i className="bi bi-star-fill fs-4"></i>
              </div>
              <div className="overflow-hidden">
                <span className="text-secondary small fw-medium text-uppercase tracking-wider">
                  Store Default Class
                </span>
                <h5 className="fw-bold mb-0 text-truncate text-body" title={defaultTax?.name || "None"}>
                  {defaultTax ? `${defaultTax.name} (${defaultTax.rate}%)` : "None"}
                </h5>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-3 h-100 bg-body">
            <div className="card-body d-flex align-items-center gap-3">
              <div
                className="bg-info bg-opacity-10 text-info rounded-3 d-flex align-items-center justify-content-center p-3"
                style={{ width: "50px", height: "50px" }}
              >
                <i className="bi bi-toggle-on fs-4"></i>
              </div>
              <div>
                <span className="text-secondary small fw-medium text-uppercase tracking-wider">
                  Active Classes
                </span>
                <h4 className="fw-bold mb-0 text-body">{activeCount} / {taxes.length}</h4>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-3 h-100 bg-warning bg-opacity-10 border-start border-4 border-warning">
            <div className="card-body d-flex align-items-center gap-3">
              <div
                className="bg-warning bg-opacity-25 text-warning-emphasis rounded-3 d-flex align-items-center justify-content-center p-3"
                style={{ width: "50px", height: "50px" }}
              >
                <i className="bi bi-shield-check fs-4"></i>
              </div>
              <div>
                <span className="text-warning-emphasis small fw-bold text-uppercase tracking-wider">
                  Pricing Rule
                </span>
                <p className="small mb-0 text-body" style={{ fontSize: "0.82rem", lineHeight: 1.25 }}>
                  Tax-Inclusive retail prices. Shipping fees are strictly <strong>0% VAT exempt</strong>.
                </p>
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
                  placeholder="Search by name, code or description..."
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

            <div className="col-12 col-md-4 d-flex align-items-center justify-content-md-end gap-2">
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                style={{ maxWidth: "160px" }}
              >
                <option value="">All Statuses</option>
                <option value="true">Active Only</option>
                <option value="false">Inactive Only</option>
              </select>

              {(searchTerm || statusFilter) && (
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => {
                    setSearchTerm("");
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
                <th scope="col" style={{ minWidth: "220px" }}>Tax Class</th>
                <th scope="col" style={{ width: "120px" }} className="text-center">Rate</th>
                <th scope="col" style={{ width: "130px" }} className="text-center">Default Rule</th>
                <th scope="col" style={{ width: "110px" }} className="text-center">Status</th>
                <th scope="col" style={{ minWidth: "160px" }} className="text-center">Catalog Links</th>
                <th scope="col" style={{ width: "140px" }} className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && taxes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-secondary">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                    <span>Loading tax classes...</span>
                  </td>
                </tr>
              ) : taxes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-5">
                    <div className="d-flex flex-column align-items-center justify-content-center">
                      <i className="bi bi-receipt-cutoff text-secondary opacity-50 display-4 mb-2"></i>
                      <h6 className="fw-semibold text-secondary">No Tax Classes Found</h6>
                      <p className="text-secondary small mb-3">
                        {searchTerm || statusFilter
                          ? "No tax classes match your current search or status filter."
                          : "No tax classes have been created yet. Add one to enable VAT calculation."}
                      </p>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={handleOpenCreate}
                      >
                        <i className="bi bi-plus-lg me-1"></i> Add Tax Class
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                taxes.map((tax) => (
                  <tr key={tax.id}>
                    <td>
                      <div className="d-flex flex-column">
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-semibold text-body">{tax.name}</span>
                          <span className="badge font-monospace bg-secondary bg-opacity-10 text-secondary border">
                            {tax.code}
                          </span>
                        </div>
                        {tax.description && (
                          <span className="text-secondary small text-truncate" style={{ maxWidth: "340px" }}>
                            {tax.description}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="text-center">
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 fs-6 fw-bold">
                        {Number(tax.rate).toFixed(2)}%
                      </span>
                    </td>

                    <td className="text-center">
                      {tax.isDefault ? (
                        <span className="badge bg-success d-inline-flex align-items-center gap-1 shadow-sm px-2 py-1">
                          <i className="bi bi-star-fill text-warning"></i>
                          <span>Default</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm py-0 px-2"
                          style={{ fontSize: "0.75rem" }}
                          onClick={() => handleSetDefault(tax)}
                          title="Set as store default fallback"
                          disabled={!tax.isActive || !can("settings", "update")}
                        >
                          Make Default
                        </button>
                      )}
                    </td>

                    <td className="text-center">
                      <div className="form-check form-switch d-inline-block m-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          checked={tax.isActive}
                          onChange={() => handleToggleStatus(tax)}
                          disabled={tax.isDefault || !can("settings", "update")}
                          title={tax.isDefault ? "Store default cannot be deactivated" : "Toggle active state"}
                        />
                      </div>
                    </td>

                    <td className="text-center">
                      <div className="d-flex align-items-center justify-content-center gap-2">
                        <span className="badge bg-light text-secondary border" title="Categories assigned">
                          <i className="bi bi-tags me-1"></i>
                          {tax.categoriesCount} Cats
                        </span>
                        <span className="badge bg-light text-secondary border" title="Products explicitly overridden">
                          <i className="bi bi-box me-1"></i>
                          {tax.productsCount} Prods
                        </span>
                      </div>
                    </td>

                    <td className="text-end">
                      <div className="btn-group btn-group-sm" role="group">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => handleOpenEdit(tax)}
                          title="Edit Tax Class"
                          disabled={!can("settings", "update")}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => {
                            setDeletingTax(tax);
                            setShowDeleteModal(true);
                          }}
                          title="Delete Tax Class"
                          disabled={tax.isDefault || !can("settings", "delete")}
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

        {/* Card Footer with Pagination */}
        {totalPages > 1 && (
          <div className="card-footer bg-body border-top py-2 d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2">
            <span className="text-secondary small">
              Showing page {page} of {totalPages} ({total} total classes)
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
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0 rounded-3">
              <form onSubmit={handleSaveTax}>
                <div className="modal-header bg-body border-bottom">
                  <h5 className="modal-title fw-bold text-body d-flex align-items-center gap-2">
                    <i className="bi bi-receipt text-primary"></i>
                    <span>{editingTax ? "Edit Tax Class" : "Create New Tax Class"}</span>
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                    disabled={modalSubmitting}
                  ></button>
                </div>

                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">
                      Tax Class Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Standard Electronics VAT"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      autoFocus
                    />
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-semibold text-secondary">
                        Code Identifier <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control font-monospace"
                        placeholder="e.g. VAT_5_ELEC"
                        value={formData.code}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            code: e.target.value.toUpperCase().replace(/\s+/g, "_"),
                          })
                        }
                        required
                      />
                      <small className="text-secondary" style={{ fontSize: "0.75rem" }}>
                        Uppercase alphanumeric & underscores
                      </small>
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-semibold text-secondary">
                        Tax Rate (%) <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <input
                          type="number"
                          className="form-control"
                          placeholder="5.00"
                          min="0"
                          max="100"
                          step="0.01"
                          value={formData.rate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              rate: parseFloat(e.target.value) || 0,
                            })
                          }
                          required
                        />
                        <span className="input-group-text">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">
                      Description (Optional)
                    </label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="Brief notes on applicable category rules or NBR statutory guidance..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                    ></textarea>
                  </div>

                  <div className="bg-body-tertiary p-3 rounded-2 border">
                    <div className="form-check form-switch mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="isDefaultSwitch"
                        checked={formData.isDefault}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isDefault: e.target.checked,
                            // If default, must be active
                            isActive: e.target.checked ? true : formData.isActive,
                          })
                        }
                      />
                      <label className="form-check-label small fw-medium" htmlFor="isDefaultSwitch">
                        Set as Store Default Tax Class
                      </label>
                      <div className="text-secondary" style={{ fontSize: "0.72rem" }}>
                        Used as global fallback when no category or product override is specified.
                      </div>
                    </div>

                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="isActiveSwitch"
                        checked={formData.isActive}
                        disabled={formData.isDefault}
                        onChange={(e) =>
                          setFormData({ ...formData, isActive: e.target.checked })
                        }
                      />
                      <label className="form-check-label small fw-medium" htmlFor="isActiveSwitch">
                        Active & Enabled
                      </label>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-body border-top">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setShowModal(false)}
                    disabled={modalSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                    disabled={modalSubmitting}
                  >
                    {modalSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-lg"></i>
                        <span>{editingTax ? "Update Tax Class" : "Create Tax Class"}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && deletingTax && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0 rounded-3">
              <div className="modal-header bg-danger bg-opacity-10 border-bottom">
                <h5 className="modal-title fw-bold text-danger d-flex align-items-center gap-2">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  <span>Confirm Deletion</span>
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={modalSubmitting}
                ></button>
              </div>

              <div className="modal-body p-4">
                <p className="mb-2">
                  Are you sure you want to remove tax class <strong>&quot;{deletingTax.name}&quot;</strong> ({deletingTax.rate}%)?
                </p>
                {deletingTax.categoriesCount > 0 || deletingTax.productsCount > 0 ? (
                  <div className="alert alert-warning small mb-0 d-flex align-items-start gap-2">
                    <i className="bi bi-info-circle-fill mt-1"></i>
                    <div>
                      This tax class has <strong>{deletingTax.categoriesCount} categories</strong> and <strong>{deletingTax.productsCount} products</strong> assigned. To preserve catalog integrity, it will be <em>soft-deactivated</em> rather than permanently deleted.
                    </div>
                  </div>
                ) : (
                  <p className="text-secondary small mb-0">
                    This action cannot be undone. All catalog associations will fall back to the store default.
                  </p>
                )}
              </div>

              <div className="modal-footer bg-body border-top">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setShowDeleteModal(false)}
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
                  {modalSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      <span>Removing...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-trash"></i>
                      <span>Confirm Remove</span>
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
