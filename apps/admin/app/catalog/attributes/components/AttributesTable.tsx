"use client";

import React from "react";
import { AttributeItem, AttributeType } from "../../../../services/attributes";

interface AttributesTableProps {
  attributes: AttributeItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  loading: boolean;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  typeFilter: string;
  onTypeFilterChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSortChange: (column: "name" | "sortOrder" | "createdAt") => void;
  onPageChange: (newPage: number) => void;
  onAddClick: () => void;
  onEditClick: (attr: AttributeItem) => void;
  onDeleteClick: (attr: AttributeItem) => void;
  onToggleStatus: (attr: AttributeItem) => void;
  onResetFilters: () => void;
}

export function AttributesTable({
  attributes,
  total,
  page,
  limit,
  totalPages,
  loading,
  searchTerm,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  sortOrder,
  onSortChange,
  onPageChange,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onToggleStatus,
  onResetFilters,
}: AttributesTableProps) {
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  const renderSortIcon = (column: string) => {
    if (sortBy !== column) {
      return (
        <i className="bi bi-arrow-down-up text-secondary opacity-50 ms-1 small"></i>
      );
    }
    return sortOrder === "asc" ? (
      <i className="bi bi-sort-down-alt text-primary ms-1"></i>
    ) : (
      <i className="bi bi-sort-up text-primary ms-1"></i>
    );
  };

  const renderTypeBadge = (type: AttributeType) => {
    switch (type) {
      case "COLOR":
        return (
          <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle">
            <i className="bi bi-palette me-1"></i>Color
          </span>
        );
      case "BUTTON":
        return (
          <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">
            <i className="bi bi-ui-radios-grid me-1"></i>Button
          </span>
        );
      case "TEXT":
      default:
        return (
          <span className="badge bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle">
            <i className="bi bi-fonts me-1"></i>Text
          </span>
        );
    }
  };

  return (
    <div className="card shadow-sm border-0">
      {/* Card Header & Controls */}
      <div className="card-header bg-body border-bottom py-3">
        <div className="row g-2 align-items-center justify-content-between">
          <div className="col-12 col-md-3">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-body-tertiary">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search name or slug..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => onSearchChange("")}
                  title="Clear search"
                >
                  <i className="bi bi-x"></i>
                </button>
              )}
            </div>
          </div>

          <div className="col-12 col-md-9 d-flex flex-wrap align-items-center justify-content-md-end gap-2">
            {/* Type Filter */}
            <select
              className="form-select form-select-sm w-auto"
              value={typeFilter}
              onChange={(e) => onTypeFilterChange(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="COLOR">Color</option>
              <option value="BUTTON">Button</option>
              <option value="TEXT">Text</option>
            </select>

            {/* Status Filter */}
            <select
              className="form-select form-select-sm w-auto"
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>

            {(searchTerm || typeFilter || statusFilter) && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={onResetFilters}
                title="Reset filters"
              >
                <i className="bi bi-arrow-counterclockwise me-1"></i>Reset
              </button>
            )}

            <button
              type="button"
              className="btn btn-sm btn-primary d-inline-flex align-items-center"
              onClick={onAddClick}
            >
              <i className="bi bi-plus-lg me-1"></i>Add Attribute
            </button>
          </div>
        </div>
      </div>

      {/* Table Body */}
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light text-secondary text-uppercase small">
            <tr>
              <th
                style={{ width: "25%", cursor: "pointer" }}
                onClick={() => onSortChange("name")}
              >
                Name / Slug {renderSortIcon("name")}
              </th>
              <th style={{ width: "12%" }}>Type</th>
              <th style={{ width: "35%" }}>Values Preview</th>
              <th
                style={{ width: "10%", cursor: "pointer" }}
                className="text-center"
                onClick={() => onSortChange("sortOrder")}
              >
                Order {renderSortIcon("sortOrder")}
              </th>
              <th style={{ width: "8%" }} className="text-center">Status</th>
              <th style={{ width: "10%" }} className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-5 text-secondary">
                  <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                  Loading attributes...
                </td>
              </tr>
            ) : attributes.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-5 text-secondary">
                  <i className="bi bi-sliders display-6 d-block mb-2 text-secondary opacity-50"></i>
                  {searchTerm || typeFilter || statusFilter
                    ? "No attributes found matching your filters."
                    : "No attributes in catalog yet. Click 'Add Attribute' to create one."}
                </td>
              </tr>
            ) : (
              attributes.map((attr) => {
                const values = attr.values || [];
                const displayedValues = values.slice(0, 5);
                const extraCount = values.length - displayedValues.length;

                return (
                  <tr key={attr.id}>
                    {/* Name / Slug */}
                    <td>
                      <div className="fw-semibold text-body">{attr.name}</div>
                      <div className="small text-secondary font-monospace">
                        {attr.slug}
                      </div>
                      {attr.description && (
                        <div className="small text-secondary text-truncate" style={{ maxWidth: "240px" }}>
                          {attr.description}
                        </div>
                      )}
                    </td>

                    {/* Type Badge */}
                    <td>{renderTypeBadge(attr.type)}</td>

                    {/* Values Preview */}
                    <td>
                      {values.length === 0 ? (
                        <span className="small text-secondary fst-italic">
                          No values defined
                        </span>
                      ) : (
                        <div className="d-flex flex-wrap align-items-center gap-1">
                          {displayedValues.map((v) => {
                            if (attr.type === "COLOR" && v.colorCode) {
                              return (
                                <span
                                  key={v.id}
                                  className="d-inline-flex align-items-center rounded-pill px-2 py-1 border bg-body"
                                  style={{ fontSize: "0.75rem" }}
                                  title={`${v.label || v.value} (${v.colorCode})`}
                                >
                                  <span
                                    className="d-inline-block rounded-circle me-1 border"
                                    style={{
                                      width: "12px",
                                      height: "12px",
                                      backgroundColor: v.colorCode,
                                    }}
                                  ></span>
                                  {v.label || v.value}
                                </span>
                              );
                            }
                            return (
                              <span
                                key={v.id}
                                className="badge bg-body-secondary text-body border"
                                style={{ fontSize: "0.75rem" }}
                              >
                                {v.label || v.value}
                              </span>
                            );
                          })}
                          {extraCount > 0 && (
                            <span
                              className="badge bg-secondary-subtle text-secondary"
                              style={{ fontSize: "0.75rem" }}
                            >
                              +{extraCount} more
                            </span>
                          )}
                          <span
                            className="text-secondary ms-1"
                            style={{ fontSize: "0.7rem" }}
                          >
                            ({values.length} total)
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Sort Order */}
                    <td className="text-center">
                      <span className="badge bg-light text-dark border">
                        {attr.sortOrder}
                      </span>
                    </td>

                    {/* Status Toggle */}
                    <td className="text-center">
                      <div className="form-check form-switch d-inline-block m-0">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          role="switch"
                          checked={attr.isActive}
                          onChange={() => onToggleStatus(attr)}
                          title={attr.isActive ? "Active (click to deactivate)" : "Inactive (click to activate)"}
                          style={{ cursor: "pointer" }}
                        />
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => onEditClick(attr)}
                          title="Edit attribute and values"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => onDeleteClick(attr)}
                          title="Delete attribute"
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

      {/* Card Footer / Pagination */}
      {!loading && total > 0 && (
        <div className="card-footer bg-body border-top py-3">
          <div className="row align-items-center g-2">
            <div className="col-12 col-md-6 small text-secondary text-center text-md-start">
              Showing <span className="fw-semibold text-body">{startItem}</span> to{" "}
              <span className="fw-semibold text-body">{endItem}</span> of{" "}
              <span className="fw-semibold text-body">{total}</span> attributes
            </div>

            <div className="col-12 col-md-6">
              <nav aria-label="Attribute table pagination">
                <ul className="pagination pagination-sm justify-content-center justify-content-md-end mb-0">
                  <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => onPageChange(page - 1)}
                      disabled={page <= 1}
                    >
                      <i className="bi bi-chevron-left"></i>
                    </button>
                  </li>

                  {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .map((p, idx, arr) => {
                      const prev = arr[idx - 1];
                      const showEllipsis = prev && p - prev > 1;

                      return (
                        <React.Fragment key={p}>
                          {showEllipsis && (
                            <li className="page-item disabled">
                              <span className="page-link">...</span>
                            </li>
                          )}
                          <li className={`page-item ${p === page ? "active" : ""}`}>
                            <button
                              className="page-link"
                              onClick={() => onPageChange(p)}
                            >
                              {p}
                            </button>
                          </li>
                        </React.Fragment>
                      );
                    })}

                  <li className={`page-item ${page >= totalPages ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => onPageChange(page + 1)}
                      disabled={page >= totalPages}
                    >
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
