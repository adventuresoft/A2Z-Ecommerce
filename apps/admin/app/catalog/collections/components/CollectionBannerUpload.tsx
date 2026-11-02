/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useRef } from "react";
import { collectionsService } from "@/services/collections";

interface CollectionBannerUploadProps {
  bannerUrl: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export function CollectionBannerUpload({
  bannerUrl,
  onChange,
  disabled = false,
}: CollectionBannerUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      setError("Banner size must be less than 5MB");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const res = await collectionsService.uploadBannerImage(file);
      onChange(res.imageUrl);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setError(err?.message || "Failed to upload banner image");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange("");
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="collection-banner-upload">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        className="d-none"
        onChange={handleFileChange}
        disabled={disabled || uploading}
      />

      {bannerUrl ? (
        <div className="position-relative rounded-4 overflow-hidden border border-slate-200 bg-slate-50">
          <div
            className="w-100 position-relative"
            style={{
              maxHeight: 200,
              aspectRatio: "16/5",
              overflow: "hidden",
              backgroundColor: "#0f172a",
            }}
          >
            <img
              src={resolveUrl(bannerUrl)}
              alt="Collection Banner Preview"
              className="w-100 h-100 object-fit-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  "https://placehold.co/1200x300/1e293b/ffffff?text=Banner+Preview";
              }}
            />
          </div>

          <div className="p-2.5 bg-white border-top d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2 text-truncate" style={{ maxWidth: "70%" }}>
              <i className="bi bi-image text-primary" />
              <span className="small text-truncate text-muted">{bannerUrl}</span>
            </div>
            <div className="d-flex align-items-center gap-1.5">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary rounded-3 d-inline-flex align-items-center gap-1"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || uploading}
              >
                <i className="bi bi-arrow-repeat" /> Change
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger rounded-3 d-inline-flex align-items-center gap-1"
                onClick={handleRemove}
                disabled={disabled || uploading}
              >
                <i className="bi bi-trash" /> Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={`border border-2 border-dashed rounded-4 p-4 text-center cursor-pointer transition-all ${
            uploading ? "bg-light opacity-75" : "bg-white hover:bg-light"
          }`}
          style={{ cursor: "pointer" }}
        >
          {uploading ? (
            <div className="py-2 text-primary">
              <span className="spinner-border spinner-border-sm me-2" role="status" />
              <span className="small fw-semibold">Uploading banner image...</span>
            </div>
          ) : (
            <div className="py-2">
              <div
                className="mx-auto mb-2.5 d-flex align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary"
                style={{ width: 48, height: 48 }}
              >
                <i className="bi bi-cloud-arrow-up fs-4" />
              </div>
              <div className="fw-semibold text-dark small mb-1">
                Click to upload Collection Banner
              </div>
              <div className="text-muted text-xs">
                PNG, JPG, WEBP, or SVG (Recommended: 1600x400px, max 5MB)
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="text-danger small mt-1.5 d-flex align-items-center gap-1">
          <i className="bi bi-exclamation-circle" /> {error}
        </div>
      )}
    </div>
  );
}

