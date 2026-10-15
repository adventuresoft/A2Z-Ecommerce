"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminNavbar } from "./AdminNavbar";
import { AdminSidebar } from "./AdminSidebar";
import { AdminFooter } from "./AdminFooter";
import { PageHeader, PageHeaderProps } from "./PageHeader";
import { useAdminLayout } from "./AdminLayoutContext";
import { useAuth } from "../../context/AuthContext";

export interface AdminLayoutProps {
  children: React.ReactNode;
  headerProps?: PageHeaderProps;
  hideHeader?: boolean;
}

export function AdminLayout({ children, headerProps, hideHeader }: AdminLayoutProps) {
  const { mobileOpen, closeMobileSidebar } = useAdminLayout();
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isAuthPage = pathname === "/login" || pathname === "/forgot-password";

  useEffect(() => {
    if (!isLoading && !user && !isAuthPage) {
      router.push(`/login?returnUrl=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, user, isAuthPage, pathname, router]);

  // If on login or forgot-password, render clean layout without sidebar/navbar
  if (isAuthPage) {
    return (
      <main className="min-vh-100 bg-body-secondary d-flex align-items-center justify-content-center p-3">
        {children}
      </main>
    );
  }

  // If loading and unauthenticated, render a clean loading spinner
  if (isLoading || !user) {
    return (
      <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center bg-body-tertiary">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading administrative session...</span>
        </div>
        <p className="mt-3 text-secondary small">Verifying session...</p>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      {/* 1. Main Sidebar (grid-area: lte-app-sidebar) */}
      <AdminSidebar />

      {/* 2. Top Navbar (grid-area: lte-app-header) */}
      <AdminNavbar />

      {/* 3. Main Content Area (grid-area: lte-app-main) */}
      <main className="app-main bg-body-tertiary">
        {!hideHeader && <PageHeader {...headerProps} />}

        <div className="app-content py-4 px-3 px-md-4">
          <div className="container-fluid p-0">{children}</div>
        </div>
      </main>

      {/* 4. Footer (grid-area: lte-app-footer) */}
      <AdminFooter />

      {/* Mobile Drawer Overlay Backdrop */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
          style={{ zIndex: 1040, cursor: "pointer" }}
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
