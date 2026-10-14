"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { findActiveItem, BreadcrumbItem } from "@/config/navigation";
import { Breadcrumbs } from "./Breadcrumbs";

export interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, breadcrumbs, actions }: PageHeaderProps) {
  const pathname = usePathname();

  // If title is omitted, resolve title from navigation tree
  let resolvedTitle = title;
  if (!resolvedTitle) {
    const { activeItem } = findActiveItem(pathname);
    resolvedTitle = activeItem ? activeItem.title : "Dashboard";
  }

  return (
    <div className="app-content-header py-3 px-3 border-bottom bg-body">
      <div className="container-fluid p-0">
        <div className="row align-items-center gy-2">
          <div className="col-sm-6">
            <h1 className="mb-0 fs-4 fw-semibold text-body d-flex align-items-center gap-2">
              <span>{resolvedTitle}</span>
            </h1>
            {subtitle && <p className="text-secondary small mb-0 mt-1">{subtitle}</p>}
          </div>
          <div className="col-sm-6">
            <div className="d-flex align-items-center justify-content-sm-end gap-3 flex-wrap">
              <Breadcrumbs items={breadcrumbs} />
              {actions && <div className="d-flex align-items-center gap-2">{actions}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
