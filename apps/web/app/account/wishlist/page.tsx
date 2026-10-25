"use client";

import React from "react";
import { WishlistView } from "../../../components/Wishlist/WishlistView";

export default function AccountWishlistPage() {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
      <WishlistView embedded={true} />
    </div>
  );
}
