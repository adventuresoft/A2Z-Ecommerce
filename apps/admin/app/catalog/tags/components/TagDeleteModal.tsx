"use client";

import React, { useState } from "react";
import { TagItem, tagsApi } from "../../../../services/tags";

interface TagDeleteModalProps {
  isOpen: boolean;
  tag: TagItem | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function TagDeleteModal({
  isOpen,
  tag,
  onClose,
  onSuccess,
}: TagDeleteModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !tag) return null;

  const handleDelete = async () => {
    setSubmitting(true);
    setError(null);

    try {
      await tagsApi.deleteTag(tag.id);
      onSuccess(`Tag "${tag.name}" was successfully deleted.`);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete tag.");
    } finally {
      setSubmitting(false);
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
          <div className="modal-header bg-danger text-white">
            <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill"></i>
              Delete Tag
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              disabled={submitting}
            />
          </div>

          <div className="modal-body py-4">
            {error && (
              <div className="alert alert-danger py-2 small mb-3">{error}</div>
            )}

            <p className="mb-2">
              Are you sure you want to delete the tag{" "}
              <strong>&quot;{tag.name}&quot;</strong>?
            </p>

            {tag.productCount > 0 ? (
              <div className="alert alert-warning py-2 small mb-0">
                <i className="bi bi-info-circle me-1"></i>
                This tag is currently attached to <strong>{tag.productCount}</strong>{" "}
                product{tag.productCount === 1 ? "" : "s"}. Deleting this tag will cleanly
                detach it from those products, but will <strong>not</strong> delete or modify the products.
              </div>
            ) : (
              <p className="text-muted small mb-0">
                This action cannot be undone.
              </p>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting && (
                <span
                  className="spinner-border spinner-border-sm me-1"
                  role="status"
                />
              )}
              Delete Tag
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
