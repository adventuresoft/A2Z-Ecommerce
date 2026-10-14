import React from "react";
import Link from "next/link";

export interface ModuleStatusShellProps {
  moduleName: string;
  phase?: number;
  description?: string;
  targetPrdSection?: string;
  backHref?: string;
}

export function ModuleStatusShell({
  moduleName,
  phase = 2,
  description,
  targetPrdSection,
  backHref = "/",
}: ModuleStatusShellProps) {
  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-body border-bottom py-3 d-flex align-items-center justify-content-between">
        <h5 className="card-title mb-0 fw-semibold d-flex align-items-center gap-2">
          <i className="bi bi-cone-striped text-warning"></i>
          <span>{moduleName}</span>
        </h5>
        <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1">
          Phase {phase} Roadmap
        </span>
      </div>

      <div className="card-body p-4">
        <div className="text-center py-4">
          <div
            className="d-inline-flex align-items-center justify-content-center bg-warning-subtle text-warning rounded-circle mb-3"
            style={{ width: "64px", height: "64px" }}
          >
            <i className="bi bi-clock-history fs-2"></i>
          </div>

          <h4 className="fw-semibold text-body mb-2">{moduleName} Management</h4>
          <p className="text-secondary mx-auto mb-4" style={{ maxWidth: "540px" }}>
            {description ||
              `The ${moduleName} module is slated for active implementation in Phase ${phase}. This placeholder maintains navigation integrity across the admin portal without dead links or misleading mock metrics.`}
          </p>

          <div
            className="alert alert-info d-inline-flex align-items-center text-start gap-3 p-3 mb-4 mx-auto"
            style={{ maxWidth: "600px" }}
          >
            <i className="bi bi-info-circle-fill fs-4 text-info flex-shrink-0"></i>
            <div className="small">
              <strong>Approved Phased Activation Policy:</strong>
              {targetPrdSection ? (
                <span> Specified in PRD §{targetPrdSection}. </span>
              ) : (
                <span> Aligned with the project architecture roadmap. </span>
              )}
              Production data endpoints will be integrated sequentially with accompanying NestJS services and database models.
            </div>
          </div>

          <div className="d-flex align-items-center justify-content-center gap-2">
            <Link href={backHref} className="btn btn-outline-secondary btn-sm">
              <i className="bi bi-arrow-left me-1"></i>
              Back to Dashboard
            </Link>
            <Link href="/catalog/categories" className="btn btn-primary btn-sm">
              <i className="bi bi-tags me-1"></i>
              View Categories (Phase 1)
            </Link>
          </div>
        </div>
      </div>

      <div className="card-footer bg-body-tertiary border-top py-2 px-4 small text-secondary d-flex align-items-center justify-content-between">
        <span>Status: Architectural Shell Active</span>
        <span>A to Z E-Commerce AdminLTE 4</span>
      </div>
    </div>
  );
}
