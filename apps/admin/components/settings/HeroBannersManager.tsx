"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { SettingsService, resolveSettingMediaUrl } from "../../services/settings";

export interface HeroBannerSlide {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  ctaText?: string;
  linkUrl?: string;
  badgeText?: string;
  sortOrder: number;
  isActive: boolean;
}

interface HeroBannersManagerProps {
  bannersJson?: string;
  onChange: (updatedJson: string) => void;
  onSave?: () => void;
  saving?: boolean;
}

const DEFAULT_BANNER: Omit<HeroBannerSlide, "id"> = {
  title: "",
  subtitle: "",
  imageUrl: "",
  mobileImageUrl: "",
  ctaText: "Explore Now",
  linkUrl: "/shop",
  badgeText: "HOT DEAL",
  sortOrder: 0,
  isActive: true,
};

const DEMO_HERO_SLIDES: HeroBannerSlide[] = [
  {
    id: "demo-slide-1",
    title: "BEST TECH. BEST DEALS.",
    subtitle:
      "Upgrade your lifestyle with the latest laptops, gaming rigs, and audio gear at unbeatable prices.",
    imageUrl:
      "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1200&q=80",
    ctaText: "Shop Flash Deals",
    linkUrl: "/flash-sale",
    badgeText: "UP TO 40% OFF",
    sortOrder: 10,
    isActive: true,
  },
  {
    id: "demo-slide-2",
    title: "Next-Gen Audio — Premium Headsets & Gear",
    subtitle:
      "Experience studio-grade acoustic clarity, active noise cancellation, and all-day comfort with our curated audiophile selection.",
    imageUrl:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
    ctaText: "Explore Audio",
    linkUrl: "/shop?category=audio",
    badgeText: "STUDIO GRADE ANC",
    sortOrder: 20,
    isActive: true,
  },
  {
    id: "demo-slide-3",
    title: "High-Performance Workstations & Ultrabooks",
    subtitle:
      "Power up your productivity with Apple Silicon, OLED ultrawide monitors, and ergonomic wireless accessories.",
    imageUrl:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80",
    ctaText: "Discover Laptops",
    linkUrl: "/shop?category=laptops",
    badgeText: "OFFICIAL WARRANTY",
    sortOrder: 30,
    isActive: true,
  },
];

export function HeroBannersManager({
  bannersJson = "[]",
  onChange,
  onSave,
  saving = false,
}: HeroBannersManagerProps) {
  const [editingBanner, setEditingBanner] = useState<HeroBannerSlide | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Omit<HeroBannerSlide, "id">>(DEFAULT_BANNER);
  const [uploadingField, setUploadingField] = useState<"web" | "mobile" | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isPreviewPaused, setIsPreviewPaused] = useState(false);
  const webFileRef = useRef<HTMLInputElement>(null);
  const mobileFileRef = useRef<HTMLInputElement>(null);

  const handleUploadImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "web" | "mobile",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.match(/^image\/(jpeg|jpg|png|webp|svg\+xml|gif)$/i)) {
      setUploadError("Please select a valid image (JPG, PNG, WEBP, SVG, GIF).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Banner image cannot exceed 5MB.");
      return;
    }
    setUploadError(null);
    setUploadingField(target);
    try {
      const res = await SettingsService.uploadHeroBannerImage(file);
      setFormData((prev) =>
        target === "web"
          ? { ...prev, imageUrl: res.imageUrl }
          : { ...prev, mobileImageUrl: res.imageUrl },
      );
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload banner image.");
    } finally {
      setUploadingField(null);
      if (target === "web" && webFileRef.current) webFileRef.current.value = "";
      if (target === "mobile" && mobileFileRef.current) mobileFileRef.current.value = "";
    }
  };

  // Derive sorted banners from bannersJson
  const banners = useMemo<HeroBannerSlide[]>(() => {
    try {
      const parsed = JSON.parse(bannersJson || "[]");
      if (Array.isArray(parsed)) {
        return [...parsed].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      }
    } catch {
      // In case of invalid JSON, don't crash
    }
    return [];
  }, [bannersJson]);

  const activeBanners = useMemo(
    () => banners.filter((b) => b.isActive !== false),
    [banners],
  );

  // Use active configured banners for the live slider preview, or fall back to demo slides
  const isShowingDemoPreview = activeBanners.length === 0;
  const previewSlides = isShowingDemoPreview ? DEMO_HERO_SLIDES : activeBanners;
  const safePreviewIndex =
    previewSlides.length > 0 ? previewIndex % previewSlides.length : 0;
  const currentPreviewSlide = previewSlides[safePreviewIndex];

  useEffect(() => {
    if (isPreviewPaused || previewSlides.length <= 1) return;
    const timer = setInterval(() => {
      setPreviewIndex((prev) => (prev + 1) % previewSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPreviewPaused, previewSlides.length]);

  const commitChanges = (updated: HeroBannerSlide[]) => {
    const sorted = [...updated].sort((a, b) => a.sortOrder - b.sortOrder);
    onChange(JSON.stringify(sorted, null, 2));
  };

  const handleLoadDemoSlides = () => {
    const existingIds = new Set(banners.map((b) => b.id));
    const maxOrder =
      banners.length > 0 ? Math.max(...banners.map((b) => b.sortOrder ?? 0)) : 0;

    const slidesToAdd = DEMO_HERO_SLIDES.filter((s) => !existingIds.has(s.id)).map(
      (s, idx) => ({
        ...s,
        sortOrder: maxOrder + (idx + 1) * 10,
      }),
    );

    if (slidesToAdd.length === 0) {
      // If all demo IDs already exist, append fresh copies with unique IDs
      const cloned = DEMO_HERO_SLIDES.map((s, idx) => ({
        ...s,
        id: `demo-${Date.now()}-${idx + 1}`,
        sortOrder: maxOrder + (idx + 1) * 10,
      }));
      commitChanges([...banners, ...cloned]);
      return;
    }

    commitChanges([...banners, ...slidesToAdd]);
    setPreviewIndex(0);
  };

  const handleOpenAdd = () => {
    setEditingBanner(null);
    setUploadError(null);
    setFormData({
      ...DEFAULT_BANNER,
      sortOrder: banners.length > 0 ? Math.max(...banners.map((b) => b.sortOrder)) + 10 : 10,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (banner: HeroBannerSlide) => {
    setEditingBanner(banner);
    setUploadError(null);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || "",
      imageUrl: banner.imageUrl,
      mobileImageUrl: banner.mobileImageUrl || "",
      ctaText: banner.ctaText || "Explore Now",
      linkUrl: banner.linkUrl || "",
      badgeText: banner.badgeText || "",
      sortOrder: banner.sortOrder ?? 0,
      isActive: banner.isActive !== false,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to remove this hero banner slide?")) {
      const filtered = banners.filter((b) => b.id !== id);
      commitChanges(filtered);
    }
  };

  const handleToggleActive = (id: string) => {
    const updated = banners.map((b) =>
      b.id === id ? { ...b, isActive: !b.isActive } : b,
    );
    commitChanges(updated);
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;

    const updated = [...banners];
    const current = updated[index];
    const target = updated[targetIndex];

    if (!current || !target) return;

    const tempOrder = current.sortOrder;
    current.sortOrder = target.sortOrder;
    target.sortOrder = tempOrder;

    if (current.sortOrder === target.sortOrder) {
      updated[index] = target;
      updated[targetIndex] = current;
      updated.forEach((b, idx) => {
        b.sortOrder = (idx + 1) * 10;
      });
    }

    commitChanges(updated);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.imageUrl.trim()) {
      alert("Title and Image URL are required.");
      return;
    }

    if (editingBanner) {
      const updated = banners.map((b) =>
        b.id === editingBanner.id
          ? {
              ...b,
              ...formData,
              sortOrder: Number(formData.sortOrder) || 0,
            }
          : b,
      );
      commitChanges(updated);
    } else {
      const newSlide: HeroBannerSlide = {
        id: `hero-${Date.now()}`,
        ...formData,
        sortOrder: Number(formData.sortOrder) || 0,
      };
      commitChanges([...banners, newSlide]);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* Top Action Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 p-3 rounded-3 border bg-body-tertiary">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h5 className="mb-0 fw-bold text-body">Storefront Hero Banners</h5>
            <span className="badge text-bg-primary rounded-pill">
              {banners.length} {banners.length === 1 ? "Slide" : "Slides"}
            </span>
            {activeBanners.length > 0 && (
              <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill">
                {activeBanners.length} Active
              </span>
            )}
          </div>
          <p className="text-muted small mb-0 mt-1">
            Configure visual marketing slides displayed in the storefront homepage carousel.
          </p>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2">
          <button
            type="button"
            onClick={handleLoadDemoSlides}
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
            title="Load 3 ready-to-use demo hero slides"
          >
            <i className="bi bi-magic"></i>
            <span>Load Demo Slides</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm"
          >
            <i className="bi bi-plus-lg"></i>
            <span>Add Slide</span>
          </button>

          {onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="btn btn-success btn-sm d-flex align-items-center gap-1 shadow-sm"
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
                  <span>Save All Settings</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Live Demo / Active Slider Preview */}
      {currentPreviewSlide && (
        <div
          className="card border-0 shadow-sm overflow-hidden"
          onMouseEnter={() => setIsPreviewPaused(true)}
          onMouseLeave={() => setIsPreviewPaused(false)}
        >
          <div className="card-header bg-body-tertiary border-bottom d-flex align-items-center justify-content-between py-2 px-3">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-display text-primary"></i>
              <span className="fw-semibold small text-body">
                {isShowingDemoPreview ? "Demo Slider Preview" : "Live Storefront Slider Preview"}
              </span>
              {isShowingDemoPreview && (
                <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle">
                  Demo Mode
                </span>
              )}
            </div>

            <div className="d-flex align-items-center gap-2">
              {isShowingDemoPreview && (
                <button
                  type="button"
                  onClick={handleLoadDemoSlides}
                  className="btn btn-link btn-sm text-decoration-none p-0 fw-semibold"
                >
                  Use These Demo Slides
                </button>
              )}
              <span className="text-muted small">
                {safePreviewIndex + 1} / {previewSlides.length}
              </span>
            </div>
          </div>

          <div
            className="position-relative text-white overflow-hidden"
            style={{
              minHeight: "240px",
              background: "linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #0b1120 100%)",
            }}
          >
            {/* Background Image */}
            {currentPreviewSlide.imageUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={resolveSettingMediaUrl(currentPreviewSlide.imageUrl)}
                alt={currentPreviewSlide.title}
                className="position-absolute top-0 start-0 w-100 h-100 object-fit-cover"
                style={{ opacity: 0.42 }}
              />
            )}

            {/* Gradient Overlay */}
            <div
              className="position-absolute top-0 start-0 w-100 h-100"
              style={{
                background:
                  "linear-gradient(90deg, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.68) 55%, rgba(15,23,42,0.25) 100%)",
              }}
            />

            {/* Slide Content */}
            <div
              className="position-relative d-flex flex-column justify-content-center p-4 p-md-5"
              style={{ minHeight: "240px", maxWidth: "680px", zIndex: 2 }}
            >
              {currentPreviewSlide.badgeText && (
                <div className="mb-2">
                  <span className="badge text-bg-warning text-uppercase fw-bold px-2 py-1">
                    {currentPreviewSlide.badgeText}
                  </span>
                </div>
              )}

              <h3 className="fw-bold mb-2 text-white" style={{ lineHeight: 1.2 }}>
                {currentPreviewSlide.title}
              </h3>

              {currentPreviewSlide.subtitle && (
                <p
                  className="mb-3 small text-light"
                  style={{ opacity: 0.85, maxWidth: "540px" }}
                >
                  {currentPreviewSlide.subtitle}
                </p>
              )}

              <div className="d-flex flex-wrap align-items-center gap-2">
                <span className="btn btn-primary btn-sm px-3 fw-semibold">
                  {currentPreviewSlide.ctaText || "Explore Now"}{" "}
                  <i className="bi bi-arrow-right ms-1"></i>
                </span>
                <span className="small text-light font-monospace" style={{ opacity: 0.7 }}>
                  {currentPreviewSlide.linkUrl || "/shop"}
                </span>
              </div>
            </div>

            {/* Prev / Next Controls */}
            {previewSlides.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setPreviewIndex(
                      (prev) => (prev - 1 + previewSlides.length) % previewSlides.length,
                    )
                  }
                  className="btn btn-dark btn-sm rounded-circle position-absolute top-50 start-0 translate-middle-y ms-2 d-flex align-items-center justify-content-center"
                  style={{ width: "34px", height: "34px", opacity: 0.8, zIndex: 3 }}
                  title="Previous slide"
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPreviewIndex((prev) => (prev + 1) % previewSlides.length)
                  }
                  className="btn btn-dark btn-sm rounded-circle position-absolute top-50 end-0 translate-middle-y me-2 d-flex align-items-center justify-content-center"
                  style={{ width: "34px", height: "34px", opacity: 0.8, zIndex: 3 }}
                  title="Next slide"
                >
                  <i className="bi bi-chevron-right"></i>
                </button>

                {/* Indicator Dots */}
                <div
                  className="position-absolute bottom-0 start-50 translate-middle-x mb-2 d-flex align-items-center gap-2"
                  style={{ zIndex: 3 }}
                >
                  {previewSlides.map((s, idx) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setPreviewIndex(idx)}
                      aria-label={`Go to slide ${idx + 1}`}
                      className="border-0 p-0 rounded-pill"
                      style={{
                        width: idx === safePreviewIndex ? "24px" : "8px",
                        height: "8px",
                        backgroundColor:
                          idx === safePreviewIndex ? "#ffffff" : "rgba(255,255,255,0.45)",
                        transition: "all 0.2s ease",
                        cursor: "pointer",
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Banner List Cards */}
      {banners.length === 0 ? (
        <div className="text-center py-5 px-4 border border-2 border-dashed rounded-3 bg-body-tertiary">
          <i className="bi bi-images display-4 text-secondary d-block mb-2"></i>
          <h5 className="fw-bold text-body">No Hero Banners Configured</h5>
          <p className="text-muted small mx-auto mb-3" style={{ maxWidth: "420px" }}>
            Click &quot;Add Slide&quot; to create a custom promotional banner, or load the
            ready-made demo slides to get started immediately.
          </p>
          <div className="d-flex justify-content-center flex-wrap gap-2">
            <button
              type="button"
              onClick={handleLoadDemoSlides}
              className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1"
            >
              <i className="bi bi-magic"></i>
              <span>Load Demo Slides</span>
            </button>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1"
            >
              <i className="bi bi-plus-lg"></i>
              <span>Create First Banner</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {banners.map((slide, idx) => (
            <div
              key={slide.id}
              className={`card card-glass overflow-hidden ${
                slide.isActive ? "" : "opacity-75"
              }`}
            >
              <div className="card-body p-3">
                <div className="d-flex align-items-start align-items-sm-center gap-3">
                  {/* Reorder Rail */}
                  <div className="d-flex flex-column align-items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, "up")}
                      className="btn btn-outline-secondary btn-sm d-flex align-items-center justify-content-center p-0"
                      style={{ width: "26px", height: "24px" }}
                      title="Move up"
                      aria-label={`Move slide ${idx + 1} up`}
                    >
                      <i className="bi bi-chevron-up" style={{ fontSize: "0.7rem" }}></i>
                    </button>
                    <span
                      className="badge rounded-pill text-bg-secondary"
                      style={{ fontSize: "0.65rem", minWidth: "26px" }}
                    >
                      #{idx + 1}
                    </span>
                    <button
                      type="button"
                      disabled={idx === banners.length - 1}
                      onClick={() => handleMove(idx, "down")}
                      className="btn btn-outline-secondary btn-sm d-flex align-items-center justify-content-center p-0"
                      style={{ width: "26px", height: "24px" }}
                      title="Move down"
                      aria-label={`Move slide ${idx + 1} down`}
                    >
                      <i className="bi bi-chevron-down" style={{ fontSize: "0.7rem" }}></i>
                    </button>
                  </div>

                  {/* 16:9 Thumbnail */}
                  <div
                    className="rounded-2 border bg-body-secondary overflow-hidden flex-shrink-0 d-flex align-items-center justify-content-center position-relative"
                    style={{ width: "128px", height: "74px" }}
                  >
                    {slide.imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={resolveSettingMediaUrl(slide.imageUrl)}
                        alt={slide.title}
                        className="w-100 h-100 object-fit-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <i className="bi bi-image text-secondary fs-4"></i>
                    )}
                  </div>

                  {/* Slide Text Info */}
                  <div className="flex-grow-1 min-w-0">
                    <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                      <h6 className="mb-0 fw-bold text-body text-truncate" style={{ maxWidth: "100%" }}>
                        {slide.title}
                      </h6>
                      {slide.badgeText && (
                        <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle text-uppercase">
                          {slide.badgeText}
                        </span>
                      )}
                    </div>

                    {slide.subtitle && (
                      <p className="text-muted small text-truncate mb-2">
                        {slide.subtitle}
                      </p>
                    )}

                    <div className="d-flex flex-wrap align-items-center gap-3 text-muted small">
                      <span className="d-inline-flex align-items-center gap-1 min-w-0 text-truncate">
                        <i className="bi bi-link-45deg flex-shrink-0"></i>
                        <span className="font-monospace text-truncate">
                          {slide.linkUrl || "/shop"}
                        </span>
                      </span>
                      {slide.ctaText && (
                        <span className="d-inline-flex align-items-center gap-1 flex-shrink-0">
                          <i className="bi bi-cursor"></i>
                          <span>{slide.ctaText}</span>
                        </span>
                      )}
                      <span className="d-inline-flex align-items-center gap-1 flex-shrink-0">
                        <i className="bi bi-sort-numeric-down"></i>
                        <span>Order: {slide.sortOrder}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dedicated Card Footer Action Bar */}
              <div className="card-footer d-flex flex-wrap align-items-center justify-content-between gap-2 py-2 px-3">
                <div className="d-flex align-items-center gap-2">
                  <div className="form-check form-switch mb-0 d-flex align-items-center gap-2">
                    <input
                      className="form-check-input mt-0"
                      type="checkbox"
                      role="switch"
                      id={`slide-active-${slide.id}`}
                      checked={slide.isActive !== false}
                      onChange={() => handleToggleActive(slide.id)}
                      style={{ cursor: "pointer" }}
                    />
                    <label
                      className={`form-check-label small fw-semibold ${
                        slide.isActive !== false ? "text-success" : "text-muted"
                      }`}
                      htmlFor={`slide-active-${slide.id}`}
                      style={{ cursor: "pointer" }}
                    >
                      {slide.isActive !== false ? "Active on Storefront" : "Hidden"}
                    </label>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(slide)}
                    className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1 px-2.5"
                    title="Edit slide"
                  >
                    <i className="bi bi-pencil-square"></i>
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(slide.id)}
                    className="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1 px-2.5"
                    title="Remove slide"
                  >
                    <i className="bi bi-trash"></i>
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide Edit / Create Modal (Bootstrap 5) */}
      {isModalOpen && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.55)" }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-body-tertiary">
                <h5 className="modal-title fw-bold text-body d-flex align-items-center gap-2">
                  <i className="bi bi-images text-primary"></i>
                  <span>
                    {editingBanner ? "Edit Hero Banner Slide" : "Add New Hero Banner"}
                  </span>
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsModalOpen(false)}
                  aria-label="Close"
                ></button>
              </div>

              <form onSubmit={handleSaveModal}>
                <div className="modal-body p-4">
                  {uploadError && (
                    <div className="alert alert-danger py-2 px-3 small mb-3">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      {uploadError}
                    </div>
                  )}

                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label small fw-semibold text-body">
                        Headline Title <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        placeholder="e.g. Next-Gen Gaming Laptops"
                        className="form-control form-control-sm"
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold text-body">
                        Tagline / Subtitle
                      </label>
                      <input
                        type="text"
                        value={formData.subtitle || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, subtitle: e.target.value })
                        }
                        placeholder="e.g. Powered by RTX 4090 GPUs with up to 240Hz OLED screens"
                        className="form-control form-control-sm"
                      />
                    </div>

                    {/* Web / Default Hero Image */}
                    <div className="col-12">
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <label className="form-label small fw-semibold text-body mb-0">
                          Web / Default Banner Image <span className="text-danger">*</span>
                        </label>
                        <button
                          type="button"
                          disabled={uploadingField !== null}
                          onClick={() => webFileRef.current?.click()}
                          className="btn btn-outline-primary btn-sm py-0 px-2"
                        >
                          <i className="bi bi-cloud-upload me-1"></i>
                          {uploadingField === "web" ? "Uploading..." : "Upload Image"}
                        </button>
                        <input
                          ref={webFileRef}
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,.svg,.gif"
                          className="d-none"
                          onChange={(e) => void handleUploadImage(e, "web")}
                        />
                      </div>
                      <input
                        type="text"
                        required
                        value={formData.imageUrl}
                        onChange={(e) =>
                          setFormData({ ...formData, imageUrl: e.target.value })
                        }
                        placeholder="Upload above or paste /uploads/banners/... or https://..."
                        className="form-control form-control-sm font-monospace"
                      />
                    </div>

                    {/* Optional Mobile Hero Image */}
                    <div className="col-12">
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <label className="form-label small fw-semibold text-body mb-0">
                          Mobile Banner Image{" "}
                          <span className="text-muted fw-normal">
                            (Optional — falls back to Web image)
                          </span>
                        </label>
                        <button
                          type="button"
                          disabled={uploadingField !== null}
                          onClick={() => mobileFileRef.current?.click()}
                          className="btn btn-outline-secondary btn-sm py-0 px-2"
                        >
                          <i className="bi bi-phone me-1"></i>
                          {uploadingField === "mobile"
                            ? "Uploading..."
                            : "Upload Mobile Image"}
                        </button>
                        <input
                          ref={mobileFileRef}
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,.svg,.gif"
                          className="d-none"
                          onChange={(e) => void handleUploadImage(e, "mobile")}
                        />
                      </div>
                      <input
                        type="text"
                        value={formData.mobileImageUrl || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, mobileImageUrl: e.target.value })
                        }
                        placeholder="Optional mobile-cropped banner URL"
                        className="form-control form-control-sm font-monospace"
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-body">
                        CTA Button Text
                      </label>
                      <input
                        type="text"
                        value={formData.ctaText || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, ctaText: e.target.value })
                        }
                        placeholder="Explore Now"
                        className="form-control form-control-sm"
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-body">
                        Target Link URL
                      </label>
                      <input
                        type="text"
                        value={formData.linkUrl || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, linkUrl: e.target.value })
                        }
                        placeholder="/shop"
                        className="form-control form-control-sm font-monospace"
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-body">
                        Badge Pill Text
                      </label>
                      <input
                        type="text"
                        value={formData.badgeText || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, badgeText: e.target.value })
                        }
                        placeholder="HOT DEAL, NEW LAUNCH"
                        className="form-control form-control-sm"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-body">
                        Sort Order
                      </label>
                      <input
                        type="number"
                        value={formData.sortOrder}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            sortOrder: parseInt(e.target.value, 10) || 0,
                          })
                        }
                        className="form-control form-control-sm"
                      />
                    </div>

                    <div className="col-md-6 d-flex align-items-end pb-1">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          id="heroBannerActiveSwitch"
                          checked={formData.isActive}
                          onChange={(e) =>
                            setFormData({ ...formData, isActive: e.target.checked })
                          }
                        />
                        <label
                          className="form-check-label small fw-semibold text-body"
                          htmlFor="heroBannerActiveSwitch"
                        >
                          Display Active on Storefront
                        </label>
                      </div>
                    </div>

                    {/* Live Preview Snippet */}
                    {formData.imageUrl && (
                      <div className="col-12">
                        <div className="p-2 rounded-3 border bg-body-tertiary">
                          <div className="small fw-semibold text-muted text-uppercase mb-2">
                            Slide Preview
                          </div>
                          <div
                            className="position-relative rounded-2 overflow-hidden bg-dark text-white p-3 d-flex flex-column justify-content-end"
                            style={{ height: "130px" }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={resolveSettingMediaUrl(formData.imageUrl)}
                              alt="Preview"
                              className="position-absolute top-0 start-0 w-100 h-100 object-fit-cover"
                              style={{ opacity: 0.5 }}
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                            <div className="position-relative" style={{ zIndex: 1 }}>
                              {formData.badgeText && (
                                <span className="badge text-bg-warning text-uppercase mb-1">
                                  {formData.badgeText}
                                </span>
                              )}
                              <h6 className="fw-bold mb-0 text-truncate text-white">
                                {formData.title || "Headline Title"}
                              </h6>
                              <p
                                className="small mb-0 text-truncate text-light"
                                style={{ opacity: 0.85 }}
                              >
                                {formData.subtitle || "Promotional subtitle"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-footer bg-body-tertiary">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn btn-secondary btn-sm"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm px-3">
                    {editingBanner ? "Update Slide" : "Add Slide"}
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
