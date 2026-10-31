"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { tagsApi, TagItem } from "../../../services/tags";
import { TagsTable } from "./components/TagsTable";
import { TagFormModal } from "./components/TagFormModal";
import { TagDeleteModal } from "./components/TagDeleteModal";

export default function TagsPage() {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "createdAt" | "productCount">(
    "name",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [tagToEdit, setTagToEdit] = useState<TagItem | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<TagItem | null>(null);

  // Alert feedback
  const [alert, setAlert] = useState<{
    type: "success" | "danger" | "info";
    text: string;
  } | null>(null);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch tags based on current page, filters, and sort
  const fetchTags = useCallback(async () => {
    void Promise.resolve().then(() => setLoading(true));
    try {
      const res = await tagsApi.getTags({
        page,
        limit,
        search: debouncedSearch || undefined,
        isActive: statusFilter === "" ? undefined : statusFilter === "true",
        sortBy,
        sortOrder,
      });

      setTags(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load tags.";
      setAlert({ type: "danger", text: msg });
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleSortChange = (col: "name" | "createdAt" | "productCount") => {
    if (sortBy === col) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setStatusFilter("");
    setSortBy("name");
    setSortOrder("asc");
    setPage(1);
  };

  const handleAddClick = () => {
    setTagToEdit(null);
    setFormModalOpen(true);
  };

  const handleEditClick = (tag: TagItem) => {
    setTagToEdit(tag);
    setFormModalOpen(true);
  };

  const handleDeleteClick = (tag: TagItem) => {
    setTagToDelete(tag);
    setDeleteModalOpen(true);
  };

  const handleModalSuccess = (message: string) => {
    setAlert({ type: "success", text: message });
    fetchTags();
  };

  return (
    <div className="container-fluid px-0 pb-5">
      {/* Page Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb small m-0 mb-1">
              <li className="breadcrumb-item">
                <Link href="/catalog/products" className="text-decoration-none">
                  Catalog
                </Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Tags
              </li>
            </ol>
          </nav>
          <h4 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
            <i className="bi bi-tags text-primary"></i>
            Product Tags
          </h4>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm"
          onClick={handleAddClick}
        >
          <i className="bi bi-plus-lg"></i>
          <span>Add Tag</span>
        </button>
      </div>

      {/* Alert Banner */}
      {alert && (
        <div
          className={`alert alert-${alert.type} alert-dismissible fade show mb-4`}
          role="alert"
          aria-live="polite"
        >
          {alert.text}
          <button
            type="button"
            className="btn-close"
            onClick={() => setAlert(null)}
            aria-label="Close alert"
          />
        </div>
      )}

      {/* Filter Card */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            {/* Search */}
            <div className="col-12 col-md-6 col-lg-4">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-search text-muted" aria-hidden="true"></i>
                </span>
                <input
                  type="search"
                  className="form-control border-start-0"
                  placeholder="Search tag name or slug…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Search tag name or slug"
                />
                {searchTerm && (
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setSearchTerm("")}
                    aria-label="Clear search input"
                  >
                    <i className="bi bi-x" aria-hidden="true"></i>
                  </button>
                )}
              </div>
            </div>

            {/* Status Filter */}
            <div className="col-6 col-md-3 col-lg-2">
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                aria-label="Filter tags by status"
              >
                <option value="">All Statuses</option>
                <option value="true">Active Only</option>
                <option value="false">Inactive Only</option>
              </select>
            </div>

            {/* Reset Filters */}
            <div className="col-6 col-md-3 col-lg-2 d-flex align-items-center">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm w-100"
                onClick={handleResetFilters}
                aria-label="Reset all search filters"
              >
                <i className="bi bi-arrow-counterclockwise me-1" aria-hidden="true"></i>
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tags Table Card */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3 border-bottom d-flex align-items-center justify-content-between">
          <h6 className="m-0 fw-bold text-dark">
            All Tags <span className="text-muted fw-normal tabular-nums">({total})</span>
          </h6>
        </div>

        <TagsTable
          tags={tags}
          loading={loading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="card-footer bg-white border-top py-3 d-flex align-items-center justify-content-between">
            <span className="small text-muted tabular-nums">
              Showing page {page} of {totalPages} ({total} total items)
            </span>
            <ul className="pagination pagination-sm m-0">
              <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  aria-label="Previous page"
                >
                  Previous
                </button>
              </li>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <li
                  key={p}
                  className={`page-item ${p === page ? "active" : ""}`}
                >
                  <button
                    className="page-link tabular-nums"
                    onClick={() => setPage(p)}
                    aria-label={`Page ${p}`}
                    aria-current={p === page ? "page" : undefined}
                  >
                    {p}
                  </button>
                </li>
              ))}
              <li
                className={`page-item ${
                  page === totalPages ? "disabled" : ""
                }`}
              >
                <button
                  className="page-link"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  aria-label="Next page"
                >
                  Next
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <TagFormModal
        isOpen={formModalOpen}
        tagToEdit={tagToEdit}
        onClose={() => setFormModalOpen(false)}
        onSuccess={handleModalSuccess}
      />

      {/* Delete Confirmation Modal */}
      <TagDeleteModal
        isOpen={deleteModalOpen}
        tag={tagToDelete}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
