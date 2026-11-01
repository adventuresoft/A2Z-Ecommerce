"use client";

import React from "react";
import Link from "next/link";

export function QuickActionsCard() {
  const actions = [
    {
      title: "Add New Product",
      desc: "Create SKU, variants & pricing",
      icon: "bi-plus-circle-fill",
      color: "primary",
      href: "/catalog/products/new",
    },
    {
      title: "Order Fulfillment",
      desc: "Process pending & shipped orders",
      icon: "bi-box-seam-fill",
      color: "success",
      href: "/orders",
    },
    {
      title: "Stock Adjustments",
      desc: "Update low thresholds & counts",
      icon: "bi-arrow-left-right",
      color: "warning",
      href: "/inventory/adjustments",
    },
    {
      title: "Manage Categories",
      desc: "Catalog taxonomies & hierarchy",
      icon: "bi-diagram-3-fill",
      color: "info",
      href: "/catalog/categories",
    },
    {
      title: "Store Settings",
      desc: "Currency, payment & taxes",
      icon: "bi-sliders2",
      color: "secondary",
      href: "/system/settings",
    },
  ];

  return (
    <div className="card card-3d border-0 h-100">
      <div className="card-header py-3 px-3 px-md-4 d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2">
          <div
            className="tile-3d d-inline-flex align-items-center justify-content-center text-warning me-1"
            style={{ width: "34px", height: "34px", borderRadius: "0.55rem" }}
          >
            <i className="bi bi-lightning-charge-fill fs-6" aria-hidden="true"></i>
          </div>
          <div>
            <h5 className="card-title mb-0 fw-bold text-body" style={{ fontSize: "0.95rem" }}>
              Operations Quick Access
            </h5>
            <small className="text-secondary" style={{ fontSize: "0.74rem" }}>
              Direct 1-click administrative workflows
            </small>
          </div>
        </div>
      </div>

      <div className="card-body p-3 d-flex flex-column justify-content-between gap-2">
        {actions.map((act, i) => (
          <Link
            key={i}
            href={act.href}
            className="tile-3d d-flex align-items-center justify-content-between text-start p-2-5 text-decoration-none"
            style={{ padding: "0.65rem 0.85rem", fontSize: "0.825rem" }}
          >
            <div className="d-flex align-items-center gap-2-5 text-truncate">
              <div
                className={`bg-${act.color}-subtle text-${act.color} rounded-3 d-flex align-items-center justify-content-center flex-shrink-0 me-2 shadow-sm`}
                style={{ width: "36px", height: "36px" }}
              >
                <i className={`bi ${act.icon} fs-6`} aria-hidden="true"></i>
              </div>
              <div className="text-truncate">
                <div className="fw-semibold text-body">{act.title}</div>
                <small className="text-secondary" style={{ fontSize: "0.71rem" }}>
                  {act.desc}
                </small>
              </div>
            </div>
            <i className="bi bi-chevron-right text-secondary small" aria-hidden="true"></i>
          </Link>
        ))}
      </div>
    </div>
  );
}
