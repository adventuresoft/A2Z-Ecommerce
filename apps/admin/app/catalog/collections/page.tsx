"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { collectionsService, CollectionItem } from "../../../services/collections";
import { CollectionsTable } from "./components/CollectionsTable";
import { CollectionDeleteModal } from "./components/CollectionDeleteModal";

export default function CollectionsPage() {
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [homeFilter, setHomeFilter] = useState("");

  // Inline toggle & sort order state
  const [togglingHomeId, setTogglingHomeId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<CollectionItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Alerts
  const [alert, setAlert] = useState<{
    type: "success" | "danger" | "info";
    text: string;
  } | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await collectionsService.getCollections({
        page,
        limit,
        search: debouncedSearch || undefined,
        isActive: statusFilter === "" ? undefined : statusFilter === "true",
        showOnHomePage: homeFilter === "" ? undefined : homeFilter === "true",
      });
      setCollections(res.data || []);
      setTotal(res.meta?.total || 0);
      setTotalPages(res.meta?.totalPages || 1);
    } catch (err: any) {
      setAlert({
        type: "danger",
        text: err?.message || "Failed to load collections.",
      });
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter, homeFilter]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const handleToggleHomePage = async (col: CollectionItem) => {
    const nextVal = !col.showOnHomePage;
    setTogglingHomeId(col.id);
    try {
      await collectionsService.updateCollection(col.id, {
        showOnHomePage: nextVal,
      });
      setCollections((prev) =>
        prev.map((item) =>
          item.id === col.id ? { ...item, showOnHomePage: nextVal } : item
        )
      );
      setAlert({
        type: "success",
        text: nextVal
          ? `"${col.name}" will now be displayed on the storefront Home Page.`
          : `"${col.name}" was removed from the storefront Home Page.`,
      });
    } catch (err: any) {
      setAlert({
        type: "danger",
        text: err?.message || "Failed to update Home Page visibility.",
      });
    } finally {
      setTogglingHomeId(null);
    }
  };

  const handleUpdateSortOrder = async (col: CollectionItem, newSortOrder: number) => {
    setUpdatingOrderId(col.id);
    try {
      await collectionsService.updateCollection(col.id, {
        sortOrder: newSortOrder,
      });
      setCollections((prev) =>
        [...prev]
          .map((item) =>
            item.id === col.id ? { ...item, sortOrder: newSortOrder } : item
          )
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      );
      setAlert({
        type: "success",
        text: `Updated display order for "${col.name}" to ${newSortOrder}.`,
      });
    } catch (err: any) {
      setAlert({
        type: "danger",
        text: err?.message || "Failed to update display order.",
      });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleDeletePrompt = (col: CollectionItem) => {
    setCollectionToDelete(col);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!collectionToDelete) return;
    setDeleteLoading(true);
    try {
      await collectionsService.deleteCollection(collectionToDelete.id);
      setAlert({
        type: "success",
        text: `Collection "${collectionToDelete.name}" deleted successfully.`,
      });
      setDeleteModalOpen(false);
      setCollectionToDelete(null);
      fetchCollections();
    } catch (err: any) {
      setAlert({
        type: "danger",
        text: err?.message || "Failed to delete collection.",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="container-fluid p-4">
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1 text-muted small">
              <li className="breadcrumb-item">
                <Link href="/catalog/products" className="text-decoration-none text-muted">
                  Catalog
                </Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Collections
              </li>
            </ol>
          </nav>
          <h2 className="h4 fw-bold text-dark mb-1">Curated Collections</h2>
          <p className="text-muted small mb-0">
            Create and organize campaign landing pages (e.g. Flash Sale, New Arrivals, Best Selling TV) with hybrid rules, countdown timers, and Home Page product sliders.
          </p>
        </div>

        <Link
          href="/catalog/collections/new"
          className="btn btn-primary d-inline-flex align-items-center gap-2 rounded-3 px-3 py-2 shadow-sm"
        >
          <i className="bi bi-plus-lg" />
          <span>New Collection</span>
        </Link>
      </div>

      {/* Alert Banner */}
      {alert && (
        <div
          className={`alert alert-${alert.type} alert-dismissible fade show rounded-3 py-2.5 px-3 mb-4 d-flex align-items-center gap-2`}
          role="alert"
        >
          <i
            className={`bi ${
              alert.type === "success"
                ? "bi-check-circle-fill text-success"
                : "bi-exclamation-triangle-fill text-danger"
            }`}
          />
          <div className="small flex-grow-1">{alert.text}</div>
          <button
            type="button"
            className="btn-close"
            onClick={() => setAlert(null)}
            aria-label="Close"
          />
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-md-4">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-search text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control bg-light border-start-0"
                  placeholder="Search collection name or slug..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    className="btn btn-light border"
                    type="button"
                    onClick={() => setSearchTerm("")}
                  >
                    <i className="bi bi-x" />
                  </button>
                )}
              </div>
            </div>

            <div className="col-md-3">
              <select
                className="form-select form-select-sm bg-light"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="true">Active Only</option>
                <option value="false">Draft / Inactive</option>
              </select>
            </div>

            <div className="col-md-3">
              <select
                className="form-select form-select-sm bg-light"
                value={homeFilter}
                onChange={(e) => {
                  setHomeFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Home Page Visibility</option>
                <option value="true">Shown on Home Page</option>
                <option value="false">Not on Home Page</option>
              </select>
            </div>

            <div className="col-md-2 text-md-end text-muted small">
              Total {total} {total === 1 ? "collection" : "collections"}
            </div>
          </div>
        </div>
      </div>

      {/* Collections Table Card */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
        <CollectionsTable
          collections={collections}
          loading={loading}
          onDelete={handleDeletePrompt}
          onToggleHomePage={handleToggleHomePage}
          togglingHomeId={togglingHomeId}
          onUpdateSortOrder={handleUpdateSortOrder}
          updatingOrderId={updatingOrderId}
        />

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="card-footer bg-white border-top py-2.5 px-3 d-flex align-items-center justify-content-between">
            <div className="text-muted small">
              Showing page {page} of {totalPages}
            </div>
            <div className="btn-group btn-group-sm">
              <button
                type="button"
                className="btn btn-outline-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      <CollectionDeleteModal
        isOpen={deleteModalOpen}
        collection={collectionToDelete}
        loading={deleteLoading}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
