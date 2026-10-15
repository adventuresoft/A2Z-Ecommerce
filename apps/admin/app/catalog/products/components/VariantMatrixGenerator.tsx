/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import {
  AttributeItem,
  attributesApi,
} from "../../../../services/attributes";
import {
  CreateVariantPayload,
  ProductImageItem,
  uploadProductImage,
} from "../../../../services/products";
import { useAuth } from "@/context/AuthContext";

export interface VariantRow extends CreateVariantPayload {
  tempId: string;
  attributeLabels?: string[];
}

interface VariantMatrixGeneratorProps {
  productTitle: string;
  galleryImages: ProductImageItem[];
  variants: VariantRow[];
  onChange: (variants: VariantRow[]) => void;
}

export function VariantMatrixGenerator({
  productTitle,
  galleryImages,
  variants,
  onChange,
}: VariantMatrixGeneratorProps) {
  const { can } = useAuth();
  const [attributes, setAttributes] = useState<AttributeItem[]>([]);
  const [loadingAttrs, setLoadingAttrs] = useState(false);
  const [selectedAttrMap, setSelectedAttrMap] = useState<Record<string, string[]>>({});
  const [defaultPrice, setDefaultPrice] = useState<number>(29.99);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '') : 'http://localhost:3001';

  // Load catalog attributes
  useEffect(() => {
    async function load() {
      setLoadingAttrs(true);
      try {
        const res = await attributesApi.getAttributes({ limit: 100, isActive: true });
        setAttributes(res.items);
      } catch (err) {
        console.error("Failed to load catalog attributes:", err);
      } finally {
        setLoadingAttrs(false);
      }
    }
    load();
  }, []);

  // Toggle selection of attribute value
  const toggleValue = (attrId: string, valId: string) => {
    setSelectedAttrMap((prev) => {
      const current = prev[attrId] || [];
      const updated = current.includes(valId)
        ? current.filter((id) => id !== valId)
        : [...current, valId];

      if (updated.length === 0) {
        const copy = { ...prev };
        delete copy[attrId];
        return copy;
      }
      return { ...prev, [attrId]: updated };
    });
  };

  // Generate Cartesian Product Matrix
  const handleGenerateMatrix = () => {
    const selectedAttrIds = Object.keys(selectedAttrMap).filter(
      (attrId) => selectedAttrMap[attrId].length > 0,
    );

    if (selectedAttrIds.length === 0) {
      alert("Please select at least one attribute value to generate variants.");
      return;
    }

    // Prepare arrays of { attrValId, valLabel, attrName }
    const pools: { id: string; label: string; name: string }[][] = [];

    for (const attrId of selectedAttrIds) {
      const attr = attributes.find((a) => a.id === attrId);
      const valIds = selectedAttrMap[attrId];
      const items = valIds
        .map((vid) => {
          const valObj = attr?.values?.find((v) => v.id === vid);
          return valObj
            ? {
                id: valObj.id,
                label: valObj.label || valObj.value,
                name: attr?.name || "Option",
              }
            : null;
        })
        .filter(Boolean) as { id: string; label: string; name: string }[];

      if (items.length > 0) pools.push(items);
    }

    if (pools.length === 0) return;

    // Cartesian product
    const cartesian = pools.reduce<Array<typeof pools[0]>>(
      (acc, pool) =>
        acc.flatMap((x) => pool.map((y) => [...x, y])),
      [[]],
    );

    const prefix = productTitle
      ? productTitle.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)
      : "SKU";

    const generated: VariantRow[] = cartesian.map((combo, idx) => {
      const skuSuffix = combo
        .map((c) => c.label.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 3))
        .join("-");
      const sku = `${prefix}-${skuSuffix || idx + 1}-${Date.now().toString().slice(-4)}`;
      const labels = combo.map((c) => `${c.name}: ${c.label}`);

      return {
        tempId: `gen-${Date.now()}-${idx}`,
        sku,
        regularPrice: defaultPrice,
        salePrice: undefined,
        weightGrams: 200,
        isActive: true,
        attributeValueIds: combo.map((c) => c.id),
        attributeLabels: labels,
      };
    });

    onChange(generated);
  };

  const handleAddCustomVariant = () => {
    const prefix = productTitle
      ? productTitle.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)
      : "SKU";
    const newVariant: VariantRow = {
      tempId: `custom-${Date.now()}`,
      sku: `${prefix}-${variants.length + 1}-${Date.now().toString().slice(-4)}`,
      regularPrice: defaultPrice,
      isActive: true,
      attributeValueIds: [],
      attributeLabels: ["Default Variant"],
    };
    onChange([...variants, newVariant]);
  };

  const handleUploadVariantPhoto = async (index: number, file: File) => {
    if (!file.type.match(/^image\/(jpeg|png|webp|gif|svg\+xml)$/)) {
      alert("Please select a valid image file (JPG, PNG, WEBP, GIF, SVG)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    setUploadingIndex(index);
    try {
      const res = await uploadProductImage(file);
      handleUpdateRow(index, {
        imageUrl: res.imageUrl,
        imageId: undefined,
      });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to upload variant image");
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleUpdateRow = (index: number, patch: Partial<VariantRow>) => {
    const copy = [...variants];
    copy[index] = { ...copy[index], ...patch };
    onChange(copy);
  };

  const handleRemoveRow = (index: number) => {
    const copy = variants.filter((_, idx) => idx !== index);
    onChange(copy);
  };

  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-header bg-white py-3 border-bottom d-flex align-items-center justify-content-between">
        <h5 className="card-title fw-bold m-0 d-flex align-items-center gap-2">
          <i className="bi bi-diagram-3 text-primary"></i>
          Product Variants & Attributes
        </h5>
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-primary-subtle text-primary border">
            {variants.length} {variants.length === 1 ? "Variant" : "Variants"}
          </span>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
            onClick={handleAddCustomVariant}
          >
            <i className="bi bi-plus-circle"></i> Add Single SKU
          </button>
        </div>
      </div>

      <div className="card-body">
        {/* Attribute Selection Section */}
        <div className="p-3 border rounded-3 bg-light mb-4">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <span className="fw-semibold small text-muted text-uppercase">
              <i className="bi bi-sliders me-1"></i> Catalog Attributes Generator
            </span>
            <div className="d-flex align-items-center gap-2">
              <span className="small text-muted">Base Price:</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-control form-control-sm text-end"
                style={{ width: "90px" }}
                value={defaultPrice}
                onChange={(e) => setDefaultPrice(parseFloat(e.target.value) || 0)}
              />
              <button
                type="button"
                className="btn btn-sm btn-primary d-flex align-items-center gap-1"
                onClick={handleGenerateMatrix}
                disabled={loadingAttrs || attributes.length === 0}
              >
                <i className="bi bi-lightning-charge-fill"></i> Generate Combinations
              </button>
            </div>
          </div>

          {loadingAttrs ? (
            <div className="text-center py-2 text-muted small">
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              Loading attributes...
            </div>
          ) : attributes.length === 0 ? (
            <div className="text-muted small">
              No catalog attributes found. Add attributes under <strong>Catalog &gt; Attributes</strong> first.
            </div>
          ) : (
            <div className="row g-3">
              {attributes.map((attr) => (
                <div key={attr.id} className="col-12 col-md-6 col-lg-4">
                  <div className="p-2 border rounded bg-white h-100 shadow-xs">
                    <span className="fw-bold small d-block mb-1 text-dark">
                      {attr.name} ({attr.type})
                    </span>
                    <div className="d-flex flex-wrap gap-1">
                      {(attr.values || []).map((val) => {
                        const isSelected = (selectedAttrMap[attr.id] || []).includes(val.id);
                        return (
                          <button
                            key={val.id}
                            type="button"
                            className={`btn btn-xs rounded-pill border d-flex align-items-center gap-1 ${
                              isSelected
                                ? "btn-primary text-white"
                                : "btn-outline-secondary text-dark bg-light"
                            }`}
                            style={{ fontSize: "0.75rem", padding: "0.2rem 0.55rem" }}
                            onClick={() => toggleValue(attr.id, val.id)}
                          >
                            {val.colorCode && (
                              <span
                                className="rounded-circle border"
                                style={{
                                  display: "inline-block",
                                  width: "9px",
                                  height: "9px",
                                  backgroundColor: val.colorCode,
                                }}
                              ></span>
                            )}
                            {val.label || val.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Variants Matrix Table */}
        {variants.length === 0 ? (
          <div className="text-center py-4 border border-dashed rounded-3 bg-light bg-opacity-50">
            <i className="bi bi-diagram-3 display-5 text-muted opacity-50"></i>
            <p className="mt-2 text-muted fw-semibold">No product variants generated</p>
            <p className="small text-muted mb-0">
              Select attributes above and click &quot;Generate Combinations&quot;, or click &quot;Add Single SKU&quot;.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered table-hover align-middle mb-0" style={{ fontSize: "0.85rem" }}>
              <thead className="table-light">
                <tr>
                  <th style={{ width: "25%" }}>SKU & Options</th>
                  <th style={{ width: "15%" }}>Regular Price ($)</th>
                  <th style={{ width: "15%" }}>Sale Price ($)</th>
                  <th style={{ width: "15%" }}>Barcode</th>
                  <th style={{ width: "20%" }}>Variant Photo (Option B)</th>
                  <th style={{ width: "5%" }} className="text-center">Status</th>
                  <th style={{ width: "5%" }} className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v, index) => (
                  <tr key={v.tempId}>
                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm mb-1 fw-bold"
                        value={v.sku}
                        onChange={(e) => handleUpdateRow(index, { sku: e.target.value })}
                        placeholder="SKU-CODE"
                        required
                      />
                      {v.attributeLabels && v.attributeLabels.length > 0 && (
                        <div className="d-flex flex-wrap gap-1">
                          {v.attributeLabels.map((lbl, lIdx) => (
                            <span key={lIdx} className="badge bg-secondary-subtle text-secondary border" style={{ fontSize: "0.68rem" }}>
                              {lbl}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        className="form-control form-control-sm"
                        value={v.regularPrice}
                        onChange={(e) =>
                          handleUpdateRow(index, { regularPrice: parseFloat(e.target.value) || 0 })
                        }
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        className="form-control form-control-sm"
                        value={v.salePrice ?? ""}
                        placeholder="Optional"
                        onChange={(e) =>
                          handleUpdateRow(index, {
                            salePrice: e.target.value ? parseFloat(e.target.value) : undefined,
                          })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={v.barcode ?? ""}
                        placeholder="UPC / EAN"
                        onChange={(e) =>
                          handleUpdateRow(index, {
                            barcode: e.target.value ? e.target.value : undefined,
                          })
                        }
                      />
                    </td>
                    <td>
                      {/* Photo preview if present */}
                      {(() => {
                        let previewSrc: string | null = null;
                        let label = "";

                        if (v.imageUrl) {
                          previewSrc = v.imageUrl.startsWith("http")
                            ? v.imageUrl
                            : `${API_URL}${v.imageUrl}`;
                          label = "Uploaded";
                        } else if (v.imageId) {
                          const found = galleryImages.find((img) => img.id === v.imageId);
                          if (found) {
                            previewSrc = found.imageUrl.startsWith("http")
                              ? found.imageUrl
                              : `${API_URL}${found.imageUrl}`;
                            label = "Gallery";
                          }
                        }

                        if (!previewSrc) return null;

                        return (
                          <div className="mb-1 p-1 bg-light border rounded d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center gap-1 overflow-hidden">
                              <img
                                src={previewSrc}
                                alt="Variant thumbnail"
                                className="rounded border"
                                style={{ width: "24px", height: "24px", objectFit: "cover", flexShrink: 0 }}
                              />
                              <span className="badge bg-success-subtle text-success p-1" style={{ fontSize: "0.68rem" }}>
                                {label}
                              </span>
                            </div>
                            <button
                              type="button"
                              className="btn btn-link btn-sm p-0 text-danger"
                              title="Clear photo"
                              onClick={() => handleUpdateRow(index, { imageUrl: undefined, imageId: undefined })}
                            >
                              <i className="bi bi-x-circle"></i>
                            </button>
                          </div>
                        );
                      })()}

                      {/* Direct File Upload Option */}
                      <div className="d-flex align-items-center gap-1 mb-1">
                        <label
                          className={`btn btn-sm btn-outline-primary py-0 px-2 d-inline-flex align-items-center gap-1 w-100 justify-content-center ${
                            uploadingIndex === index ? "disabled" : ""
                          }`}
                          style={{ fontSize: "0.75rem", cursor: "pointer" }}
                        >
                          {uploadingIndex === index ? (
                            <>
                              <span className="spinner-border spinner-border-sm" role="status"></span>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-cloud-arrow-up"></i>
                              Upload Photo
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="d-none"
                            disabled={uploadingIndex === index}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadVariantPhoto(index, file);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      </div>

                      {/* Or Select from Gallery Images */}
                      {galleryImages.length > 0 && (
                        <select
                          className="form-select form-select-sm"
                          style={{ fontSize: "0.72rem" }}
                          value={v.imageId ?? ""}
                          onChange={(e) =>
                            handleUpdateRow(index, {
                              imageId: e.target.value ? e.target.value : undefined,
                              imageUrl: undefined,
                            })
                          }
                        >
                          <option value="">Or pick gallery...</option>
                          {galleryImages.map((img, imgIdx) => (
                            <option key={img.id} value={img.id}>
                              Photo #{imgIdx + 1} {img.altText ? `(${img.altText})` : ""} {img.isPrimary ? "[Cover]" : ""}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="text-center">
                      <div className="form-check form-switch d-inline-block">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={v.isActive ?? true}
                          onChange={(e) => handleUpdateRow(index, { isActive: e.target.checked })}
                        />
                      </div>
                    </td>
                    <td className="text-center">
                      {can("variants", "delete") && (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm p-1"
                          title="Remove Variant"
                          onClick={() => handleRemoveRow(index)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
