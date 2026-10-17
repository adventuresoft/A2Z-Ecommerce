"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ShippingMethod,
  ShippingZone,
  getShippingMethods,
  getShippingZones,
  createShippingMethod,
  updateShippingMethod,
  deleteShippingMethod,
} from "../../../services/shipments";

export default function ShippingMethodsPage() {
  const searchParams = useSearchParams();
  const initialZoneId = searchParams.get("zoneId") || "";

  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [selectedZoneFilter, setSelectedZoneFilter] = useState(initialZoneId);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);
  const [zoneId, setZoneId] = useState("");
  const [name, setName] = useState("");
  const [cost, setCost] = useState<number>(60);
  const [estimatedDays, setEstimatedDays] = useState<number>(3);
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  // Alert
  const [alert, setAlert] = useState<{
    type: "success" | "danger";
    text: string;
  } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [methodsData, zonesData] = await Promise.all([
        getShippingMethods(selectedZoneFilter || undefined),
        getShippingZones(),
      ]);
      setMethods(methodsData);
      setZones(zonesData);
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to load shipping methods",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedZoneFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreateModal = () => {
    setEditingMethod(null);
    setZoneId(selectedZoneFilter || (zones.length > 0 ? zones[0].id : ""));
    setName("");
    setCost(60);
    setEstimatedDays(3);
    setIsActive(true);
    setSortOrder(0);
    setShowModal(true);
  };

  const handleOpenEditModal = (method: ShippingMethod) => {
    setEditingMethod(method);
    setZoneId(method.zoneId);
    setName(method.name);
    setCost(method.cost);
    setEstimatedDays(method.estimatedDays);
    setIsActive(method.isActive);
    setSortOrder(method.sortOrder);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneId) {
      setAlert({ type: "danger", text: "Please select a shipping zone." });
      return;
    }

    setSaving(true);
    try {
      if (editingMethod) {
        await updateShippingMethod(editingMethod.id, {
          zoneId,
          name: name.trim(),
          cost: Number(cost),
          estimatedDays: Number(estimatedDays) || 3,
          isActive,
          sortOrder: Number(sortOrder) || 0,
        });
        setAlert({ type: "success", text: "Shipping method updated successfully" });
      } else {
        await createShippingMethod({
          zoneId,
          name: name.trim(),
          cost: Number(cost),
          estimatedDays: Number(estimatedDays) || 3,
          isActive,
          sortOrder: Number(sortOrder) || 0,
        });
        setAlert({ type: "success", text: "Shipping method created successfully" });
      }
      setShowModal(false);
      loadData();
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to save shipping method",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (method: ShippingMethod) => {
    if (!confirm(`Are you sure you want to delete shipping method "${method.name}"?`)) {
      return;
    }

    try {
      await deleteShippingMethod(method.id);
      setAlert({ type: "success", text: `Method "${method.name}" deleted successfully` });
      loadData();
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to delete method",
      });
    }
  };

  return (
    <div className="container-fluid px-4 py-3">
      {/* Header */}
      <div className="row mb-3 align-items-center">
        <div className="col-sm-6">
          <h1 className="m-0 fs-3 fw-bold text-dark">
            <i className="bi bi-gear-wide me-2 text-primary"></i>
            Shipping Methods & Rate Cards
          </h1>
          <p className="text-muted small m-0">
            Configure delivery fees, transit estimates, and carrier options by zone
          </p>
        </div>
        <div className="col-sm-6 text-sm-end mt-2 mt-sm-0">
          <Link href="/shipping/shipments" className="btn btn-outline-secondary btn-sm me-2">
            <i className="bi bi-box me-1"></i> Shipments
          </Link>
          <Link href="/shipping/zones" className="btn btn-outline-secondary btn-sm me-2">
            <i className="bi bi-geo-alt me-1"></i> Delivery Zones
          </Link>
          <button className="btn btn-primary btn-sm" onClick={handleOpenCreateModal}>
            <i className="bi bi-plus-lg me-1"></i> Add Method
          </button>
        </div>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show shadow-sm mb-4`} role="alert">
          {alert.text}
          <button type="button" className="btn-close" onClick={() => setAlert(null)}></button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-center">
            <div className="col-md-4">
              <label className="form-label small fw-semibold text-muted mb-1">Filter by Geographic Zone</label>
              <select
                className="form-select form-select-sm"
                value={selectedZoneFilter}
                onChange={(e) => setSelectedZoneFilter(e.target.value)}
              >
                <option value="">All Shipping Zones</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>
            {selectedZoneFilter && (
              <div className="col-md-2 mt-md-4">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setSelectedZoneFilter("")}
                >
                  <i className="bi bi-x-circle me-1"></i> Clear Filter
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Methods Table */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light text-muted small text-uppercase">
                <tr>
                  <th className="ps-3 py-3">Method Name</th>
                  <th className="py-3">Zone</th>
                  <th className="py-3">Delivery Fee</th>
                  <th className="py-3">Estimated Days</th>
                  <th className="py-3">Sort Order</th>
                  <th className="py-3">Status</th>
                  <th className="pe-3 py-3 text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5 text-muted">
                      <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                      Loading shipping methods...
                    </td>
                  </tr>
                ) : methods.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5 text-muted">
                      <i className="bi bi-truck display-6 text-muted d-block mb-2"></i>
                      No shipping methods configured yet. Click &quot;Add Method&quot; to create one.
                    </td>
                  </tr>
                ) : (
                  methods.map((m) => (
                    <tr key={m.id}>
                      <td className="ps-3">
                        <span className="fw-bold text-dark">{m.name}</span>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border px-2 py-1">
                          <i className="bi bi-geo-alt me-1 text-primary"></i>
                          {m.zoneName || "Zone"}
                        </span>
                      </td>
                      <td>
                        <span className="fw-bold fs-6 text-success">
                          ৳ {m.cost.toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <span className="small text-muted">
                          <i className="bi bi-clock me-1"></i>
                          {m.estimatedDays} {m.estimatedDays === 1 ? "day" : "days"}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">{m.sortOrder}</span>
                      </td>
                      <td>
                        {m.isActive ? (
                          <span className="badge bg-success">Active</span>
                        ) : (
                          <span className="badge bg-secondary">Inactive</span>
                        )}
                      </td>
                      <td className="pe-3 text-end">
                        <button
                          className="btn btn-outline-primary btn-sm me-2"
                          onClick={() => handleOpenEditModal(m)}
                          title="Edit Method"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleDelete(m)}
                          title="Delete Method"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  {editingMethod ? `Edit Method: ${editingMethod.name}` : "Create Shipping Method"}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Target Shipping Zone *</label>
                    <select
                      className="form-select form-select-sm"
                      value={zoneId}
                      onChange={(e) => setZoneId(e.target.value)}
                      required
                    >
                      <option value="">Select a zone...</option>
                      {zones.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Method Name *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. Standard Courier Delivery"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Delivery Fee (BDT) *</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={cost}
                        onChange={(e) => setCost(Number(e.target.value))}
                        min={0}
                        step="0.5"
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Estimated Days</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={estimatedDays}
                        onChange={(e) => setEstimatedDays(Number(e.target.value))}
                        min={1}
                        required
                      />
                    </div>
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Sort Order</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(Number(e.target.value))}
                        min={0}
                      />
                    </div>
                    <div className="col-6 d-flex align-items-end">
                      <div className="form-check form-switch mb-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="methodActiveSwitch"
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                        />
                        <label className="form-check-label small fw-semibold" htmlFor="methodActiveSwitch">
                          Active Method
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowModal(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                    {saving ? "Saving..." : editingMethod ? "Update Method" : "Create Method"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
