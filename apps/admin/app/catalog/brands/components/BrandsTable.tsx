"use client";

import React from "react";
import { BrandItem, resolveLogoUrl } from "../../../../services/brands";

interface BrandsTableProps {
  brands: BrandItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  loading: boolean;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSortChange: (column: "name" | "sortOrder" | "createdAt") => void;
  onPageChange: (newPage: number) => void;
  onAddClick: () => void;
  onEditClick: (brand: BrandItem) => void;
  onDeleteClick: (brand: BrandItem) => void;
  onToggleStatus: (brand: BrandItem) => void;
  onResetFilters: () => void;
}

export function BrandsTable({
  brands,
  total,
  page,
  limit,
  totalPages,
  loading,
  searchTerm,
  onSearchChange,
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
}: BrandsTableProps) {
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

  return (
    <div className="card shadow-sm border-0">
      {/* Card Header & Controls */}
      <div className="card-header bg-body border-bottom py-3">
        <div className="row g-2 align-items-center justify-content-between">
          <div className="col-12 col-md-4">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-body-tertiary">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by name or slug..."
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

          <div className="col-12 col-md-8 d-flex flex-wrap align-items-center justify-content-md-end gap-2">
            {/* Status Filter */}
            <select
              className="form-select form-select-sm w-auto"
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>

            {(searchTerm || statusFilter) && (
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={onResetFilters}
                title="Reset filters"
              >
                <i className="bi bi-arrow-counterclockwise me-1"></i>
                Reset
              </button>
            )}

            <button
              type="button"
              className="btn btn-primary btn-sm d-flex align-items-center gap-1"
              onClick={onAddClick}
            >
              <i className="bi bi-plus-lg"></i>
              <span>Add Brand</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table Body */}
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-secondary small text-uppercase">
              <tr>
                <th scope="col" style={{ width: "60px" }}>
                  Logo
                </th>
                <th
                  scope="col"
                  role="button"
                  onClick={() => onSortChange("name")}
                >
                  Name {renderSortIcon("name")}
                </th>
                <th scope="col">Slug</th>
                <th scope="col">Website</th>
                <th
                  scope="col"
                  role="button"
                  className="text-center"
                  onClick={() => onSortChange("sortOrder")}
                >
                  Order {renderSortIcon("sortOrder")}
                </th>
                <th scope="col" className="text-center">
                  Status
                </th>
                <th
                  scope="col"
                  className="text-end pe-3"
                  style={{ width: "120px" }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-5">
                    <div
                      className="spinner-border spinner-border-sm text-primary me-2"
                      role="status"
                    ></div>
                    <span className="text-secondary">Loading brands...</span>
                  </td>
                </tr>
              ) : brands.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-5">
                    <div
                      className="d-inline-flex align-items-center justify-content-center bg-body-tertiary text-secondary rounded-circle mb-3"
                      style={{ width: "56px", height: "56px" }}
                    >
                      <i className="bi bi-award fs-3"></i>
                    </div>
                    <h6 className="fw-semibold text-body mb-1">
                      No Brands Found
                    </h6>
                    <p className="text-secondary small mb-3">
                      {searchTerm || statusFilter
                        ? "Try adjusting your search criteria or resetting filters."
                        : "Start organizing your product catalog by adding your first brand."}
                    </p>
                    {!(searchTerm || statusFilter) && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={onAddClick}
                      >
                        <i className="bi bi-plus-lg me-1"></i> Add Brand
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                brands.map((brand) => (
                  <tr key={brand.id}>
                    {/* Thumbnail */}
                    <td>
                      <div
                        className="d-flex align-items-center justify-content-center bg-body-tertiary rounded overflow-hidden border p-1"
                        style={{ width: "42px", height: "42px" }}
                      >
                        {brand.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={resolveLogoUrl(brand.logoUrl)}
                            alt={brand.name}
                            style={{
                              maxWidth: "100%",
                              maxHeight: "100%",
                              objectFit: "contain",
                            }}
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <i
                            className="bi bi-award-fill text-primary fs-5"
                            title="Brand Logo"
                          ></i>
                        )}
                      </div>
                    </td>

                    {/* Name & Description */}
                    <td>
                      <div className="fw-semibold text-body">
                        {brand.name}
                      </div>
                      {brand.description && (
                        <small
                          className="text-secondary text-truncate d-block"
                          style={{ maxWidth: "250px" }}
                        >
                          {brand.description}
                        </small>
                      )}
                    </td>

                    {/* Slug */}
                    <td>
                      <code className="text-primary-emphasis bg-primary-subtle px-2 py-1 rounded small">
                        {brand.slug}
                      </code>
                    </td>

                    {/* Website */}
                    <td>
                      {brand.website ? (
                        <a
                          href={brand.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-decoration-none small d-inline-flex align-items-center gap-1 text-truncate"
                          style={{ maxWidth: "200px" }}
                        >
                          <span>
                            {brand.website.replace(/^https?:\/\//, "")}
                          </span>
                          <i className="bi bi-box-arrow-up-right small"></i>
                        </a>
                      ) : (
                        <span className="text-secondary opacity-50">—</span>
                      )}
                    </td>

                    {/* Sort Order */}
                    <td className="text-center text-secondary small">
                      {brand.sortOrder}
                    </td>

                    {/* Status & Inline Toggle */}
                    <td className="text-center">
                      <div className="d-inline-flex align-items-center gap-1">
                        <div
                          className="form-check form-switch m-0"
                          title="Click to toggle status"
                        >
                          <input
                            type="checkbox"
                            role="switch"
                            className="form-check-input"
                            checked={brand.isActive}
                            onChange={() => onToggleStatus(brand)}
                            aria-label={`Toggle status for ${brand.name}`}
                          />
                        </div>
                        <span
                          className={`badge ${
                            brand.isActive ? "bg-success" : "bg-secondary"
                          }`}
                        >
                          {brand.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="text-end pe-3">
                      <div className="btn-group btn-group-sm">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => onEditClick(brand)}
                          title="Edit brand"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => onDeleteClick(brand)}
                          title="Delete brand"
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

      {/* Card Footer: Result Count & Pagination */}
      <div className="card-footer bg-body-tertiary border-top py-2 px-3 d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2 small">
        <span className="text-secondary">
          Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of{" "}
          <strong>{total}</strong> brands
        </span>

        {totalPages > 1 && (
          <nav aria-label="Brand pagination">
            <ul className="pagination pagination-sm m-0">
              <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
                <button
                  type="button"
                  className="page-link"
                  onClick={() => onPageChange(page - 1)}
                  disabled={page <= 1}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
              </li>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  if (totalPages <= 7) return true;
                  return (
                    p === 1 ||
                    p === totalPages ||
                    (p >= page - 1 && p <= page + 1)
                  );
                })
                .map((p, idx, arr) => {
                  const showEllipsisBefore = idx > 0 && p > arr[idx - 1] + 1;
                  return (
                    <React.Fragment key={p}>
                      {showEllipsisBefore && (
                        <li className="page-item disabled">
                          <span className="page-link">…</span>
                        </li>
                      )}
                      <li
                        className={`page-item ${p === page ? "active" : ""}`}
                      >
                        <button
                          type="button"
                          className="page-link"
                          onClick={() => onPageChange(p)}
                        >
                          {p}
                        </button>
                      </li>
                    </React.Fragment>
                  );
                })}

              <li
                className={`page-item ${page >= totalPages ? "disabled" : ""}`}
              >
                <button
                  type="button"
                  className="page-link"
                  onClick={() => onPageChange(page + 1)}
                  disabled={page >= totalPages}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
}
