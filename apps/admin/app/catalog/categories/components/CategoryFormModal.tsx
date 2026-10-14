"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  categoriesApi,
  CategoryItem,
  CreateCategoryPayload,
  ParentOption,
  resolveImageUrl,
} from "../../../../services/categories";

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (category: CategoryItem) => void;
  categoryToEdit?: CategoryItem | null;
  parentOptions: ParentOption[];
}

export function CategoryFormModal({
  isOpen,
  onClose,
  onSaved,
  categoryToEdit,
  parentOptions,
}: CategoryFormModalProps) {
  const isEditing = Boolean(categoryToEdit);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [parentId, setParentId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize or reset form when modal opens or categoryToEdit changes
  useEffect(() => {
    if (!isOpen) return;

    if (categoryToEdit) {
      setName(categoryToEdit.name);
      setSlug(categoryToEdit.slug);
      setIsSlugManual(true);
      setParentId(categoryToEdit.parentId || "");
      setDescription(categoryToEdit.description || "");
      setImageUrl(categoryToEdit.imageUrl || "");
      setIsActive(categoryToEdit.isActive);
      setSortOrder(categoryToEdit.sortOrder);
      setShowUrlInput(Boolean(categoryToEdit.imageUrl && categoryToEdit.imageUrl.startsWith("http")));
    } else {
      setName("");
      setSlug("");
      setIsSlugManual(false);
      setParentId("");
      setDescription("");
      setImageUrl("");
      setIsActive(true);
      setSortOrder(0);
      setShowUrlInput(false);
    }
    setErrorMessage(null);
  }, [isOpen, categoryToEdit]);

  // Real-time auto-slugification for new categories
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    if (!isEditing && !isSlugManual) {
      const generated = newName
        .toLowerCase()
        .trim()
        .replace(/['’]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(generated);
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(e.target.value);
    setIsSlugManual(true);
  };

  // Image File Upload Handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|jpg|png|webp|svg\+xml|gif)$/i)) {
      setErrorMessage("Please select a valid image file (JPG, PNG, WEBP, SVG, GIF).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Image file size cannot exceed 5MB.");
      return;
    }

    setUploadingImage(true);
    setErrorMessage(null);

    try {
      const res = await categoriesApi.uploadImage(file);
      setImageUrl(res.imageUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload image.";
      setErrorMessage(msg);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage("Category name is required.");
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    const payload: CreateCategoryPayload = {
      name: name.trim(),
      slug: slug.trim() ? slug.trim() : undefined,
      parentId: parentId || undefined,
      description: description.trim() ? description.trim() : undefined,
      imageUrl: imageUrl.trim() ? imageUrl.trim() : undefined,
      isActive,
      sortOrder: Number(sortOrder) || 0,
    };

    try {
      let saved: CategoryItem;
      if (isEditing && categoryToEdit) {
        saved = await categoriesApi.updateCategory(categoryToEdit.id, payload);
      } else {
        saved = await categoriesApi.createCategory(payload);
      }
      onSaved(saved);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        role="dialog"
        aria-labelledby="categoryModalTitle"
        aria-modal="true"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1055 }}
      >
        <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
          <div className="modal-content shadow border-0">
            <div className="modal-header bg-body-tertiary border-bottom py-3">
              <h5 className="modal-title fw-semibold d-flex align-items-center gap-2" id="categoryModalTitle">
                <i className={`bi ${isEditing ? "bi-pencil-square text-warning" : "bi-plus-circle text-primary"}`}></i>
                <span>{isEditing ? "Edit Category" : "Add New Category"}</span>
              </h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={onClose}
                disabled={saving || uploadingImage}
              ></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body p-4">
                {errorMessage && (
                  <div className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 mb-3 rounded" role="alert">
                    <i className="bi bi-exclamation-triangle-fill fs-5"></i>
                    <div>{errorMessage}</div>
                  </div>
                )}

                <div className="row g-3">
                  {/* Category Name */}
                  <div className="col-md-7">
                    <label htmlFor="catName" className="form-label fw-semibold">
                      Category Name <span className="text-danger">*</span>
                    </label>
                    <input
                      id="catName"
                      type="text"
                      className="form-control"
                      placeholder="e.g., Laptops & Computers"
                      value={name}
                      onChange={handleNameChange}
                      required
                      maxLength={100}
                      disabled={saving}
                    />
                    <div className="form-text">Display name shown in menus and catalog filters.</div>
                  </div>

                  {/* Slug */}
                  <div className="col-md-5">
                    <label htmlFor="catSlug" className="form-label fw-semibold">
                      Slug <small className="text-secondary fw-normal">(Optional)</small>
                    </label>
                    <input
                      id="catSlug"
                      type="text"
                      className="form-control"
                      placeholder="e.g., laptops-and-computers"
                      value={slug}
                      onChange={handleSlugChange}
                      maxLength={120}
                      disabled={saving}
                    />
                    <div className="form-text">URL identifier. Auto-generated from name if left blank.</div>
                  </div>

                  {/* Parent Category Dropdown */}
                  <div className="col-md-7">
                    <label htmlFor="catParent" className="form-label fw-semibold">
                      Parent Category
                    </label>
                    <select
                      id="catParent"
                      className="form-select"
                      value={parentId}
                      onChange={(e) => setParentId(e.target.value)}
                      disabled={saving}
                    >
                      <option value="">None (Top-Level Root Category)</option>
                      {parentOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.depth === 1 ? `📁 ${opt.name}` : `🏷️ ${opt.name}`}
                        </option>
                      ))}
                    </select>
                    <div className="form-text">Limited to 3 levels of depth (Level 3 cannot be a parent).</div>
                  </div>

                  {/* Sort Order */}
                  <div className="col-md-5">
                    <label htmlFor="catSortOrder" className="form-label fw-semibold">
                      Sort Order
                    </label>
                    <input
                      id="catSortOrder"
                      type="number"
                      className="form-control"
                      min={0}
                      value={sortOrder}
                      onChange={(e) => setSortOrder(Number(e.target.value))}
                      disabled={saving}
                    />
                    <div className="form-text">Lower numbers appear first in lists and menus.</div>
                  </div>

                  {/* Category Image Upload Dropzone */}
                  <div className="col-md-12">
                    <label className="form-label fw-semibold d-flex align-items-center justify-content-between mb-2">
                      <span>Category Image</span>
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 text-decoration-none"
                        onClick={() => setShowUrlInput(!showUrlInput)}
                        style={{ fontSize: "0.78rem" }}
                      >
                        {showUrlInput ? "Use File Upload" : "Or enter image URL"}
                      </button>
                    </label>

                    {showUrlInput ? (
                      <div className="input-group">
                        <span className="input-group-text bg-body-tertiary">
                          <i className="bi bi-link-45deg"></i>
                        </span>
                        <input
                          id="catImageUrl"
                          type="url"
                          className="form-control"
                          placeholder="https://example.com/images/category-banner.png"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          maxLength={255}
                          disabled={saving || uploadingImage}
                        />
                        {imageUrl && (
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setImageUrl("")}
                            title="Clear image URL"
                          >
                            <i className="bi bi-x"></i>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div>
                        {/* Hidden File Input */}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                          className="d-none"
                          onChange={handleFileChange}
                          disabled={saving || uploadingImage}
                        />

                        {imageUrl ? (
                          <div className="p-3 bg-body-tertiary rounded border d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center gap-3">
                              <div
                                className="d-flex align-items-center justify-content-center bg-white border rounded overflow-hidden shadow-sm"
                                style={{ width: "64px", height: "64px", flexShrink: 0 }}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={resolveImageUrl(imageUrl)}
                                  alt="Category preview"
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' fill='%23999' viewBox='0 0 16 16'><path d='M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z'/><path d='M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z'/></svg>";
                                  }}
                                />
                              </div>
                              <div>
                                <span className="badge bg-success-subtle text-success mb-1">Image Attached</span>
                                <div className="small text-truncate" style={{ maxWidth: "300px" }}>
                                  <code>{imageUrl}</code>
                                </div>
                              </div>
                            </div>

                            <div className="d-flex gap-2">
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={saving || uploadingImage}
                              >
                                <i className="bi bi-arrow-repeat me-1"></i>
                                Change
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => setImageUrl("")}
                                disabled={saving || uploadingImage}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="border border-2 rounded p-4 text-center bg-body-tertiary"
                            style={{ borderStyle: "dashed", cursor: "pointer" }}
                            onClick={() => fileInputRef.current?.click()}
                          >
                            {uploadingImage ? (
                              <div className="py-2">
                                <span className="spinner-border spinner-border-sm text-primary mb-2" role="status"></span>
                                <div className="small text-primary fw-medium">Uploading image to server...</div>
                              </div>
                            ) : (
                              <div className="py-2">
                                <i className="bi bi-cloud-arrow-up text-primary fs-2 d-block mb-2"></i>
                                <div className="fw-semibold text-body mb-1">Click to Upload Category Image</div>
                                <div className="text-secondary small">
                                  PNG, JPG, WEBP, or SVG up to 5MB.
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="col-md-12">
                    <label htmlFor="catDesc" className="form-label fw-semibold">
                      Description
                    </label>
                    <textarea
                      id="catDesc"
                      rows={2}
                      className="form-control"
                      placeholder="Brief summary of physical items categorized in this section..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={saving}
                    ></textarea>
                  </div>

                  {/* Active Toggle Switch */}
                  <div className="col-md-12">
                    <div className="form-check form-switch mt-1">
                      <input
                        id="catIsActive"
                        type="checkbox"
                        role="switch"
                        className="form-check-input"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        disabled={saving}
                      />
                      <label htmlFor="catIsActive" className="form-check-label fw-semibold ms-2">
                        Active Category (Visible to customers on Storefront)
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer bg-body-tertiary border-top py-2 px-3 d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={onClose}
                  disabled={saving || uploadingImage}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm d-flex align-items-center gap-2"
                  disabled={saving || uploadingImage}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg"></i>
                      <span>{isEditing ? "Save Changes" : "Create Category"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
