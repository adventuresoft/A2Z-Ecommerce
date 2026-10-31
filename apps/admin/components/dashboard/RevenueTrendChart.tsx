"use client";

import React, { useState, useId } from "react";
import { TimelinePoint } from "./types";

interface RevenueTrendChartProps {
  data: TimelinePoint[];
  currency?: string;
  isLoading?: boolean;
}

export function RevenueTrendChart({
  data,
  currency = "৳",
  isLoading = false,
}: RevenueTrendChartProps) {
  const [metricMode, setMetricMode] = useState<"revenue" | "orders">("revenue");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showDataTable, setShowDataTable] = useState(false);
  const gradId = useId();

  // If no data, use empty array
  const points = data && data.length > 0 ? data : [];

  // Chart dimensions & padding
  const svgWidth = 760;
  const svgHeight = 260;
  const padLeft = 65;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 40;

  const chartWidth = svgWidth - padLeft - padRight;
  const chartHeight = svgHeight - padTop - padBottom;

  // Compute values
  const values = points.map((p) =>
    metricMode === "revenue" ? p.grossSales : p.orderCount
  );
  const maxVal = Math.max(...values, 1) * 1.15; // 15% head room
  const minVal = 0;

  // Coordinate mapping helper
  const getX = (index: number) => {
    if (points.length <= 1) return padLeft + chartWidth / 2;
    return padLeft + (index / (points.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    const ratio = (val - minVal) / (maxVal - minVal);
    return padTop + chartHeight - ratio * chartHeight;
  };

  // Build SVG Path with smooth curves
  const coords = points.map((p, idx) => ({
    x: getX(idx),
    y: getY(metricMode === "revenue" ? p.grossSales : p.orderCount),
  }));

  // Generate smooth cubic bezier SVG path
  let pathD = "";
  if (coords.length > 0) {
    pathD = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i === 0 ? i : i - 1];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = coords[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
  }

  // Area path (closed at the bottom)
  const areaD =
    coords.length > 0
      ? `${pathD} L ${coords[coords.length - 1].x} ${padTop + chartHeight} L ${
          coords[0].x
        } ${padTop + chartHeight} Z`
      : "";

  // Compute aggregate statistics
  const totalGross = points.reduce((sum, p) => sum + p.grossSales, 0);
  const totalOrders = points.reduce((sum, p) => sum + p.orderCount, 0);
  const peakPoint = [...points].sort((a, b) => b.grossSales - a.grossSales)[0];
  const avgSales = points.length ? Math.round(totalGross / points.length) : 0;

  const activePoint = hoveredIndex !== null ? points[hoveredIndex] : null;

  return (
    <div className="card shadow-sm border-0 h-100 bg-body">
      {/* Chart Header */}
      <div className="card-header bg-body border-bottom py-3 px-3 px-md-4 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h5 className="card-title mb-0 fw-semibold text-body" style={{ fontSize: "0.95rem" }}>
              Sales & Order Performance Timeline
            </h5>
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle" style={{ fontSize: "0.68rem" }}>
              Interactive Telemetry
            </span>
          </div>
          <small className="text-secondary" style={{ fontSize: "0.75rem" }}>
            Track revenue progression and order volume trends across selected period
          </small>
        </div>

        {/* Chart View Toggles & A11y Table Button */}
        <div className="d-flex align-items-center gap-2">
          <div className="btn-group btn-group-sm bg-body-tertiary rounded-3 border p-1" role="group" aria-label="Metric toggle">
            <button
              type="button"
              onClick={() => setMetricMode("revenue")}
              className={`btn btn-sm px-2 py-1 border-0 ${
                metricMode === "revenue"
                  ? "btn-primary shadow-sm text-white fw-medium"
                  : "btn-light text-secondary"
              }`}
              style={{ fontSize: "0.75rem" }}
            >
              <i className="bi bi-currency-dollar me-1"></i>
              Revenue ({currency})
            </button>
            <button
              type="button"
              onClick={() => setMetricMode("orders")}
              className={`btn btn-sm px-2 py-1 border-0 ${
                metricMode === "orders"
                  ? "btn-primary shadow-sm text-white fw-medium"
                  : "btn-light text-secondary"
              }`}
              style={{ fontSize: "0.75rem" }}
            >
              <i className="bi bi-cart3 me-1"></i>
              Order Volume
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowDataTable(!showDataTable)}
            className="btn btn-outline-secondary btn-sm px-2 py-1"
            title="Toggle Accessible Data Table"
            aria-expanded={showDataTable}
            style={{ fontSize: "0.75rem" }}
          >
            <i className={`bi ${showDataTable ? "bi-graph-up" : "bi-table"}`}></i>
          </button>
        </div>
      </div>

      {/* Chart Canvas Body */}
      <div className="card-body p-3 p-md-4 position-relative">
        {isLoading && (
          <div className="position-absolute top-0 start-0 w-100 h-100 bg-body bg-opacity-75 d-flex align-items-center justify-content-center" style={{ zIndex: 10 }}>
            <div className="spinner-border text-primary spinner-border-sm me-2" role="status"></div>
            <small className="text-secondary">Loading telemetry...</small>
          </div>
        )}

        {showDataTable ? (
          /* Accessible Data Table View */
          <div className="table-responsive" style={{ maxHeight: "260px" }}>
            <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: "0.8rem" }}>
              <thead className="table-light">
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col" className="text-end">Gross Sales</th>
                  <th scope="col" className="text-end">Net Sales</th>
                  <th scope="col" className="text-end">Orders</th>
                  <th scope="col" className="text-end">Items Sold</th>
                </tr>
              </thead>
              <tbody>
                {points.map((p, i) => (
                  <tr key={i}>
                    <td className="fw-medium">{p.date} ({p.label})</td>
                    <td className="text-end tabular-nums text-primary fw-semibold">{currency} {p.grossSales.toLocaleString()}</td>
                    <td className="text-end tabular-nums">{currency} {p.netSales.toLocaleString()}</td>
                    <td className="text-end tabular-nums">{p.orderCount}</td>
                    <td className="text-end tabular-nums">{p.itemsSold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Interactive Responsive SVG Area Chart */
          <div className="position-relative w-100" style={{ minHeight: "260px" }}>
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-100 h-auto d-block"
              style={{ overflow: "visible" }}
              aria-label="Interactive sales and order trend chart"
            >
              <defs>
                <linearGradient id={`revGrad-${gradId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
                  <stop offset="90%" stopColor="#3B82F6" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id={`orderGrad-${gradId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                  <stop offset="90%" stopColor="#10B981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Reference Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const yPos = padTop + chartHeight * (1 - ratio);
                const displayVal = Math.round(minVal + ratio * (maxVal - minVal));
                return (
                  <g key={i}>
                    <line
                      x1={padLeft}
                      y1={yPos}
                      x2={svgWidth - padRight}
                      y2={yPos}
                      className="chart-grid-line"
                    />
                    <text
                      x={padLeft - 10}
                      y={yPos + 4}
                      textAnchor="end"
                      className="chart-axis-text"
                    >
                      {metricMode === "revenue"
                        ? `${currency}${displayVal >= 1000 ? `${Math.round(displayVal / 1000)}k` : displayVal}`
                        : displayVal}
                    </text>
                  </g>
                );
              })}

              {/* Area Gradient Fill */}
              {areaD && (
                <path
                  d={areaD}
                  fill={metricMode === "revenue" ? `url(#revGrad-${gradId})` : `url(#orderGrad-${gradId})`}
                />
              )}

              {/* Main Trend Line */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke={metricMode === "revenue" ? "#3B82F6" : "#10B981"}
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* X Axis Labels & Interactive Target Columns */}
              {points.map((p, idx) => {
                const cx = getX(idx);
                const cy = getY(metricMode === "revenue" ? p.grossSales : p.orderCount);
                const isHovered = hoveredIndex === idx;

                return (
                  <g key={idx}>
                    {/* X Axis Label */}
                    <text
                      x={cx}
                      y={svgHeight - 12}
                      textAnchor="middle"
                      className="chart-axis-text fw-medium"
                      style={{ fill: isHovered ? "var(--bs-primary)" : "var(--bs-secondary-color)" }}
                    >
                      {p.label}
                    </text>

                    {/* Vertical guideline on hover */}
                    {isHovered && (
                      <line
                        x1={cx}
                        y1={padTop}
                        x2={cx}
                        y2={padTop + chartHeight}
                        stroke="#3B82F6"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                        opacity="0.8"
                      />
                    )}

                    {/* Data Point Dot */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? "6" : "3.5"}
                      fill={isHovered ? "#3B82F6" : "var(--bs-body-bg)"}
                      stroke={metricMode === "revenue" ? "#3B82F6" : "#10B981"}
                      strokeWidth={isHovered ? "2.5" : "2"}
                      style={{ transition: "r 0.15s ease" }}
                    />

                    {/* Invisible Wide Hit Area for Mouse Hover */}
                    <rect
                      x={cx - chartWidth / (points.length * 2)}
                      y={padTop}
                      width={chartWidth / points.length}
                      height={chartHeight}
                      fill="transparent"
                      style={{ cursor: "pointer" }}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Floating Interactive Tooltip */}
            {activePoint && hoveredIndex !== null && (
              <div
                className="chart-tooltip p-2 position-absolute"
                style={{
                  left: `${Math.min(Math.max(getX(hoveredIndex) - 90, 10), svgWidth - 190)}px`,
                  top: "10px",
                  minWidth: "180px",
                }}
              >
                <div className="d-flex align-items-center justify-content-between mb-1 pb-1 border-bottom">
                  <span className="fw-semibold text-body small">{activePoint.date}</span>
                  <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: "0.65rem" }}>
                    {activePoint.label}
                  </span>
                </div>
                <div className="d-flex justify-content-between small text-secondary">
                  <span>Gross Sales:</span>
                  <span className="fw-bold text-primary tabular-nums">
                    {currency} {activePoint.grossSales.toLocaleString()}
                  </span>
                </div>
                <div className="d-flex justify-content-between small text-secondary">
                  <span>Net Sales:</span>
                  <span className="fw-medium text-body tabular-nums">
                    {currency} {activePoint.netSales.toLocaleString()}
                  </span>
                </div>
                <div className="d-flex justify-content-between small text-secondary">
                  <span>Orders:</span>
                  <span className="fw-semibold text-success tabular-nums">
                    {activePoint.orderCount} orders
                  </span>
                </div>
                <div className="d-flex justify-content-between small text-secondary">
                  <span>Items Sold:</span>
                  <span className="fw-medium text-body tabular-nums">
                    {activePoint.itemsSold} units
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary Telemetry Strip Footer */}
      <div className="card-footer bg-body-tertiary border-top py-2 px-3 px-md-4">
        <div className="row g-2 text-center text-sm-start">
          <div className="col-6 col-sm-3">
            <span className="text-secondary" style={{ fontSize: "0.7rem" }}>Period Gross</span>
            <div className="fw-bold text-body tabular-nums" style={{ fontSize: "0.85rem" }}>
              {currency} {totalGross.toLocaleString()}
            </div>
          </div>
          <div className="col-6 col-sm-3">
            <span className="text-secondary" style={{ fontSize: "0.7rem" }}>Peak Volume Day</span>
            <div className="fw-semibold text-primary tabular-nums" style={{ fontSize: "0.85rem" }}>
              {peakPoint ? `${peakPoint.label} (${currency}${peakPoint.grossSales.toLocaleString()})` : "—"}
            </div>
          </div>
          <div className="col-6 col-sm-3">
            <span className="text-secondary" style={{ fontSize: "0.7rem" }}>Average Daily Sales</span>
            <div className="fw-semibold text-body tabular-nums" style={{ fontSize: "0.85rem" }}>
              {currency} {avgSales.toLocaleString()}
            </div>
          </div>
          <div className="col-6 col-sm-3">
            <span className="text-secondary" style={{ fontSize: "0.7rem" }}>Total Completed Units</span>
            <div className="fw-semibold text-success tabular-nums" style={{ fontSize: "0.85rem" }}>
              {totalOrders.toLocaleString()} Orders
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
