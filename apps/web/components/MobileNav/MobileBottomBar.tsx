"use client";

import Link from "next/link";
import { Home, Grid, Flame, ShoppingBag, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface MobileBottomBarProps {
  cartCount: number;
  onOpenCategories: () => void;
  onOpenCartModal: () => void;
}

export function MobileBottomBar({
  cartCount,
  onOpenCategories,
  onOpenCartModal,
}: MobileBottomBarProps) {
  const { isAuthenticated, user } = useAuth();
  return (
    <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2 px-6 flex items-center justify-between z-40 lg:hidden shadow-lg">
      <Link
        href="/"
        className="flex flex-col items-center text-blue-700 hover:text-blue-800 transition-colors"
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px] font-bold mt-1">Home</span>
      </Link>

      <button
        onClick={onOpenCategories}
        className="flex flex-col items-center text-slate-600 hover:text-blue-700 transition-colors cursor-pointer"
      >
        <Grid className="w-5 h-5" />
        <span className="text-[10px] font-bold mt-1">Categories</span>
      </button>

      <Link
        href="/archive"
        className="flex flex-col items-center text-orange-600 hover:text-orange-700 transition-colors"
      >
        <Flame className="w-5 h-5" />
        <span className="text-[10px] font-bold mt-1">Deals</span>
      </Link>

      <Link
        href={isAuthenticated ? "/account" : "/login"}
        className="flex flex-col items-center text-slate-600 hover:text-blue-700 transition-colors"
      >
        <User className="w-5 h-5" />
        <span className="text-[10px] font-bold mt-1">
          {isAuthenticated ? "Account" : "Sign In"}
        </span>
      </Link>

      <button
        onClick={onOpenCartModal}
        className="flex flex-col items-center text-slate-600 hover:text-blue-700 transition-colors relative cursor-pointer"
      >
        <div className="relative">
          <ShoppingBag className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-orange-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
              {cartCount}
            </span>
          )}
        </div>
        <span className="text-[10px] font-bold mt-1">Cart</span>
      </button>
    </div>
  );
}
