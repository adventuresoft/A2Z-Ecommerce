"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { brandsApi, BrandItem } from "../../../services/brands";
import { BrandsTable } from "./components/BrandsTable";
import { BrandFormModal } from "./components/BrandFormModal";
import { BrandDeleteModal } from "./components/BrandDeleteModal";

export default function BrandsPage() {
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "sortOrder" | "createdAt">(
    "sortOrder",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [brandToEdit, setBrandToEdit] = useState<BrandItem | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<BrandItem | null>(null);

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

  // Fetch brands based on current page, filters, and sort
  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const res = await brandsApi.getBrands({
        page,
        limit,
        search: debouncedSearch || undefined,
        isActive: statusFilter === "" ? undefined : statusFilter === "true",
        sortBy,
        sortOrder,
      });

      setBrands(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to load brands.";
      setAlert({ type: "danger", text: msg });
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

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
    setStatusFilter("");
    setSortBy("sortOrder");
    setSortOrder("asc");
    setPage(1);
  };

  const handleAddClick = () => {
    setBrandToEdit(null);
    setFormModalOpen(true);
  };

  const handleEditClick = (brand: BrandItem) => {
    setBrandToEdit(brand);
    setFormModalOpen(true);
  };

  const handleDeleteClick = (brand: BrandItem) => {
    setBrandToDelete(brand);
    setDeleteModalOpen(true);
  };

  const handleToggleStatus = async (brand: BrandItem) => {
    const updatedStatus = !brand.isActive;

    // Optimistic UI update
    setBrands((prev) =>
      prev.map((item) =>
        item.id === brand.id ? { ...item, isActive: updatedStatus } : item,
      ),
    );

    try {
      await brandsApi.toggleStatus(brand.id, updatedStatus);
      setAlert({
        type: "success",
        text: `Brand "${brand.name}" is now ${
          updatedStatus ? "Active" : "Inactive"
        }.`,
      });
    } catch (err: unknown) {
      // Revert on failure
      setBrands((prev) =>
        prev.map((item) =>
          item.id === brand.id ? { ...item, isActive: !updatedStatus } : item,
        ),
      );
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to update brand status.";
      setAlert({ type: "danger", text: msg });
    }
  };

  const handleSaved = (savedBrand: BrandItem) => {
    setAlert({
      type: "success",
      text: `Brand "${savedBrand.name}" has been ${
        brandToEdit ? "updated" : "created"
      } successfully.`,
    });
    fetchBrands();
  };

  const handleDeleted = () => {
    setAlert({
      type: "success",
      text: `Brand "${brandToDelete?.name}" was deleted successfully.`,
    });
    fetchBrands();
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
                Brands
              </li>
            </ol>
          </nav>
          <h1 className="h3 fw-bold text-body mb-0 d-flex align-items-center gap-2">
            <i className="bi bi-award text-primary"></i>
            <span>Brands</span>
          </h1>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
            onClick={fetchBrands}
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
            <span>Add Brand</span>
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

      {/* Brands Table View */}
      <BrandsTable
        brands={brands}
        total={total}
        page={page}
        limit={limit}
        totalPages={totalPages}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
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
        <BrandFormModal
          key={brandToEdit?.id ?? "new"}
          isOpen={formModalOpen}
          onClose={() => setFormModalOpen(false)}
          onSaved={handleSaved}
          brandToEdit={brandToEdit}
        />
      )}

      {/* Delete Confirmation Modal */}
      <BrandDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onDeleted={handleDeleted}
        brand={brandToDelete}
      />
    </div>
  );
}
