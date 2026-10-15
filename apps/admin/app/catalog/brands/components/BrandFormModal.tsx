"use client";

import React, { useState, useRef } from "react";
import {
  brandsApi,
  BrandItem,
  CreateBrandPayload,
  resolveLogoUrl,
} from "../../../../services/brands";

interface BrandFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (brand: BrandItem) => void;
  brandToEdit?: BrandItem | null;
}

export function BrandFormModal({
  isOpen,
  onClose,
  onSaved,
  brandToEdit,
}: BrandFormModalProps) {
  const isEditing = Boolean(brandToEdit);

  const [name, setName] = useState(brandToEdit?.name || "");
  const [slug, setSlug] = useState(brandToEdit?.slug || "");
  const [isSlugManual, setIsSlugManual] = useState(Boolean(brandToEdit));
  const [description, setDescription] = useState(
    brandToEdit?.description || "",
  );
  const [website, setWebsite] = useState(brandToEdit?.website || "");
  const [logoUrl, setLogoUrl] = useState(brandToEdit?.logoUrl || "");
  const [isActive, setIsActive] = useState(
    brandToEdit !== undefined && brandToEdit !== null
      ? brandToEdit.isActive
      : true,
  );
  const [sortOrder, setSortOrder] = useState(
    brandToEdit ? brandToEdit.sortOrder : 0,
  );

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(
    Boolean(brandToEdit?.logoUrl && brandToEdit.logoUrl.startsWith("http")),
  );
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|jpg|png|webp|svg\+xml|gif)$/i)) {
      setErrorMessage(
        "Please select a valid image file (JPG, PNG, WEBP, SVG, GIF).",
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Logo file size cannot exceed 5MB.");
      return;
    }

    setUploadingLogo(true);
    setErrorMessage(null);

    try {
      const res = await brandsApi.uploadLogo(file);
      setLogoUrl(res.logoUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload logo.";
      setErrorMessage(msg);
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage("Brand name is required.");
      return;
    }

    if (
      website.trim() &&
      !website.trim().startsWith("http://") &&
      !website.trim().startsWith("https://")
    ) {
      setErrorMessage("Website must start with http:// or https://");
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    const payload: CreateBrandPayload = {
      name: name.trim(),
      slug: slug.trim() ? slug.trim() : undefined,
      description: description.trim() ? description.trim() : undefined,
      website: website.trim() ? website.trim() : undefined,
      logoUrl: logoUrl.trim() ? logoUrl.trim() : undefined,
      isActive,
      sortOrder: Number(sortOrder) || 0,
    };

    try {
      let savedBrand: BrandItem;
      if (isEditing && brandToEdit) {
        savedBrand = await brandsApi.updateBrand(brandToEdit.id, payload);
      } else {
        savedBrand = await brandsApi.createBrand(payload);
      }
      onSaved(savedBrand);
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save brand.";
      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      role="dialog"
      aria-labelledby="brandModalTitle"
      aria-modal="true"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1050 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
        <div className="modal-content shadow border-0">
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-header bg-body border-bottom py-3">
              <h5 className="modal-title fw-semibold text-body" id="brandModalTitle">
                <i
                  className={`bi ${isEditing ? "bi-pencil-square" : "bi-plus-circle"} text-primary me-2`}
                ></i>
                {isEditing ? `Edit Brand: ${brandToEdit?.name}` : "Create New Brand"}
              </h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={onClose}
                disabled={saving}
              ></button>
            </div>

            <div className="modal-body p-4">
              {errorMessage && (
                <div
                  className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 mb-4 rounded"
                  role="alert"
                >
                  <i className="bi bi-exclamation-octagon-fill"></i>
                  <div>{errorMessage}</div>
                </div>
              )}

              <div className="row g-3">
                {/* Brand Name */}
                <div className="col-12 col-md-7">
                  <label htmlFor="brandName" className="form-label fw-semibold small">
                    Brand Name <span className="text-danger">*</span>
                  </label>
                  <input
                    id="brandName"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Apple, Samsung, Nike"
                    value={name}
                    onChange={handleNameChange}
                    required
                    maxLength={100}
                  />
                  <div className="form-text">Max 100 characters.</div>
                </div>

                {/* Slug */}
                <div className="col-12 col-md-5">
                  <label htmlFor="brandSlug" className="form-label fw-semibold small">
                    URL Slug
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-body-tertiary small">/</span>
                    <input
                      id="brandSlug"
                      type="text"
                      className="form-control font-monospace small"
                      placeholder="auto-generated"
                      value={slug}
                      onChange={handleSlugChange}
                      maxLength={120}
                    />
                  </div>
                  <div className="form-text">
                    Unique identifier for public URLs.
                  </div>
                </div>

                {/* Website */}
                <div className="col-12 col-md-8">
                  <label htmlFor="brandWebsite" className="form-label fw-semibold small">
                    Website URL
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-body-tertiary">
                      <i className="bi bi-globe"></i>
                    </span>
                    <input
                      id="brandWebsite"
                      type="url"
                      className="form-control"
                      placeholder="https://www.example.com"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      maxLength={255}
                    />
                  </div>
                  <div className="form-text">Must include http:// or https://</div>
                </div>

                {/* Sort Order */}
                <div className="col-12 col-md-4">
                  <label htmlFor="brandSortOrder" className="form-label fw-semibold small">
                    Sort Order
                  </label>
                  <input
                    id="brandSortOrder"
                    type="number"
                    className="form-control"
                    min={0}
                    value={sortOrder}
                    onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
                  />
                  <div className="form-text">Curated ordering ranking (lower first).</div>
                </div>

                {/* Description */}
                <div className="col-12">
                  <label htmlFor="brandDescription" className="form-label fw-semibold small">
                    Description
                  </label>
                  <textarea
                    id="brandDescription"
                    className="form-control"
                    rows={2}
                    placeholder="Short summary of brand heritage and products..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  ></textarea>
                </div>

                {/* Logo Upload & Preview */}
                <div className="col-12">
                  <label className="form-label fw-semibold small d-flex justify-content-between align-items-center">
                    <span>Brand Logo</span>
                    <button
                      type="button"
                      className="btn btn-link btn-sm p-0 text-decoration-none"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                    >
                      {showUrlInput ? "Upload file instead" : "Enter image URL instead"}
                    </button>
                  </label>

                  <div className="d-flex flex-column flex-sm-row gap-3 align-items-start">
                    {/* Live Preview Box */}
                    <div
                      className="border rounded bg-body-tertiary d-flex align-items-center justify-content-center p-2 position-relative overflow-hidden flex-shrink-0"
                      style={{ width: "90px", height: "90px" }}
                    >
                      {logoUrl ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={resolveLogoUrl(logoUrl)}
                            alt="Logo preview"
                            style={{
                              maxWidth: "100%",
                              maxHeight: "100%",
                              objectFit: "contain",
                            }}
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                          <button
                            type="button"
                            className="btn btn-danger btn-sm p-0 position-absolute top-0 end-0 m-1 rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: "20px", height: "20px", fontSize: "10px" }}
                            title="Remove logo"
                            onClick={() => setLogoUrl("")}
                          >
                            <i className="bi bi-x"></i>
                          </button>
                        </>
                      ) : (
                        <div className="text-center text-secondary">
                          <i className="bi bi-image fs-3 d-block opacity-50"></i>
                          <small style={{ fontSize: "10px" }}>No logo</small>
                        </div>
                      )}
                    </div>

                    {/* Upload Controls or URL Input */}
                    <div className="flex-grow-1 w-100">
                      {showUrlInput ? (
                        <div>
                          <input
                            type="text"
                            className="form-control form-control-sm mb-1"
                            placeholder="https://cdn.example.com/logo.png"
                            value={logoUrl}
                            onChange={(e) => setLogoUrl(e.target.value)}
                            maxLength={255}
                          />
                          <div className="form-text">
                            Direct image link (JPG, PNG, WEBP, SVG, GIF).
                          </div>
                        </div>
                      ) : (
                        <div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="form-control form-control-sm"
                            accept=".jpg,.jpeg,.png,.webp,.svg,.gif"
                            onChange={handleFileChange}
                            disabled={uploadingLogo}
                          />
                          <div className="form-text">
                            {uploadingLogo ? (
                              <span className="text-primary d-inline-flex align-items-center gap-1">
                                <span
                                  className="spinner-border spinner-border-sm"
                                  role="status"
                                ></span>
                                Uploading logo to server...
                              </span>
                            ) : (
                              "Accepted formats: JPG, PNG, WEBP, SVG, GIF (max 5MB)."
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Toggle */}
                <div className="col-12 pt-2">
                  <div className="form-check form-switch">
                    <input
                      id="brandIsActive"
                      type="checkbox"
                      role="switch"
                      className="form-check-input"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                    />
                    <label htmlFor="brandIsActive" className="form-check-label fw-semibold small">
                      Active on Storefront
                    </label>
                  </div>
                  <div className="form-text ms-1">
                    Inactive brands are hidden from public catalog and storefront filters.
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer bg-body-tertiary border-top py-2 px-3 d-flex justify-content-between">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm d-flex align-items-center gap-2"
                disabled={saving || uploadingLogo}
              >
                {saving ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-lg"></i>
                    <span>{isEditing ? "Save Changes" : "Create Brand"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
