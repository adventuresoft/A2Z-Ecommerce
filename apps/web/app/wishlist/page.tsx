"use client";

import React from "react";
import Link from "next/link";
import { StorefrontShell } from "../../components/Shell/StorefrontShell";
import { WishlistView } from "../../components/Wishlist/WishlistView";

export default function WishlistPage() {
  return (
    <StorefrontShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Breadcrumb Header */}
        <nav className="flex items-center space-x-2 text-xs font-semibold text-slate-500 mb-6">
          <Link href="/" className="hover:text-blue-700 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">My Wishlist</span>
        </nav>

        <WishlistView embedded={false} />
      </div>
    </StorefrontShell>
  );
}
