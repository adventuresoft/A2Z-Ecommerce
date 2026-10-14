"use client";

import React from "react";
import { AdminNavbar } from "./AdminNavbar";
import { AdminSidebar } from "./AdminSidebar";
import { AdminFooter } from "./AdminFooter";
import { PageHeader, PageHeaderProps } from "./PageHeader";
import { useAdminLayout } from "./AdminLayoutContext";

export interface AdminLayoutProps {
  children: React.ReactNode;
  headerProps?: PageHeaderProps;
  hideHeader?: boolean;
}

export function AdminLayout({ children, headerProps, hideHeader }: AdminLayoutProps) {
  const { mobileOpen, closeMobileSidebar } = useAdminLayout();

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
