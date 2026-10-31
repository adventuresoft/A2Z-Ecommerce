"use client";

import React from "react";
import Link from "next/link";

export function QuickActionsCard() {
  const actions = [
    {
      title: "Add New Product",
      desc: "Create SKU, variants & pricing",
      icon: "bi-plus-circle",
      color: "primary",
      href: "/products/new",
    },
    {
      title: "Order Fulfillment",
      desc: "Process pending & shipped orders",
      icon: "bi-box-seam",
      color: "success",
      href: "/orders",
    },
    {
      title: "Stock Adjustments",
      desc: "Update low thresholds & counts",
      icon: "bi-arrow-left-right",
      color: "warning",
      href: "/inventory",
    },
    {
      title: "Manage Categories",
      desc: "Catalog taxonomies & hierarchy",
      icon: "bi-diagram-3",
      color: "info",
      href: "/catalog/categories",
    },
    {
      title: "Store Settings",
      desc: "Currency, payment & taxes",
      icon: "bi-gear",
      color: "secondary",
      href: "/system/settings",
    },
  ];

  return (
    <div className="card shadow-sm border-0 h-100 bg-body">
      <div className="card-header bg-body border-bottom py-3 px-3 px-md-4">
        <h5 className="card-title mb-0 fw-semibold text-body d-flex align-items-center gap-2" style={{ fontSize: "0.95rem" }}>
          <i className="bi bi-lightning-charge text-warning"></i>
          <span>Operations Quick Access</span>
        </h5>
      </div>

      <div className="card-body p-3 d-flex flex-column gap-2">
        {actions.map((act, i) => (
          <Link
            key={i}
            href={act.href}
            className="btn btn-outline-secondary d-flex align-items-center justify-content-between text-start p-2 rounded-2 hover-bg-body-secondary border-light-subtle"
            style={{ fontSize: "0.825rem", transition: "all 0.15s ease" }}
          >
            <div className="d-flex align-items-center gap-2 text-truncate">
              <div
                className={`bg-${act.color}-subtle text-${act.color} rounded-2 d-flex align-items-center justify-content-center flex-shrink-0`}
                style={{ width: "32px", height: "32px" }}
              >
                <i className={`bi ${act.icon} fs-6`}></i>
              </div>
              <div className="text-truncate">
                <div className="fw-semibold text-body">{act.title}</div>
                <small className="text-secondary" style={{ fontSize: "0.7rem" }}>
                  {act.desc}
                </small>
              </div>
            </div>
            <i className="bi bi-chevron-right text-secondary small"></i>
          </Link>
        ))}
      </div>
    </div>
  );
}
