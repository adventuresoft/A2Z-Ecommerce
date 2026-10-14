import React from "react";
import Link from "next/link";

export default function CategoriesPage() {
  return (
    <div className="d-flex flex-column gap-4">
      {/* Informative Status Banner */}
      <div className="alert alert-info border-info-subtle d-flex align-items-center justify-content-between p-3 rounded shadow-sm">
        <div className="d-flex align-items-center gap-3">
          <i className="bi bi-info-circle-fill fs-3 text-info"></i>
          <div>
            <h6 className="mb-0 fw-semibold">Phase 1 Target Module: Categories CRUD</h6>
            <small className="text-secondary">
              This module is scheduled as the very next atomic vertical business slice following the Admin Dashboard Layout.
            </small>
          </div>
        </div>
        <span className="badge bg-primary px-3 py-2">Vertical Slice 1</span>
      </div>

      {/* AdminLTE Card Pattern */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-body border-bottom py-3 d-flex align-items-center justify-content-between">
          <h5 className="card-title mb-0 fw-semibold d-flex align-items-center gap-2">
            <i className="bi bi-tags text-primary"></i>
            <span>Category Taxonomy</span>
          </h5>
          <button type="button" className="btn btn-primary btn-sm" disabled>
            <i className="bi bi-plus-lg me-1"></i>
            Add Category (Upcoming)
          </button>
        </div>

        <div className="card-body p-4 text-center">
          <div className="py-5">
            <div
              className="d-inline-flex align-items-center justify-content-center bg-primary-subtle text-primary rounded-circle mb-3"
              style={{ width: "64px", height: "64px" }}
            >
              <i className="bi bi-folder-plus fs-2"></i>
            </div>
            <h5 className="fw-semibold text-body mb-2">Category Management Scaffold Ready</h5>
            <p className="text-secondary mx-auto mb-4" style={{ maxWidth: "500px" }}>
              The layout and breadcrumbs for Categories are fully verified. The next OpenSpec proposal will deliver the Prisma Category schema migration, NestJS Category endpoints, and AdminLTE DataTable.
            </p>
            <Link href="/" className="btn btn-outline-secondary btn-sm">
              <i className="bi bi-arrow-left me-1"></i>
              Back to Overview
            </Link>
          </div>
        </div>

        <div className="card-footer bg-body-tertiary border-top py-2 px-3 small text-secondary d-flex justify-content-between">
          <span>Route: /catalog/categories</span>
          <span>Single-Vendor E-Commerce Admin</span>
        </div>
      </div>
    </div>
  );
}
