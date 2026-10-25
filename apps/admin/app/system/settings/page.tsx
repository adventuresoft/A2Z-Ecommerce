"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  SettingsService,
  StoreSetting,
  SettingItemUpdate,
} from "../../../services/settings";
import { HeroBannersManager } from "../../../components/settings/HeroBannersManager";

type TabKey =
  | "GENERAL"
  | "LOCALIZATION"
  | "ORDER"
  | "INVENTORY"
  | "SHIPPING"
  | "NOTIFICATION"
  | "SECURITY"
  | "HERO_BANNERS";

interface TabDefinition {
  key: TabKey;
  label: string;
  icon: string;
  description: string;
}

const TABS: TabDefinition[] = [
  {
    key: "GENERAL",
    label: "General Info",
    icon: "bi-shop",
    description: "Store branding, contact channels, and physical address",
  },
  {
    key: "LOCALIZATION",
    label: "Currency & Localization",
    icon: "bi-globe",
    description: "Currency symbols, position, timezone, and date formatting",
  },
  {
    key: "ORDER",
    label: "Order & Checkout",
    icon: "bi-cart-check",
    description: "Order number prefixes, limits, payment toggles, and timeouts",
  },
  {
    key: "INVENTORY",
    label: "Inventory Rules",
    icon: "bi-boxes",
    description: "Low-stock thresholds, backorders, and stock reservation durations",
  },
  {
    key: "SHIPPING",
    label: "Shipping Policies",
    icon: "bi-truck",
    description: "Free delivery thresholds, dispatch timelines, and returns",
  },
  {
    key: "NOTIFICATION",
    label: "Notifications",
    icon: "bi-bell",
    description: "Customer and staff notification triggers and sender email identities",
  },
  {
    key: "SECURITY",
    label: "Security & SEO",
    icon: "bi-shield-check",
    description: "Maintenance mode, customer registration, and meta tags",
  },
  {
    key: "HERO_BANNERS",
    label: "Hero Banners",
    icon: "bi-images",
    description: "Homepage hero carousel slides, headlines, badges, and CTA redirects",
  },
];

export default function StoreSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("GENERAL");
  const [settings, setSettings] = useState<StoreSetting[]>([]);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [initialValues, setInitialValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [alert, setAlert] = useState<{
    type: "success" | "danger" | "info" | "warning";
    message: string;
  } | null>(null);

  // New setting modal state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newKey, setNewKey] = useState<string>("");
  const [newValue, setNewValue] = useState<string>("");
  const [newDataType, setNewDataType] = useState<string>("STRING");
  const [newGroup, setNewGroup] = useState<string>("GENERAL");
  const [newIsPublic, setNewIsPublic] = useState<boolean>(false);
  const [newDescription, setNewDescription] = useState<string>("");
  const [creating, setCreating] = useState<boolean>(false);

  // Fetch settings from API
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await SettingsService.getSettings();
      setSettings(data);

      const valMap: Record<string, string> = {};
      for (const item of data) {
        valMap[item.key] = item.value;
      }
      setFormValues(valMap);
      setInitialValues(valMap);
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        message: err instanceof Error ? err.message : "Failed to load store settings from server.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Compute settings belonging to active tab
  const activeSettings = useMemo(() => {
    return settings.filter(
      (s) => (s.group || "GENERAL").toUpperCase() === activeTab,
    );
  }, [settings, activeTab]);

  // Check if active tab has unsaved changes
  const hasChangesInActiveTab = useMemo(() => {
    if (activeTab === "HERO_BANNERS") {
      return (
        (formValues["storefront.hero_banners"] || "[]") !==
        (initialValues["storefront.hero_banners"] || "[]")
      );
    }
    return activeSettings.some(
      (s) => formValues[s.key] !== initialValues[s.key],
    );
  }, [activeSettings, formValues, initialValues, activeTab]);

  // Handle single input field change
  const handleInputChange = (key: string, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handle boolean toggle switch change
  const handleToggleChange = (key: string, checked: boolean) => {
    handleInputChange(key, checked ? "true" : "false");
  };

  // Reset active tab changes
  const handleResetActiveTab = () => {
    const updated = { ...formValues };
    if (activeTab === "HERO_BANNERS") {
      updated["storefront.hero_banners"] =
        initialValues["storefront.hero_banners"] ?? "[]";
    } else {
      for (const s of activeSettings) {
        updated[s.key] = initialValues[s.key] ?? s.value;
      }
    }
    setFormValues(updated);
    setAlert({
      type: "info",
      message: "Reverted unsaved changes for this tab.",
    });
  };

  // Save changes for active tab
  const handleSaveActiveTab = async () => {
    setSaving(true);
    setAlert(null);
    try {
      const changedItems: SettingItemUpdate[] = [];
      if (activeTab === "HERO_BANNERS") {
        const val = formValues["storefront.hero_banners"] || "[]";
        if (val !== (initialValues["storefront.hero_banners"] || "[]")) {
          changedItems.push({
            key: "storefront.hero_banners",
            value: val,
            isPublic: true,
            description: "Storefront homepage hero carousel slides",
          });
        }
      } else {
        for (const s of activeSettings) {
          if (formValues[s.key] !== undefined && formValues[s.key] !== initialValues[s.key]) {
            changedItems.push({
              key: s.key,
              value: formValues[s.key],
            });
          }
        }
      }

      if (changedItems.length === 0) {
        setAlert({
          type: "info",
          message: "No modified settings to save in this tab.",
        });
        setSaving(false);
        return;
      }

      await SettingsService.batchUpdate(changedItems);

      // Update initial values snapshot
      const updatedInitial = { ...initialValues };
      for (const item of changedItems) {
        updatedInitial[item.key] = item.value;
      }
      setInitialValues(updatedInitial);

      setAlert({
        type: "success",
        message: `Successfully saved ${changedItems.length} setting(s) in ${
          TABS.find((t) => t.key === activeTab)?.label
        }!`,
      });
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        message: err instanceof Error ? err.message : "Failed to update store settings.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Create custom setting
  const handleCreateSetting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;

    setCreating(true);
    try {
      await SettingsService.createSetting({
        key: newKey.trim().toLowerCase(),
        value: newValue,
        dataType: newDataType,
        group: newGroup,
        isPublic: newIsPublic,
        description: newDescription.trim() || undefined,
      });

      setShowAddModal(false);
      setNewKey("");
      setNewValue("");
      setNewDescription("");
      setAlert({
        type: "success",
        message: `Setting '${newKey.toLowerCase()}' created successfully!`,
      });
      await fetchSettings();
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        message: err instanceof Error ? err.message : "Failed to create setting.",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="container-fluid p-4">
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="mb-1 text-dark fw-bold d-flex align-items-center gap-2">
            <i className="bi bi-sliders2 text-primary"></i> Store Settings
          </h2>
          <p className="text-muted mb-0 small">
            Configure system parameters, contact details, currency localization, and operational rules.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 shadow-sm"
            onClick={fetchSettings}
            disabled={loading}
          >
            <i className={`bi bi-arrow-clockwise ${loading ? "spin" : ""}`}></i>
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1 shadow-sm"
            onClick={() => {
              setNewGroup(activeTab);
              setShowAddModal(true);
            }}
          >
            <i className="bi bi-plus-circle"></i>
            <span>Add Custom Setting</span>
          </button>
        </div>
      </div>

      {/* Alert Notification */}
      {alert && (
        <div
          className={`alert alert-${alert.type} alert-dismissible fade show shadow-sm d-flex align-items-center justify-content-between`}
          role="alert"
        >
          <div className="d-flex align-items-center gap-2">
            <i
              className={`bi ${
                alert.type === "success"
                  ? "bi-check-circle-fill text-success"
                  : alert.type === "danger"
                  ? "bi-exclamation-triangle-fill text-danger"
                  : "bi-info-circle-fill text-info"
              }`}
            ></i>
            <span>{alert.message}</span>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={() => setAlert(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Main Settings Card */}
      <div className="card shadow-sm border-0 mb-4">
        {/* Navigation Tabs Header */}
        <div className="card-header bg-white border-bottom p-0">
          <ul className="nav nav-tabs card-header-tabs m-0 px-3 pt-2 border-0 flex-nowrap overflow-x-auto">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              const tabSettings = settings.filter(
                (s) => (s.group || "GENERAL").toUpperCase() === tab.key,
              );
              const tabHasUnsaved =
                tab.key === "HERO_BANNERS"
                  ? (formValues["storefront.hero_banners"] || "[]") !==
                    (initialValues["storefront.hero_banners"] || "[]")
                  : tabSettings.some(
                      (s) => formValues[s.key] !== initialValues[s.key],
                    );

              return (
                <li className="nav-item text-nowrap" key={tab.key}>
                  <button
                    type="button"
                    className={`nav-link border-0 border-bottom border-3 py-3 px-3 d-flex align-items-center gap-2 fw-medium ${
                      isActive
                        ? "border-primary text-primary active bg-transparent"
                        : "border-transparent text-secondary hover-text-dark"
                    }`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    <i className={`bi ${tab.icon}`}></i>
                    <span>{tab.label}</span>
                    {tabHasUnsaved && (
                      <span
                        className="badge bg-warning text-dark rounded-pill ms-1"
                        style={{ fontSize: "0.65rem" }}
                        title="Unsaved changes in this tab"
                      >
                        Edited
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Tab Description Banner */}
        <div className="bg-light px-4 py-3 border-bottom d-flex justify-content-between align-items-center">
          <div>
            <h6 className="mb-0 fw-semibold text-dark">
              {TABS.find((t) => t.key === activeTab)?.label}
            </h6>
            <span className="text-muted small">
              {TABS.find((t) => t.key === activeTab)?.description}
            </span>
          </div>
          {hasChangesInActiveTab && (
            <span className="badge bg-warning-subtle text-warning-emphasis border border-warning px-2 py-1 small">
              <i className="bi bi-pencil-fill me-1"></i> Unsaved changes pending
            </span>
          )}
        </div>

        {/* Card Body Form */}
        <div className="card-body p-4">
          {activeTab === "HERO_BANNERS" ? (
            <HeroBannersManager
              bannersJson={formValues["storefront.hero_banners"] || initialValues["storefront.hero_banners"] || "[]"}
              onChange={(updatedJson) => handleInputChange("storefront.hero_banners", updatedJson)}
              onSave={handleSaveActiveTab}
              saving={saving}
            />
          ) : loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading settings...</span>
              </div>
              <p className="text-muted mt-2 small">Loading store configuration...</p>
            </div>
          ) : activeSettings.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-gear text-secondary display-4 d-block mb-3"></i>
              <h5 className="text-dark">No settings in this group</h5>
              <p className="text-muted small mb-3">
                No configuration entries currently belong to the {activeTab} group.
              </p>
              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={() => {
                  setNewGroup(activeTab);
                  setShowAddModal(true);
                }}
              >
                <i className="bi bi-plus-lg me-1"></i> Add Setting to {activeTab}
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveActiveTab();
              }}
            >
              <div className="row g-4">
                {activeSettings.map((setting) => {
                  const currentValue = formValues[setting.key] ?? setting.value ?? "";
                  const isModified = currentValue !== (initialValues[setting.key] ?? setting.value);
                  const isBoolean = setting.dataType?.toUpperCase() === "BOOLEAN";

                  return (
                    <div
                      key={setting.key}
                      className={
                        setting.key.includes("address") ||
                        setting.key.includes("description") ||
                        setting.key.includes("notice") ||
                        setting.key.includes("tagline")
                          ? "col-12"
                          : "col-12 col-md-6"
                      }
                    >
                      <div
                        className={`p-3 rounded border transition-all ${
                          isModified ? "border-primary bg-primary-subtle bg-opacity-10" : "bg-white"
                        }`}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <label
                            htmlFor={`setting-${setting.key}`}
                            className="form-label fw-semibold text-dark mb-0 small text-capitalize"
                          >
                            {setting.key.replace(/_/g, " ")}
                          </label>

                          <div className="d-flex align-items-center gap-1">
                            {setting.isPublic ? (
                              <span
                                className="badge bg-success-subtle text-success border border-success"
                                style={{ fontSize: "0.65rem" }}
                                title="Available to public storefront"
                              >
                                <i className="bi bi-globe me-1"></i>Public
                              </span>
                            ) : (
                              <span
                                className="badge bg-secondary-subtle text-secondary border"
                                style={{ fontSize: "0.65rem" }}
                                title="Admin internal setting only"
                              >
                                <i className="bi bi-lock me-1"></i>Private
                              </span>
                            )}
                            <span
                              className="badge bg-light text-muted border"
                              style={{ fontSize: "0.65rem" }}
                            >
                              {setting.dataType}
                            </span>
                          </div>
                        </div>

                        {setting.description && (
                          <div className="text-muted small mb-2" style={{ fontSize: "0.78rem" }}>
                            {setting.description}
                          </div>
                        )}

                        {/* Input Rendering based on DataType / Key */}
                        {isBoolean ? (
                          <div className="form-check form-switch mt-2">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              role="switch"
                              id={`setting-${setting.key}`}
                              checked={currentValue === "true" || currentValue === "1"}
                              onChange={(e) => handleToggleChange(setting.key, e.target.checked)}
                            />
                            <label
                              className="form-check-label small ms-2"
                              htmlFor={`setting-${setting.key}`}
                            >
                              {currentValue === "true" || currentValue === "1"
                                ? "Enabled / Active"
                                : "Disabled / Inactive"}
                            </label>
                          </div>
                        ) : setting.key === "currency_symbol_position" ? (
                          <select
                            id={`setting-${setting.key}`}
                            className="form-select form-select-sm"
                            value={currentValue}
                            onChange={(e) => handleInputChange(setting.key, e.target.value)}
                          >
                            <option value="BEFORE">BEFORE (e.g. $100 / ৳100)</option>
                            <option value="AFTER">AFTER (e.g. 100$ / 100৳)</option>
                          </select>
                        ) : setting.key.includes("address") ||
                          setting.key.includes("description") ||
                          setting.key.includes("notice") ? (
                          <textarea
                            id={`setting-${setting.key}`}
                            rows={2}
                            className="form-control form-control-sm"
                            value={currentValue}
                            onChange={(e) => handleInputChange(setting.key, e.target.value)}
                          />
                        ) : (
                          <input
                            type={setting.dataType?.toUpperCase() === "NUMBER" ? "number" : "text"}
                            id={`setting-${setting.key}`}
                            step={setting.dataType?.toUpperCase() === "NUMBER" ? "any" : undefined}
                            className="form-control form-control-sm"
                            value={currentValue}
                            onChange={(e) => handleInputChange(setting.key, e.target.value)}
                          />
                        )}

                        <div className="d-flex justify-content-between align-items-center mt-2">
                          <code className="text-muted small" style={{ fontSize: "0.72rem" }}>
                            {setting.key}
                          </code>
                          {isModified && (
                            <span className="text-primary small" style={{ fontSize: "0.75rem" }}>
                              <i className="bi bi-circle-fill me-1" style={{ fontSize: "0.5rem" }}></i>
                              Modified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons Footer */}
              <div className="d-flex justify-content-between align-items-center pt-4 mt-4 border-top">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={handleResetActiveTab}
                  disabled={!hasChangesInActiveTab || saving}
                >
                  <i className="bi bi-arrow-counterclockwise me-1"></i> Discard Tab Changes
                </button>

                <div className="d-flex align-items-center gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm px-4 d-flex align-items-center gap-2 shadow-sm"
                    disabled={!hasChangesInActiveTab || saving}
                  >
                    {saving ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check2"></i>
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Add Custom Setting Modal */}
      {showAddModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow border-0">
              <div className="modal-header bg-light">
                <h5 className="modal-title fw-bold text-dark">
                  <i className="bi bi-plus-circle text-primary me-2"></i> Add Custom Setting
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddModal(false)}
                  disabled={creating}
                ></button>
              </div>

              <form onSubmit={handleCreateSetting}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">
                      Key Identifier <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. promo_banner_text"
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                      required
                    />
                    <div className="form-text small">
                      Lowercase alphanumeric with underscores only.
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">
                      Setting Value <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Enter raw value"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-dark">Group</label>
                      <select
                        className="form-select form-select-sm"
                        value={newGroup}
                        onChange={(e) => setNewGroup(e.target.value)}
                      >
                        {TABS.map((t) => (
                          <option key={t.key} value={t.key}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-6">
                      <label className="form-label small fw-semibold text-dark">Data Type</label>
                      <select
                        className="form-select form-select-sm"
                        value={newDataType}
                        onChange={(e) => setNewDataType(e.target.value)}
                      >
                        <option value="STRING">STRING</option>
                        <option value="NUMBER">NUMBER</option>
                        <option value="BOOLEAN">BOOLEAN</option>
                        <option value="JSON">JSON</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">Description</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Brief note on what this setting controls"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                    />
                  </div>

                  <div className="form-check form-switch mb-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      id="modalIsPublic"
                      checked={newIsPublic}
                      onChange={(e) => setNewIsPublic(e.target.checked)}
                    />
                    <label className="form-check-label small" htmlFor="modalIsPublic">
                      Publicly accessible by storefront clients
                    </label>
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowAddModal(false)}
                    disabled={creating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                    disabled={creating}
                  >
                    {creating && (
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                    )}
                    <span>Create Setting</span>
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
