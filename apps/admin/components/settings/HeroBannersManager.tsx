"use client";

import React, { useState, useMemo } from "react";

export interface HeroBannerSlide {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
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
  linkUrl: "/shop",
  badgeText: "HOT DEAL",
  sortOrder: 0,
  isActive: true,
};

export function HeroBannersManager({
  bannersJson = "[]",
  onChange,
  onSave,
  saving = false,
}: HeroBannersManagerProps) {
  const [editingBanner, setEditingBanner] = useState<HeroBannerSlide | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Omit<HeroBannerSlide, "id">>(DEFAULT_BANNER);

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

  const commitChanges = (updated: HeroBannerSlide[]) => {
    const sorted = [...updated].sort((a, b) => a.sortOrder - b.sortOrder);
    onChange(JSON.stringify(sorted, null, 2));
  };

  const handleOpenAdd = () => {
    setEditingBanner(null);
    setFormData({
      ...DEFAULT_BANNER,
      sortOrder: banners.length > 0 ? Math.max(...banners.map((b) => b.sortOrder)) + 1 : 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (banner: HeroBannerSlide) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || "",
      imageUrl: banner.imageUrl,
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
      b.id === id ? { ...b, isActive: !b.isActive } : b
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

    // Swap sortOrders
    const tempOrder = current.sortOrder;
    current.sortOrder = target.sortOrder;
    target.sortOrder = tempOrder;

    // In case they had identical sortOrders, enforce index based spacing
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
          : b
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
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <div>
          <h4 className="text-sm font-bold text-slate-800">
            Storefront Hero Banners ({banners.length})
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure visual marketing slides displayed in the homepage carousel.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <i className="bi bi-plus-lg text-xs"></i>
            <span>Add Slide</span>
          </button>
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-check2 text-xs"></i>
                  <span>Save All Settings</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Banner list cards */}
      {banners.length === 0 ? (
        <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl bg-white">
          <i className="bi bi-images text-4xl text-slate-300 mb-2 block"></i>
          <h5 className="text-sm font-bold text-slate-700">No Hero Banners Configured</h5>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Click &quot;Add Slide&quot; above to create dynamic promotional banners for your storefront homepage.
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="mt-4 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <i className="bi bi-plus-lg"></i>
            Create First Banner
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((slide, idx) => (
            <div
              key={slide.id}
              className={`p-4 bg-white rounded-xl border transition-all ${
                slide.isActive
                  ? "border-slate-200 hover:border-blue-300 shadow-2xs"
                  : "border-slate-200 bg-slate-50/60 opacity-60"
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Left: Reorder controls & Thumbnail Preview */}
                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  {/* Reorder Buttons */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, "up")}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 transition-colors cursor-pointer"
                      title="Move up"
                    >
                      <i className="bi bi-chevron-up text-xs font-bold"></i>
                    </button>
                    <button
                      type="button"
                      disabled={idx === banners.length - 1}
                      onClick={() => handleMove(idx, "down")}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 transition-colors cursor-pointer"
                      title="Move down"
                    >
                      <i className="bi bi-chevron-down text-xs font-bold"></i>
                    </button>
                  </div>

                  {/* Thumbnail */}
                  <div className="relative w-20 h-14 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {slide.imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={slide.imageUrl}
                        alt={slide.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <i className="bi bi-image text-slate-300 text-lg"></i>
                    )}
                  </div>

                  {/* Slide Text Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h5 className="text-sm font-bold text-slate-900 truncate">
                        {slide.title}
                      </h5>
                      {slide.badgeText && (
                        <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-md bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                          {slide.badgeText}
                        </span>
                      )}
                    </div>
                    {slide.subtitle && (
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {slide.subtitle}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 truncate">
                        <i className="bi bi-link-45deg"></i>
                        <span className="truncate">{slide.linkUrl || "/shop"}</span>
                      </span>
                      <span>Order: {slide.sortOrder}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                  {/* Active Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleActive(slide.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                      slide.isActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-500 border border-slate-200"
                    }`}
                  >
                    {slide.isActive ? "Active" : "Hidden"}
                  </button>

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(slide)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    title="Edit slide"
                  >
                    <i className="bi bi-pencil-square text-sm"></i>
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDelete(slide.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Remove slide"
                  >
                    <i className="bi bi-trash text-sm"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h4 className="text-sm font-bold text-slate-900">
                {editingBanner ? "Edit Hero Banner Slide" : "Add New Hero Banner"}
              </h4>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <i className="bi bi-x-lg text-sm"></i>
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Headline Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Next-Gen Gaming Laptops"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tagline / Subtitle
                </label>
                <input
                  type="text"
                  value={formData.subtitle || ""}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="e.g. Powered by RTX 4090 GPUs with up to 240Hz OLED screens"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Banner Image URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="e.g. /banners/hero-gaming.webp or https://..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Link URL
                  </label>
                  <input
                    type="text"
                    value={formData.linkUrl || ""}
                    onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                    placeholder="/category/laptops"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Badge Pill Text
                  </label>
                  <input
                    type="text"
                    value={formData.badgeText || ""}
                    onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
                    placeholder="HOT DEAL, NEW LAUNCH"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, sortOrder: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-700">Display Active on Storefront</span>
                  </label>
                </div>
              </div>

              {/* Live Preview Snippet */}
              {formData.imageUrl && (
                <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Live Preview
                  </p>
                  <div className="relative rounded-lg overflow-hidden bg-slate-800 text-white p-4 h-28 flex flex-col justify-end">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="absolute inset-0 w-full h-full object-cover opacity-50"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                    <div className="relative z-10">
                      {formData.badgeText && (
                        <span className="text-[9px] font-black uppercase bg-amber-500 text-slate-900 px-1.5 py-0.5 rounded">
                          {formData.badgeText}
                        </span>
                      )}
                      <h5 className="text-xs font-black truncate mt-1">
                        {formData.title || "Headline Title"}
                      </h5>
                      <p className="text-[10px] text-slate-300 truncate">
                        {formData.subtitle || "Promotional subtitle"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {editingBanner ? "Update Slide" : "Add Slide"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
