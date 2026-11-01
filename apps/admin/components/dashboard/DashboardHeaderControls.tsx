"use client";

import React from "react";
import Link from "next/link";
import { TimeRange } from "./types";

interface DashboardHeaderControlsProps {
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  onRefresh: () => void;
  isLoading?: boolean;
  lastUpdated?: string;
  isFallback?: boolean;
}

export function DashboardHeaderControls({
  timeRange,
  onTimeRangeChange,
  onRefresh,
  isLoading = false,
  lastUpdated,
  isFallback = false,
}: DashboardHeaderControlsProps) {
  const timeRanges: { label: string; value: TimeRange }[] = [
    { label: "Today", value: "today" },
    { label: "7 Days", value: "7d" },
    { label: "30 Days", value: "30d" },
    { label: "90 Days", value: "90d" },
    { label: "All Time", value: "year" },
  ];

  return (
    <div className="card card-3d border-0 mb-3 animate-stagger-1">
      <div className="card-body p-3">
        <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
          {/* Left: Operational status banner */}
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <div className="d-flex align-items-center gap-2">
              <span className="pulse-indicator" aria-hidden="true"></span>
              <span className="fw-bold text-body" style={{ fontSize: "0.88rem", letterSpacing: "-0.01em" }}>
                Live Store Telemetry
              </span>
            </div>

            <div className="vr d-none d-sm-block text-secondary opacity-25" style={{ height: "16px" }}></div>

            {isFallback ? (
              <span
                className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle d-inline-flex align-items-center gap-1"
                style={{ fontSize: "0.72rem" }}
              >
                <i className="bi bi-info-circle-fill"></i>
                <span>Demo Data Mode (API Offline)</span>
              </span>
            ) : (
              <span
                className="badge bg-success-subtle text-success border border-success-subtle d-inline-flex align-items-center gap-1"
                style={{ fontSize: "0.72rem" }}
              >
                <i className="bi bi-check-circle-fill"></i>
                <span>Database Synchronized</span>
              </span>
            )}

            {lastUpdated && (
              <small className="text-secondary d-flex align-items-center gap-1" style={{ fontSize: "0.75rem" }}>
                <i className="bi bi-clock-history"></i>
                <span>Synced {lastUpdated}</span>
              </small>
            )}
          </div>

          {/* Right: Date interval buttons & Action controls */}
          <div className="d-flex align-items-center gap-2 flex-wrap">
            {/* 3D Recessed Filter Pill Track */}
            <div
              className="btn-group btn-group-sm p-1 bg-body-tertiary rounded-3 border"
              style={{ boxShadow: "var(--az-shadow-inset)" }}
              role="group"
              aria-label="Time period range"
            >
              {timeRanges.map((range) => {
                const isActive = timeRange === range.value;
                return (
                  <button
                    key={range.value}
                    type="button"
                    onClick={() => onTimeRangeChange(range.value)}
                    className={`btn btn-sm px-2-5 py-1 border-0 rounded-2 ${
                      isActive
                        ? "btn-primary fw-semibold text-white"
                        : "bg-transparent text-secondary"
                    }`}
                    style={{ fontSize: "0.75rem", padding: "0.28rem 0.65rem" }}
                  >
                    {range.label}
                  </button>
                );
              })}
            </div>

            {/* Refresh 3D Tile Button */}
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="btn tile-3d btn-sm d-flex align-items-center gap-1 px-2-5 py-1 text-body"
              title="Refresh dashboard metrics"
              aria-label="Refresh dashboard data"
              style={{ height: "32px" }}
            >
              <i className={`bi bi-arrow-clockwise ${isLoading ? "spin" : ""}`}></i>
              <span className="d-none d-sm-inline">Refresh</span>
            </button>

            {/* Quick Create Order CTA */}
            <Link
              href="/orders/create"
              className="btn btn-primary btn-sm d-flex align-items-center gap-1 px-2-5"
              style={{ height: "32px" }}
            >
              <i className="bi bi-cart-plus-fill"></i>
              <span>POS Order</span>
            </Link>
          </div>
        </div>
      </div>
      <style jsx>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
