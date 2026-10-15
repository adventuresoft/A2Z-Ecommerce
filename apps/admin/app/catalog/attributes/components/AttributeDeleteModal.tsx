"use client";

import React, { useState } from "react";
import { attributesApi, AttributeItem } from "../../../../services/attributes";

interface AttributeDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleted: (id: string) => void;
  attribute: AttributeItem | null;
}

export function AttributeDeleteModal({
  isOpen,
  onClose,
  onDeleted,
  attribute,
}: AttributeDeleteModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !attribute) return null;

  const productsCount = attribute.counts?.products || 0;
  const variantsCount = attribute.counts?.variants || 0;
  const hasDependencies = productsCount > 0 || variantsCount > 0;
  const valuesCount = attribute.values?.length || 0;

  const handleDelete = async () => {
    if (hasDependencies) return;

    setDeleting(true);
    setErrorMessage(null);

    try {
      await attributesApi.deleteAttribute(attribute.id);
      onDeleted(attribute.id);
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to delete attribute.";
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
      aria-labelledby="deleteAttributeModalTitle"
      aria-modal="true"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1055 }}
    >
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content shadow border-0">
          <div className="modal-header bg-danger-subtle border-bottom border-danger-subtle py-3">
            <h5
              className="modal-title text-danger fw-semibold d-flex align-items-center gap-2"
              id="deleteAttributeModalTitle"
            >
              <i className="bi bi-exclamation-triangle-fill"></i>
              <span>Delete Attribute Confirmation</span>
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
              <div
                className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 mb-3 rounded"
                role="alert"
              >
                <i className="bi bi-x-circle-fill"></i>
                <div>{errorMessage}</div>
              </div>
            )}

            <p className="mb-2 text-body">
              Are you sure you want to permanently delete attribute{" "}
              <strong>&ldquo;{attribute.name}&rdquo;</strong> (
              <code>{attribute.slug}</code>)?
            </p>

            {valuesCount > 0 && (
              <div className="small text-danger mb-3">
                <i className="bi bi-info-circle me-1"></i>
                This attribute currently has <strong>{valuesCount}</strong> predefined value(s) which will also be permanently deleted.
              </div>
            )}

            {hasDependencies ? (
              <div className="alert alert-warning border-warning-subtle p-3 rounded mb-0">
                <div className="d-flex gap-2">
                  <i className="bi bi-shield-fill-x text-warning fs-4"></i>
                  <div>
                    <h6 className="fw-semibold mb-1 text-warning-emphasis">
                      Deletion Blocked by Safeguards
                    </h6>
                    <p className="small mb-2 text-secondary">
                      This attribute cannot be deleted because dependent catalog records exist:
                    </p>
                    <ul className="small mb-2 ps-3 text-secondary">
                      {productsCount > 0 && (
                        <li>
                          <strong>{productsCount}</strong> assigned product(s)
                        </li>
                      )}
                      {variantsCount > 0 && (
                        <li>
                          <strong>{variantsCount}</strong> assigned product variant(s)
                        </li>
                      )}
                    </ul>
                    <small className="text-secondary d-block">
                      <strong>Remedy:</strong> Reassign or remove its products/variants first, or toggle its status to <em>Inactive</em> to hide it from the storefront.
                    </small>
                  </div>
                </div>
              </div>
            ) : (
              <div className="alert alert-info border-info-subtle py-2 px-3 rounded small mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-info-circle-fill text-info"></i>
                <span>
                  This attribute has 0 assigned products or variants. Deletion is safe to execute.
                </span>
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
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-trash"></i>
                  <span>Delete Attribute</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
