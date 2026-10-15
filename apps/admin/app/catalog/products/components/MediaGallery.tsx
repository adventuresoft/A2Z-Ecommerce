/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import {
  ProductImageItem,
  uploadProductImages,
  updateProductImage,
  deleteProductImage,
  reorderProductImages,
} from "../../../../services/products";

interface MediaGalleryProps {
  productId: string;
  images: ProductImageItem[];
  onImagesChange: (images: ProductImageItem[]) => void;
}

export function MediaGallery({
  productId,
  images,
  onImagesChange,
}: MediaGalleryProps) {
  const [uploading, setUploading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingAltId, setEditingAltId] = useState<string | null>(null);
  const [altTextDraft, setAltTextDraft] = useState<string>("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '') : 'http://localhost:3001';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setUploading(true);
      setError(null);
      try {
        const newImages = await uploadProductImages(productId, files);
        onImagesChange([...images, ...newImages]);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to upload images");
      } finally {
        setUploading(false);
        e.target.value = "";
      }
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    setActionLoading(imageId);
    setError(null);
    try {
      await updateProductImage(productId, imageId, { isPrimary: true });
      const updated = images.map((img) => ({
        ...img,
        isPrimary: img.id === imageId,
      }));
      onImagesChange(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update primary image");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!window.confirm("Are you sure you want to delete this gallery image?")) {
      return;
    }
    setActionLoading(imageId);
    setError(null);
    try {
      await deleteProductImage(productId, imageId);
      const remaining = images.filter((img) => img.id !== imageId);
      onImagesChange(remaining);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete image");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveAltText = async (imageId: string) => {
    setActionLoading(imageId);
    try {
      await updateProductImage(productId, imageId, { altText: altTextDraft });
      const updated = images.map((img) =>
        img.id === imageId ? { ...img, altText: altTextDraft } : img,
      );
      onImagesChange(updated);
      setEditingAltId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update alt text");
    } finally {
      setActionLoading(null);
    }
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const copy = [...images];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);

    const reorderedIds = copy.map((img) => img.id);
    try {
      const refreshed = await reorderProductImages(productId, reorderedIds);
      onImagesChange(refreshed);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reorder images");
    }
  };

  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-header bg-white py-3 border-bottom d-flex align-items-center justify-content-between">
        <h5 className="card-title fw-bold m-0 d-flex align-items-center gap-2">
          <i className="bi bi-images text-primary"></i>
          Product Media Gallery
        </h5>
        <span className="badge bg-secondary-subtle text-secondary border">
          {images.length} {images.length === 1 ? "Image" : "Images"}
        </span>
      </div>

      <div className="card-body">
        {error && (
          <div className="alert alert-danger alert-dismissible fade show mb-3" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
            <button type="button" className="btn-close" onClick={() => setError(null)}></button>
          </div>
        )}

        {/* Upload Dropzone Bar */}
        <div className="p-3 border rounded-3 bg-light mb-4">
          <label className="form-label fw-semibold small text-muted text-uppercase mb-2">
            Upload Images (JPG, PNG, WEBP, GIF, Max 5MB per file)
          </label>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <input
              id="product-media-upload"
              type="file"
              className="form-control form-control-sm w-auto flex-grow-1"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
              onChange={handleFileChange}
              disabled={uploading}
            />
            {uploading && (
              <span className="text-primary small fw-semibold d-flex align-items-center gap-1">
                <span className="spinner-border spinner-border-sm" role="status"></span>
                Uploading images...
              </span>
            )}
          </div>
        </div>

        {/* Gallery Grid */}
        {images.length === 0 ? (
          <div className="text-center py-5 border border-dashed rounded-3 bg-light bg-opacity-50">
            <i className="bi bi-card-image display-4 text-muted opacity-50"></i>
            <p className="mt-2 text-muted fw-semibold">No images in product gallery</p>
            <p className="small text-muted mb-0">
              Upload photos above to display thumbnail covers and variant color swatches.
            </p>
          </div>
        ) : (
          <div className="row g-3">
            {images.map((img, index) => {
              const fullUrl = img.imageUrl.startsWith("http")
                ? img.imageUrl
                : `${API_URL}${img.imageUrl}`;

              return (
                <div key={img.id} className="col-12 col-sm-6 col-md-4 col-xl-3">
                  <div className={`card h-100 border position-relative overflow-hidden ${img.isPrimary ? "border-primary shadow-sm" : ""}`}>
                    {/* Primary Badge */}
                    {img.isPrimary ? (
                      <span className="position-absolute top-0 start-0 m-2 badge bg-primary shadow-sm d-flex align-items-center gap-1" style={{ zIndex: 2 }}>
                        <i className="bi bi-star-fill"></i> Primary Cover
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-sm btn-light border position-absolute top-0 start-0 m-2 shadow-sm d-flex align-items-center gap-1 opacity-75 hover-opacity-100"
                        style={{ zIndex: 2, fontSize: "0.75rem" }}
                        onClick={() => handleSetPrimary(img.id)}
                        disabled={actionLoading === img.id}
                      >
                        <i className="bi bi-star"></i> Set Cover
                      </button>
                    )}

                    {/* Image Preview Container */}
                    <div
                      className="bg-light d-flex align-items-center justify-content-center border-bottom overflow-hidden"
                      style={{ height: "180px" }}
                    >
                      <img
                        src={fullUrl}
                        alt={img.altText || "Product photo"}
                        style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
                      />
                    </div>

                    {/* Card Actions & Alt Text */}
                    <div className="card-body p-2 d-flex flex-column justify-content-between">
                      {editingAltId === img.id ? (
                        <div className="d-flex gap-1 mb-2">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Alt text"
                            value={altTextDraft}
                            onChange={(e) => setAltTextDraft(e.target.value)}
                            autoFocus
                          />
                          <button
                            type="button"
                            className="btn btn-sm btn-success"
                            onClick={() => handleSaveAltText(img.id)}
                            disabled={actionLoading === img.id}
                          >
                            <i className="bi bi-check"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            onClick={() => setEditingAltId(null)}
                          >
                            <i className="bi bi-x"></i>
                          </button>
                        </div>
                      ) : (
                        <div className="d-flex align-items-center justify-content-between mb-2 px-1">
                          <span
                            className="text-truncate small text-muted"
                            title={img.altText || "No alt text"}
                            style={{ maxWidth: "150px" }}
                          >
                            {img.altText ? img.altText : <span className="fst-italic opacity-50">No alt text</span>}
                          </span>
                          <button
                            type="button"
                            className="btn btn-link btn-sm p-0 text-decoration-none"
                            onClick={() => {
                              setEditingAltId(img.id);
                              setAltTextDraft(img.altText || "");
                            }}
                          >
                            <i className="bi bi-pencil-square"></i>
                          </button>
                        </div>
                      )}

                      {/* Bottom Controls */}
                      <div className="d-flex align-items-center justify-content-between pt-1 border-top">
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm p-1"
                            title="Move left"
                            disabled={index === 0}
                            onClick={() => handleMove(index, "up")}
                          >
                            <i className="bi bi-chevron-left"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm p-1"
                            title="Move right"
                            disabled={index === images.length - 1}
                            onClick={() => handleMove(index, "down")}
                          >
                            <i className="bi bi-chevron-right"></i>
                          </button>
                        </div>

                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm p-1 px-2"
                          title="Delete photo"
                          onClick={() => handleDelete(img.id)}
                          disabled={actionLoading === img.id}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
