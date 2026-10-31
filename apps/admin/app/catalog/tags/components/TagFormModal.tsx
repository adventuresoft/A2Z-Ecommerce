"use client";

import React, { useState, useEffect } from "react";
import { TagItem, CreateTagPayload, UpdateTagPayload, tagsApi } from "../../../../services/tags";

interface TagFormModalProps {
  isOpen: boolean;
  tagToEdit: TagItem | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const PRESET_COLORS = [
  "#0d6efd", // Primary Blue
  "#198754", // Success Green
  "#dc3545", // Danger Red
  "#ffc107", // Warning Yellow
  "#0dcaf0", // Info Cyan
  "#6f42c1", // Purple
  "#d63384", // Pink
  "#fd7e14", // Orange
  "#20c997", // Teal
  "#6c757d", // Secondary Gray
  "#212529", // Dark
];

export function TagFormModal({
  isOpen,
  tagToEdit,
  onClose,
  onSuccess,
}: TagFormModalProps) {
  const isEditing = Boolean(tagToEdit);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [colorCode, setColorCode] = useState("#0d6efd");
  const [isActive, setIsActive] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (tagToEdit) {
      setName(tagToEdit.name);
      setSlug(tagToEdit.slug);
      setColorCode(tagToEdit.colorCode || "#0d6efd");
      setIsActive(tagToEdit.isActive);
    } else {
      setName("");
      setSlug("");
      setColorCode("#0d6efd");
      setIsActive(true);
    }
    setError(null);
  }, [tagToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Tag name is required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (isEditing && tagToEdit) {
        const payload: UpdateTagPayload = {
          name: name.trim(),
          slug: slug.trim() || undefined,
          colorCode: colorCode || undefined,
          isActive,
        };
        await tagsApi.updateTag(tagToEdit.id, payload);
        onSuccess(`Tag "${name.trim()}" updated successfully.`);
      } else {
        const payload: CreateTagPayload = {
          name: name.trim(),
          slug: slug.trim() || undefined,
          colorCode: colorCode || undefined,
          isActive,
        };
        await tagsApi.createTag(payload);
        onSuccess(`Tag "${name.trim()}" created successfully.`);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save tag.");
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
          <form onSubmit={handleSubmit}>
            <div className="modal-header">
              <h5 className="modal-title fw-bold">
                {isEditing ? "Edit Tag" : "Create New Tag"}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                disabled={submitting}
              />
            </div>

            <div className="modal-body">
              {error && (
                <div className="alert alert-danger py-2 small" role="alert">
                  {error}
                </div>
              )}

              {/* Tag Preview */}
              <div className="text-center p-3 mb-3 bg-light rounded border">
                <span className="small text-muted d-block mb-1">Badge Preview:</span>
                <span
                  className="badge px-3 py-2 text-white shadow-sm"
                  style={{
                    backgroundColor: colorCode || "#0d6efd",
                    fontSize: "0.95rem",
                    borderRadius: "1rem",
                  }}
                >
                  <i className="bi bi-tag-fill me-1"></i>
                  {name.trim() || "Tag Preview"}
                </span>
              </div>

              {/* Name */}
              <div className="mb-3">
                <label className="form-label small fw-semibold">
                  Tag Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Summer Collection, Trending"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={submitting}
                  autoFocus
                />
              </div>

              {/* Slug */}
              <div className="mb-3">
                <label className="form-label small fw-semibold">
                  URL Slug <span className="text-muted fw-normal">(Optional, auto-generated)</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. summer-collection"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  disabled={submitting}
                />
              </div>

              {/* Color Code */}
              <div className="mb-3">
                <label className="form-label small fw-semibold d-block">
                  Badge Color
                </label>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <input
                    type="color"
                    className="form-control form-control-color"
                    value={colorCode}
                    onChange={(e) => setColorCode(e.target.value)}
                    title="Choose custom color"
                    disabled={submitting}
                  />
                  <input
                    type="text"
                    className="form-control font-monospace"
                    style={{ maxWidth: "120px" }}
                    value={colorCode}
                    onChange={(e) => setColorCode(e.target.value)}
                    placeholder="#0d6efd"
                    disabled={submitting}
                  />
                </div>
                {/* Presets */}
                <div className="d-flex flex-wrap gap-2 pt-1">
                  {PRESET_COLORS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className={`btn p-0 rounded-circle border ${
                        colorCode.toLowerCase() === preset.toLowerCase()
                          ? "ring-2 border-dark"
                          : ""
                      }`}
                      style={{
                        width: "24px",
                        height: "24px",
                        backgroundColor: preset,
                      }}
                      onClick={() => setColorCode(preset)}
                      disabled={submitting}
                    />
                  ))}
                </div>
              </div>

              {/* Active Toggle */}
              <div className="form-check form-switch mt-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="isActiveTagCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={submitting}
                />
                <label className="form-check-label small" htmlFor="isActiveTagCheck">
                  Active (available on catalog and storefront filters)
                </label>
              </div>
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
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={submitting}
              >
                {submitting && (
                  <span
                    className="spinner-border spinner-border-sm me-1"
                    role="status"
                  />
                )}
                {isEditing ? "Save Changes" : "Create Tag"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
