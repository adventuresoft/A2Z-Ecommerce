import React from "react";
import { StorefrontShell } from "../../../components/Shell/StorefrontShell";
import { ProductDetailView } from "../../../components/ProductDetail/ProductDetailView";
import { getProductById } from "../../../data/mock-catalog";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = getProductById(id);

  if (!product) {
    return {
      title: "Product Not Found | A to Z Ecommerce",
    };
  }

  return {
    title: `${product.title} | A to Z Ecommerce`,
    description:
      product.description ||
      `Buy genuine ${product.title} at best price in Bangladesh with official warranty from A to Z Ecommerce.`,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <StorefrontShell>
      <ProductDetailView productId={id} />
    </StorefrontShell>
  );
}
