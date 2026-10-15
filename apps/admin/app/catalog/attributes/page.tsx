"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  attributesApi,
  AttributeItem,
  AttributeType,
} from "../../../services/attributes";
import { AttributesTable } from "./components/AttributesTable";
import { AttributeFormModal } from "./components/AttributeFormModal";
import { AttributeDeleteModal } from "./components/AttributeDeleteModal";

export default function AttributesPage() {
  const [attributes, setAttributes] = useState<AttributeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "sortOrder" | "createdAt">(
    "sortOrder",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [attributeToEdit, setAttributeToEdit] = useState<AttributeItem | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [attributeToDelete, setAttributeToDelete] = useState<AttributeItem | null>(null);

  // Feedback alert
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

  // Fetch attributes based on current page, filters, and sort
  const fetchAttributes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await attributesApi.getAttributes({
        page,
        limit,
        search: debouncedSearch || undefined,
        type: typeFilter ? (typeFilter as AttributeType) : undefined,
        isActive: statusFilter === "" ? undefined : statusFilter === "true",
        sortBy,
        sortOrder,
      });

      setAttributes(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to load attributes.";
      setAlert({ type: "danger", text: msg });
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, typeFilter, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchAttributes();
  }, [fetchAttributes]);

  // Handlers
  const handleSortChange = (col: "name" | "sortOrder" | "createdAt") => {
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
    setTypeFilter("");
    setStatusFilter("");
    setSortBy("sortOrder");
    setSortOrder("asc");
    setPage(1);
  };

  const handleAddClick = () => {
    setAttributeToEdit(null);
    setFormModalOpen(true);
  };

  const handleEditClick = (attr: AttributeItem) => {
    setAttributeToEdit(attr);
    setFormModalOpen(true);
  };

  const handleDeleteClick = (attr: AttributeItem) => {
    setAttributeToDelete(attr);
    setDeleteModalOpen(true);
  };

  const handleToggleStatus = async (attr: AttributeItem) => {
    const previousState = attr.isActive;
    const nextState = !previousState;

    // Optimistic UI update
    setAttributes((prev) =>
      prev.map((a) => (a.id === attr.id ? { ...a, isActive: nextState } : a)),
    );

    try {
      await attributesApi.toggleStatus(attr.id, nextState);
      setAlert({
        type: "success",
        text: `Attribute "${attr.name}" is now ${nextState ? "active" : "inactive"}.`,
      });
    } catch (err: unknown) {
      // Revert on failure
      setAttributes((prev) =>
        prev.map((a) =>
          a.id === attr.id ? { ...a, isActive: previousState } : a,
        ),
      );
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to update attribute status.";
      setAlert({ type: "danger", text: msg });
    }
  };

  const handleSuccess = (message: string) => {
    setAlert({ type: "success", text: message });
    fetchAttributes();
  };

  const handleDeleted = () => {
    setAlert({
      type: "success",
      text: `Attribute "${attributeToDelete?.name}" was deleted successfully.`,
    });
    fetchAttributes();
  };

  return (
    <div className="container-fluid p-4">
      {/* Page Header & Breadcrumbs */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1 small text-secondary">
              <li className="breadcrumb-item">
                <Link href="/" className="text-decoration-none text-secondary">
                  Dashboard
                </Link>
              </li>
              <li className="breadcrumb-item">Catalog</li>
              <li className="breadcrumb-item active text-body fw-semibold" aria-current="page">
                Attributes
              </li>
            </ol>
          </nav>
          <h1 className="h3 fw-bold text-body mb-0 d-flex align-items-center gap-2">
            <i className="bi bi-sliders text-primary"></i>
            <span>Attributes</span>
          </h1>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
            onClick={fetchAttributes}
            title="Refresh list"
            disabled={loading}
          >
            <i className={`bi bi-arrow-clockwise ${loading ? "spin" : ""}`}></i>
            <span className="d-none d-sm-inline">Refresh</span>
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm"
            onClick={handleAddClick}
          >
            <i className="bi bi-plus-lg"></i>
            <span>Add Attribute</span>
          </button>
        </div>
      </div>

      {/* Dismissible Feedback Alert */}
      {alert && (
        <div
          className={`alert alert-${alert.type} alert-dismissible fade show d-flex align-items-center gap-2 py-2 px-3 mb-4 shadow-sm border-0`}
          role="alert"
        >
          <i
            className={`bi ${
              alert.type === "success"
                ? "bi-check-circle-fill text-success"
                : alert.type === "danger"
                  ? "bi-exclamation-triangle-fill text-danger"
                  : "bi-info-circle-fill text-info"
            }`}
          ></i>
          <div className="flex-grow-1">{alert.text}</div>
          <button
            type="button"
            className="btn-close py-2"
            aria-label="Close"
            onClick={() => setAlert(null)}
          ></button>
        </div>
      )}

      {/* Attributes Table View */}
      <AttributesTable
        attributes={attributes}
        total={total}
        page={page}
        limit={limit}
        totalPages={totalPages}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        typeFilter={typeFilter}
        onTypeFilterChange={(val) => {
          setTypeFilter(val);
          setPage(1);
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(val) => {
          setStatusFilter(val);
          setPage(1);
        }}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        onPageChange={setPage}
        onAddClick={handleAddClick}
        onEditClick={handleEditClick}
        onDeleteClick={handleDeleteClick}
        onToggleStatus={handleToggleStatus}
        onResetFilters={handleResetFilters}
      />

      {/* Create / Edit Modal */}
      {formModalOpen && (
        <AttributeFormModal
          key={attributeToEdit?.id ?? "new"}
          isOpen={formModalOpen}
          onClose={() => setFormModalOpen(false)}
          onSuccess={handleSuccess}
          attributeToEdit={attributeToEdit}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <AttributeDeleteModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onDeleted={handleDeleted}
          attribute={attributeToDelete}
        />
      )}
    </div>
  );
}
