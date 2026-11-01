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
  const { activeItem, parentItem } = findActiveItem(pathname);

  const resolvedTitle = title || (activeItem ? activeItem.title : "Dashboard");
  const resolvedIcon = activeItem?.icon || parentItem?.icon || "bi bi-speedometer2";

  return (
    <div className="app-content-header py-3 px-3 px-md-4">
      <div className="container-fluid p-0">
        <div className="row align-items-center gy-2">
          <div className="col-sm-6">
            <div className="d-flex align-items-center gap-2-5">
              <div
                className="tile-3d d-none d-sm-inline-flex align-items-center justify-content-center text-primary me-2"
                style={{ width: "36px", height: "36px", borderRadius: "0.6rem" }}
              >
                <i className={`${resolvedIcon} fs-6`} aria-hidden="true"></i>
              </div>
              <div>
                <h1 className="mb-0 fw-bold text-body d-flex align-items-center gap-2" style={{ fontSize: "1.22rem", letterSpacing: "-0.02em" }}>
                  <span>{resolvedTitle}</span>
                </h1>
                {subtitle && <p className="text-secondary small mb-0 mt-0-5">{subtitle}</p>}
              </div>
            </div>
          </div>
          <div className="col-sm-6">
            <div className="d-flex align-items-center justify-content-sm-end gap-3 flex-wrap">
              <div className="px-2-5 py-1 rounded-pill bg-body-secondary bg-opacity-50 border" style={{ padding: "0.28rem 0.85rem" }}>
                <Breadcrumbs items={breadcrumbs} />
              </div>
              {actions && <div className="d-flex align-items-center gap-2">{actions}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
