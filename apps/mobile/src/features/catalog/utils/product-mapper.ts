import type { ProductCardModel } from '../components/product-card';

/**
 * Extracts a product's primary image URL across all backend payload shapes:
 * - PublicProductSummaryDto (`primaryImage: { imageUrl }` or string)
 * - Legacy/hydrated summaries (`thumbnailUrl`, `imageUrl`, `images[0].imageUrl`)
 */
export function extractProductImageUrl(raw: Record<string, unknown>): string | null {
  const primary = raw.primaryImage;
  if (typeof primary === 'string' && primary.trim()) {
    return primary.trim();
  }
  if (primary && typeof primary === 'object') {
    const primaryUrl = (primary as Record<string, unknown>).imageUrl;
    if (typeof primaryUrl === 'string' && primaryUrl.trim()) {
      return primaryUrl.trim();
    }
  }

  if (typeof raw.thumbnailUrl === 'string' && raw.thumbnailUrl.trim()) {
    return raw.thumbnailUrl.trim();
  }

  const images = Array.isArray(raw.images) ? raw.images : [];
  if (images.length > 0) {
    const preferred =
      (images.find(
        (img) => img && typeof img === 'object' && (img as Record<string, unknown>).isPrimary,
      ) as Record<string, unknown> | undefined) ?? (images[0] as Record<string, unknown> | undefined);
    const imgUrl = preferred?.imageUrl;
    if (typeof imgUrl === 'string' && imgUrl.trim()) {
      return imgUrl.trim();
    }
  }

  if (typeof raw.imageUrl === 'string' && raw.imageUrl.trim()) {
    return raw.imageUrl.trim();
  }

  return null;
}

export function mapProductSummaryToCard(raw: Record<string, unknown>): ProductCardModel {
  const sale = raw.salePrice != null ? Number(raw.salePrice) : null;
  const reg = raw.regularPrice != null ? Number(raw.regularPrice) : null;
  const minPrice = Number(
    sale && sale > 0
      ? sale
      : raw.minPrice ?? reg ?? raw.price ?? 0,
  );
  const regularPrice = Number(reg ?? raw.maxPrice ?? minPrice);
  const variants = Array.isArray(raw.variants) ? raw.variants : undefined;

  return {
    id: String(raw.id ?? ''),
    slug: String(raw.slug ?? raw.id ?? ''),
    title: String(raw.title ?? ''),
    imageUrl: extractProductImageUrl(raw),
    price: Number.isFinite(minPrice) ? minPrice : 0,
    regularPrice:
      Number.isFinite(regularPrice) && regularPrice > minPrice ? regularPrice : null,
    rating: typeof raw.rating === 'number' && raw.rating > 0 ? raw.rating : undefined,
    reviewsCount: typeof raw.reviewsCount === 'number' ? raw.reviewsCount : undefined,
    inStock: raw.inStock !== false,
    defaultVariantId:
      typeof raw.defaultVariantId === 'string' ? raw.defaultVariantId : null,
    variantsCount:
      typeof raw.variantsCount === 'number'
        ? raw.variantsCount
        : variants?.length,
  };
}

