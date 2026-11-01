import React from "react";
import Link from "next/link";

export function AdminFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer py-3 px-3 px-md-4 text-secondary small d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2">
      <div>
        <span>
          Copyright &copy; {currentYear}{" "}
          <Link href="/" className="text-decoration-none fw-semibold text-primary">
            A to Z E-Commerce
          </Link>
          . All rights reserved.
        </span>
      </div>
      <div className="d-flex align-items-center gap-2 text-secondary" style={{ fontSize: "0.75rem" }}>
        <span className="badge bg-body-secondary text-secondary border fw-medium">
          <i className="bi bi-layers-half text-primary me-1" aria-hidden="true"></i>
          3D Tactile Console
        </span>
        <span className="d-none d-md-inline">AdminLTE 4 &middot; Bootstrap 5.3 &middot; Next.js 16</span>
      </div>
    </footer>
  );
}
