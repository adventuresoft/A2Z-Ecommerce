'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Heart,
  MapPin,
  Clock,
  ArrowRight,
  Plus,
  ExternalLink,
  ShieldCheck,
  Package,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { apiClient } from '../../lib/api-client';

interface UserAddress {
  id: string;
  label?: string | null;
  recipientName: string;
  phone: string;
  streetAddress: string;
  city: string;
  state?: string | null;
  postalCode: string;
  country: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}

export default function AccountDashboardPage() {
  const { user } = useAuth();
  const { cart, wishlistCount } = useStore();
  const [defaultAddress, setDefaultAddress] = useState<UserAddress | null>(null);
  const [totalAddresses, setTotalAddresses] = useState(0);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadAddressSummary() {
      try {
        const addresses = await apiClient.get<UserAddress[]>('/account/addresses');
        if (mounted && Array.isArray(addresses)) {
          setTotalAddresses(addresses.length);
          const def = addresses.find((a) => a.isDefaultShipping) || addresses[0] || null;
          setDefaultAddress(def);
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (mounted) setLoadingAddresses(false);
      }
    }

    loadAddressSummary();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-500/10">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-medium tracking-wide mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-200" />
            Verified Customer Dashboard
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Hello, {user?.name || 'Customer'} 👋
          </h1>
          <p className="mt-2 text-sm sm:text-base text-blue-100/90 leading-relaxed">
            Welcome to your account center. Here you can track active orders,
            manage your delivery destinations, and customize your security credentials.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 font-semibold text-xs rounded-xl shadow-sm transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              Start Shopping
            </Link>
            <Link
              href="/account/profile"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium text-xs rounded-xl backdrop-blur-sm transition-all"
            >
              Edit Profile
            </Link>
          </div>
        </div>

        {/* Ambient decorative circle */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Orders
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">0</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Cart Items
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{cart.length}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Saved Wishlist
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{wishlistCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
            <Heart className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Saved Addresses
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalAddresses}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <MapPin className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Grid: Default Address & Quick Security */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Default Shipping Address Snapshot */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">
                Primary Delivery Address
              </h2>
            </div>
            <Link
              href="/account/addresses"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Manage <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loadingAddresses ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Loading address details...
            </div>
          ) : defaultAddress ? (
            <div className="space-y-2 text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">
                  {defaultAddress.recipientName}
                </span>
                <span className="text-[11px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  Default Shipping
                </span>
              </div>
              <p className="text-xs text-slate-500">{defaultAddress.phone}</p>
              <p className="text-slate-700">{defaultAddress.streetAddress}</p>
              <p className="text-slate-700">
                {defaultAddress.city}
                {defaultAddress.state ? `, ${defaultAddress.state}` : ''} -{' '}
                {defaultAddress.postalCode}
              </p>
              <p className="text-xs text-slate-400">{defaultAddress.country}</p>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-xs text-slate-500 mb-3">
                No delivery destination saved yet.
              </p>
              <Link
                href="/account/addresses"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 text-blue-600 rounded-xl font-semibold text-xs hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add New Address
              </Link>
            </div>
          )}
        </div>

        {/* Profile Snapshot & Security */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">
              Profile & Security
            </h2>
            <Link
              href="/account/profile"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Update <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400 text-xs">Full Name</span>
              <span className="font-semibold text-slate-900">{user?.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400 text-xs">Email Address</span>
              <span className="font-semibold text-slate-900">{user?.email}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400 text-xs">Contact Phone</span>
              <span className="font-semibold text-slate-900">
                {user?.phone || 'Not provided'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400 text-xs">Password</span>
              <span className="font-mono text-xs text-slate-500">••••••••••••</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div id="orders" className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Recent Orders</h2>
          </div>
          <Link
            href="/shop"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Explore Catalog <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="text-center py-12 px-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Orders Placed Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
            When you complete purchases on A to Z Ecommerce, your invoice details,
            tracking codes, and delivery statuses will appear right here.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all"
          >
            Browse Today's Deals <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
