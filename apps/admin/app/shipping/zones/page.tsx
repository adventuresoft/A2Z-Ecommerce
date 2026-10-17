"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShippingZone,
  getShippingZones,
  createShippingZone,
  updateShippingZone,
  deleteShippingZone,
} from "../../../services/shipments";

export default function ShippingZonesPage() {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  // Alert
  const [alert, setAlert] = useState<{
    type: "success" | "danger";
    text: string;
  } | null>(null);

  const loadZones = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getShippingZones();
      setZones(data);
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to load shipping zones",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadZones();
  }, [loadZones]);

  const handleOpenCreateModal = () => {
    setEditingZone(null);
    setName("");
    setDescription("");
    setIsActive(true);
    setSortOrder(0);
    setShowModal(true);
  };

  const handleOpenEditModal = (zone: ShippingZone) => {
    setEditingZone(zone);
    setName(zone.name);
    setDescription(zone.description || "");
    setIsActive(zone.isActive);
    setSortOrder(zone.sortOrder);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingZone) {
        await updateShippingZone(editingZone.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          isActive,
          sortOrder: Number(sortOrder) || 0,
        });
        setAlert({ type: "success", text: "Shipping zone updated successfully" });
      } else {
        await createShippingZone({
          name: name.trim(),
          description: description.trim() || undefined,
          isActive,
          sortOrder: Number(sortOrder) || 0,
        });
        setAlert({ type: "success", text: "Shipping zone created successfully" });
      }
      setShowModal(false);
      loadZones();
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to save shipping zone",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (zone: ShippingZone) => {
    if (
      !confirm(
        `Are you sure you want to delete zone "${zone.name}" and all its delivery methods?`,
      )
    ) {
      return;
    }

    try {
      await deleteShippingZone(zone.id);
      setAlert({ type: "success", text: `Zone "${zone.name}" deleted successfully` });
      loadZones();
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to delete zone",
      });
    }
  };

  return (
    <div className="container-fluid px-4 py-3">
      {/* Header */}
      <div className="row mb-3 align-items-center">
        <div className="col-sm-6">
          <h1 className="m-0 fs-3 fw-bold text-dark">
            <i className="bi bi-geo-alt me-2 text-primary"></i>
            Delivery Zones
          </h1>
          <p className="text-muted small m-0">
            Define regional tiers (e.g. Inside Dhaka, Outside Dhaka) for delivery charges
          </p>
        </div>
        <div className="col-sm-6 text-sm-end mt-2 mt-sm-0">
          <Link href="/shipping/shipments" className="btn btn-outline-secondary btn-sm me-2">
            <i className="bi bi-box me-1"></i> Shipments
          </Link>
          <Link href="/shipping/methods" className="btn btn-outline-secondary btn-sm me-2">
            <i className="bi bi-gear-wide me-1"></i> Rate Cards
          </Link>
          <button className="btn btn-primary btn-sm" onClick={handleOpenCreateModal}>
            <i className="bi bi-plus-lg me-1"></i> Add Zone
          </button>
        </div>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show shadow-sm mb-4`} role="alert">
          {alert.text}
          <button type="button" className="btn-close" onClick={() => setAlert(null)}></button>
        </div>
      )}

      {/* Zones Table */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light text-muted small text-uppercase">
                <tr>
                  <th className="ps-3 py-3">Zone Name</th>
                  <th className="py-3">Description</th>
                  <th className="py-3">Methods</th>
                  <th className="py-3">Sort Order</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Created</th>
                  <th className="pe-3 py-3 text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5 text-muted">
                      <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                      Loading shipping zones...
                    </td>
                  </tr>
                ) : zones.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5 text-muted">
                      <i className="bi bi-geo display-6 text-muted d-block mb-2"></i>
                      No shipping zones configured yet. Click &quot;Add Zone&quot; to create one.
                    </td>
                  </tr>
                ) : (
                  zones.map((zone) => (
                    <tr key={zone.id}>
                      <td className="ps-3">
                        <span className="fw-bold text-dark">{zone.name}</span>
                      </td>
                      <td className="text-muted small">
                        {zone.description || <span className="fst-italic text-muted">No description</span>}
                      </td>
                      <td>
                        <Link
                          href={`/shipping/methods?zoneId=${zone.id}`}
                          className="badge bg-light text-dark border text-decoration-none px-2 py-1"
                        >
                          <i className="bi bi-gear me-1 text-primary"></i>
                          {zone.methodsCount || 0} methods
                        </Link>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">{zone.sortOrder}</span>
                      </td>
                      <td>
                        {zone.isActive ? (
                          <span className="badge bg-success">Active</span>
                        ) : (
                          <span className="badge bg-secondary">Inactive</span>
                        )}
                      </td>
                      <td className="small text-muted">
                        {new Date(zone.createdAt).toLocaleDateString()}
                      </td>
                      <td className="pe-3 text-end">
                        <button
                          className="btn btn-outline-primary btn-sm me-2"
                          onClick={() => handleOpenEditModal(zone)}
                          title="Edit Zone"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleDelete(zone)}
                          title="Delete Zone"
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
                  {editingZone ? `Edit Zone: ${editingZone.name}` : "Create Delivery Zone"}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Zone Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Inside Dhaka"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Description</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="e.g. Metropolitan areas within Dhaka district"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    ></textarea>
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Sort Order</label>
                      <input
                        type="number"
                        className="form-control"
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
                          id="zoneActiveSwitch"
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                        />
                        <label className="form-check-label small fw-semibold" htmlFor="zoneActiveSwitch">
                          Active Zone
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
                    {saving ? "Saving..." : editingZone ? "Update Zone" : "Create Zone"}
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
