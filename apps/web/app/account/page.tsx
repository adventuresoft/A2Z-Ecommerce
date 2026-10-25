'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShoppingBag,
  Heart,
  MapPin,
  Clock,
  ArrowRight,
  Plus,
  ShieldCheck,
  Package,
  ChevronRight,
  Truck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { apiClient } from '../../lib/api-client';
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/UI/OrderStatusBadge';

interface RecentOrderItemPreview {
  productTitle: string;
  thumbnailUrl?: string | null;
  quantity: number;
}

interface RecentOrderSummary {
  id: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  shipmentStatus: string;
  grandTotal: number;
  itemCount: number;
  createdAt: string;
  itemsPreview: RecentOrderItemPreview[];
}

interface AccountOverviewData {
  counts: {
    totalOrders: number;
    pendingOrders: number;
    processingOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
  };
  recentOrders: RecentOrderSummary[];
  defaultShippingAddress: {
    id: string;
    recipientName: string;
    phone: string;
    streetAddress: string;
    city: string;
    state?: string | null;
    postalCode: string;
    country: string;
  } | null;
}

export default function AccountDashboardPage() {
  const { user } = useAuth();
  const { cart, wishlistCount } = useStore();
  const [overview, setOverview] = useState<AccountOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchOverview() {
      try {
        const data = await apiClient.get<AccountOverviewData>('/account/overview');
        if (mounted && data) {
          setOverview(data);
        }
      } catch (err) {
        console.error('Failed to load customer overview:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    fetchOverview();

    return () => {
      mounted = false;
    };
  }, []);

  const totalOrders = overview?.counts.totalOrders ?? 0;
  const pendingOrders = overview?.counts.pendingOrders ?? 0;
  const defaultAddress = overview?.defaultShippingAddress ?? null;
  const recentOrders = overview?.recentOrders ?? [];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl shadow-slate-900/10 border border-slate-800">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-semibold tracking-wide mb-3">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            Verified Customer Center
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Welcome back, {user?.name || 'Customer'}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed">
            Monitor current shipments, inspect itemized invoices, or update your saved
            delivery destinations from your personal overview.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/account/orders"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl shadow-sm transition-all"
            >
              <Package className="w-4 h-4" />
              View All Orders ({totalOrders})
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-xl border border-slate-700 transition-all"
            >
              <ShoppingBag className="w-4 h-4 text-slate-400" />
              Explore Catalog
            </Link>
          </div>
        </div>

        {/* Ambient atmospheric glow */}
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders */}
        <Link
          href="/account/orders"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Orders
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 font-mono">
            {isLoading ? '...' : totalOrders}
          </p>
          <span className="text-[11px] text-blue-600 font-medium mt-1 inline-flex items-center gap-1">
            Order history <ChevronRight className="w-3 h-3" />
          </span>
        </Link>

        {/* Pending Orders */}
        <Link
          href="/account/orders?status=PENDING"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Orders
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 font-mono">
            {isLoading ? '...' : pendingOrders}
          </p>
          <span className="text-[11px] text-amber-600 font-medium mt-1 inline-flex items-center gap-1">
            {pendingOrders > 0 ? 'Awaiting fulfillment' : 'All clear'} <ChevronRight className="w-3 h-3" />
          </span>
        </Link>

        {/* Cart Items */}
        <Link
          href="/cart"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Cart Items
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 font-mono">
            {cart.length}
          </p>
          <span className="text-[11px] text-indigo-600 font-medium mt-1 inline-flex items-center gap-1">
            View shopping cart <ChevronRight className="w-3 h-3" />
          </span>
        </Link>

        {/* Saved Wishlist */}
        <Link
          href="/account/wishlist"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Saved Wishlist
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 font-mono">
            {wishlistCount}
          </p>
          <span className="text-[11px] text-rose-600 font-medium mt-1 inline-flex items-center gap-1">
            Saved items <ChevronRight className="w-3 h-3" />
          </span>
        </Link>
      </div>

      {/* Grid: Primary Address & Security Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Default Shipping Address Snapshot */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900">
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

            {isLoading ? (
              <div className="py-6 text-center text-slate-400 text-xs animate-pulse">
                Loading address information...
              </div>
            ) : defaultAddress ? (
              <div className="space-y-1.5 text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900">
                    {defaultAddress.recipientName}
                  </span>
                  <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    Default Destination
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono">{defaultAddress.phone}</p>
                <p className="text-slate-700 text-xs leading-relaxed">{defaultAddress.streetAddress}</p>
                <p className="text-slate-700 text-xs">
                  {defaultAddress.city}
                  {defaultAddress.state ? `, ${defaultAddress.state}` : ''} -{' '}
                  <span className="font-mono">{defaultAddress.postalCode}</span>
                </p>
                <p className="text-[11px] text-slate-400">{defaultAddress.country}</p>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-slate-500 mb-3">
                  No default delivery destination configured yet.
                </p>
                <Link
                  href="/account/addresses"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 text-blue-600 rounded-xl font-semibold text-xs hover:bg-blue-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Shipping Destination
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Profile Snapshot & Security */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900">
                  Profile & Security Credentials
                </h2>
              </div>
              <Link
                href="/account/profile"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Update <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400">Full Name</span>
                <span className="font-semibold text-slate-900">{user?.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400">Email Address</span>
                <span className="font-semibold text-slate-900 font-mono">{user?.email}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400">Phone Number</span>
                <span className="font-semibold text-slate-900 font-mono">
                  {user?.phone || 'Not provided'}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Password Status</span>
                <span className="font-mono text-slate-500">•••••••••••• (Encrypted)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Activity & Orders</h2>
              <p className="text-[11px] text-slate-400">Latest orders placed on your account</p>
            </div>
          </div>
          <Link
            href="/account/orders"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            All Orders ({totalOrders}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs animate-pulse">
            Loading recent order history...
          </div>
        ) : recentOrders.length > 0 ? (
          <div className="space-y-3">
            {recentOrders.map((order) => {
              const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div
                  key={order.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200/70 hover:border-blue-200 hover:bg-slate-50/60 transition-all gap-4"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    {/* Items Thumbnails Strip */}
                    <div className="flex items-center -space-x-2 shrink-0">
                      {order.itemsPreview.slice(0, 3).map((item, idx) => (
                        <div
                          key={idx}
                          className="w-10 h-10 rounded-lg border-2 border-white bg-slate-100 overflow-hidden relative shadow-xs"
                          title={item.productTitle}
                        >
                          {item.thumbnailUrl ? (
                            <Image
                              src={item.thumbnailUrl}
                              alt={item.productTitle}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <Package className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      ))}
                      {order.itemsPreview.length > 3 && (
                        <div className="w-10 h-10 rounded-lg border-2 border-white bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center justify-center shadow-xs">
                          +{order.itemsPreview.length - 3}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-900 tracking-wide">
                          {order.orderNumber}
                        </span>
                        <OrderStatusBadge status={order.orderStatus} size="sm" />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Placed on {formattedDate} • {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <span className="text-[11px] text-slate-400 block sm:inline mr-1">Total:</span>
                      <span className="text-sm font-bold text-slate-900 font-mono">
                        ৳{order.grandTotal.toLocaleString()}
                      </span>
                    </div>

                    <Link
                      href={`/account/orders/${order.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-medium text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      Details <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 px-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3 border border-slate-100">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No Orders Placed Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
              When you purchase items from A to Z Ecommerce, your order status, delivery
              tracking, and receipts will appear right here.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-xs transition-all"
            >
              Browse Catalog <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
