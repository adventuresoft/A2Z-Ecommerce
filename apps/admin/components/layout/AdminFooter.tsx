import React from "react";
import Link from "next/link";

export function AdminFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer py-3 px-3 bg-body border-top text-secondary small">
      <div className="float-end d-none d-sm-inline text-muted">
        <span>AdminLTE 4 &middot; Next.js 16</span>
      </div>
      <span>
        Copyright &copy; {currentYear}{" "}
        <Link href="/" className="text-decoration-none fw-medium text-primary">
          A to Z E-Commerce
        </Link>
        . All rights reserved.
      </span>
    </footer>
  );
}
