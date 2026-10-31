"use client";

import React from "react";
import Link from "next/link";
import { InventoryAlertSummary } from "./types";

interface InventoryAlertsCardProps {
  alerts: InventoryAlertSummary[];
  isLoading?: boolean;
}

export function InventoryAlertsCard({
  alerts,
  isLoading = false,
}: InventoryAlertsCardProps) {
  return (
    <div className="card shadow-sm border-0 h-100 bg-body">
      <div className="card-header bg-body border-bottom py-3 px-3 px-md-4 d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2">
          <div
            className="bg-warning-subtle text-warning rounded-2 d-flex align-items-center justify-content-center"
            style={{ width: "30px", height: "30px" }}
          >
            <i className="bi bi-shield-exclamation fs-6"></i>
          </div>
          <div>
            <h5 className="card-title mb-0 fw-semibold text-body" style={{ fontSize: "0.95rem" }}>
              Critical Inventory Watchlist
            </h5>
            <small className="text-secondary" style={{ fontSize: "0.75rem" }}>
              Items requiring replenishment or attention
            </small>
          </div>
        </div>

        <Link
          href="/inventory"
          className="btn btn-outline-warning btn-sm d-flex align-items-center gap-1"
          style={{ fontSize: "0.75rem" }}
        >
          <span>Inventory hub</span>
          <i className="bi bi-chevron-right"></i>
        </Link>
      </div>

      <div className="card-body p-3 p-md-4">
        {isLoading ? (
          <div className="d-flex align-items-center justify-content-center py-4">
            <div className="spinner-border text-warning spinner-border-sm me-2" role="status"></div>
            <span className="text-secondary small">Checking stock levels...</span>
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-4 text-success">
            <i className="bi bi-check-circle-fill fs-2 mb-2 d-block"></i>
            <p className="mb-0 fw-medium small">All catalog items are adequately stocked!</p>
            <small className="text-secondary">No low-stock or out-of-stock items detected.</small>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {alerts.map((item) => {
              const percent = Math.min(Math.round((item.quantity / Math.max(item.threshold, 1)) * 100), 100);

              return (
                <div
                  key={item.id}
                  className="p-2-5 rounded-2 border bg-body-tertiary transition-all"
                  style={{ fontSize: "0.8rem" }}
                >
                  <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                    <div className="text-truncate">
                      <div className="fw-medium text-body text-truncate" title={item.productTitle}>
                        {item.productTitle}
                      </div>
                      <div className="d-flex align-items-center gap-2 mt-1">
                        <span className="badge bg-secondary-subtle text-secondary font-monospace" style={{ fontSize: "0.68rem" }}>
                          {item.sku}
                        </span>
                        {item.categoryName && (
                          <small className="text-secondary" style={{ fontSize: "0.7rem" }}>
                            {item.categoryName}
                          </small>
                        )}
                      </div>
                    </div>

                    {item.isOutOfStock ? (
                      <span className="badge bg-danger text-white border border-danger flex-shrink-0" style={{ fontSize: "0.68rem" }}>
                        Out of Stock
                      </span>
                    ) : (
                      <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle flex-shrink-0" style={{ fontSize: "0.68rem" }}>
                        {item.quantity} left (Min: {item.threshold})
                      </span>
                    )}
                  </div>

                  {/* Stock Bar */}
                  <div className="d-flex align-items-center gap-2">
                    <div className="progress flex-grow-1" style={{ height: "6px" }}>
                      <div
                        className={`progress-bar rounded ${
                          item.isOutOfStock ? "bg-danger" : percent < 30 ? "bg-danger" : "bg-warning"
                        }`}
                        role="progressbar"
                        style={{ width: `${item.isOutOfStock ? 100 : percent}%` }}
                        aria-valuenow={percent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      ></div>
                    </div>
                    <span className="text-secondary small tabular-nums" style={{ fontSize: "0.7rem", minWidth: "35px", textAlign: "right" }}>
                      {item.isOutOfStock ? "0%" : `${percent}%`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="card-footer bg-body-tertiary border-top py-2 px-3 px-md-4 text-end">
        <Link
          href="/inventory"
          className="text-secondary text-decoration-none small d-inline-flex align-items-center gap-1"
          style={{ fontSize: "0.75rem" }}
        >
          <span>Batch stock adjustments</span>
          <i className="bi bi-arrow-right"></i>
        </Link>
      </div>
    </div>
  );
}
