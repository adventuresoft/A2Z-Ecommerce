/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useRef } from "react";
import { uploadProductImage } from "../../../../services/products";

interface SingleProductImageUploadProps {
  imageUrl: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export function SingleProductImageUpload({
  imageUrl,
  onChange,
  disabled = false,
}: SingleProductImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace("/api/v1", "")
    : "http://localhost:3001";

  const resolveUrl = (url?: string | null): string => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
      return url;
    }
    return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|webp|gif|svg\+xml)$/)) {
      setError("Please select a valid image file (JPG, PNG, WEBP, GIF, SVG)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const res = await uploadProductImage(file);
      onChange(res.imageUrl);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-header bg-white py-3 border-bottom d-flex align-items-center justify-content-between">
        <h6 className="card-title fw-bold m-0 d-flex align-items-center gap-2">
          <i className="bi bi-image text-primary"></i>
          Single Product Image (Featured Cover)
        </h6>
        <button
          type="button"
          className="btn btn-link btn-sm p-0 text-decoration-none text-muted"
          onClick={() => setShowUrlInput(!showUrlInput)}
          style={{ fontSize: "0.78rem" }}
          disabled={disabled || uploading}
        >
          {showUrlInput ? "Use File Upload" : "Or enter URL"}
        </button>
      </div>

      <div className="card-body">
        {error && (
          <div className="alert alert-danger py-2 px-3 small d-flex align-items-center justify-content-between mb-3">
            <span>{error}</span>
            <button
              type="button"
              className="btn-close btn-close-sm"
              onClick={() => setError(null)}
            ></button>
          </div>
        )}

        {showUrlInput ? (
          <div className="input-group input-group-sm">
            <span className="input-group-text bg-light text-muted">
              <i className="bi bi-link-45deg"></i>
            </span>
            <input
              type="url"
              className="form-control"
              placeholder="https://example.com/product.jpg or /uploads/..."
              value={imageUrl}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled || uploading}
            />
            {imageUrl && (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => onChange("")}
                title="Clear image"
              >
                <i className="bi bi-x"></i>
              </button>
            )}
          </div>
        ) : (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
              className="d-none"
              onChange={handleFileChange}
              disabled={disabled || uploading}
            />

            {imageUrl ? (
              <div className="p-3 bg-light rounded border">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div
                    className="bg-white border rounded overflow-hidden shadow-sm d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: "64px", height: "64px" }}
                  >
                    <img
                      src={resolveUrl(imageUrl)}
                      alt="Product thumbnail"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <div className="min-w-0 flex-grow-1 overflow-hidden">
                    <span className="badge bg-success-subtle text-success border mb-1">
                      Main Product Photo
                    </span>
                    <div
                      className="small text-truncate text-muted font-monospace"
                      title={imageUrl}
                    >
                      {imageUrl}
                    </div>
                  </div>
                </div>

                <div className="d-flex gap-2 justify-content-end pt-2 border-top">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || uploading}
                  >
                    <i className="bi bi-arrow-repeat"></i> Replace
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                    onClick={() => onChange("")}
                    disabled={disabled || uploading}
                    title="Remove image"
                  >
                    <i className="bi bi-trash"></i> Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="border border-dashed rounded-3 p-4 text-center bg-light bg-opacity-50 cursor-pointer hover-bg-light transition"
                onClick={() => !uploading && !disabled && fileInputRef.current?.click()}
                style={{ cursor: disabled || uploading ? "not-allowed" : "pointer" }}
              >
                {uploading ? (
                  <div className="py-2">
                    <span className="spinner-border spinner-border-sm text-primary mb-2" role="status"></span>
                    <div className="small text-primary fw-medium">Uploading image to server...</div>
                  </div>
                ) : (
                  <div>
                    <i className="bi bi-cloud-arrow-up display-6 text-muted opacity-50 mb-2 d-block"></i>
                    <div className="fw-semibold text-dark small mb-1">
                      Click to Upload Single Product Image
                    </div>
                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                      JPG, PNG, WEBP, GIF, SVG up to 5MB
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
