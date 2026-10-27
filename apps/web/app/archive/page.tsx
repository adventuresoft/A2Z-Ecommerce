import React from "react";
import { Metadata } from "next";
import { StorefrontShell } from "../../components/Shell/StorefrontShell";
import { ProductCatalogView } from "../../components/Catalog/ProductCatalogView";

export const metadata: Metadata = {
  title: "Special Archive & Clearance Deals | A to Z Ecommerce",
  description:
    "Explore special edition releases, seasonal clearance, and archived hardware collections at exclusive prices.",
};

export default function ArchivePage() {
  return (
    <StorefrontShell>
      <ProductCatalogView
        title="Hardware Archive & Clearance Deals"
        subtitle="Exclusive inventory archive, end-of-season technology clearances, and promotional tech drops at unbeatable discounted prices."
        archiveBadge="🏷️ CLEARANCE & ARCHIVE DEALS"
        hasDiscount={true}
        bannerGradient="from-slate-950 via-zinc-900 to-purple-950 border border-purple-500/20"
      />
    </StorefrontShell>
  );
}
