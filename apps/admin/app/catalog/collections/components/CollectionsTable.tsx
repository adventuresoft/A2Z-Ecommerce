"use client";

import React from "react";
import Link from "next/link";
import { CollectionItem } from "@/services/collections";

interface CollectionsTableProps {
  collections: CollectionItem[];
  loading: boolean;
  onDelete: (col: CollectionItem) => void;
}

export function CollectionsTable({
  collections,
  loading,
  onDelete,
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
            <th style={{ width: "25%" }}>Collection Name</th>
            <th style={{ width: "20%" }}>URL Slug</th>
            <th style={{ width: "20%" }}>Hybrid Rules</th>
            <th style={{ width: "15%" }}>Campaign / Timer</th>
            <th style={{ width: "10%" }}>Status</th>
            <th style={{ width: "10%" }} className="text-end">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={6} className="text-center py-5 text-muted">
                <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                Loading collections...
              </td>
            </tr>
          ) : collections.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-5 text-muted">
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

              return (
                <tr key={col.id}>
                  <td>
                    <div className="fw-bold text-dark">{col.name}</div>
                    {col.badgeText && (
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle me-1 small">
                        {col.badgeText}
                      </span>
                    )}
                    {col.description && (
                      <div className="text-muted small text-truncate" style={{ maxWidth: 220 }}>
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
                  <td>
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

