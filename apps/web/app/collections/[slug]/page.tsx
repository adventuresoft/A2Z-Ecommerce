import React from "react";
import { Metadata } from "next";
import { StorefrontShell } from "../../../components/Shell/StorefrontShell";
import { ProductCatalogView } from "../../../components/Catalog/ProductCatalogView";
import { apiClient } from "../../../lib/api-client";

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const res = await apiClient.get<any>(`/collections/${encodeURIComponent(slug)}`, {
      skipAuth: true,
    });

    if (res?.collection) {
      const col = res.collection;
      return {
        title: col.seoTitle || `${col.name} Deals & Offers | A to Z Ecommerce`,
        description:
          col.seoDescription ||
          col.description ||
          `Browse official ${col.name} with competitive prices and warranty at A to Z Ecommerce.`,
      };
    }
  } catch {
    // Fallback metadata
  }

  const formattedName = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return {
    title: `${formattedName} Collection | A to Z Ecommerce`,
    description: `Shop authentic products from ${formattedName} collection at A to Z Ecommerce.`,
  };
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;

  let collectionData: any = null;
  try {
    collectionData = await apiClient.get<any>(`/collections/${encodeURIComponent(slug)}`, {
      skipAuth: true,
    });
  } catch {
    // If backend isn't responding or 404, we render with clean fallback defaults
  }

  const collection = collectionData?.collection || {
    name: slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" "),
    description: "Curated selection of top electronics and official warranty products.",
  };

  return (
    <StorefrontShell>
      <ProductCatalogView
        collectionSlug={slug}
        title={collection.name}
        subtitle={
          collection.description ||
          "Explore genuine curated products with verified warranty and fast delivery across Bangladesh."
        }
        showHeroBanner={false}
        showCategoryPills={true}
      />
    </StorefrontShell>
  );
}

