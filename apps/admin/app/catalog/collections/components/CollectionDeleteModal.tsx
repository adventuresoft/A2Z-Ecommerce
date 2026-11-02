"use client";

import React from "react";
import { CollectionItem } from "../../../../services/collections";

interface CollectionDeleteModalProps {
  isOpen: boolean;
  collection: CollectionItem | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function CollectionDeleteModal({
  isOpen,
  collection,
  loading,
  onClose,
  onConfirm,
}: CollectionDeleteModalProps) {
  if (!isOpen || !collection) return null;

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1055 }}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content shadow-lg border-0 rounded-4">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title text-danger d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill" /> Delete Collection
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={loading}
              aria-label="Close"
            />
          </div>
          <div className="modal-body py-4">
            <p className="mb-1">
              Are you sure you want to delete the collection{" "}
              <strong className="text-dark">&quot;{collection.name}&quot;</strong>?
            </p>
            <p className="text-muted small mb-0">
              URL: <code className="text-secondary">/collections/{collection.slug}</code>. This action cannot be undone. Associated products will remain in the catalog.
            </p>
          </div>
          <div className="modal-footer border-0 pt-0">
            <button
              type="button"
              className="btn btn-light rounded-3"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger rounded-3 d-flex align-items-center gap-2"
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" />
                  Deleting...
                </>
              ) : (
                <>
                  <i className="bi bi-trash" /> Delete Collection
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

