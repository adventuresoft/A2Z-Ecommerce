"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "../../context/StoreContext";
import { SmoothScrollProvider } from "../SmoothScroll/SmoothScrollProvider";
import { ScrollProgressBar } from "../UI/ScrollProgressBar";
import { ScrollToTopButton } from "../UI/ScrollToTopButton";
import { TopUtilityBar } from "../Navbar/TopUtilityBar";
import { Header } from "../Navbar/Header";
import { MainNav } from "../Navbar/MainNav";
import { Footer } from "../Footer/Footer";
import { MobileDrawer } from "../MobileNav/MobileDrawer";
import { MobileBottomBar } from "../MobileNav/MobileBottomBar";
import { CartModal } from "../Cart/CartModal";
import { ToastContainer } from "../UI/Toast";
import { Product } from "../../data/mock-catalog";

interface StorefrontShellProps {
  children: React.ReactNode;
  hideFooter?: boolean;
}

export function StorefrontShell({ children, hideFooter = false }: StorefrontShellProps) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const {
    cart,
    totalCartCount,
    totalCartPrice,
    isCartModalOpen,
    setIsCartModalOpen,
    updateQuantity,
    removeFromCart,
    clearCart,
    wishlistCount,
    toasts,
    removeToast,
  } = useStore();

  // Convert store cart items into format expected by CartModal
  const modalCartItems = cart.map((item) => ({
    ...item.product,
    price: item.price,
    quantity: item.quantity,
  }));

  return (
    <SmoothScrollProvider>
      <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A] selection:bg-blue-600 selection:text-white pb-16 lg:pb-0">
        <ScrollProgressBar />
        <TopUtilityBar />
        
        <Header
          cartCount={totalCartCount}
          cartTotal={totalCartPrice}
          wishlistCount={wishlistCount}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenCartModal={() => setIsCartModalOpen(true)}
          onOpenWishlist={() => router.push("/wishlist")}
        />

        <MainNav />

        <main className="flex-1 w-full">{children}</main>

        {!hideFooter && <Footer />}

        <MobileDrawer
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        <MobileBottomBar
          cartCount={totalCartCount}
          onOpenCategories={() => setIsMobileMenuOpen(true)}
          onOpenCartModal={() => setIsCartModalOpen(true)}
        />

        <CartModal
          isOpen={isCartModalOpen}
          onClose={() => setIsCartModalOpen(false)}
          cartItems={modalCartItems}
          onRemoveItem={removeFromCart}
          onClearCart={clearCart}
          onUpdateQuantity={updateQuantity}
        />

        <ToastContainer toasts={toasts} onDismiss={removeToast} />
        <ScrollToTopButton />
      </div>
    </SmoothScrollProvider>
  );
}
