"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  InventoryItem,
  getInventory,
  adjustStock,
} from "../../../services/inventory";

export default function StockAdjustmentsPage() {
  const router = useRouter();

  // Search & Variant selection
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchResults, setSearchResults] = useState<InventoryItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<InventoryItem | null>(null);

  // Form State
  const [actionType, setActionType] = useState<"RESTOCK" | "MANUAL_ADJUSTMENT" | "DAMAGED">("RESTOCK");
  const [quantityDelta, setQuantityDelta] = useState<number>(25);
  const [referenceId, setReferenceId] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Notification Banner
  const [alert, setAlert] = useState<{
    type: "success" | "danger" | "info";
    text: string;
  } | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Query variants for selector
  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setSearchResults([]);
      return;
    }

    async function search() {
      setSearching(true);
      try {
        const res = await getInventory({
          search: debouncedSearch,
          limit: 8,
        });
        setSearchResults(res.items);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }

    search();
  }, [debouncedSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariant) {
      setAlert({ type: "danger", text: "Please select a product variant to adjust." });
      return;
    }

    if (quantityDelta === 0) {
      setAlert({ type: "danger", text: "Quantity delta cannot be zero." });
      return;
    }

    setSubmitting(true);
    try {
      const updated = await adjustStock({
        variantId: selectedVariant.variantId,
        type: actionType,
        quantityChange: Number(quantityDelta),
        referenceId: referenceId.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setAlert({
        type: "success",
        text: `Stock successfully adjusted for SKU ${selectedVariant.sku}! New physical balance: ${updated.quantity} units.`,
      });

      // Update selected variant in view
      setSelectedVariant(updated);
      setReferenceId("");
      setNotes("");
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to commit stock adjustment",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const calculatedNewStock = selectedVariant
    ? selectedVariant.quantity + Number(quantityDelta || 0)
    : 0;

  return (
    <div className="container-fluid py-4" style={{ maxWidth: "1000px" }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="h4 mb-1 text-dark fw-bold">Record Stock Adjustment</h2>
          <p className="text-muted small mb-0">
            Log inventory replenishment, damaged goods write-offs, or physical warehouse cycle counts.
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link href="/inventory" className="btn btn-outline-secondary btn-sm">
            <i className="bi bi-arrow-left me-1"></i> Stock Overview
          </Link>
          <Link href="/inventory/movements" className="btn btn-outline-secondary btn-sm">
            <i className="bi bi-clock-history me-1"></i> Audit Ledger
          </Link>
        </div>
      </div>

      {/* Alert Notification */}
      {alert && (
        <div
          className={`alert alert-${alert.type} alert-dismissible fade show`}
          role="alert"
        >
          {alert.text}
          <button
            type="button"
            className="btn-close"
            onClick={() => setAlert(null)}
          ></button>
        </div>
      )}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-white py-3 border-0">
          <h5 className="card-title mb-0 fs-6 fw-bold text-dark">
            Step 1: Select Target Product SKU
          </h5>
        </div>
        <div className="card-body pt-0">
          <div className="input-group input-group-sm mb-2">
            <span className="input-group-text bg-white">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by SKU, product title, or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {searching && (
            <div className="text-muted small py-2">
              <div className="spinner-border spinner-border-sm me-2"></div>
              Searching inventory records...
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="list-group shadow-sm mb-3" style={{ maxHeight: "240px", overflowY: "auto" }}>
              {searchResults.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`list-group-item list-group-item-action text-start py-2 ${
                    selectedVariant?.id === item.id ? "active text-white" : ""
                  }`}
                  onClick={() => {
                    setSelectedVariant(item);
                    setSearchResults([]);
                    setSearchTerm("");
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <span className="fw-bold font-monospace me-2">{item.sku}</span>
                      <span className="small">{item.productTitle}</span>
                    </div>
                    <span className="badge bg-light text-dark border">
                      On-hand: {item.quantity} | Available: {item.availableQuantity}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selected Variant Display Card */}
          {selectedVariant ? (
            <div className="card bg-light border p-3 mt-3">
              <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                <div>
                  <span className="badge bg-primary me-2">Selected SKU</span>
                  <span className="fw-bold font-monospace fs-6 text-dark me-2">
                    {selectedVariant.sku}
                  </span>
                  <div className="text-dark fw-bold mt-1">
                    {selectedVariant.productTitle}
                  </div>
                  {selectedVariant.attributes.length > 0 && (
                    <div className="small text-muted mt-1">
                      {selectedVariant.attributes.map((a) => `${a.name}: ${a.value}`).join(", ")}
                    </div>
                  )}
                </div>
                <div className="text-end">
                  <div className="text-muted small">Current Warehouse State:</div>
                  <div className="small">
                    On-Hand: <strong className="fs-6">{selectedVariant.quantity}</strong> | Reserved:{" "}
                    <strong>{selectedVariant.reservedQuantity}</strong> | Available:{" "}
                    <strong className="text-success fs-6">{selectedVariant.availableQuantity}</strong>
                  </div>
                  <button
                    type="button"
                    className="btn btn-link btn-sm text-danger p-0 mt-1"
                    onClick={() => setSelectedVariant(null)}
                  >
                    Change selection
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-muted small p-3 bg-light rounded text-center border">
              No SKU selected. Use the search box above to pick a variant to adjust.
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Adjustment Details */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3 border-0">
          <h5 className="card-title mb-0 fs-6 fw-bold text-dark">
            Step 2: Enter Adjustment Details
          </h5>
        </div>
        <div className="card-body pt-0">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold">
                  Adjustment Reason / Action Type <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select form-select-sm"
                  value={actionType}
                  onChange={(e) => {
                    const val = e.target.value as "RESTOCK" | "MANUAL_ADJUSTMENT" | "DAMAGED";
                    setActionType(val);
                    if (val === "RESTOCK" && quantityDelta < 0) {
                      setQuantityDelta(Math.abs(quantityDelta) || 10);
                    } else if (val === "DAMAGED" && quantityDelta > 0) {
                      setQuantityDelta(-Math.abs(quantityDelta) || -1);
                    }
                  }}
                  required
                >
                  <option value="RESTOCK">Restock (Warehouse Replenishment: +)</option>
                  <option value="MANUAL_ADJUSTMENT">Manual Cycle Count Adjustment (Count Correction: +/-)</option>
                  <option value="DAMAGED">Damaged / Written-Off Goods (Shrinkage: -)</option>
                </select>
                <div className="form-text small">
                  {actionType === "RESTOCK" && "Adds incoming vendor stock to physical on-hand inventory."}
                  {actionType === "MANUAL_ADJUSTMENT" && "Corrects discrepancy between physical shelf count and system count."}
                  {actionType === "DAMAGED" && "Deducts ruined or lost inventory from sellable stock."}
                </div>
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold">
                  Quantity Delta <span className="text-danger">*</span>
                </label>
                <div className="input-group input-group-sm">
                  <input
                    type="number"
                    className="form-control"
                    value={quantityDelta}
                    onChange={(e) => setQuantityDelta(Number(e.target.value))}
                    required
                  />
                  <span className="input-group-text bg-light text-muted">units</span>
                </div>
                {selectedVariant && (
                  <div className="form-text small mt-1">
                    Projected Physical Balance:{" "}
                    <strong
                      className={
                        calculatedNewStock < 0
                          ? "text-danger"
                          : calculatedNewStock < selectedVariant.reservedQuantity
                          ? "text-warning"
                          : "text-primary"
                      }
                    >
                      {calculatedNewStock} units
                    </strong>
                    {calculatedNewStock < 0 && " (Error: Balance cannot be negative)"}
                    {calculatedNewStock >= 0 &&
                      calculatedNewStock < selectedVariant.reservedQuantity &&
                      " (Error: Below committed reserved quantity)"}
                  </div>
                )}
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold">Reference Number (Optional)</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="e.g. PO-2026-880, AUDIT-2026-10"
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                />
                <div className="form-text small">
                  Purchase order, consignment receipt, or cycle count code.
                </div>
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold">Audit Notes</label>
                <textarea
                  className="form-control form-control-sm"
                  rows={2}
                  placeholder="Describe the context for this adjustment..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
              </div>

              <div className="col-12 text-end mt-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm me-2"
                  onClick={() => router.push("/inventory")}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm px-4"
                  disabled={
                    submitting ||
                    !selectedVariant ||
                    quantityDelta === 0 ||
                    calculatedNewStock < 0 ||
                    calculatedNewStock < (selectedVariant?.reservedQuantity || 0)
                  }
                >
                  {submitting ? "Committing Adjustment..." : "Commit Stock Adjustment"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
