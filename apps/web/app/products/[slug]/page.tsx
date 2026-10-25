import React from "react";
import { StorefrontShell } from "../../../components/Shell/StorefrontShell";
import { ProductDetailView } from "../../../components/ProductDetail/ProductDetailView";
import { apiClient } from "../../../lib/api-client";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const product = await apiClient.get(`/products/${encodeURIComponent(slug)}`, {
      skipAuth: true,
    });

    if (!product) {
      return {
        title: "Product Not Found | A to Z Ecommerce",
      };
    }

    return {
      title: `${product.title} | Best Price in Bangladesh | A to Z Ecommerce`,
      description:
        product.shortDescription ||
        product.description?.slice(0, 160) ||
        `Buy authentic ${product.title} at best price with official warranty from A to Z Ecommerce Bangladesh.`,
      openGraph: {
        title: `${product.title} | A to Z Ecommerce`,
        description: product.shortDescription || product.title,
        images: product.images?.[0]?.imageUrl ? [product.images[0].imageUrl] : [],
      },
    };
  } catch {
    return {
      title: "Product Details | A to Z Ecommerce",
      description: "Authentic tech gadgets and products in Bangladesh.",
    };
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <StorefrontShell>
      <ProductDetailView slug={slug} />
    </StorefrontShell>
  );
}
