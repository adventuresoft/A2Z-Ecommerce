import React from "react";
import { Metadata } from "next";
import { StorefrontShell } from "../../components/Shell/StorefrontShell";
import { ProductCatalogView } from "../../components/Catalog/ProductCatalogView";

export const metadata: Metadata = {
  title: "Shop All Products | A to Z Ecommerce Bangladesh",
  description:
    "Explore our complete catalog of authentic laptops, smartphones, PC components, audio gear, and gadgets at best prices in Bangladesh.",
};

export default function ShopPage() {
  return (
    <StorefrontShell>
      <ProductCatalogView
        title="Shop All Products"
        subtitle="Discover top-tier tech, components, smartphones, laptops and accessories with official warranty and instant shipping across Bangladesh."
      />
    </StorefrontShell>
  );
}
