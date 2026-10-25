import React from "react";
import { Metadata } from "next";
import { StorefrontShell } from "../../components/Shell/StorefrontShell";
import { ProductCatalogView } from "../../components/Catalog/ProductCatalogView";

export const metadata: Metadata = {
  title: "Special Archive & Clearance Showcase | A to Z Ecommerce",
  description:
    "Explore special edition releases, seasonal clearance, and archived hardware collections at exclusive prices.",
};

export default function ArchivePage() {
  return (
    <StorefrontShell>
      <ProductCatalogView
        title="Hardware Archive & Clearance"
        subtitle="Exclusive inventory archive, end-of-season technology clearances, and promotional tech drops at unbeatable prices."
        archiveBadge="Special Archive Collection"
        hasDiscount={true}
      />
    </StorefrontShell>
  );
}
