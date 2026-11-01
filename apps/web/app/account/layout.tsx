'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  User,
  MapPin,
  Package,
  Heart,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Home,
  Sparkles,
} from 'lucide-react';
import { StorefrontShell } from '../../components/Shell/StorefrontShell';
import { useAuth } from '../../context/AuthContext';

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  if (isLoading) {
    return (
      <StorefrontShell>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col items-center justify-center">
          <div className="relative w-16 h-16 flex items-center justify-center mb-5">
            <div className="absolute inset-0 rounded-2xl bg-blue-600/10 animate-ping" />
            <div className="w-12 h-12 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
          </div>
          <p className="text-slate-700 font-semibold text-sm">Verifying customer session...</p>
          <p className="text-slate-400 text-xs mt-1">Connecting to secure account registry</p>
        </div>
      </StorefrontShell>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const navItems = [
    {
      label: 'Dashboard Overview',
      href: '/account',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: 'Profile & Security',
      href: '/account/profile',
      icon: User,
      exact: false,
    },
    {
      label: 'Address Book',
      href: '/account/addresses',
      icon: MapPin,
      exact: false,
    },
    {
      label: 'Order History',
      href: '/account/orders',
      icon: Package,
      exact: false,
    },
    {
      label: 'Saved Wishlist',
      href: '/account/wishlist',
      icon: Heart,
      exact: false,
    },
  ];

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const userInitial = user.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <StorefrontShell>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 hover:text-blue-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-sm"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-900 font-semibold">Customer Account</span>
          </nav>

          {/* Mobile Horizontal Navigation Strip */}
          <div className="lg:hidden mb-6 -mx-4 px-4 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 min-w-max pb-2">
              {navItems.map((item) => {
                const baseHref = item.href.split('#')[0] || item.href;
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(baseHref) && item.href !== '/account';

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 shadow-xs'
                    }`}
                  >
                    <item.icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Desktop Sidebar Menu */}
            <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 sticky top-24">
              <div className="surface-3d rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-900/5 p-6 overflow-hidden">
                {/* 3D Profile Summary Card */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-5 text-white shadow-lg mb-6 border border-slate-700/60">
                  <div className="relative z-10 flex items-center gap-3.5">
                    <div className="relative w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-blue-500/25 ring-2 ring-white/20 shrink-0">
                      {userInitial}
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                        <span className="truncate">{user.name}</span>
                      </h2>
                      <p className="text-[11px] text-slate-300 truncate font-mono mt-0.5">{user.email}</p>
                      <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full mt-2">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>Verified Account</span>
                      </div>
                    </div>
                  </div>

                  {/* Atmospheric Glow */}
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
                </div>

                {/* Navigation Items */}
                <nav aria-label="Customer Account Navigation" className="space-y-1.5">
                  {navItems.map((item) => {
                    const baseHref = item.href.split('#')[0] || item.href;
                    const isActive = item.exact
                      ? pathname === item.href
                      : pathname.startsWith(baseHref) && item.href !== '/account';

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`group flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon
                            className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                              isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'
                            }`}
                          />
                          <span>{item.label}</span>
                        </div>
                        <ChevronRight
                          className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 ${
                            isActive ? 'text-white/80' : 'text-slate-300 group-hover:text-slate-500'
                          }`}
                        />
                      </Link>
                    );
                  })}

                  <div className="pt-3 mt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </nav>
              </div>
            </aside>

            {/* Main Content View */}
            <main className="lg:col-span-8 xl:col-span-9 min-w-0">{children}</main>
          </div>
        </div>
      </div>
    </StorefrontShell>
  );
}