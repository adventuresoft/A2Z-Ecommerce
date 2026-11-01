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
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { apiClient } from '../../lib/api-client';
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/UI/OrderStatusBadge';
import { Tilt3DCard } from '../../components/UI/Tilt3DCard';

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

  const counts = overview?.counts ?? {
    totalOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
  };
  const defaultAddress = overview?.defaultShippingAddress ?? null;
  const recentOrders = overview?.recentOrders ?? [];

  return (
    <div className="space-y-8">
      {/* 3D Spatial Welcome Banner */}
      <div className="relative overflow-hidden bg-tech-grid rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-2xl shadow-slate-950/20 border border-slate-800">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-semibold tracking-wide mb-4 backdrop-blur-xs">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Verified Customer Control Center</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">{user?.name || 'Customer'}</span>
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
            Track real-time shipment dispatches, review authenticated payment receipts, or manage saved delivery destinations seamlessly.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/account/orders"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-[background-color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <Package className="w-4 h-4" />
              <span>View All Orders ({counts.totalOrders})</span>
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800/90 hover:bg-slate-700 active:scale-95 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-[background-color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <ShoppingBag className="w-4 h-4 text-slate-400" />
              <span>Explore Products</span>
            </Link>
          </div>
        </div>

        {/* Ambient 3D Tech Glows */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/2 bottom-0 w-64 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 3D KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders */}
        <Tilt3DCard maxTiltDeg={7} glareOpacity={0.12}>
          <Link
            href="/account/orders"
            className="block surface-3d p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:border-blue-300 hover:shadow-md transition-[border-color,box-shadow] group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Orders
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono tabular-nums">
              {isLoading ? '…' : counts.totalOrders}
            </p>
            <span className="text-[11px] text-blue-600 font-semibold mt-1 inline-flex items-center gap-1 group-hover:underline">
              Order history <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </Tilt3DCard>

        {/* Pending Orders */}
        <Tilt3DCard maxTiltDeg={7} glareOpacity={0.12}>
          <Link
            href="/account/orders?status=PENDING"
            className="block surface-3d p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:border-amber-300 hover:shadow-md transition-[border-color,box-shadow] group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Pending Orders
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono tabular-nums">
              {isLoading ? '…' : counts.pendingOrders}
            </p>
            <span className="text-[11px] text-amber-600 font-semibold mt-1 inline-flex items-center gap-1 group-hover:underline">
              {counts.pendingOrders > 0 ? 'Awaiting dispatch' : 'All clear'} <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </Tilt3DCard>

        {/* Cart Items */}
        <Tilt3DCard maxTiltDeg={7} glareOpacity={0.12}>
          <Link
            href="/cart"
            className="block surface-3d p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:border-indigo-300 hover:shadow-md transition-[border-color,box-shadow] group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Cart Items
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono tabular-nums">
              {cart.length}
            </p>
            <span className="text-[11px] text-indigo-600 font-semibold mt-1 inline-flex items-center gap-1 group-hover:underline">
              View shopping cart <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </Tilt3DCard>

        {/* Saved Wishlist */}
        <Tilt3DCard maxTiltDeg={7} glareOpacity={0.12}>
          <Link
            href="/account/wishlist"
            className="block surface-3d p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:border-rose-300 hover:shadow-md transition-[border-color,box-shadow] group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Saved Wishlist
              </span>
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Heart className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono tabular-nums">
              {wishlistCount}
            </p>
            <span className="text-[11px] text-rose-600 font-semibold mt-1 inline-flex items-center gap-1 group-hover:underline">
              Saved items <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </Tilt3DCard>
      </div>

      {/* Fulfillment Pipeline Telemetry */}
      {counts.totalOrders > 0 && (
        <div className="surface-3d rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Fulfillment Status Breakdown
                </h2>
                <p className="text-[11px] text-slate-500">Live lifecycle distribution of your orders</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 text-amber-700">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Pending: {counts.pendingOrders}
              </span>
              <span className="inline-flex items-center gap-1.5 text-blue-700">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Processing: {counts.processingOrders}
              </span>
              <span className="inline-flex items-center gap-1.5 text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Delivered: {counts.deliveredOrders}
              </span>
            </div>
          </div>

          {/* Segmented bar */}
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
            {counts.pendingOrders > 0 && (
              <div
                style={{ width: `${(counts.pendingOrders / counts.totalOrders) * 100}%` }}
                className="bg-amber-500 h-full transition-[width] duration-500"
                title={`Pending: ${counts.pendingOrders}`}
              />
            )}
            {counts.processingOrders > 0 && (
              <div
                style={{ width: `${(counts.processingOrders / counts.totalOrders) * 100}%` }}
                className="bg-blue-600 h-full transition-[width] duration-500"
                title={`Processing: ${counts.processingOrders}`}
              />
            )}
            {counts.deliveredOrders > 0 && (
              <div
                style={{ width: `${(counts.deliveredOrders / counts.totalOrders) * 100}%` }}
                className="bg-emerald-500 h-full transition-[width] duration-500"
                title={`Delivered: ${counts.deliveredOrders}`}
              />
            )}
            {counts.cancelledOrders > 0 && (
              <div
                style={{ width: `${(counts.cancelledOrders / counts.totalOrders) * 100}%` }}
                className="bg-slate-300 h-full transition-[width] duration-500"
                title={`Cancelled: ${counts.cancelledOrders}`}
              />
            )}
          </div>
        </div>
      )}

      {/* Grid: Primary Address & Security Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Default Shipping Address Snapshot */}
        <div className="surface-3d rounded-3xl border border-slate-200/90 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900">
                  Primary Delivery Address
                </h2>
              </div>
              <Link
                href="/account/addresses"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-sm"
              >
                <span>Manage</span> <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {isLoading ? (
              <div className="py-6 text-center text-slate-400 text-xs animate-pulse">
                Loading address information...
              </div>
            ) : defaultAddress ? (
              <div className="space-y-2 text-xs text-slate-600 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900 text-sm">
                    {defaultAddress.recipientName}
                  </span>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    Default Destination
                  </span>
                </div>
                <p className="text-slate-500 font-mono text-xs">{defaultAddress.phone}</p>
                <p className="text-slate-700 leading-relaxed font-medium">{defaultAddress.streetAddress}</p>
                <p className="text-slate-700 font-medium">
                  {defaultAddress.city}
                  {defaultAddress.state ? `, ${defaultAddress.state}` : ''} -{' '}
                  <span className="font-mono">{defaultAddress.postalCode}</span>
                </p>
                <p className="text-[11px] text-slate-400 font-semibold">{defaultAddress.country}</p>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-slate-500 mb-3">
                  No default delivery destination configured yet.
                </p>
                <Link
                  href="/account/addresses"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 text-blue-600 rounded-xl font-semibold text-xs hover:bg-blue-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <Plus className="w-3.5 h-3.5" /> <span>Add Shipping Destination</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Profile Snapshot & Security */}
        <div className="surface-3d rounded-3xl border border-slate-200/90 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900">
                  Profile & Security Credentials
                </h2>
              </div>
              <Link
                href="/account/profile"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-sm"
              >
                <span>Update</span> <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-400">Full Name</span>
                <span className="font-semibold text-slate-900">{user?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-400">Email Address</span>
                <span className="font-semibold text-slate-900 font-mono">{user?.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-400">Phone Number</span>
                <span className="font-semibold text-slate-900 font-mono">
                  {user?.phone || 'Not provided'}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Password Security</span>
                <span className="font-mono text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Encrypted & Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="surface-3d rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Activity & Orders</h2>
              <p className="text-[11px] text-slate-400">Latest orders placed on your account</p>
            </div>
          </div>
          <Link
            href="/account/orders"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-sm"
          >
            <span>All Orders ({counts.totalOrders})</span> <ArrowRight className="w-3.5 h-3.5" />
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
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-slate-200/80 hover:border-blue-300 hover:bg-slate-50/70 transition-[border-color,background-color] gap-4"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    {/* Items Thumbnails Strip */}
                    <div className="flex items-center -space-x-2 shrink-0">
                      {order.itemsPreview.slice(0, 3).map((item, idx) => (
                        <div
                          key={idx}
                          className="w-11 h-11 rounded-xl border-2 border-white bg-slate-100 overflow-hidden relative shadow-xs"
                          title={item.productTitle}
                        >
                          {item.thumbnailUrl ? (
                            <Image
                              src={item.thumbnailUrl}
                              alt={item.productTitle}
                              fill
                              sizes="44px"
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
                        <div className="w-11 h-11 rounded-xl border-2 border-white bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shadow-xs">
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
                        <PaymentStatusBadge status={order.paymentStatus} size="sm" />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Placed on {formattedDate} • {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <span className="text-[11px] text-slate-400 block sm:inline mr-1">Total:</span>
                      <span className="text-sm font-bold text-slate-900 font-mono tabular-nums">
                        ৳{order.grandTotal.toLocaleString()}
                      </span>
                    </div>

                    <Link
                      href={`/account/orders/${order.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 font-semibold text-xs rounded-xl transition-[background-color,color] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    >
                      <span>Details</span> <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 px-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3 border border-slate-200">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No Orders Placed Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
              When you purchase items from A to Z Ecommerce, your order status, delivery
              tracking, and receipts will appear right here.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-600/25 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <span>Browse Catalog</span> <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}