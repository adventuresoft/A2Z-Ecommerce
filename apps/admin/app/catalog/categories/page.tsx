"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  categoriesApi,
  CategoryItem,
  ParentOption,
} from "../../../services/categories";
import { CategoriesTable } from "./components/CategoriesTable";
import { CategoryFormModal } from "./components/CategoryFormModal";
import { CategoryDeleteModal } from "./components/CategoryDeleteModal";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [parentFilter, setParentFilter] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "sortOrder" | "createdAt">("sortOrder");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Parent options for dropdowns
  const [parentOptions, setParentOptions] = useState<ParentOption[]>([]);

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<CategoryItem | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null);

  // Alert feedback
  const [alert, setAlert] = useState<{ type: "success" | "danger" | "info"; text: string } | null>(null);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // reset to page 1 on new search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load parent options for dropdowns
  const loadParentOptions = useCallback(async () => {
    try {
      const options = await categoriesApi.getParentOptions();
      setParentOptions(options);
    } catch {
      // ignore
    }
  }, []);

  // Fetch categories based on current page, filters, and sort
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await categoriesApi.getCategories({
        page,
        limit,
        search: debouncedSearch || undefined,
        parentId: parentFilter || undefined,
        isActive: statusFilter === "" ? undefined : statusFilter === "true",
        sortBy,
        sortOrder,
      });

      setCategories(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load categories.";
      setAlert({ type: "danger", text: msg });
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, parentFilter, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    loadParentOptions();
  }, [loadParentOptions]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

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
    setParentFilter("");
    setSortBy("sortOrder");
    setSortOrder("asc");
    setPage(1);
  };

  const handleAddClick = () => {
    setCategoryToEdit(null);
    setFormModalOpen(true);
  };

  const handleEditClick = (cat: CategoryItem) => {
    setCategoryToEdit(cat);
    setFormModalOpen(true);
  };

  const handleDeleteClick = (cat: CategoryItem) => {
    setCategoryToDelete(cat);
    setDeleteModalOpen(true);
  };

  const handleToggleStatus = async (cat: CategoryItem) => {
    const updatedStatus = !cat.isActive;
    try {
      await categoriesApi.updateCategory(cat.id, { isActive: updatedStatus });
      setCategories((prev) =>
        prev.map((item) => (item.id === cat.id ? { ...item, isActive: updatedStatus } : item))
      );
      setAlert({
        type: "success",
        text: `Category "${cat.name}" is now ${updatedStatus ? "Active" : "Inactive"}.`,
      });
      loadParentOptions();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to toggle category status.";
      setAlert({ type: "danger", text: msg });
    }
  };

  const handleSaved = (savedCategory: CategoryItem) => {
    setAlert({
      type: "success",
      text: categoryToEdit
        ? `Category "${savedCategory.name}" updated successfully.`
        : `Category "${savedCategory.name}" created successfully.`,
    });
    fetchCategories();
    loadParentOptions();
  };

  const handleDeleted = () => {
    setAlert({
      type: "success",
      text: `Category deleted successfully.`,
    });
    fetchCategories();
    loadParentOptions();
  };

  return (
    <div className="d-flex flex-column gap-3">
      {/* Alert Notification */}
      {alert && (
        <div
          className={`alert alert-${alert.type} alert-dismissible fade show d-flex align-items-center gap-2 py-2 px-3 shadow-sm rounded`}
          role="alert"
        >
          <i
            className={`bi ${
              alert.type === "success"
                ? "bi-check-circle-fill text-success"
                : alert.type === "danger"
                ? "bi-exclamation-triangle-fill text-danger"
                : "bi-info-circle-fill text-info"
            } fs-5`}
          ></i>
          <div className="flex-grow-1">{alert.text}</div>
          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={() => setAlert(null)}
          ></button>
        </div>
      )}

      {/* Main Categories Table */}
      <CategoriesTable
        categories={categories}
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
        parentFilter={parentFilter}
        onParentFilterChange={(val) => {
          setParentFilter(val);
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
        parentOptions={parentOptions}
        onResetFilters={handleResetFilters}
      />

      {/* Create / Edit Modal */}
      <CategoryFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSaved={handleSaved}
        categoryToEdit={categoryToEdit}
        parentOptions={parentOptions}
      />

      {/* Delete Confirmation Modal */}
      <CategoryDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onDeleted={handleDeleted}
        category={categoryToDelete}
      />
    </div>
  );
}
