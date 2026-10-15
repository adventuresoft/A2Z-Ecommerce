"use client";

import React, { useState, useEffect } from "react";
import {
  attributesApi,
  AttributeItem,
  AttributeType,
  CreateAttributePayload,
  CreateAttributeValueInput,
} from "../../../../services/attributes";

interface AttributeFormModalProps {
  isOpen: boolean;
  attributeToEdit: AttributeItem | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

interface ValueRowState {
  id?: string; // existing value ID if in edit mode
  value: string;
  label: string;
  colorCode: string;
  sortOrder: number;
  isActive: boolean;
  isDeleted?: boolean;
}

export function AttributeFormModal({
  isOpen,
  attributeToEdit,
  onClose,
  onSuccess,
}: AttributeFormModalProps) {
  const isEditMode = Boolean(attributeToEdit);

  // Form Fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [type, setType] = useState<AttributeType>("TEXT");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(true);

  // Values List
  const [values, setValues] = useState<ValueRowState[]>([]);

  // State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form on open
  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    if (attributeToEdit) {
      setName(attributeToEdit.name || "");
      setSlug(attributeToEdit.slug || "");
      setType(attributeToEdit.type || "TEXT");
      setDescription(attributeToEdit.description || "");
      setSortOrder(attributeToEdit.sortOrder ?? 0);
      setIsActive(attributeToEdit.isActive ?? true);

      setValues(
        (attributeToEdit.values || []).map((v) => ({
          id: v.id,
          value: v.value,
          label: v.label || "",
          colorCode: v.colorCode || "#000000",
          sortOrder: v.sortOrder ?? 0,
          isActive: v.isActive ?? true,
        })),
      );
    } else {
      setName("");
      setSlug("");
      setType("TEXT");
      setDescription("");
      setSortOrder(0);
      setIsActive(true);
      setValues([]);
    }
  }, [isOpen, attributeToEdit]);

  if (!isOpen) return null;

  const handleAddValueRow = () => {
    setValues((prev) => [
      ...prev,
      {
        value: "",
        label: "",
        colorCode: type === "COLOR" ? "#000000" : "",
        sortOrder: prev.length,
        isActive: true,
      },
    ]);
  };

  const handleUpdateValueRow = (
    index: number,
    field: keyof ValueRowState,
    val: any,
  ) => {
    setValues((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleRemoveValueRow = (index: number) => {
    setValues((prev) => {
      const target = prev[index];
      // If it exists in the database, mark it as isDeleted
      if (target.id) {
        const next = [...prev];
        next[index] = { ...target, isDeleted: true };
        return next;
      }
      // If purely new, drop it from array
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Attribute name is required.");
      return;
    }

    // Validate values: ensure no empty value strings and validate hex if COLOR
    const activeRows = values.filter((v) => !v.isDeleted);
    const seenValues = new Set<string>();

    for (const v of activeRows) {
      if (!v.value.trim()) {
        setError("All attribute value rows must have a valid value specified.");
        return;
      }
      const lower = v.value.trim().toLowerCase();
      if (seenValues.has(lower)) {
        setError(`Duplicate attribute value '${v.value}' specified.`);
        return;
      }
      seenValues.add(lower);

      if (type === "COLOR" && v.colorCode) {
        if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v.colorCode.trim())) {
          setError(
            `Invalid hex color code '${v.colorCode}'. Must be #RGB or #RRGGBB.`,
          );
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      if (isEditMode && attributeToEdit) {
        // 1. Update attribute details
        await attributesApi.updateAttribute(attributeToEdit.id, {
          name: name.trim(),
          slug: slug.trim() || undefined,
          type,
          description: description.trim() || undefined,
          sortOrder: Number(sortOrder) || 0,
          isActive,
        });

        // 2. Handle values updates, additions, and deletions
        for (const row of values) {
          if (row.isDeleted && row.id) {
            await attributesApi.deleteValue(attributeToEdit.id, row.id);
          } else if (!row.id && !row.isDeleted) {
            await attributesApi.createValue(attributeToEdit.id, {
              value: row.value.trim(),
              label: row.label.trim() || undefined,
              colorCode:
                type === "COLOR" ? row.colorCode.trim() || undefined : undefined,
              sortOrder: Number(row.sortOrder) || 0,
              isActive: row.isActive,
            });
          } else if (row.id && !row.isDeleted) {
            await attributesApi.updateValue(attributeToEdit.id, row.id, {
              value: row.value.trim(),
              label: row.label.trim() || undefined,
              colorCode:
                type === "COLOR" ? row.colorCode.trim() || undefined : undefined,
              sortOrder: Number(row.sortOrder) || 0,
              isActive: row.isActive,
            });
          }
        }

        onSuccess(`Attribute '${name}' updated successfully.`);
      } else {
        // Create new attribute with initial values payload
        const initialValues: CreateAttributeValueInput[] = activeRows.map(
          (v, idx) => ({
            value: v.value.trim(),
            label: v.label.trim() || undefined,
            colorCode:
              type === "COLOR" ? v.colorCode.trim() || undefined : undefined,
            sortOrder: Number(v.sortOrder) || idx,
            isActive: v.isActive,
          }),
        );

        const payload: CreateAttributePayload = {
          name: name.trim(),
          slug: slug.trim() || undefined,
          type,
          description: description.trim() || undefined,
          sortOrder: Number(sortOrder) || 0,
          isActive,
          values: initialValues.length > 0 ? initialValues : undefined,
        };

        await attributesApi.createAttribute(payload);
        onSuccess(`Attribute '${name}' created successfully.`);
      }

      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to save attribute.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1055 }}
      >
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content shadow border-0">
            {/* Modal Header */}
            <div className="modal-header border-bottom py-3">
              <h5 className="modal-title fw-semibold">
                <i className="bi bi-sliders text-primary me-2"></i>
                {isEditMode ? `Edit Attribute: ${attributeToEdit?.name}` : "Add New Attribute"}
              </h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={onClose}
                disabled={submitting}
              ></button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit}>
              <div className="modal-body p-4">
                {error && (
                  <div className="alert alert-danger d-flex align-items-center mb-3">
                    <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                    <div>{error}</div>
                  </div>
                )}

                {/* Attribute Details Section */}
                <h6 className="fw-bold text-secondary text-uppercase small mb-3">
                  1. Attribute Configuration
                </h6>

                <div className="row g-3 mb-4">
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold">
                      Attribute Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g., Color, Size, Storage"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={100}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold">
                      URL Slug
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Auto-generated if left empty"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      maxLength={120}
                    />
                    <div className="form-text" style={{ fontSize: "0.75rem" }}>
                      Lowercase alphanumeric with hyphens (e.g., shoe-size)
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold">
                      Display Type
                    </label>
                    <select
                      className="form-select"
                      value={type}
                      onChange={(e) => setType(e.target.value as AttributeType)}
                    >
                      <option value="TEXT">Text (Standard chips / select)</option>
                      <option value="COLOR">Color (Visual swatches with hex color picker)</option>
                      <option value="BUTTON">Button (Selectable pills / blocks)</option>
                    </select>
                  </div>

                  <div className="col-12 col-md-3">
                    <label className="form-label small fw-semibold">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(Number(e.target.value))}
                      min={0}
                    />
                  </div>

                  <div className="col-12 col-md-3 d-flex align-items-end">
                    <div className="form-check form-switch mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="attrActiveSwitch"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                      />
                      <label className="form-check-label small fw-semibold" htmlFor="attrActiveSwitch">
                        Active in Catalog
                      </label>
                    </div>
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-semibold">
                      Description (Optional)
                    </label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="Brief note on what this attribute represents"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    ></textarea>
                  </div>
                </div>

                {/* Attribute Values Section */}
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h6 className="fw-bold text-secondary text-uppercase small m-0">
                    2. Predefined Attribute Values
                  </h6>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={handleAddValueRow}
                  >
                    <i className="bi bi-plus-circle me-1"></i>Add Value
                  </button>
                </div>

                <div className="border rounded p-2 bg-body-tertiary mb-2">
                  {values.filter((v) => !v.isDeleted).length === 0 ? (
                    <div className="text-center py-4 text-secondary small">
                      <i className="bi bi-tag d-block mb-1 fs-4 opacity-50"></i>
                      No values defined yet. Click <strong>&quot;Add Value&quot;</strong> above to add options (e.g., Red, Blue, XL).
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-sm table-borderless align-middle mb-0">
                        <thead className="small text-secondary">
                          <tr>
                            <th style={{ width: "30%" }}>Value *</th>
                            <th style={{ width: "30%" }}>Display Label</th>
                            {type === "COLOR" && (
                              <th style={{ width: "25%" }}>Color Swatch</th>
                            )}
                            <th style={{ width: "10%" }} className="text-center">Order</th>
                            <th style={{ width: "5%" }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {values.map((row, idx) => {
                            if (row.isDeleted) return null;

                            return (
                              <tr key={row.id || idx}>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="e.g. Red, XL, 256GB"
                                    value={row.value}
                                    onChange={(e) =>
                                      handleUpdateValueRow(idx, "value", e.target.value)
                                    }
                                    required
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="e.g. Crimson Red"
                                    value={row.label}
                                    onChange={(e) =>
                                      handleUpdateValueRow(idx, "label", e.target.value)
                                    }
                                  />
                                </td>
                                {type === "COLOR" && (
                                  <td>
                                    <div className="input-group input-group-sm">
                                      <input
                                        type="color"
                                        className="form-control form-control-color form-control-sm p-1"
                                        value={
                                          /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(
                                            row.colorCode,
                                          )
                                            ? row.colorCode
                                            : "#000000"
                                        }
                                        onChange={(e) =>
                                          handleUpdateValueRow(
                                            idx,
                                            "colorCode",
                                            e.target.value,
                                          )
                                        }
                                        title="Pick swatch color"
                                      />
                                      <input
                                        type="text"
                                        className="form-control form-control-sm font-monospace"
                                        placeholder="#000000"
                                        value={row.colorCode}
                                        onChange={(e) =>
                                          handleUpdateValueRow(
                                            idx,
                                            "colorCode",
                                            e.target.value,
                                          )
                                        }
                                        maxLength={7}
                                      />
                                    </div>
                                  </td>
                                )}
                                <td>
                                  <input
                                    type="number"
                                    className="form-control form-control-sm text-center"
                                    value={row.sortOrder}
                                    onChange={(e) =>
                                      handleUpdateValueRow(
                                        idx,
                                        "sortOrder",
                                        Number(e.target.value),
                                      )
                                    }
                                    min={0}
                                  />
                                </td>
                                <td className="text-end">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-link text-danger p-0"
                                    onClick={() => handleRemoveValueRow(idx)}
                                    title="Remove value row"
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="modal-footer border-top py-2 bg-body-tertiary">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={onClose}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary d-inline-flex align-items-center"
                  disabled={submitting}
                >
                  {submitting && (
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    ></span>
                  )}
                  {isEditMode ? "Save Changes" : "Create Attribute"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
