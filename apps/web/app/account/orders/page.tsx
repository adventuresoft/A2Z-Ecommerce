'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Package,
  ShoppingBag,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar,
  CreditCard,
  Truck,
  ExternalLink,
} from 'lucide-react';
import { apiClient } from '../../../lib/api-client';
import { OrderStatusBadge, PaymentStatusBadge } from '../../../components/UI/OrderStatusBadge';

interface OrderItemDto {
  id: string;
  variantId: string;
  productTitle: string;
  sku: string;
  variantAttributes: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  thumbnailUrl: string | null;
}

interface OrderDto {
  id: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  shipmentStatus: string;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  grandTotal: number;
  recipientName: string;
  shippingCity: string;
  createdAt: string;
  items: OrderItemDto[];
}

interface PaginatedOrdersResponse {
  data: OrderDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const STATUS_TABS = [
  { key: 'ALL', label: 'All Orders' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'PROCESSING', label: 'Processing' },
  { key: 'SHIPPED', label: 'Shipped' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

function OrderHistoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get('status') || 'ALL';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.set('page', currentPage.toString());
      queryParams.set('limit', '8');

      if (currentStatus !== 'ALL') {
        queryParams.set('orderStatus', currentStatus);
      }

      const res = await apiClient.get<PaginatedOrdersResponse>(
        `/orders?${queryParams.toString()}`,
      );

      if (res && Array.isArray(res.data)) {
        setOrders(res.data);
        setTotalPages(res.meta?.totalPages || 1);
        setTotalCount(res.meta?.total || 0);
      }
    } catch (err) {
      console.error('Failed to load customer orders:', err);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentStatus, currentPage]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleTabChange = (tabKey: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tabKey === 'ALL') {
      params.delete('status');
    } else {
      params.set('status', tabKey);
    }
    params.set('page', '1');
    router.push(`/account/orders?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/account/orders?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Order History
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Track fulfillment, view invoices, and inspect shipment progress for all your orders
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            {totalCount} {totalCount === 1 ? 'Total Order' : 'Total Orders'}
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-2 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {STATUS_TABS.map((tab) => {
            const isActive = currentStatus === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List / Loading / Empty State */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 animate-pulse space-y-4"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div className="h-5 bg-slate-200 rounded-md w-36" />
                <div className="h-5 bg-slate-200 rounded-full w-24" />
              </div>
              <div className="h-16 bg-slate-100 rounded-xl w-full" />
            </div>
          ))}
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => {
            const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            const itemCount = order.items.reduce((acc, it) => acc + it.quantity, 0);

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-200 hover:shadow-sm transition-all overflow-hidden"
              >
                {/* Order Top Bar */}
                <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-900 tracking-wide">
                      {order.orderNumber}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500 inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formattedDate}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <OrderStatusBadge status={order.orderStatus} size="sm" />
                    <PaymentStatusBadge status={order.paymentStatus} size="sm" />
                  </div>
                </div>

                {/* Order Content */}
                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Items Preview */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 overflow-x-auto pb-1">
                      {order.items.slice(0, 4).map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100 shrink-0 max-w-xs"
                        >
                          <div className="w-12 h-12 rounded-lg bg-white overflow-hidden relative shrink-0 border border-slate-200/70">
                            {item.thumbnailUrl ? (
                              <Image
                                src={item.thumbnailUrl}
                                alt={item.productTitle}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 text-xs">
                            <p className="font-medium text-slate-800 truncate" title={item.productTitle}>
                              {item.productTitle}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Qty: {item.quantity} × ৳{item.unitPrice.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      {order.items.length > 4 && (
                        <div className="px-3 py-4 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs shrink-0 flex items-center justify-center">
                          +{order.items.length - 4} more
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 mt-2">
                      Delivering to: <span className="text-slate-600 font-medium">{order.recipientName}</span> ({order.shippingCity})
                    </p>
                  </div>

                  {/* Financial & Action CTA */}
                  <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 gap-3">
                    <div className="text-left md:text-right">
                      <span className="text-[11px] text-slate-400 block">Total Amount</span>
                      <span className="text-lg font-bold text-slate-900 font-mono">
                        ৳{order.grandTotal.toLocaleString()}
                      </span>
                    </div>

                    <Link
                      href={`/account/orders/${order.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white font-medium text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      View Details <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <span className="text-xs text-slate-500 font-medium font-mono">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-base font-bold text-slate-900">
            {currentStatus === 'ALL'
              ? 'No orders found'
              : `No ${currentStatus.toLowerCase()} orders`}
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
            {currentStatus === 'ALL'
              ? "You haven't placed any orders yet. Discover our premium products and shop with total peace of mind."
              : `You have no orders currently categorized under '${currentStatus.toLowerCase()}'.`}
          </p>
          <div className="flex justify-center gap-3">
            {currentStatus !== 'ALL' && (
              <button
                type="button"
                onClick={() => handleTabChange('ALL')}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Clear Filter
              </button>
            )}
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-xs transition-all"
            >
              Browse Catalog <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderHistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-400 text-xs animate-pulse">
          Loading order history...
        </div>
      }
    >
      <OrderHistoryContent />
    </Suspense>
  );
}
