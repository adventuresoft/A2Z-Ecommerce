"use client";

import { CategoryItem, ParentOption, resolveImageUrl } from "../../../../services/categories";

interface CategoriesTableProps {
  categories: CategoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  loading: boolean;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  parentFilter: string;
  onParentFilterChange: (val: string) => void;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSortChange: (column: "name" | "sortOrder" | "createdAt") => void;
  onPageChange: (newPage: number) => void;
  onAddClick: () => void;
  onEditClick: (category: CategoryItem) => void;
  onDeleteClick: (category: CategoryItem) => void;
  onToggleStatus: (category: CategoryItem) => void;
  parentOptions: ParentOption[];
  onResetFilters: () => void;
}

export function CategoriesTable({
  categories,
  total,
  page,
  limit,
  totalPages,
  loading,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  parentFilter,
  onParentFilterChange,
  sortBy,
  sortOrder,
  onSortChange,
  onPageChange,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onToggleStatus,
  parentOptions,
  onResetFilters,
}: CategoriesTableProps) {
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  const renderSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <i className="bi bi-arrow-down-up text-secondary opacity-50 ms-1 small"></i>;
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
            {/* Parent Category Filter */}
            <select
              className="form-select form-select-sm w-auto"
              value={parentFilter}
              onChange={(e) => onParentFilterChange(e.target.value)}
              aria-label="Filter by parent"
            >
              <option value="">All Parents</option>
              <option value="root">Root Categories Only</option>
              {parentOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.depth === 1 ? `📁 ${opt.name}` : `🏷️ ${opt.name}`}
                </option>
              ))}
            </select>

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

            {(searchTerm || parentFilter || statusFilter) && (
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
              <span>Add Category</span>
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
                <th scope="col" style={{ width: "60px" }}>Image</th>
                <th scope="col" role="button" onClick={() => onSortChange("name")}>
                  Name {renderSortIcon("name")}
                </th>
                <th scope="col">Slug</th>
                <th scope="col">Parent Category</th>
                <th scope="col" className="text-center">Subcategories</th>
                <th scope="col" role="button" className="text-center" onClick={() => onSortChange("sortOrder")}>
                  Order {renderSortIcon("sortOrder")}
                </th>
                <th scope="col" className="text-center">Status</th>
                <th scope="col" className="text-end pe-3" style={{ width: "120px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                    <span className="text-secondary">Loading categories...</span>
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-5">
                    <div
                      className="d-inline-flex align-items-center justify-content-center bg-body-tertiary text-secondary rounded-circle mb-3"
                      style={{ width: "56px", height: "56px" }}
                    >
                      <i className="bi bi-folder2-open fs-3"></i>
                    </div>
                    <h6 className="fw-semibold text-body mb-1">No Categories Found</h6>
                    <p className="text-secondary small mb-3">
                      {searchTerm || parentFilter || statusFilter
                        ? "Try adjusting your search criteria or resetting filters."
                        : "Start organizing your product catalog by creating your first category."}
                    </p>
                    {!(searchTerm || parentFilter || statusFilter) && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={onAddClick}
                      >
                        <i className="bi bi-plus-lg me-1"></i> Add Category
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id}>
                    {/* Thumbnail */}
                    <td>
                      <div
                        className="d-flex align-items-center justify-content-center bg-body-tertiary rounded overflow-hidden border"
                        style={{ width: "42px", height: "42px" }}
                      >
                        {cat.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={resolveImageUrl(cat.imageUrl)}
                            alt={cat.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : cat.parent ? (
                          <i className="bi bi-tag-fill text-primary fs-5" title="Subcategory"></i>
                        ) : (
                          <i className="bi bi-folder-fill text-warning fs-5" title="Root Category"></i>
                        )}
                      </div>
                    </td>

                    {/* Name & Description */}
                    <td>
                      <div className="fw-semibold text-body d-flex align-items-center gap-2">
                        {cat.parent ? (
                          <span title="Subcategory" className="text-primary d-inline-flex align-items-center">
                            <i className="bi bi-tag-fill small"></i>
                          </span>
                        ) : (
                          <span title="Root Category" className="text-warning d-inline-flex align-items-center">
                            <i className="bi bi-folder-fill small"></i>
                          </span>
                        )}
                        <span>{cat.name}</span>
                      </div>
                      {cat.description && (
                        <small className="text-secondary text-truncate d-block" style={{ maxWidth: "250px" }}>
                          {cat.description}
                        </small>
                      )}
                    </td>

                    {/* Slug */}
                    <td>
                      <code className="text-primary-emphasis bg-primary-subtle px-2 py-1 rounded small">
                        {cat.slug}
                      </code>
                    </td>

                    {/* Parent Category */}
                    <td>
                      {cat.parent ? (
                        <span className="badge bg-secondary-subtle text-secondary-emphasis border">
                          <i className="bi bi-folder-symlink me-1"></i>
                          {cat.parent.name}
                        </span>
                      ) : (
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                          <i className="bi bi-diagram-3 me-1"></i>
                          Root Level
                        </span>
                      )}
                    </td>

                    {/* Subcategories Count */}
                    <td className="text-center">
                      <span className="badge bg-body-secondary text-body-secondary rounded-pill px-2">
                        {cat.counts?.subcategories || 0}
                      </span>
                    </td>

                    {/* Sort Order */}
                    <td className="text-center text-secondary small">
                      {cat.sortOrder}
                    </td>

                    {/* Status & Inline Toggle */}
                    <td className="text-center">
                      <div className="d-inline-flex align-items-center gap-1">
                        <div className="form-check form-switch m-0" title="Click to toggle status">
                          <input
                            type="checkbox"
                            role="switch"
                            className="form-check-input"
                            checked={cat.isActive}
                            onChange={() => onToggleStatus(cat)}
                            aria-label={`Toggle status for ${cat.name}`}
                          />
                        </div>
                        <span className={`badge ${cat.isActive ? "bg-success" : "bg-secondary"}`}>
                          {cat.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="text-end pe-3">
                      <div className="btn-group btn-group-sm">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => onEditClick(cat)}
                          title="Edit category"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => onDeleteClick(cat)}
                          title="Delete category"
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
          Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of <strong>{total}</strong> categories
        </span>

        {totalPages > 1 && (
          <nav aria-label="Category pagination">
            <ul className="pagination pagination-sm m-0">
              <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
                <button
                  type="button"
                  className="page-link"
                  onClick={() => onPageChange(page - 1)}
                  disabled={page <= 1}
                >
                  Previous
                </button>
              </li>

              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((p) => {
                // Show pages around current
                if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
                  return (
                    <li key={p} className={`page-item ${p === page ? "active" : ""}`}>
                      <button
                        type="button"
                        className="page-link"
                        onClick={() => onPageChange(p)}
                      >
                        {p}
                      </button>
                    </li>
                  );
                } else if (p === page - 2 || p === page + 2) {
                  return (
                    <li key={p} className="page-item disabled">
                      <span className="page-link">...</span>
                    </li>
                  );
                }
                return null;
              })}

              <li className={`page-item ${page >= totalPages ? "disabled" : ""}`}>
                <button
                  type="button"
                  className="page-link"
                  onClick={() => onPageChange(page + 1)}
                  disabled={page >= totalPages}
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
}
