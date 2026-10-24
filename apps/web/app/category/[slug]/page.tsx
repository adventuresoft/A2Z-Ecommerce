import React from "react";
import { Metadata } from "next";
import { StorefrontShell } from "../../../components/Shell/StorefrontShell";
import { ProductCatalogView } from "../../../components/Catalog/ProductCatalogView";

function formatCategorySlug(slug: string): string {
  const map: Record<string, string> = {
    "pc": "PC Components",
    "pc-components": "PC Components",
    "components": "PC Components",
    "laptops": "Laptops",
    "smartphones": "Smartphones",
    "phones": "Smartphones",
    "gaming": "Gaming",
    "accessories": "Accessories",
    "monitors": "Monitors",
    "audio": "Audio Gear",
    "audio-gear": "Audio Gear",
  };

  const matched = map[slug.toLowerCase()];
  if (matched) {
    return matched;
  }

  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const categoryName = formatCategorySlug(slug);

  return {
    title: `${categoryName} Best Deals & Prices in Bangladesh | A to Z Ecommerce`,
    description: `Shop authentic ${categoryName} with official warranty and nationwide delivery in Bangladesh from A to Z Ecommerce.`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const categoryName = formatCategorySlug(slug);

  return (
    <StorefrontShell>
      <ProductCatalogView
        title={`${categoryName} Collection`}
        subtitle={`Browse official ${categoryName} with verified warranty, competitive pricing, and fast nationwide delivery.`}
        categoryScope={categoryName}
      />
    </StorefrontShell>
  );
}
