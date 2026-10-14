"use client";

import React, { useState } from "react";
import { categoriesApi, CategoryItem } from "../../../../services/categories";

interface CategoryDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleted: (id: string) => void;
  category: CategoryItem | null;
}

export function CategoryDeleteModal({
  isOpen,
  onClose,
  onDeleted,
  category,
}: CategoryDeleteModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !category) return null;

  const subcategoriesCount = category.counts?.subcategories || 0;
  const productsCount = category.counts?.products || 0;
  const hasDependencies = subcategoriesCount > 0 || productsCount > 0;

  const handleDelete = async () => {
    if (hasDependencies) return;

    setDeleting(true);
    setErrorMessage(null);

    try {
      await categoriesApi.deleteCategory(category.id);
      onDeleted(category.id);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete category.";
      setErrorMessage(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      role="dialog"
      aria-labelledby="deleteCategoryModalTitle"
      aria-modal="true"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1055 }}
    >
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content shadow border-0">
          <div className="modal-header bg-danger-subtle border-bottom border-danger-subtle py-3">
            <h5 className="modal-title text-danger fw-semibold d-flex align-items-center gap-2" id="deleteCategoryModalTitle">
              <i className="bi bi-exclamation-triangle-fill"></i>
              <span>Delete Category Confirmation</span>
            </h5>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={onClose}
              disabled={deleting}
            ></button>
          </div>

          <div className="modal-body p-4">
            {errorMessage && (
              <div className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 mb-3 rounded" role="alert">
                <i className="bi bi-x-circle-fill"></i>
                <div>{errorMessage}</div>
              </div>
            )}

            <p className="mb-3 text-body">
              Are you sure you want to permanently delete category{" "}
              <strong>&ldquo;{category.name}&rdquo;</strong> (<code>{category.slug}</code>)?
            </p>

            {hasDependencies ? (
              <div className="alert alert-warning border-warning-subtle p-3 rounded mb-0">
                <div className="d-flex gap-2">
                  <i className="bi bi-shield-fill-x text-warning fs-4"></i>
                  <div>
                    <h6 className="fw-semibold mb-1 text-warning-emphasis">Deletion Blocked by Safeguards</h6>
                    <p className="small mb-2 text-secondary">
                      This category cannot be deleted because dependent catalog records exist:
                    </p>
                    <ul className="small mb-2 ps-3 text-secondary">
                      {subcategoriesCount > 0 && (
                        <li>
                          <strong>{subcategoriesCount}</strong> direct child subcategories
                        </li>
                      )}
                      {productsCount > 0 && (
                        <li>
                          <strong>{productsCount}</strong> assigned products
                        </li>
                      )}
                    </ul>
                    <small className="text-secondary d-block">
                      <strong>Remedy:</strong> Reassign or remove its subcategories first, or simply toggle its
                      status to <em>Inactive</em> to hide it from the storefront.
                    </small>
                  </div>
                </div>
              </div>
            ) : (
              <div className="alert alert-info border-info-subtle py-2 px-3 rounded small mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-info-circle-fill text-info"></i>
                <span>This category has 0 subcategories and 0 products. Deletion is safe to execute.</span>
              </div>
            )}
          </div>

          <div className="modal-footer bg-body-tertiary border-top py-2 px-3 d-flex justify-content-between">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={onClose}
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm d-flex align-items-center gap-2"
              onClick={handleDelete}
              disabled={hasDependencies || deleting}
            >
              {deleting ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-trash"></i>
                  <span>Delete Category</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
