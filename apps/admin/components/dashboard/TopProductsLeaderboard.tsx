"use client";

import React from "react";
import Link from "next/link";
import { TopProductSummary } from "./types";

interface TopProductsLeaderboardProps {
  products: TopProductSummary[];
  currency?: string;
  isLoading?: boolean;
}

export function TopProductsLeaderboard({
  products,
  currency = "৳",
  isLoading = false,
}: TopProductsLeaderboardProps) {
  const maxRevenue = Math.max(...products.map((p) => p.revenue), 1);

  return (
    <div className="card shadow-sm border-0 h-100 bg-body">
      <div className="card-header bg-body border-bottom py-3 px-3 px-md-4 d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2">
          <div
            className="bg-primary-subtle text-primary rounded-2 d-flex align-items-center justify-content-center"
            style={{ width: "30px", height: "30px" }}
          >
            <i className="bi bi-trophy fs-6"></i>
          </div>
          <div>
            <h5 className="card-title mb-0 fw-semibold text-body" style={{ fontSize: "0.95rem" }}>
              Top-Selling Products
            </h5>
            <small className="text-secondary" style={{ fontSize: "0.75rem" }}>
              Ranked by revenue contribution & unit volume
            </small>
          </div>
        </div>

        <Link
          href="/products"
          className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
          style={{ fontSize: "0.75rem" }}
        >
          <span>Catalog</span>
          <i className="bi bi-chevron-right"></i>
        </Link>
      </div>

      <div className="card-body p-3 p-md-4">
        {isLoading ? (
          <div className="d-flex align-items-center justify-content-center py-4">
            <div className="spinner-border text-primary spinner-border-sm me-2" role="status"></div>
            <span className="text-secondary small">Calculating rankings...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-4 text-secondary">
            <i className="bi bi-tag fs-2 mb-2 d-block"></i>
            <p className="mb-0 small">No product sales recorded yet</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {products.map((product, idx) => {
              const rank = idx + 1;
              const ratio = Math.round((product.revenue / maxRevenue) * 100);

              return (
                <div key={product.id} className="d-flex flex-column gap-1">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2 text-truncate pe-2">
                      <span
                        className={`badge rounded-pill ${
                          rank === 1
                            ? "bg-warning text-dark fw-bold"
                            : rank === 2
                            ? "bg-secondary-subtle text-secondary fw-semibold"
                            : rank === 3
                            ? "bg-primary-subtle text-primary fw-semibold"
                            : "bg-light text-secondary border"
                        }`}
                        style={{ width: "22px", height: "22px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.68rem" }}
                      >
                        {rank}
                      </span>
                      <div className="text-truncate">
                        <Link
                          href={`/products`}
                          className="fw-medium text-body text-decoration-none text-truncate d-block small"
                          title={product.title}
                        >
                          {product.title}
                        </Link>
                        <small className="text-secondary" style={{ fontSize: "0.7rem" }}>
                          {product.categoryName} • <span className="font-monospace">{product.sku}</span>
                        </small>
                      </div>
                    </div>

                    <div className="text-end flex-shrink-0">
                      <div className="fw-semibold text-body tabular-nums small">
                        {currency} {product.revenue.toLocaleString()}
                      </div>
                      <small className="text-secondary" style={{ fontSize: "0.68rem" }}>
                        {product.unitsSold.toLocaleString()} sold
                      </small>
                    </div>
                  </div>

                  {/* Relative Sales Bar */}
                  <div className="progress mt-1" style={{ height: "4px" }}>
                    <div
                      className="progress-bar bg-primary rounded"
                      role="progressbar"
                      style={{ width: `${ratio}%` }}
                      aria-valuenow={ratio}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card-footer bg-body-tertiary border-top py-2 px-3 px-md-4 text-end">
        <Link
          href="/reports"
          className="text-secondary text-decoration-none small d-inline-flex align-items-center gap-1"
          style={{ fontSize: "0.75rem" }}
        >
          <span>Detailed sales metrics</span>
          <i className="bi bi-arrow-right"></i>
        </Link>
      </div>
    </div>
  );
}
