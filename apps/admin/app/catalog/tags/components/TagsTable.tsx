"use client";

import React from "react";
import Link from "next/link";
import { TagItem } from "../../../../services/tags";

interface TagsTableProps {
  tags: TagItem[];
  loading: boolean;
  sortBy: "name" | "createdAt" | "productCount";
  sortOrder: "asc" | "desc";
  onSortChange: (col: "name" | "createdAt" | "productCount") => void;
  onEdit: (tag: TagItem) => void;
  onDelete: (tag: TagItem) => void;
}

export function TagsTable({
  tags,
  loading,
  sortBy,
  sortOrder,
  onSortChange,
  onEdit,
  onDelete,
}: TagsTableProps) {
  const renderSortIcon = (col: "name" | "createdAt" | "productCount") => {
    if (sortBy !== col) {
      return <i className="bi bi-arrow-down-up text-muted ms-1 small" aria-hidden="true"></i>;
    }
    return sortOrder === "asc" ? (
      <i className="bi bi-sort-down-alt text-primary ms-1" aria-hidden="true"></i>
    ) : (
      <i className="bi bi-sort-up text-primary ms-1" aria-hidden="true"></i>
    );
  };

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead className="table-light">
          <tr>
            <th
              style={{ cursor: "pointer", width: "30%" }}
              onClick={() => onSortChange("name")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSortChange("name");
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`Sort by tag name, currently ${sortBy === "name" ? sortOrder : "unsorted"}`}
            >
              Tag Name {renderSortIcon("name")}
            </th>
            <th style={{ width: "25%" }}>Slug</th>
            <th
              style={{ cursor: "pointer", width: "15%" }}
              onClick={() => onSortChange("productCount")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSortChange("productCount");
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`Sort by tagged products count, currently ${sortBy === "productCount" ? sortOrder : "unsorted"}`}
            >
              Tagged Products {renderSortIcon("productCount")}
            </th>
            <th style={{ width: "10%" }}>Status</th>
            <th
              style={{ cursor: "pointer", width: "10%" }}
              onClick={() => onSortChange("createdAt")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSortChange("createdAt");
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`Sort by created date, currently ${sortBy === "createdAt" ? sortOrder : "unsorted"}`}
            >
              Created {renderSortIcon("createdAt")}
            </th>
            <th className="text-end" style={{ width: "10%" }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={6} className="text-center py-4 text-muted" role="status" aria-live="polite">
                <span
                  className="spinner-border spinner-border-sm me-2 text-primary"
                  role="status"
                />
                Loading tags…
              </td>
            </tr>
          ) : tags.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-4 text-muted">
                No tags found matching current criteria.
              </td>
            </tr>
          ) : (
            tags.map((tag) => {
              const badgeColor = tag.colorCode || "#0d6efd";
              return (
                <tr key={tag.id}>
                  {/* Tag Name & Badge */}
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <span
                        className="badge text-white px-2 py-1 shadow-sm"
                        style={{
                          backgroundColor: badgeColor,
                          borderRadius: "1rem",
                          fontSize: "0.85rem",
                        }}
                      >
                        <i className="bi bi-tag-fill me-1"></i>
                        {tag.name}
                      </span>
                    </div>
                  </td>

                  {/* Slug */}
                  <td>
                    <code className="text-secondary small">{tag.slug}</code>
                  </td>

                  {/* Product Count */}
                  <td className="tabular-nums">
                    {tag.productCount > 0 ? (
                      <Link
                        href={`/catalog/products?tagId=${tag.id}`}
                        className="badge bg-light text-primary border text-decoration-none tabular-nums"
                        title="View tagged products in catalog"
                      >
                        <i className="bi bi-box-seam me-1" aria-hidden="true"></i>
                        {tag.productCount} product{tag.productCount === 1 ? "" : "s"}
                      </Link>
                    ) : (
                      <span className="badge bg-light text-muted border tabular-nums">
                        0 products
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td>
                    {tag.isActive ? (
                      <span className="badge bg-success-subtle text-success border border-success-subtle">
                        Active
                      </span>
                    ) : (
                      <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
                        Inactive
                      </span>
                    )}
                  </td>

                  {/* Created At */}
                  <td className="small text-muted tabular-nums">
                    {new Date(tag.createdAt).toLocaleDateString()}
                  </td>

                  {/* Actions */}
                  <td className="text-end">
                    <div className="btn-group btn-group-sm">
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        aria-label={`Edit ${tag.name} tag`}
                        title="Edit tag"
                        onClick={() => onEdit(tag)}
                      >
                        <i className="bi bi-pencil" aria-hidden="true"></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-danger"
                        aria-label={`Delete ${tag.name} tag`}
                        title="Delete tag"
                        onClick={() => onDelete(tag)}
                      >
                        <i className="bi bi-trash" aria-hidden="true"></i>
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
  );
}
