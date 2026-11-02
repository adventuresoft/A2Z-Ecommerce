"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CollectionItem } from "@/services/collections";

interface CollectionsTableProps {
  collections: CollectionItem[];
  loading: boolean;
  onDelete: (col: CollectionItem) => void;
  onToggleHomePage?: (col: CollectionItem) => void;
  togglingHomeId?: string | null;
  onUpdateSortOrder?: (col: CollectionItem, newSortOrder: number) => void;
  updatingOrderId?: string | null;
}

function SortOrderCell({
  collection,
  isUpdating,
  onCommit,
}: {
  collection: CollectionItem;
  isUpdating: boolean;
  onCommit?: (col: CollectionItem, newOrder: number) => void;
}) {
  const [value, setValue] = useState<string>(String(collection.sortOrder ?? 0));

  useEffect(() => {
    setValue(String(collection.sortOrder ?? 0));
  }, [collection.sortOrder]);

  const commitChange = () => {
    const parsed = parseInt(value, 10);
    const normalized = Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
    setValue(String(normalized));
    if (normalized !== (collection.sortOrder ?? 0)) {
      onCommit?.(collection, normalized);
    }
  };

  return (
    <div className="d-inline-flex align-items-center justify-content-center gap-1 position-relative">
      <input
        type="number"
        min={0}
        className="form-control form-control-sm text-center fw-semibold rounded-3"
        style={{
          width: 72,
          paddingRight: isUpdating ? 22 : undefined,
          borderColor: "#cbd5e1",
          backgroundColor: isUpdating ? "#f8fafc" : "#ffffff",
        }}
        value={value}
        disabled={isUpdating}
        aria-label={`Sort order for ${collection.name}`}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commitChange}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          } else if (e.key === "Escape") {
            setValue(String(collection.sortOrder ?? 0));
          }
        }}
      />
      {isUpdating && (
        <span
          className="spinner-border spinner-border-sm text-primary position-absolute"
          style={{ right: 6, width: "0.85rem", height: "0.85rem" }}
          role="status"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export function CollectionsTable({
  collections,
  loading,
  onDelete,
  onToggleHomePage,
  togglingHomeId,
  onUpdateSortOrder,
  updatingOrderId,
}: CollectionsTableProps) {
  const storeUrl =
    process.env.NEXT_PUBLIC_STORE_URL ||
    process.env.NEXT_PUBLIC_STOREFRONT_URL ||
    "http://localhost:3000";

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead className="table-light">
          <tr>
            <th style={{ width: "21%" }}>Collection Name</th>
            <th style={{ width: "16%" }}>URL Slug</th>
            <th style={{ width: "17%" }}>Hybrid Rules</th>
            <th style={{ width: "12%" }}>Campaign / Timer</th>
            <th style={{ width: "10%" }} className="text-center">
              Order
            </th>
            <th style={{ width: "11%" }} className="text-center">
              Show on Home
            </th>
            <th style={{ width: "6%" }} className="text-center">
              Status
            </th>
            <th style={{ width: "7%" }} className="text-end">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={8} className="text-center py-5 text-muted">
                <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                Loading collections...
              </td>
            </tr>
          ) : collections.length === 0 ? (
            <tr>
              <td colSpan={8} className="text-center py-5 text-muted">
                <i className="bi bi-collection display-6 d-block mb-2 text-secondary" />
                No collections found. Create your first curated collection page.
              </td>
            </tr>
          ) : (
            collections.map((col) => {
              const catCount = col._count?.categories || 0;
              const tagCount = col._count?.tags || 0;
              const prodCount = col._count?.products || 0;
              const hasTimer = Boolean(col.endDate);
              const storefrontLink = `${storeUrl.replace(/\/$/, "")}/collections/${col.slug}`;
              const isTogglingHome = togglingHomeId === col.id;
              const isUpdatingOrder = updatingOrderId === col.id;

              return (
                <tr key={col.id}>
                  <td>
                    <div className="d-flex align-items-center gap-1.5 flex-wrap">
                      <span className="fw-bold text-dark">{col.name}</span>
                      {col.showOnHomePage && (
                        <span
                          className="badge bg-primary-subtle text-primary border border-primary-subtle small"
                          style={{ fontSize: "0.68rem" }}
                          title="Displayed on Storefront Home Page"
                        >
                          <i className="bi bi-house-heart-fill me-1" />
                          Home Page
                        </span>
                      )}
                    </div>
                    {col.badgeText && (
                      <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle me-1 mt-1 small">
                        {col.badgeText}
                      </span>
                    )}
                    {col.description && (
                      <div className="text-muted small text-truncate mt-0.5" style={{ maxWidth: 220 }}>
                        {col.description}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="d-flex align-items-center gap-1">
                      <code className="text-primary small">/collections/{col.slug}</code>
                      <a
                        href={storefrontLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted hover-primary ms-1"
                        title="View on Storefront"
                      >
                        <i className="bi bi-box-arrow-up-right small" />
                      </a>
                    </div>
                  </td>
                  <td>
                    <div className="d-flex flex-wrap gap-1 small">
                      {catCount > 0 && (
                        <span className="badge bg-secondary-subtle text-secondary border">
                          <i className="bi bi-tags me-1" />
                          {catCount} {catCount === 1 ? "Category" : "Categories"}
                        </span>
                      )}
                      {tagCount > 0 && (
                        <span className="badge bg-info-subtle text-info border">
                          <i className="bi bi-tag me-1" />
                          {tagCount} {tagCount === 1 ? "Tag" : "Tags"}
                        </span>
                      )}
                      {prodCount > 0 && (
                        <span className="badge bg-warning-subtle text-warning border">
                          <i className="bi bi-pin-angle me-1" />
                          {prodCount} Pinned {prodCount === 1 ? "Product" : "Products"}
                        </span>
                      )}
                      {catCount === 0 && tagCount === 0 && prodCount === 0 && (
                        <span className="text-muted small fst-italic">All active products</span>
                      )}
                    </div>
                  </td>
                  <td>
                    {hasTimer ? (
                      <div>
                        <span className="badge bg-danger-subtle text-danger border border-danger-subtle d-inline-flex align-items-center gap-1">
                          <i className="bi bi-clock-history" /> Live Timer
                        </span>
                        <div className="text-muted small mt-0.5">
                          Ends: {new Date(col.endDate!).toLocaleDateString()}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted small">Standard Page</span>
                    )}
                  </td>
                  <td className="text-center">
                    <SortOrderCell
                      collection={col}
                      isUpdating={isUpdatingOrder}
                      onCommit={onUpdateSortOrder}
                    />
                  </td>
                  <td className="text-center">
                    <div className="d-inline-flex align-items-center justify-content-center gap-1.5">
                      <div className="form-check form-switch m-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          id={`home-switch-${col.id}`}
                          checked={Boolean(col.showOnHomePage)}
                          disabled={isTogglingHome}
                          onChange={() => onToggleHomePage?.(col)}
                          aria-label={`Toggle Show on Home Page for ${col.name}`}
                          style={{ cursor: "pointer" }}
                        />
                      </div>
                      <label
                        htmlFor={`home-switch-${col.id}`}
                        className={`small fw-semibold mb-0 ${
                          col.showOnHomePage ? "text-primary" : "text-muted"
                        }`}
                        style={{ cursor: "pointer" }}
                      >
                        {col.showOnHomePage ? "On" : "Off"}
                      </label>
                    </div>
                    <div className="mt-1">
                      <span
                        className="badge bg-light text-secondary border small"
                        style={{ fontSize: "0.66rem" }}
                      >
                        <i className="bi bi-layout-wtf me-1" />
                        {col.designTemplate === "collection-1"
                          ? "Collection-1"
                          : col.designTemplate === "collection-2"
                          ? "Collection-2"
                          : "Default"}
                      </span>
                    </div>
                  </td>
                  <td className="text-center">
                    {col.isActive ? (
                      <span className="badge bg-success-subtle text-success border border-success-subtle">
                        Active
                      </span>
                    ) : (
                      <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="text-end">
                    <div className="btn-group btn-group-sm">
                      <Link
                        href={`/catalog/collections/${col.id}/edit`}
                        className="btn btn-outline-secondary"
                        title="Edit Collection"
                      >
                        <i className="bi bi-pencil" />
                      </Link>
                      <button
                        type="button"
                        className="btn btn-outline-danger"
                        onClick={() => onDelete(col)}
                        title="Delete Collection"
                      >
                        <i className="bi bi-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
