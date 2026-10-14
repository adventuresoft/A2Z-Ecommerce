import React from "react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="d-flex flex-column gap-4">
      {/* Operational Metric KPI Cards (AdminLTE Modern Card Pattern) */}
      <div className="row g-3">
        {/* Total Orders Card */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 border-start border-primary border-4 h-100">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-secondary text-uppercase fw-semibold" style={{ fontSize: "0.72rem", letterSpacing: "0.04em" }}>
                    Total Orders
                  </div>
                  <h3 className="fw-bold mb-0 text-body mt-1">0</h3>
                  <small className="text-muted" style={{ fontSize: "0.72rem" }}>
                    <i className="bi bi-clock me-1"></i>Phase 3 Integration
                  </small>
                </div>
                <div
                  className="bg-primary-subtle text-primary rounded-3 d-flex align-items-center justify-content-center"
                  style={{ width: "46px", height: "46px" }}
                >
                  <i className="bi bi-cart3 fs-4"></i>
                </div>
              </div>
            </div>
            <div className="card-footer bg-body-tertiary border-0 py-2 px-3 small">
              <Link href="/orders" className="text-decoration-none text-primary fw-medium d-flex align-items-center justify-content-between" style={{ fontSize: "0.75rem" }}>
                <span>View orders</span>
                <i className="bi bi-chevron-right small"></i>
              </Link>
            </div>
          </div>
        </div>

        {/* Total Products Card */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 border-start border-success border-4 h-100">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-secondary text-uppercase fw-semibold" style={{ fontSize: "0.72rem", letterSpacing: "0.04em" }}>
                    Products
                  </div>
                  <h3 className="fw-bold mb-0 text-body mt-1">0</h3>
                  <small className="text-muted" style={{ fontSize: "0.72rem" }}>
                    <i className="bi bi-clock me-1"></i>Phase 2 Integration
                  </small>
                </div>
                <div
                  className="bg-success-subtle text-success rounded-3 d-flex align-items-center justify-content-center"
                  style={{ width: "46px", height: "46px" }}
                >
                  <i className="bi bi-grid-3x3-gap fs-4"></i>
                </div>
              </div>
            </div>
            <div className="card-footer bg-body-tertiary border-0 py-2 px-3 small">
              <Link href="/catalog/categories" className="text-decoration-none text-success fw-medium d-flex align-items-center justify-content-between" style={{ fontSize: "0.75rem" }}>
                <span>Catalog categories</span>
                <i className="bi bi-chevron-right small"></i>
              </Link>
            </div>
          </div>
        </div>

        {/* Low-Stock Alert Card */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 border-start border-warning border-4 h-100">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-secondary text-uppercase fw-semibold" style={{ fontSize: "0.72rem", letterSpacing: "0.04em" }}>
                    Stock Alerts
                  </div>
                  <h3 className="fw-bold mb-0 text-body mt-1">0</h3>
                  <small className="text-muted" style={{ fontSize: "0.72rem" }}>
                    <i className="bi bi-shield-check me-1"></i>Healthy threshold
                  </small>
                </div>
                <div
                  className="bg-warning-subtle text-warning rounded-3 d-flex align-items-center justify-content-center"
                  style={{ width: "46px", height: "46px" }}
                >
                  <i className="bi bi-exclamation-triangle fs-4"></i>
                </div>
              </div>
            </div>
            <div className="card-footer bg-body-tertiary border-0 py-2 px-3 small">
              <Link href="/inventory" className="text-decoration-none text-warning fw-medium d-flex align-items-center justify-content-between" style={{ fontSize: "0.75rem" }}>
                <span>Inventory status</span>
                <i className="bi bi-chevron-right small"></i>
              </Link>
            </div>
          </div>
        </div>

        {/* Customers Card */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 border-start border-info border-4 h-100">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-secondary text-uppercase fw-semibold" style={{ fontSize: "0.72rem", letterSpacing: "0.04em" }}>
                    Customers
                  </div>
                  <h3 className="fw-bold mb-0 text-body mt-1">0</h3>
                  <small className="text-muted" style={{ fontSize: "0.72rem" }}>
                    <i className="bi bi-people me-1"></i>Registered shoppers
                  </small>
                </div>
                <div
                  className="bg-info-subtle text-info rounded-3 d-flex align-items-center justify-content-center"
                  style={{ width: "46px", height: "46px" }}
                >
                  <i className="bi bi-person-lines-fill fs-4"></i>
                </div>
              </div>
            </div>
            <div className="card-footer bg-body-tertiary border-0 py-2 px-3 small">
              <Link href="/customers" className="text-decoration-none text-info fw-medium d-flex align-items-center justify-content-between" style={{ fontSize: "0.75rem" }}>
                <span>Customer directory</span>
                <i className="bi bi-chevron-right small"></i>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Operations Grid */}
      <div className="row g-4">
        {/* Left Column: Operations Roadmap & Delivery Sequence */}
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-body border-bottom py-3 d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0 fw-semibold d-flex align-items-center gap-2" style={{ fontSize: "0.95rem" }}>
                <i className="bi bi-kanban text-primary"></i>
                <span>Platform Roadmap & Implementation Sequence</span>
              </h5>
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle" style={{ fontSize: "0.68rem" }}>
                Phase 2 Shell Active
              </span>
            </div>
            <div className="card-body p-4">
              <p className="text-secondary small mb-4">
                The administrative shell is standardized on AdminLTE 4 and Bootstrap 5 with native React state management. Following the approved design decisions, modules are delivered in atomic vertical slices:
              </p>

              <div className="list-group list-group-flush border rounded mb-3">
                <div className="list-group-item d-flex align-items-center justify-content-between py-2-5">
                  <div className="d-flex align-items-center gap-3">
                    <span className="badge bg-success rounded-pill px-2 py-1" style={{ fontSize: "0.68rem" }}>
                      <i className="bi bi-check-lg"></i>
                    </span>
                    <div>
                      <div className="fw-semibold small">Phase 0: Workspace & Tooling Harmonization</div>
                      <div className="text-secondary" style={{ fontSize: "0.72rem" }}>Unified pnpm monorepo, AdminLTE 4 CSS, ports locked</div>
                    </div>
                  </div>
                  <span className="badge bg-success-subtle text-success" style={{ fontSize: "0.65rem" }}>Complete</span>
                </div>

                <div className="list-group-item d-flex align-items-center justify-content-between py-2-5">
                  <div className="d-flex align-items-center gap-3">
                    <span className="badge bg-success rounded-pill px-2 py-1" style={{ fontSize: "0.68rem" }}>
                      <i className="bi bi-check-lg"></i>
                    </span>
                    <div>
                      <div className="fw-semibold small">Phase 1: REST API Backend Foundation</div>
                      <div className="text-secondary" style={{ fontSize: "0.72rem" }}>Prisma 7 adapter-pg, /api/v1 prefix, Swagger docs, health endpoint</div>
                    </div>
                  </div>
                  <span className="badge bg-success-subtle text-success" style={{ fontSize: "0.65rem" }}>Complete</span>
                </div>

                <div className="list-group-item d-flex align-items-center justify-content-between py-2-5 bg-body-tertiary">
                  <div className="d-flex align-items-center gap-3">
                    <span className="badge bg-primary rounded-pill px-2 py-1" style={{ fontSize: "0.68rem" }}>
                      <i className="bi bi-arrow-right"></i>
                    </span>
                    <div>
                      <div className="fw-semibold small text-primary">Phase 2: Admin Dashboard Layout</div>
                      <div className="text-secondary" style={{ fontSize: "0.72rem" }}>Responsive AdminLTE 4 grid, hierarchical navigation, dynamic breadcrumbs, light/dark mode</div>
                    </div>
                  </div>
                  <span className="badge bg-primary" style={{ fontSize: "0.65rem" }}>Current Step</span>
                </div>

                <div className="list-group-item d-flex align-items-center justify-content-between py-2-5">
                  <div className="d-flex align-items-center gap-3">
                    <span className="badge bg-secondary-subtle text-secondary rounded-pill px-2 py-1" style={{ fontSize: "0.68rem" }}>
                      3
                    </span>
                    <div>
                      <div className="fw-semibold small text-secondary">Vertical Slice 1: Categories CRUD</div>
                      <div className="text-muted" style={{ fontSize: "0.72rem" }}>Prisma Category model, NestJS endpoints, AdminLTE management table & form</div>
                    </div>
                  </div>
                  <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: "0.65rem" }}>Next Up</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Operations & System Health */}
        <div className="col-12 col-lg-4">
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-body border-bottom py-3">
              <h5 className="card-title mb-0 fw-semibold d-flex align-items-center gap-2" style={{ fontSize: "0.95rem" }}>
                <i className="bi bi-lightning-charge text-warning"></i>
                <span>Quick Operations</span>
              </h5>
            </div>
            <div className="card-body p-3 d-flex flex-column gap-2">
              <Link
                href="/catalog/categories"
                className="btn btn-outline-primary d-flex align-items-center justify-content-between text-start p-2 rounded-2"
              >
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-tags fs-5"></i>
                  <div>
                    <div className="fw-medium small">Manage Categories</div>
                    <small className="text-muted" style={{ fontSize: "0.7rem" }}>
                      Catalog hierarchy & taxonomies
                    </small>
                  </div>
                </div>
                <i className="bi bi-arrow-right small"></i>
              </Link>

              <Link
                href="/system/users"
                className="btn btn-outline-secondary d-flex align-items-center justify-content-between text-start p-2 rounded-2"
              >
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-people fs-5"></i>
                  <div>
                    <div className="fw-medium small">Admin Users</div>
                    <small className="text-muted" style={{ fontSize: "0.7rem" }}>
                      SUPER_ADMIN & ADMIN accounts
                    </small>
                  </div>
                </div>
                <i className="bi bi-arrow-right small"></i>
              </Link>

              <Link
                href="/system/settings"
                className="btn btn-outline-secondary d-flex align-items-center justify-content-between text-start p-2 rounded-2"
              >
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-gear fs-5"></i>
                  <div>
                    <div className="fw-medium small">Store Settings</div>
                    <small className="text-muted" style={{ fontSize: "0.7rem" }}>
                      Currency, tax & general options
                    </small>
                  </div>
                </div>
                <i className="bi bi-arrow-right small"></i>
              </Link>
            </div>
          </div>

          <div className="card shadow-sm border-0">
            <div className="card-header bg-body border-bottom py-3">
              <h5 className="card-title mb-0 fw-semibold d-flex align-items-center gap-2" style={{ fontSize: "0.95rem" }}>
                <i className="bi bi-info-circle text-info"></i>
                <span>System Environment</span>
              </h5>
            </div>
            <div className="card-body p-3">
              <ul className="list-unstyled mb-0 d-flex flex-column gap-2 small">
                <li className="d-flex justify-content-between align-items-center">
                  <span className="text-secondary">Admin UI Port:</span>
                  <span className="badge bg-body-secondary text-body border">3002</span>
                </li>
                <li className="d-flex justify-content-between align-items-center">
                  <span className="text-secondary">Backend API:</span>
                  <span className="badge bg-body-secondary text-body border">localhost:3001</span>
                </li>
                <li className="d-flex justify-content-between align-items-center">
                  <span className="text-secondary">CSS Framework:</span>
                  <span className="badge bg-body-secondary text-body border">AdminLTE 4.10 / BS 5.3</span>
                </li>
                <li className="d-flex justify-content-between align-items-center">
                  <span className="text-secondary">Theme:</span>
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle">Light / Dark Active</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
