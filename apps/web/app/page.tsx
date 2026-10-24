"use client";

import React, { useState } from "react";
import { SmoothScrollProvider } from "../components/SmoothScroll/SmoothScrollProvider";
import { ScrollProgressBar } from "../components/UI/ScrollProgressBar";
import { ScrollToTopButton } from "../components/UI/ScrollToTopButton";
import { TopUtilityBar } from "../components/Navbar/TopUtilityBar";
import { Header } from "../components/Navbar/Header";
import { MainNav } from "../components/Navbar/MainNav";
import { HeroSlider } from "../components/Hero/HeroSlider";
import { CategoryPills } from "../components/Categories/CategoryPills";
import { FlashSaleSection } from "../components/FlashSale/FlashSaleSection";
import { PromoGrid } from "../components/PromoBanners/PromoGrid";
import { SmartphoneDealsSection } from "../components/CategoryDeals/SmartphoneDealsSection";
import { FeaturedSection } from "../components/Featured/FeaturedSection";
import { BestSellersTopViewSection } from "../components/Showcase/BestSellersTopViewSection";
import { NewArrivalsSection } from "../components/NewArrivals/NewArrivalsSection";
import { BrandStrip } from "../components/Brands/BrandStrip";
import { TrustStrip } from "../components/Trust/TrustStrip";
import { NewsletterBanner } from "../components/Newsletter/NewsletterBanner";
import { Footer } from "../components/Footer/Footer";
import { MobileDrawer } from "../components/MobileNav/MobileDrawer";
import { MobileBottomBar } from "../components/MobileNav/MobileBottomBar";
import { CartModal } from "../components/Cart/CartModal";
import { ToastContainer, ToastMessage } from "../components/UI/Toast";
import { Product, formatBDT } from "../data/mock-catalog";

export default function HomePage() {
  const [cartItems, setCartItems] = useState<(Product & { quantity: number })[]>([
    {
      id: "seed-1",
      title: "Sony WH-1000XM5 Wireless Headphones",
      category: "Audio",
      price: 38500,
      rating: 4.9,
      reviewsCount: 140,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
      quantity: 1,
    },
  ]);

  const [wishlistIds, setWishlistIds] = useState<Set<string>>(
    new Set(["fs-1", "phone-2"])
  );
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalCartPrice = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });

    // Automatically slide open the mini-cart drawer
    setIsCartModalOpen(true);
  };

  const handleToggleWishlist = (productId: string) => {
    setWishlistIds((prev) => {
      const next = new Set(prev);
      const isAdding = !next.has(productId);
      if (isAdding) {
        next.add(productId);
      } else {
        next.delete(productId);
      }

      const toastId = Math.random().toString(36).substring(2, 9);
      const newToast: ToastMessage = {
        id: toastId,
        title: isAdding ? "Added to Wishlist" : "Removed from Wishlist",
        desc: isAdding
          ? "Item saved to your favorites wishlist."
          : "Item removed from your favorites wishlist.",
        type: "info",
      };

      setToasts((t) => [...t, newToast]);
      setTimeout(() => {
        setToasts((t) => t.filter((item) => item.id !== toastId));
      }, 3000);

      return next;
    });
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter((item): item is (Product & { quantity: number }) => item !== null)
    );
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <SmoothScrollProvider>
      <div className="min-h-screen flex flex-col bg-[#F8FAFC] selection:bg-blue-600 selection:text-white antialiased">
        {/* Top Scroll Timeline Progress Bar */}
        <ScrollProgressBar />

        {/* 1. Top Utility Bar with Real Wishlist Count */}
        <TopUtilityBar
          wishlistCount={wishlistIds.size}
          onOpenWishlist={() => setIsCartModalOpen(true)}
        />

        {/* 2. Main Header with Brand Logo, Live Autocomplete & Wishlist */}
        <Header
          cartCount={totalCartCount}
          cartTotal={totalCartPrice}
          wishlistCount={wishlistIds.size}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenCartModal={() => setIsCartModalOpen(true)}
          onOpenWishlist={() => setIsCartModalOpen(true)}
        />

        {/* 3. Category & Navigation Menu */}
        <MainNav />

        {/* Main Content Sections */}
        <main className="flex-1 pb-16 lg:pb-0 overflow-x-hidden">
          {/* 4. Interactive Hero Carousel with GSAP Parallax & Inline Trust */}
          <HeroSlider />

          {/* 5. Circular Category Strip */}
          <CategoryPills />

          {/* 6. Flash Sale Section with Live Countdown & Unified Cards */}
          <FlashSaleSection
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            wishlistIds={wishlistIds}
          />

          {/* 7. Promotional 3-Card Banner Grid with Motion Scale */}
          <PromoGrid />

          {/* 8. Category Deals: Best Deals on Official Smartphones */}
          <SmartphoneDealsSection
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            wishlistIds={wishlistIds}
          />

          {/* 9. Tabbed Featured Products Grid with Layout Animation */}
          <FeaturedSection
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            wishlistIds={wishlistIds}
          />

          {/* 10. Trending Showcase: Best Sellers & Top Viewed Products */}
          <BestSellersTopViewSection
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            wishlistIds={wishlistIds}
          />

          {/* 11. New Arrivals Shelf with Motion Scroll Reveal */}
          <NewArrivalsSection
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            wishlistIds={wishlistIds}
          />

          {/* 12. Official Brand Partners */}
          <BrandStrip />

          {/* 13. Storefront Value Propositions */}
          <TrustStrip />

          {/* 14. AZ Insider Club Newsletter */}
          <NewsletterBanner />
        </main>

        {/* 15. Footer */}
        <Footer />

        {/* Floating Arrow Back to Top Button */}
        <ScrollToTopButton />

        {/* Mobile Navigation Drawer */}
        <MobileDrawer
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        {/* Mobile Sticky Bottom App Bar */}
        <MobileBottomBar
          cartCount={totalCartCount}
          onOpenCategories={() => setIsMobileMenuOpen(true)}
          onOpenCartModal={() => setIsCartModalOpen(true)}
        />

        {/* Cart Slide-Over Drawer */}
        <CartModal
          isOpen={isCartModalOpen}
          onClose={() => setIsCartModalOpen(false)}
          cartItems={cartItems}
          onRemoveItem={handleRemoveFromCart}
          onClearCart={handleClearCart}
          onUpdateQuantity={handleUpdateQuantity}
          onAddToCart={handleAddToCart}
        />

        {/* Dynamic Toast Feedback Container */}
        <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
      </div>
    </SmoothScrollProvider>
  );
}
