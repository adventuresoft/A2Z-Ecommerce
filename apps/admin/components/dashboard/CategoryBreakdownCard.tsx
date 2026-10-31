"use client";

import React, { useState } from "react";
import { CategoryBreakdown, PaymentBreakdown } from "./types";

interface CategoryBreakdownCardProps {
  categories: CategoryBreakdown[];
  payments: PaymentBreakdown[];
  currency?: string;
  isLoading?: boolean;
}

export function CategoryBreakdownCard({
  categories,
  payments,
  currency = "৳",
  isLoading = false,
}: CategoryBreakdownCardProps) {
  const [activeTab, setActiveTab] = useState<"category" | "payment">("category");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const items = activeTab === "category" ? categories : payments;
  const totalAmount = items.reduce((sum, item) => sum + item.revenue, 0);

  // SVG Donut calculations
  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Compute accumulated stroke offsets for donut segments without mutating external variables
  const segments = items.reduce<
    Array<(typeof items)[0] & { idx: number; strokeDasharray: string; strokeDashoffset: number }>
  >((acc, item, idx) => {
    const prevPercent = items.slice(0, idx).reduce((sum, prev) => sum + prev.percentage, 0);
    const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((prevPercent / 100) * circumference);
    acc.push({
      ...item,
      idx,
      strokeDasharray,
      strokeDashoffset,
    });
    return acc;
  }, []);

  return (
    <div className="card shadow-sm border-0 h-100 bg-body">
      <div className="card-header bg-body border-bottom py-3 px-3 px-md-4 d-flex align-items-center justify-content-between">
        <div>
          <h5 className="card-title mb-0 fw-semibold text-body" style={{ fontSize: "0.95rem" }}>
            Revenue Breakdown
          </h5>
          <small className="text-secondary" style={{ fontSize: "0.75rem" }}>
            Channel & category contribution
          </small>
        </div>

        {/* Tab switchers */}
        <div className="btn-group btn-group-sm bg-body-tertiary rounded-3 border p-1" role="group" aria-label="Breakdown view">
          <button
            type="button"
            onClick={() => {
              setActiveTab("category");
              setHoveredIdx(null);
            }}
            className={`btn btn-sm px-2 py-1 border-0 ${
              activeTab === "category"
                ? "btn-primary shadow-sm text-white fw-medium"
                : "btn-light text-secondary"
            }`}
            style={{ fontSize: "0.72rem" }}
          >
            Categories
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("payment");
              setHoveredIdx(null);
            }}
            className={`btn btn-sm px-2 py-1 border-0 ${
              activeTab === "payment"
                ? "btn-primary shadow-sm text-white fw-medium"
                : "btn-light text-secondary"
            }`}
            style={{ fontSize: "0.72rem" }}
          >
            Payments
          </button>
        </div>
      </div>

      <div className="card-body p-3 p-md-4 d-flex flex-column justify-content-between">
        {isLoading ? (
          <div className="d-flex align-items-center justify-content-center py-5">
            <div className="spinner-border text-primary spinner-border-sm me-2" role="status"></div>
            <span className="text-secondary small">Loading breakdown...</span>
          </div>
        ) : (
          <>
            {/* Center Donut Graphic */}
            <div className="d-flex justify-content-center align-items-center my-2 position-relative">
              <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke="var(--bs-border-color)"
                  strokeWidth={strokeWidth}
                  opacity="0.25"
                />
                {segments.map((seg) => {
                  const isHovered = hoveredIdx === seg.idx;
                  return (
                    <circle
                      key={seg.idx}
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                      strokeDasharray={seg.strokeDasharray}
                      strokeDashoffset={seg.strokeDashoffset}
                      style={{
                        transform: "rotate(-90deg)",
                        transformOrigin: "center",
                        transition: "stroke-width 0.2s ease",
                        cursor: "pointer",
                      }}
                      onMouseEnter={() => setHoveredIdx(seg.idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                    />
                  );
                })}
              </svg>

              {/* Donut Center Display */}
              <div
                className="position-absolute text-center d-flex flex-column align-items-center justify-content-center"
                style={{ width: "90px", height: "90px", pointerEvents: "none" }}
              >
                <small className="text-secondary text-uppercase fw-semibold" style={{ fontSize: "0.62rem" }}>
                  {hoveredIdx !== null ? "Segment" : "Total"}
                </small>
                <span className="fw-bold text-body tabular-nums" style={{ fontSize: "0.85rem" }}>
                  {currency}{" "}
                  {hoveredIdx !== null
                    ? items[hoveredIdx].revenue.toLocaleString()
                    : totalAmount.toLocaleString()}
                </span>
                <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: "0.6rem" }}>
                  {hoveredIdx !== null ? `${items[hoveredIdx].percentage}%` : "100%"}
                </span>
              </div>
            </div>

            {/* List with Progress Bars */}
            <div className="d-flex flex-column gap-2 mt-3">
              {items.map((item, idx) => {
                const label = "categoryName" in item ? item.categoryName : item.label;
                const isHovered = hoveredIdx === idx;
                return (
                  <div
                    key={idx}
                    className={`p-2 rounded-2 transition-all ${
                      isHovered ? "bg-body-secondary" : "hover-bg-body-tertiary"
                    }`}
                    style={{ cursor: "pointer", transition: "background-color 0.15s ease" }}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <div className="d-flex align-items-center gap-2">
                        <span
                          className="rounded-circle"
                          style={{
                            width: "8px",
                            height: "8px",
                            backgroundColor: item.color,
                            flexShrink: 0,
                          }}
                        ></span>
                        <span className="text-body small fw-medium text-truncate" style={{ maxWidth: "160px" }}>
                          {label}
                        </span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span className="text-body fw-semibold tabular-nums small">
                          {currency} {item.revenue.toLocaleString()}
                        </span>
                        <span className="badge bg-light text-secondary border tabular-nums" style={{ fontSize: "0.68rem" }}>
                          {item.percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Progress track */}
                    <div className="progress" style={{ height: "4px" }}>
                      <div
                        className="progress-bar rounded"
                        role="progressbar"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.color,
                        }}
                        aria-valuenow={item.percentage}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
