"use client";

import React from "react";

export interface SpecificationItem {
  key: string;
  value: string;
}

export const DEFAULT_SPECIFICATIONS: SpecificationItem[] = [
  { key: "Brand", value: "" },
  { key: "Model", value: "" },
  { key: "Warranty", value: "Official Warranty" },
  { key: "Color", value: "" },
  { key: "Origin", value: "Bangladesh / Global" },
];

interface ProductSpecificationsEditorProps {
  specifications: SpecificationItem[];
  onChange: (specs: SpecificationItem[]) => void;
}

export function ProductSpecificationsEditor({
  specifications,
  onChange,
}: ProductSpecificationsEditorProps) {
  const handleKeyChange = (index: number, newKey: string) => {
    const updated = [...specifications];
    updated[index] = { ...updated[index], key: newKey };
    onChange(updated);
  };

  const handleValueChange = (index: number, newValue: string) => {
    const updated = [...specifications];
    updated[index] = { ...updated[index], value: newValue };
    onChange(updated);
  };

  const handleAddRow = () => {
    onChange([...specifications, { key: "", value: "" }]);
  };

  const handleRemoveRow = (index: number) => {
    onChange(specifications.filter((_, i) => i !== index));
  };

  const handleLoadDefaults = () => {
    if (
      specifications.length > 0 &&
      !window.confirm("Replace current specifications with default fields?")
    ) {
      return;
    }
    onChange([...DEFAULT_SPECIFICATIONS]);
  };

  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-header bg-white py-3 d-flex align-items-center justify-content-between">
        <div>
          <h6 className="card-title fw-bold m-0 d-flex align-items-center gap-2">
            <i className="bi bi-card-checklist text-primary"></i>
            Product Specifications
          </h6>
        </div>
        <div className="d-flex align-items-center gap-2">
          {specifications.length === 0 && (
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={handleLoadDefaults}
            >
              <i className="bi bi-magic me-1"></i> Pre-fill Defaults
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleAddRow}
          >
            <i className="bi bi-plus-lg me-1"></i> Add Specification
          </button>
        </div>
      </div>

      <div className="card-body p-0">
        {specifications.length === 0 ? (
          <div className="text-center py-4 px-3 text-muted">
            <i className="bi bi-table fs-3 text-secondary d-block mb-2"></i>
            <p className="mb-2 small">No specifications added yet.</p>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={handleLoadDefaults}
            >
              <i className="bi bi-plus-circle me-1"></i> Add Default Specifications
            </button>
          </div>
        ) : (
          <div className="table-responsive m-0">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light text-muted small text-uppercase">
                <tr>
                  <th style={{ width: "35%" }}>Specification (Attribute)</th>
                  <th style={{ width: "55%" }}>Value / Detail</th>
                  <th style={{ width: "10%" }} className="text-end pe-3">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {specifications.map((row, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Brand, Display, Battery"
                        value={row.key}
                        onChange={(e) => handleKeyChange(index, e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. 5000 mAh, 120Hz AMOLED"
                        value={row.value}
                        onChange={(e) => handleValueChange(index, e.target.value)}
                      />
                    </td>
                    <td className="text-end pe-3">
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm p-1 px-2"
                        title="Remove row"
                        onClick={() => handleRemoveRow(index)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {specifications.length > 0 && (
        <div className="card-footer bg-light py-2 text-end">
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={handleAddRow}
          >
            <i className="bi bi-plus me-1"></i> Add Row
          </button>
        </div>
      )}
    </div>
  );
}
