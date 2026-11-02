"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Star,
  ShoppingCart,
  Zap,
  Heart,
  Share2,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Sparkles,
  Info,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ArrowLeft,
  Loader2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
} from "lucide-react";
import {
  Product,
  formatBDT,
  getProductById,
  getRelatedProducts,
  ALL_PRODUCTS,
} from "../../data/mock-catalog";
import { useStore } from "../../context/StoreContext";
import { ProductCard } from "../UI/ProductCard";
import { apiClient } from "../../lib/api-client";

interface ProductDetailViewProps {
  slug?: string;
  productId?: string;
}

export function ProductDetailView({ slug, productId }: ProductDetailViewProps) {
  const router = useRouter();
  const { addToCart, toggleWishlist, isWishlisted, wishlistIds } = useStore();

  const [productData, setProductData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Gallery state
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isHoverZooming, setIsHoverZooming] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isLightboxZoomed, setIsLightboxZoomed] = useState(false);

  // Variant selections: attributeName -> value
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"specs" | "descriptions">("specs");
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Load product from API or mock
  useEffect(() => {
    async function loadProduct() {
      const targetSlug = slug || productId;
      if (!targetSlug) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const live = await apiClient.get<any>(`/products/${encodeURIComponent(targetSlug)}`, {
          skipAuth: true,
        });
        if (live) {
          setProductData(live);
        }
      } catch {
        // Fallback to local mock catalog
        const mock =
          ALL_PRODUCTS.find((p) => p.slug === targetSlug || p.id === targetSlug) ||
          (productId ? getProductById(productId) : null);
        setProductData(mock || null);
      } finally {
        setIsLoading(false);
      }
    }

    loadProduct();
  }, [slug, productId]);

  // Extract gallery images
  const galleryImages: string[] = useMemo(() => {
    if (!productData) return [];
    if (productData.images && productData.images.length > 0) {
      return productData.images.map((img: any) =>
        typeof img === "string" ? img : img.imageUrl
      );
    }
    if (productData.image) return [productData.image];
    return ["/placeholder.png"];
  }, [productData]);

  // Extract distinct attributes across variants
  const distinctAttributes = useMemo(() => {
    if (!productData?.variants || !Array.isArray(productData.variants)) return [];

    const attrMap = new Map<
      string,
      {
        name: string;
        type: string;
        values: Array<{ value: string; label?: string | null; colorCode?: string | null }>;
      }
    >();

    productData.variants.forEach((v: any) => {
      if (Array.isArray(v.attributes)) {
        v.attributes.forEach((attr: any) => {
          const name = attr.attributeName || "Option";
          const type = attr.attributeType || "TEXT";
          if (!attrMap.has(name)) {
            attrMap.set(name, { name, type, values: [] });
          }
          const group = attrMap.get(name)!;
          if (!group.values.some((val) => val.value === attr.value)) {
            group.values.push({
              value: attr.value,
              label: attr.label,
              colorCode: attr.colorCode,
            });
          }
        });
      } else if (v.type && v.value) {
        // Support legacy mock format
        const name = v.type.charAt(0).toUpperCase() + v.type.slice(1);
        const type = v.type === "color" ? "COLOR" : "TEXT";
        if (!attrMap.has(name)) {
          attrMap.set(name, { name, type, values: [] });
        }
        const group = attrMap.get(name)!;
        if (!group.values.some((val) => val.value === v.value)) {
          group.values.push({
            value: v.value,
            label: v.label,
            colorCode: v.colorCode,
          });
        }
      }
    });

    return Array.from(attrMap.values());
  }, [productData]);

  // Normalize dynamic specifications from API or mock
  const specList = useMemo<Array<{ key: string; value: string }>>(() => {
    if (!productData) return [];
    if (Array.isArray(productData.specifications)) {
      return productData.specifications.filter((s: any) => s && (s.key || s.value));
    }
    if (productData.specifications && typeof productData.specifications === "object") {
      const items: Array<{ key: string; value: string }> = [];
      Object.entries(productData.specifications).forEach(([grpOrKey, val]) => {
        if (typeof val === "object" && val !== null) {
          Object.entries(val).forEach(([k, v]) => {
            items.push({ key: `${grpOrKey} - ${k}`, value: String(v) });
          });
        } else if (val) {
          items.push({ key: grpOrKey, value: String(val) });
        }
      });
      return items;
    }
    return [];
  }, [productData]);

  // Initialize selected variants
  useEffect(() => {
    if (distinctAttributes.length > 0) {
      const initial: Record<string, string> = {};
      distinctAttributes.forEach((attr) => {
        const firstVal = attr.values[0];
        if (firstVal) {
          initial[attr.name] = firstVal.value;
        }
      });
      setSelectedVariants(initial);
    }
  }, [distinctAttributes]);

  // Find active variant matching selected attributes
  const activeVariant = useMemo(() => {
    if (!productData?.variants || productData.variants.length === 0) return null;

    const matched = productData.variants.find((v: any) => {
      if (Array.isArray(v.attributes) && v.attributes.length > 0) {
        return v.attributes.every(
          (attr: any) => selectedVariants[attr.attributeName] === attr.value
        );
      }
      if (v.type && v.value) {
        const typeName = v.type.charAt(0).toUpperCase() + v.type.slice(1);
        return selectedVariants[typeName] === v.value;
      }
      return true;
    });

    return matched || productData.variants[0];
  }, [productData, selectedVariants]);

  // Calculate pricing & stock from active variant or product root
  const currentPrice = useMemo(() => {
    if (activeVariant) {
      return activeVariant.salePrice !== null && activeVariant.salePrice !== undefined
        ? Number(activeVariant.salePrice)
        : Number(activeVariant.regularPrice);
    }
    return productData ? Number(productData.price || 0) : 0;
  }, [activeVariant, productData]);

  const regularPrice = useMemo(() => {
    if (activeVariant?.regularPrice) {
      return Number(activeVariant.regularPrice);
    }
    return productData?.regularPrice ? Number(productData.regularPrice) : null;
  }, [activeVariant, productData]);

  const discountSavings = regularPrice && regularPrice > currentPrice ? regularPrice - currentPrice : 0;
  const discountPercent =
    regularPrice && regularPrice > currentPrice
      ? Math.round(((regularPrice - currentPrice) / regularPrice) * 100)
      : null;

  const inStock = activeVariant ? Boolean(activeVariant.inStock) : Boolean(productData?.inStock ?? true);
  const stockQuantity = activeVariant?.stockQuantity ?? (productData?.stockTotal || 10);
  const sku = activeVariant?.sku || productData?.sku;

  // Track scroll position for mobile bottom sticky buy bar
  useEffect(() => {
    const handleScroll = () => {
      setShowStickyBar(window.scrollY > 480);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lightbox keyboard navigation (Escape, ArrowLeft, ArrowRight) & body scroll lock
  useEffect(() => {
    if (!isLightboxOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
        setIsLightboxZoomed(false);
      } else if (e.key === "ArrowRight") {
        setIsLightboxZoomed(false);
        setActiveImageIndex((prev) =>
          galleryImages.length > 0 ? (prev + 1) % galleryImages.length : 0
        );
      } else if (e.key === "ArrowLeft") {
        setIsLightboxZoomed(false);
        setActiveImageIndex((prev) =>
          galleryImages.length > 0
            ? (prev - 1 + galleryImages.length) % galleryImages.length
            : 0
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLightboxOpen, galleryImages.length]);

  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-[1320px] xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3 animate-pulse space-y-3">
        <div className="h-4 bg-slate-200/70 rounded w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-7 items-stretch">
          <div className="lg:col-span-5 bg-white rounded-2xl p-3.5 border border-slate-200/80 h-[368px] xl:h-[438px]" />
          <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200/80 space-y-3.5 h-[368px] xl:h-[438px]">
            <div className="h-5 bg-slate-100 rounded w-1/3" />
            <div className="h-7 bg-slate-100 rounded w-5/6" />
            <div className="h-12 bg-slate-100 rounded-xl w-full" />
            <div className="h-16 bg-slate-100 rounded-xl w-full" />
            <div className="h-11 bg-slate-100 rounded-xl w-full" />
            <div className="h-12 bg-slate-100 rounded-xl w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="max-w-[1320px] xl:max-w-[1440px] mx-auto px-4 py-16 text-center">
        <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3 border border-red-200">
          <Info className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-1.5">Product Not Found</h2>
        <p className="text-slate-500 text-xs max-w-md mx-auto mb-5">
          The product you are looking for does not exist or may have been removed from our catalog.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Browse All Products</span>
        </Link>
      </div>
    );
  }

  const categoryName = productData.category?.name || productData.category || "General";
  const categorySlug =
    productData.category?.slug || categoryName.toLowerCase().replace(/\s+/g, "-");
  const brandName = productData.brand?.name || productData.brand;

  const isItemWishlisted = isWishlisted(productData.id);
  const selectedVariantSummary = Object.values(selectedVariants).join(" / ");

  const handleAddToCartClick = () => {
    const productItem: Product = {
      id: productData.id,
      slug: productData.slug,
      title: productData.title,
      category: categoryName,
      brand: brandName,
      price: currentPrice,
      regularPrice: regularPrice || undefined,
      discountPercent: discountPercent || undefined,
      image: galleryImages[0] || "/placeholder.png",
      rating: productData.rating || 0,
      reviewsCount: productData.reviewsCount || 0,
      inStock,
    };
    addToCart(
      productItem,
      quantity,
      selectedVariantSummary || undefined,
      currentPrice,
      activeVariant?.id
    );
  };

  const handleBuyNowClick = () => {
    handleAddToCartClick();
    router.push("/checkout");
  };

  const handleShareClick = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const relatedList =
    productData.relatedProducts && productData.relatedProducts.length > 0
      ? productData.relatedProducts.map((p: any) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          category: p.category?.name || "General",
          brand: p.brand?.name,
          price: p.salePrice ? Number(p.salePrice) : Number(p.regularPrice),
          regularPrice: Number(p.regularPrice),
          discountPercent: p.discountPercent,
          rating: p.rating || 0,
          reviewsCount: p.reviewsCount || 0,
          image: p.primaryImage?.imageUrl || "/placeholder.png",
          inStock: p.inStock,
        }))
      : getRelatedProducts(productData.id, 4);

  return (
    <div className="max-w-[1320px] xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 lg:py-3.5">
      {/* 1. Compact Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center space-x-1.5 text-xs font-medium text-slate-500 mb-2.5 lg:mb-3 overflow-x-auto whitespace-nowrap"
      >
        <Link href="/" className="hover:text-blue-700 transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" aria-hidden="true" />
        <Link href={`/category/${categorySlug}`} className="hover:text-blue-700 transition-colors">
          {categoryName}
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" aria-hidden="true" />
        <span className="text-slate-800 font-semibold truncate max-w-[260px] sm:max-w-md">
          {productData.title}
        </span>
      </nav>

      {/* 2. Above-the-Fold Product Showcase (Asymmetric 5 + 7 Studio Layout for 1366px & 1920px) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 xl:gap-7 items-stretch mb-8 lg:mb-10">
        {/* Left Column (5 Cols): Full-Cover Main Image with Hover Magnify & Bottom Pagination */}
        <div className="lg:col-span-5 flex">
          <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200/90 shadow-xs relative w-full flex flex-col justify-between gap-2.5">
            {/* Main Primary Image Stage (Full Cover + Hover Magnify + Click for Lightbox) */}
            <div
              role="button"
              tabIndex={0}
              aria-label={`Open ${productData.title} image gallery in fullscreen lightbox`}
              onClick={() => {
                setIsLightboxZoomed(false);
                setIsLightboxOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setIsLightboxZoomed(false);
                  setIsLightboxOpen(true);
                }
              }}
              onMouseEnter={() => setIsHoverZooming(true)}
              onMouseLeave={() => {
                setIsHoverZooming(false);
                setZoomOrigin({ x: 50, y: 50 });
              }}
              onMouseMove={handleImageMouseMove}
              className="relative w-full flex-1 min-h-[260px] sm:min-h-[295px] lg:min-h-[290px] xl:min-h-[350px] bg-slate-100 rounded-xl overflow-hidden cursor-zoom-in group select-none border border-slate-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              {/* Top Overlay Badges */}
              <div className="absolute top-2.5 left-2.5 z-20 flex flex-wrap gap-1.5 items-center pointer-events-none">
                {discountPercent && (
                  <span className="bg-orange-600 text-white text-[11px] font-black px-2 py-0.5 rounded-md shadow-xs tabular-nums">
                    -{discountPercent}% OFF
                  </span>
                )}
                {productData.isFeatured && (
                  <span className="bg-blue-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                    Featured
                  </span>
                )}
              </div>

              {/* Top-Right Quick Actions: Share & Expand Lightbox */}
              <div
                className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsLightboxZoomed(false);
                    setIsLightboxOpen(true);
                  }}
                  className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-600 hover:text-blue-600 border border-slate-200/90 flex items-center justify-center transition-all cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  aria-label="Open fullscreen image slider"
                  title="Fullscreen Lightbox"
                >
                  <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={handleShareClick}
                  className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-600 hover:text-blue-600 border border-slate-200/90 flex items-center justify-center transition-all cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  aria-label="Share product link"
                  title="Copy product link"
                >
                  <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>

              {copiedLink && (
                <div
                  role="status"
                  aria-live="polite"
                  className="absolute top-12 right-2.5 z-30 bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-lg pointer-events-none"
                >
                  Link copied!
                </div>
              )}

              {/* Bottom Hint Pill (Fades out while actively magnifying) */}
              <div
                className={`absolute bottom-2.5 right-2.5 z-20 pointer-events-none transition-opacity duration-200 ${
                  isHoverZooming ? "opacity-0" : "opacity-100"
                }`}
              >
                <span className="inline-flex items-center gap-1 bg-slate-900/75 backdrop-blur-xs text-white text-[10px] font-semibold px-2.5 py-1 rounded-full shadow-xs">
                  <ZoomIn className="w-3 h-3 text-blue-300" aria-hidden="true" />
                  <span>Hover to Zoom • Click to Expand</span>
                </span>
              </div>

              {/* Full-Cover Image with Smooth Magnify Transform */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeImageIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="relative w-full h-full overflow-hidden"
                >
                  <div
                    className="relative w-full h-full transition-transform duration-200 ease-out will-change-transform"
                    style={{
                      transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                      transform: isHoverZooming ? "scale(2.15)" : "scale(1)",
                    }}
                  >
                    <Image
                      src={galleryImages[activeImageIndex] || "/placeholder.png"}
                      alt={productData.title}
                      fill
                      priority
                      className="object-cover w-full h-full"
                      sizes="(max-width: 1024px) 100vw, 520px"
                    />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Image Pagination & Thumbnail Strip (Below Main Image) */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              {/* Thumbnail Strip */}
              <div className="flex items-center gap-2 overflow-x-auto py-0.5 flex-1">
                {galleryImages.map((img, idx) => {
                  const isActive = activeImageIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      aria-label={`View ${productData.title} image ${idx + 1}`}
                      aria-pressed={isActive}
                      className={`relative w-12 h-12 xl:w-13 xl:h-13 rounded-xl overflow-hidden bg-slate-100 border-2 transition-all cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                        isActive
                          ? "border-blue-600 ring-2 ring-blue-600/20 shadow-2xs scale-[1.02]"
                          : "border-slate-200/90 hover:border-slate-300 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`${productData.title} - thumbnail ${idx + 1}`}
                        fill
                        sizes="56px"
                        className="object-cover w-full h-full"
                      />
                    </button>
                  );
                })}
              </div>

              {/* Prev / Next + Dot Counter Pagination */}
              {galleryImages.length > 1 && (
                <div className="flex items-center gap-1.5 shrink-0 pl-1">
                  <span className="text-[11px] font-bold text-slate-500 tabular-nums mr-0.5">
                    {activeImageIndex + 1}/{galleryImages.length}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImageIndex((prev) =>
                        (prev - 1 + galleryImages.length) % galleryImages.length
                      )
                    }
                    className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white text-slate-600 hover:text-blue-700 flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImageIndex((prev) => (prev + 1) % galleryImages.length)
                    }
                    className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white text-slate-600 hover:text-blue-700 flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): Unified High-Conversion Buy Box */}
        <div className="lg:col-span-7 flex">
          <div className="bg-white rounded-2xl p-4 sm:p-5 xl:p-6 border border-slate-200/90 shadow-xs w-full flex flex-col justify-between">
            <div>
              {/* Row 1: Brand, SKU, Ratings & Stock Status */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-extrabold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-md">
                    {brandName || categoryName}
                  </span>
                  {sku && (
                    <span className="text-[11px] font-mono text-slate-400">
                      SKU: {sku}
                    </span>
                  )}
                  <span className="text-slate-200 hidden sm:inline" aria-hidden="true">
                    •
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById("customer-reviews-section");
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="inline-flex items-center space-x-1 text-xs font-bold text-slate-700 hover:text-blue-700 cursor-pointer transition-colors"
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                    <span className="tabular-nums">{(productData.rating || 0).toFixed(1)}</span>
                    <span className="text-slate-400 font-medium">
                      ({productData.reviewsCount || (productData.reviews?.length || 0)} reviews)
                    </span>
                  </button>
                </div>

                {/* Stock Status Pill */}
                <div
                  className={`inline-flex items-center space-x-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    inStock
                      ? "text-emerald-700 bg-emerald-50 border-emerald-200/80"
                      : "text-rose-700 bg-rose-50 border-rose-200/80"
                  }`}
                >
                  {inStock ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                      <span>In Stock ({stockQuantity})</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 text-rose-600" aria-hidden="true" />
                      <span>Out of Stock</span>
                    </>
                  )}
                </div>
              </div>

              {/* Row 2: Compact Product Title (Max 2 Lines so it never pushes CTAs off-screen) */}
              <h1
                title={productData.title}
                className="text-base sm:text-lg lg:text-xl xl:text-[22px] font-extrabold text-slate-900 tracking-tight leading-snug line-clamp-2 mb-2.5"
              >
                {productData.title}
              </h1>

              {/* Row 3: Inline Price Lockup & Compact Overview */}
              <div className="py-2.5 px-3.5 rounded-xl bg-slate-50/90 border border-slate-200/70 mb-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex items-baseline flex-wrap gap-2.5">
                    <span className="text-2xl lg:text-[26px] xl:text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                      {formatBDT(currentPrice)}
                    </span>
                    {regularPrice && regularPrice > currentPrice && (
                      <span className="text-xs sm:text-sm font-semibold text-slate-400 line-through tabular-nums">
                        {formatBDT(regularPrice)}
                      </span>
                    )}
                    {discountSavings > 0 && (
                      <span className="bg-emerald-600 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-md tabular-nums">
                        Save {formatBDT(discountSavings)}
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500 shrink-0" aria-hidden="true" />
                    <span>{productData.warrantyText || "Official Warranty & Tax Included"}</span>
                  </span>
                </div>

                {productData.shortDescription && (
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mt-1.5 pt-1.5 border-t border-slate-200/60">
                    {productData.shortDescription}
                  </p>
                )}
              </div>

              {/* Row 4: Compact Dynamic Variant Selectors */}
              {distinctAttributes.length > 0 && (
                <div className="space-y-2.5 mb-3.5">
                  {distinctAttributes.map((attr) => {
                    const selectedVal = selectedVariants[attr.name];
                    const isColor = attr.type === "COLOR";

                    return (
                      <div key={attr.name} className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-700 min-w-[76px]">
                          {attr.name}:
                        </span>

                        {isColor ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            {attr.values.map((valObj) => {
                              const isSelected = selectedVal === valObj.value;
                              return (
                                <button
                                  key={valObj.value}
                                  type="button"
                                  aria-label={`${attr.name}: ${valObj.value}`}
                                  aria-pressed={isSelected}
                                  onClick={() =>
                                    setSelectedVariants((prev) => ({
                                      ...prev,
                                      [attr.name]: valObj.value,
                                    }))
                                  }
                                  className={`group relative p-0.5 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center ${
                                    isSelected
                                      ? "border-blue-600 ring-2 ring-blue-600/25"
                                      : "border-slate-200 hover:border-slate-400"
                                  }`}
                                  title={valObj.value}
                                >
                                  <span
                                    className="w-6 h-6 rounded-full flex items-center justify-center border border-black/10"
                                    style={{ backgroundColor: valObj.colorCode || "#111" }}
                                  >
                                    {isSelected && (
                                      <Check className="w-3 h-3 text-white drop-shadow-xs stroke-[3]" />
                                    )}
                                  </span>
                                </button>
                              );
                            })}
                            <span className="text-xs font-semibold text-slate-600 ml-1">
                              {selectedVal}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {attr.values.map((valObj) => {
                              const isSelected = selectedVal === valObj.value;
                              return (
                                <button
                                  key={valObj.value}
                                  type="button"
                                  aria-pressed={isSelected}
                                  onClick={() =>
                                    setSelectedVariants((prev) => ({
                                      ...prev,
                                      [attr.name]: valObj.value,
                                    }))
                                  }
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                                    isSelected
                                      ? "bg-blue-700 text-white border-blue-700 shadow-2xs"
                                      : "bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50/40"
                                  }`}
                                >
                                  <span>{valObj.value}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Section: Single-Row Action Bar + Compact 3-Col Trust Strip */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              {/* Row 5: Quantity + Add to Cart + Buy Now + Wishlist on One Line */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
                {/* Quantity Counter (44px height) */}
                <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50/60 h-11 p-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-9 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-2xs transition-all cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <span className="w-8 text-center font-black text-sm text-slate-900 tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((q) => (inStock ? Math.min(stockQuantity, q + 1) : q + 1))
                    }
                    className="w-8 h-9 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-2xs transition-all cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>

                {/* Add to Cart CTA */}
                <button
                  type="button"
                  disabled={!inStock}
                  onClick={handleAddToCartClick}
                  className="flex-1 min-w-[135px] h-11 px-4 bg-blue-700 hover:bg-blue-800 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none text-white font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-center space-x-2 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                >
                  <ShoppingCart
                    className="w-4 h-4 shrink-0 group-hover:scale-105 transition-transform"
                    aria-hidden="true"
                  />
                  <span>{inStock ? "Add to Cart" : "Out of Stock"}</span>
                </button>

                {/* Buy Now Immediate Checkout CTA */}
                <button
                  type="button"
                  disabled={!inStock}
                  onClick={handleBuyNowClick}
                  className="flex-1 min-w-[135px] h-11 px-4 bg-orange-600 hover:bg-orange-700 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none text-white font-black text-xs sm:text-sm rounded-xl flex items-center justify-center space-x-1.5 shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <Zap className="w-4 h-4 shrink-0 fill-current" aria-hidden="true" />
                  <span>Buy Now</span>
                </button>

                {/* Wishlist Toggle Button */}
                <button
                  type="button"
                  onClick={() => toggleWishlist(productData.id)}
                  aria-pressed={isItemWishlisted}
                  className={`h-11 w-11 shrink-0 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                    isItemWishlisted
                      ? "bg-rose-50 text-rose-600 border-rose-200"
                      : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
                  }`}
                  aria-label="Save to Wishlist"
                >
                  <Heart
                    className={`w-4 h-4 ${isItemWishlisted ? "fill-current text-rose-500" : ""}`}
                    aria-hidden="true"
                  />
                </button>
              </div>

              {/* Row 6: Compact 3-Column Horizontal Trust & Delivery Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                <div className="flex items-center space-x-2 bg-slate-50/80 px-2.5 py-2 rounded-xl border border-slate-200/60">
                  <Truck className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-800 truncate">
                      Fast Delivery
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium truncate">
                      Dhaka ৳60 • Outside ৳120
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 bg-slate-50/80 px-2.5 py-2 rounded-xl border border-slate-200/60">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-800 truncate">
                      100% Genuine
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium truncate">
                      Official Brand Warranty
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 bg-slate-50/80 px-2.5 py-2 rounded-xl border border-slate-200/60">
                  <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-800 truncate">
                      7 Days Return
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium truncate">
                      Easy Replacement Policy
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Deep Dive Section: Tabs (Specifications, Descriptions) */}
      <div id="pdp-deep-dive" className="mb-10 scroll-mt-28">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          {/* Tab Headers */}
          <div className="flex border-b border-slate-200 bg-slate-50/70 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("specs")}
              className={`py-4 px-6 text-sm font-black transition-all cursor-pointer border-b-2 flex items-center space-x-2 shrink-0 ${
                activeTab === "specs"
                  ? "border-blue-700 text-blue-700 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>Specifications</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("descriptions")}
              className={`py-4 px-6 text-sm font-black transition-all cursor-pointer border-b-2 flex items-center space-x-2 shrink-0 ${
                activeTab === "descriptions"
                  ? "border-blue-700 text-blue-700 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>Descriptions</span>
            </button>
          </div>

          {/* Tab Contents */}
          <div className="p-6 sm:p-8">
            {/* Tab 1: Specifications Matrix */}
            {activeTab === "specs" && (
              <div>
                <h3 className="text-lg font-black text-slate-900 mb-4">
                  Technical Specifications
                </h3>
                <div className="rounded-xl overflow-hidden border border-slate-200 divide-y divide-slate-100">
                  {specList.length > 0 ? (
                    specList.map((item: { key: string; value: string }, idx: number) => (
                      <div
                        key={idx}
                        className={`grid grid-cols-1 sm:grid-cols-3 p-3.5 text-xs ${
                          idx % 2 === 0 ? "bg-slate-50/50" : "bg-white"
                        }`}
                      >
                        <span className="font-bold text-slate-600">{item.key}</span>
                        <span className="font-medium text-slate-800 sm:col-span-2">
                          {item.value}
                        </span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 text-xs bg-slate-50/50">
                        <span className="font-bold text-slate-500">Category</span>
                        <span className="font-medium text-slate-800 sm:col-span-2">{categoryName}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 text-xs">
                        <span className="font-bold text-slate-500">Brand</span>
                        <span className="font-medium text-slate-800 sm:col-span-2">{brandName || "Authentic"}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 text-xs bg-slate-50/50">
                        <span className="font-bold text-slate-500">Active SKU</span>
                        <span className="font-mono text-slate-800 sm:col-span-2">{sku || "Standard SKU"}</span>
                      </div>
                      {activeVariant?.weightGrams && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 text-xs">
                          <span className="font-bold text-slate-500">Weight</span>
                          <span className="font-medium text-slate-800 sm:col-span-2">{activeVariant.weightGrams}g</span>
                        </div>
                      )}
                      {distinctAttributes.map((attr) => (
                        <div key={attr.name} className="grid grid-cols-1 sm:grid-cols-3 p-3.5 text-xs">
                          <span className="font-bold text-slate-500">{attr.name}</span>
                          <span className="font-medium text-slate-800 sm:col-span-2">
                            {attr.values.map((v) => v.value).join(", ")}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Descriptions (Render Tiptap HTML cleanly) */}
            {activeTab === "descriptions" && (
              <div className="text-slate-700 leading-relaxed">
                <h3 className="text-lg font-black text-slate-900 mb-4">
                  About {productData.title}
                </h3>
                {productData.description ? (
                  <div
                    className="prose prose-slate max-w-none text-sm leading-relaxed prose-headings:font-bold prose-headings:text-slate-900 prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3 prose-h3:text-lg prose-h3:mt-4 prose-h3:mb-2 prose-p:my-2 prose-ul:my-2 prose-li:my-1 prose-img:rounded-xl prose-table:my-4"
                    dangerouslySetInnerHTML={{ __html: productData.description }}
                  />
                ) : (
                  <p className="text-sm">
                    {`Experience unprecedented performance and reliability with the ${productData.title}. Sourced through official authorized channels with verified quality guarantees for customers across Bangladesh.`}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Standalone Customer Reviews Section (Outside and Below Tabs) */}
      <div id="customer-reviews-section" className="mb-16 scroll-mt-28">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8">
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-200">
            <div>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-700" />
                <span>Customer Reviews</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Ratings &amp; real customer feedback for {productData.title}
              </p>
            </div>
            <span className="text-xs font-black px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200/60">
              {productData.reviewsCount || (productData.reviews?.length || 0)} Total Reviews
            </span>
          </div>

          <div className="space-y-8">
            {/* Review Header Scorecard */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="sm:col-span-4 flex flex-col items-center justify-center text-center border-b sm:border-b-0 sm:border-r border-slate-200 pb-4 sm:pb-0 sm:pr-4">
                <span className="text-5xl font-black text-slate-900 leading-none mb-1">
                  {(productData.rating || 0).toFixed(1)}
                </span>
                <div className="flex items-center text-amber-400 my-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(productData.rating || 0) ? "fill-current" : "text-slate-200"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  Based on {productData.reviewsCount || (productData.reviews?.length || 0)} verified ratings
                </span>
              </div>

              <div className="sm:col-span-8 flex flex-col justify-center space-y-1.5">
                {[
                  { star: "5 Star", pct: 85 },
                  { star: "4 Star", pct: 12 },
                  { star: "3 Star", pct: 2 },
                  { star: "2 Star", pct: 1 },
                  { star: "1 Star", pct: 0 },
                ].map((row) => (
                  <div key={row.star} className="flex items-center space-x-3 text-xs">
                    <span className="w-12 font-bold text-slate-600">{row.star}</span>
                    <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-amber-400 h-2 rounded-full"
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-medium text-slate-500">
                      {row.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Individual Review Comments */}
            <div className="space-y-4">
              {productData.reviews && productData.reviews.length > 0 ? (
                productData.reviews.map((rev: any) => (
                  <div
                    key={rev.id}
                    className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center">
                          {(rev.reviewerName || rev.userName || "C")[0]}
                        </div>
                        <div>
                          <h5 className="text-xs font-black text-slate-800">
                            {rev.reviewerName || rev.userName || "Verified Customer"}
                          </h5>
                          {(rev.isVerifiedPurchase || rev.isVerified) && (
                            <span className="text-[10px] text-emerald-600 font-bold flex items-center">
                              <CheckCircle2 className="w-3 h-3 mr-0.5" />
                              Verified Purchase
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : rev.date || "Recent"}
                      </span>
                    </div>
                    <div className="flex items-center text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${i < rev.rating ? "fill-current" : "text-slate-200"}`}
                        />
                      ))}
                    </div>
                    {rev.title && (
                      <h6 className="text-xs font-bold text-slate-800">{rev.title}</h6>
                    )}
                    <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No customer written reviews yet. Be the first verified customer to review!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Related Products Grid */}
      {relatedList.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Related & Recommended Products
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Customers also viewed these items from {categoryName}
              </p>
            </div>
            <Link
              href={`/category/${categorySlug}`}
              className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center space-x-1"
            >
              <span>View More</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {relatedList.map((p: any, idx: number) => (
              <ProductCard
                key={p.id}
                product={p}
                onAddToCart={addToCart}
                onToggleWishlist={toggleWishlist}
                isWishlisted={wishlistIds.has(p.id)}
                index={idx}
              />
            ))}
          </div>
        </div>
      )}

      {/* 5. Mobile Sticky Buy Bar */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 p-3 z-40 lg:hidden shadow-2xl flex items-center justify-between gap-3"
          >
            <div>
              <span className="text-[10px] text-slate-400 font-bold block leading-none">
                Total Price
              </span>
              <span className="text-base font-black text-slate-900 leading-tight">
                {formatBDT(currentPrice)}
              </span>
            </div>

            <div className="flex items-center space-x-2 flex-1 max-w-[240px]">
              <button
                type="button"
                disabled={!inStock}
                onClick={handleAddToCartClick}
                className="flex-1 py-2.5 px-3 bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center justify-center space-x-1.5 active:scale-98 transition-all disabled:opacity-50"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>{inStock ? "Add" : "Out of Stock"}</span>
              </button>
              <button
                type="button"
                disabled={!inStock}
                onClick={handleBuyNowClick}
                className="py-2.5 px-3 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center justify-center space-x-1 active:scale-98 transition-all disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Buy</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. Fullscreen Product Image Lightbox Slider Modal */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`${productData.title} image gallery lightbox`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              setIsLightboxOpen(false);
              setIsLightboxZoomed(false);
            }}
            className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 select-none"
          >
            {/* Top Lightbox Header */}
            <div
              className="flex items-center justify-between gap-4 max-w-6xl w-full mx-auto z-20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white text-xs font-bold tabular-nums shrink-0">
                  {activeImageIndex + 1} / {galleryImages.length}
                </span>
                <h2 className="text-white/90 text-xs sm:text-sm font-bold truncate">
                  {productData.title}
                </h2>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsLightboxZoomed((z) => !z)}
                  className="h-10 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  aria-label={isLightboxZoomed ? "Zoom out" : "Zoom in"}
                >
                  {isLightboxZoomed ? (
                    <>
                      <ZoomOut className="w-4 h-4" aria-hidden="true" />
                      <span className="hidden sm:inline">Reset Zoom</span>
                    </>
                  ) : (
                    <>
                      <ZoomIn className="w-4 h-4" aria-hidden="true" />
                      <span className="hidden sm:inline">Magnify</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsLightboxOpen(false);
                    setIsLightboxZoomed(false);
                  }}
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-rose-600 border border-white/15 text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close lightbox"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Center Interactive Image Slider Stage */}
            <div
              className="relative flex-1 flex items-center justify-center w-full max-w-6xl mx-auto my-3 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left Prev Button */}
              {galleryImages.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setIsLightboxZoomed(false);
                    setActiveImageIndex(
                      (prev) => (prev - 1 + galleryImages.length) % galleryImages.length
                    );
                  }}
                  className="absolute left-2 sm:left-4 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-900/80 hover:bg-blue-600 text-white border border-white/15 flex items-center justify-center shadow-xl transition-all cursor-pointer"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-6 h-6" aria-hidden="true" />
                </button>
              )}

              {/* Active Slide Image */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeImageIndex}
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setIsLightboxZoomed((z) => !z)}
                  className={`relative w-full h-full max-h-[72vh] flex items-center justify-center overflow-hidden rounded-2xl ${
                    isLightboxZoomed ? "cursor-zoom-out" : "cursor-zoom-in"
                  }`}
                >
                  <div
                    className={`relative w-full h-[65vh] sm:h-[72vh] transition-transform duration-300 ease-out ${
                      isLightboxZoomed ? "scale-150" : "scale-100"
                    }`}
                  >
                    <Image
                      src={galleryImages[activeImageIndex] || "/placeholder.png"}
                      alt={`${productData.title} - slide ${activeImageIndex + 1}`}
                      fill
                      sizes="100vw"
                      className="object-contain"
                      priority
                    />
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Right Next Button */}
              {galleryImages.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setIsLightboxZoomed(false);
                    setActiveImageIndex((prev) => (prev + 1) % galleryImages.length);
                  }}
                  className="absolute right-2 sm:right-4 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-900/80 hover:bg-blue-600 text-white border border-white/15 flex items-center justify-center shadow-xl transition-all cursor-pointer"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-6 h-6" aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Bottom Lightbox Thumbnail Slider Pagination Bar */}
            <div
              className="flex flex-col items-center gap-2.5 max-w-3xl w-full mx-auto z-20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-center gap-2.5 overflow-x-auto max-w-full py-1 px-2">
                {galleryImages.map((img, idx) => {
                  const isActive = activeImageIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setIsLightboxZoomed(false);
                        setActiveImageIndex(idx);
                      }}
                      aria-label={`Slide ${idx + 1}`}
                      aria-pressed={isActive}
                      className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                        isActive
                          ? "border-blue-500 ring-2 ring-blue-500/40 scale-105 opacity-100"
                          : "border-white/20 opacity-55 hover:opacity-90"
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`${productData.title} lightbox thumbnail ${idx + 1}`}
                        fill
                        sizes="64px"
                        className="object-cover w-full h-full"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
