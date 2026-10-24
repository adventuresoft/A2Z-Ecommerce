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
  Shield,
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Verifying customer session...</p>
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
      label: 'Personal Profile & Password',
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
      label: 'My Orders',
      href: '/account#orders',
      icon: Package,
      exact: false,
    },
    {
      label: 'Saved Wishlist',
      href: '/wishlist',
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-6">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-semibold">Customer Account</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar Menu */}
          <aside className="lg:col-span-4 xl:col-span-3">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 overflow-hidden">
              {/* User Profile Header Card */}
              <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-md shadow-blue-500/20 ring-4 ring-blue-50">
                  {userInitial}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-bold text-slate-900 truncate">
                    {user.name}
                  </h2>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-1">
                    <Shield className="w-3 h-3" />
                    Verified Customer
                  </span>
                </div>
              </div>

              {/* Navigation Items */}
              <nav className="mt-6 space-y-1">
                {navItems.map((item) => {
                  const baseHref = item.href.split('#')[0] || item.href;
                  const isActive = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(baseHref) && item.href !== '/account';

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <item.icon
                        className={`w-4 h-4 ${
                          isActive ? 'text-white' : 'text-slate-400'
                        }`}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors mt-4 border-t border-slate-100 pt-4 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span>Sign Out</span>
                </button>
              </nav>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-8 xl:col-span-9">{children}</main>
        </div>
      </div>
    </StorefrontShell>
  );
}
