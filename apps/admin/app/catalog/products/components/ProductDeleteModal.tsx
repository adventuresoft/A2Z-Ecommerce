"use client";

import React, { useState } from "react";
import { ProductItem, deleteProduct } from "../../../../services/products";

interface ProductDeleteModalProps {
  product: ProductItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export function ProductDeleteModal({
  product,
  isOpen,
  onClose,
  onDeleted,
}: ProductDeleteModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      await deleteProduct(product.id);
      onDeleted();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to delete product.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow">
          <div className="modal-header bg-danger text-white py-3">
            <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill"></i>
              Confirm Product Deletion
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              disabled={loading}
            ></button>
          </div>

          <div className="modal-body p-4">
            {error && (
              <div className="alert alert-danger mb-3" role="alert">
                <i className="bi bi-x-circle-fill me-2"></i>
                {error}
              </div>
            )}

            <p className="mb-2">
              Are you sure you want to permanently delete the product:
            </p>
            <p className="fw-bold fs-5 text-dark mb-3">&quot;{product.title}&quot;?</p>

            <div className="alert alert-warning py-2 mb-0 small">
              <i className="bi bi-info-circle-fill me-1"></i>
              This will permanently delete all {product.variantCount} associated variants,
              SKUs, and media gallery images from disk. If this product was previously ordered,
              deletion will be prevented; deactivate it instead.
            </div>
          </div>

          <div className="modal-footer bg-light py-2 px-4">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm d-flex align-items-center gap-1"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                  ></span>
                  Deleting...
                </>
              ) : (
                <>
                  <i className="bi bi-trash"></i>
                  Delete Product
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
