import { Product } from "../data/mock-catalog";

export interface PublicHeroBannerItem {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  linkUrl?: string | null;
  badgeText?: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface PublicSettingsResponse {
  heroBanners?: PublicHeroBannerItem[];
  [key: string]: any;
}

export interface PublicProductCategory {
  id: string;
  name: string;
  slug: string;
}

export interface PublicProductBrand {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
}

export interface PublicProductImage {
  id: string;
  imageUrl: string;
  altText?: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

export interface PublicProductSummary {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string | null;
  category: PublicProductCategory;
  brand?: PublicProductBrand | null;
  primaryImage?: PublicProductImage | null;
  regularPrice: number;
  salePrice?: number | null;
  minPrice: number;
  maxPrice: number;
  discountPercent?: number | null;
  inStock: boolean;
  isFeatured: boolean;
  rating: number;
  reviewsCount: number;
}

export interface CuratedProductsResponse {
  flashDeals: PublicProductSummary[];
  featured: PublicProductSummary[];
  newArrivals: PublicProductSummary[];
  bestSellers: PublicProductSummary[];
}

/**
 * Maps a public product summary or API catalog item into the standard Storefront `Product` shape.
 */
export function mapSummaryToProduct(item: any): Product {
  const salePrice = item.salePrice != null ? Number(item.salePrice) : null;
  const regularPrice =
    item.regularPrice != null
      ? Number(item.regularPrice)
      : item.price != null
      ? Number(item.price)
      : 0;
  const price =
    salePrice != null && salePrice > 0
      ? salePrice
      : regularPrice > 0
      ? regularPrice
      : Number(item.minPrice || 0);

  let discountPercent =
    item.discountPercent != null ? Number(item.discountPercent) : undefined;
  if (!discountPercent && regularPrice > price && regularPrice > 0) {
    discountPercent = Math.round(((regularPrice - price) / regularPrice) * 100);
  }

  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    category:
      typeof item.category === "object" && item.category !== null
        ? item.category.name || "General"
        : item.category || "General",
    brand:
      typeof item.brand === "object" && item.brand !== null
        ? item.brand.name || undefined
        : item.brand || undefined,
    sku: item.sku,
    specs: item.shortDescription || item.specs || undefined,
    price,
    regularPrice: regularPrice > price ? regularPrice : undefined,
    discountPercent:
      discountPercent && discountPercent > 0 ? discountPercent : undefined,
    rating: Number(item.rating) || 4.8,
    reviewsCount: Number(item.reviewsCount) || 12,
    image: item.primaryImage?.imageUrl || item.image || "/placeholder.png",
    images: item.primaryImage?.imageUrl
      ? [item.primaryImage.imageUrl]
      : item.images || [],
    badge:
      item.badge ||
      (discountPercent && discountPercent > 0
        ? `${discountPercent}% OFF`
        : item.isFeatured
        ? "Featured"
        : undefined),
    inStock: item.inStock !== false,
    soldCount: item.soldCount,
    stockTotal: item.stockTotal,
    description: item.shortDescription || item.description,
  };
}
