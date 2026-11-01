'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Package,
  Calendar,
  MapPin,
  CreditCard,
  Truck,
  ExternalLink,
  ChevronLeft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  ShieldCheck,
  Ban,
  Tag,
  Printer,
  X,
} from 'lucide-react';
import { apiClient } from '../../../../lib/api-client';
import { OrderStatusBadge, PaymentStatusBadge } from '../../../../components/UI/OrderStatusBadge';

interface OrderItem {
  id: string;
  variantId: string;
  productTitle: string;
  sku: string;
  variantAttributes: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  taxRate: number;
  taxAmount: number;
  taxClassName: string | null;
  thumbnailUrl: string | null;
}

interface StatusHistoryItem {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  notes: string | null;
  changedByUserName: string | null;
  createdAt: string;
}

interface ShipmentItem {
  id: string;
  courierName: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  status: string;
  shippedAt: string | null;
  deliveredAt: string | null;
}

interface PaymentItem {
  id: string;
  method: string;
  status: string;
  amount: number;
  transactionRef: string | null;
  paidAt: string | null;
  createdAt: string;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  shipmentStatus: string;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  totalTaxAmount: number;
  grandTotal: number;
  recipientName: string;
  recipientPhone: string;
  shippingStreet: string;
  shippingCity: string;
  shippingState: string | null;
  shippingPostalCode: string;
  customerNotes: string | null;
  couponCode: string | null;
  items: OrderItem[];
  statusHistory: StatusHistoryItem[];
  shipments: ShipmentItem[];
  payments: PaymentItem[];
  createdAt: string;
  updatedAt: string;
}

const TIMELINE_STEPS = [
  { key: 'PLACED', label: 'Order Placed' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'PROCESSING', label: 'Processing' },
  { key: 'SHIPPED', label: 'Dispatched' },
  { key: 'DELIVERED', label: 'Delivered' },
];

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cancellation Modal state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadOrder() {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const data = await apiClient.get<OrderDetail>(`/orders/${id}`);
        if (mounted && data) {
          setOrder(data);
        }
      } catch (err: any) {
        if (mounted) {
          setErrorMsg(
            err?.message || 'Order could not be found or you do not have permission to view it.',
          );
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadOrder();

    return () => {
      mounted = false;
    };
  }, [id]);

  // Handle Escape key for Cancel Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCancelModalOpen) {
        setIsCancelModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCancelModalOpen]);

  const handleCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    setIsCancelling(true);
    setCancelError(null);

    try {
      const updated = await apiClient.post<OrderDetail>(`/orders/${order.id}/cancel`, {
        reason: cancelReason.trim() || undefined,
      });

      setOrder(updated);
      setIsCancelModalOpen(false);
      setCancelSuccessMsg('Your order has been cancelled successfully. Reserved stock was released.');
    } catch (err: any) {
      setCancelError(
        err?.response?.data?.message || err?.message || 'Failed to cancel order. It may have already moved to processing.',
      );
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="surface-3d rounded-3xl border border-slate-200/90 p-12 text-center shadow-xs">
        <div className="w-12 h-12 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs font-semibold text-slate-500">Loading order invoice details…</p>
      </div>
    );
  }

  if (errorMsg || !order) {
    return (
      <div className="surface-3d rounded-3xl border border-slate-200/90 p-12 text-center shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4 border border-rose-100">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Unable to Display Order</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
          {errorMsg || 'The requested order details are not available.'}
        </p>
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white font-semibold text-xs rounded-xl shadow-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <ChevronLeft className="w-4 h-4" /> <span>Back to My Orders</span>
        </Link>
      </div>
    );
  }

  const isCancelled = order.orderStatus === 'CANCELLED';
  const isReturned = order.orderStatus === 'RETURNED';

  const getStepStatus = (stepKey: string) => {
    if (isCancelled || isReturned) return 'inactive';

    const statusHierarchy: Record<string, number> = {
      PENDING: 1,
      CONFIRMED: 2,
      PROCESSING: 3,
      SHIPPED: 4,
      DELIVERED: 5,
    };

    const currentLevel = statusHierarchy[order.orderStatus] || 1;
    const stepLevel = statusHierarchy[stepKey] || 1;

    if (currentLevel > stepLevel) return 'completed';
    if (currentLevel === stepLevel) return 'current';
    return 'upcoming';
  };

  const formattedPlacedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });

  const latestShipment = order.shipments?.[0] || null;
  const latestPayment = order.payments?.[0] || null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-sm"
        >
          <ChevronLeft className="w-4 h-4" /> <span>Back to Order History</span>
        </Link>
        <span className="text-[11px] font-mono text-slate-400">Order ID: {order.id.slice(0, 8)}</span>
      </div>

      {/* Success alert on cancellation */}
      {cancelSuccessMsg && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{cancelSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setCancelSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Order Header Card */}
      <div className="surface-3d rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-wide">
                {order.orderNumber}
              </h1>
              <OrderStatusBadge status={order.orderStatus} size="md" />
              <PaymentStatusBadge status={order.paymentStatus} size="md" />
            </div>
            <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Placed on {formattedPlacedDate}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            {order.orderStatus === 'PENDING' && (
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                <Ban className="w-3.5 h-3.5" /> <span>Cancel Order</span>
              </button>
            )}

            {latestShipment?.trackingUrl && (
              <a
                href={latestShipment.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-600/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <Truck className="w-3.5 h-3.5" /> <span>Track Courier</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            )}

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" /> <span>Print Invoice</span>
            </button>
          </div>
        </div>

        {/* Fulfillment Timeline Stepper */}
        {isCancelled ? (
          <div className="mt-6 p-4 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Order Cancelled</p>
              <p className="mt-0.5 text-rose-700">
                This order was cancelled. Reserved items have been released back into warehouse inventory.
              </p>
              {order.statusHistory?.find((h) => h.toStatus === 'CANCELLED')?.notes && (
                <p className="text-[11px] text-rose-600 font-medium mt-1">
                  Reason: {order.statusHistory.find((h) => h.toStatus === 'CANCELLED')?.notes}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Fulfillment Progression
            </h2>
            <div className="grid grid-cols-5 gap-2 relative">
              {TIMELINE_STEPS.map((step, idx) => {
                const status = getStepStatus(step.key);

                return (
                  <div key={step.key} className="flex flex-col items-center text-center">
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs mb-2 transition-all duration-300 ${
                        status === 'completed'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-4 ring-emerald-50'
                          : status === 'current'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-4 ring-blue-50 animate-pulse'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <span className="font-mono">{idx + 1}</span>
                      )}
                    </div>
                    <span
                      className={`text-[11px] leading-tight font-semibold ${
                        status === 'completed' || status === 'current'
                          ? 'text-slate-900 font-bold'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Grid: Line Items & Sidebar Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Ordered Items & Audit History */}
        <div className="lg:col-span-8 space-y-6">
          {/* Order Items Table Card */}
          <div className="surface-3d rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Ordered Items ({order.items.length})
                  </h2>
                  <p className="text-[11px] text-slate-400">Frozen invoice snapshots at time of purchase</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {order.items.map((item) => (
                <div key={item.id} className="p-6 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200/80 overflow-hidden relative shrink-0 shadow-xs">
                    {item.thumbnailUrl ? (
                      <Image
                        src={item.thumbnailUrl}
                        alt={item.productTitle}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Package className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {item.productTitle}
                    </h3>

                    {item.variantAttributes && (
                      <p className="text-xs text-slate-600 mt-1 font-medium">
                        {item.variantAttributes}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1.5 font-mono tabular-nums">
                      <span>SKU: {item.sku}</span>
                      <span>Qty: {item.quantity}</span>
                      {item.taxAmount > 0 && (
                        <span>VAT (incl): ৳{item.taxAmount.toLocaleString()}</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-slate-900 font-mono tabular-nums">
                      ৳{item.totalPrice.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-mono tabular-nums">
                      ৳{item.unitPrice.toLocaleString()} each
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Timeline History Card */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="surface-3d rounded-3xl border border-slate-200/90 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                <FileText className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">Lifecycle Activity Audit Log</h2>
              </div>

              <div className="space-y-4">
                {order.statusHistory.map((history) => {
                  const historyDate = new Date(history.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                  });

                  return (
                    <div key={history.id} className="flex items-start gap-3 text-xs">
                      <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{history.toStatus}</span>
                          <span className="text-[11px] text-slate-400 font-mono">{historyDate}</span>
                        </div>
                        {history.notes && (
                          <p className="text-slate-600 mt-0.5">{history.notes}</p>
                        )}
                        {history.changedByUserName && (
                          <p className="text-[10px] text-slate-400">By: {history.changedByUserName}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (4 cols): Financial Totals, Address, Courier */}
        <div className="lg:col-span-4 space-y-6">
          {/* Itemized Price Breakdown */}
          <div className="surface-3d rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100">
              Payment Summary
            </h2>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  ৳{order.subtotal.toLocaleString()}
                </span>
              </div>

              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" /> Discount
                    {order.couponCode ? ` (${order.couponCode})` : ''}
                  </span>
                  <span className="font-mono tabular-nums font-semibold">
                    -৳{order.discountAmount.toLocaleString()}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Delivery Courier Fee</span>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  ৳{order.shippingFee.toLocaleString()}
                </span>
              </div>

              {order.totalTaxAmount > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Included VAT/Taxes</span>
                  <span className="font-mono tabular-nums">৳{order.totalTaxAmount.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
              <span className="text-sm font-bold text-slate-900">Total Payable</span>
              <span className="text-xl font-black text-slate-900 font-mono tabular-nums">
                ৳{order.grandTotal.toLocaleString()}
              </span>
            </div>

            {latestPayment && (
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Method</span>
                  <span className="font-semibold text-slate-800">
                    {latestPayment.method.replace(/_/g, ' ')}
                  </span>
                </div>
                {latestPayment.transactionRef && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">TrxID</span>
                    <span className="font-mono font-bold text-slate-800">
                      {latestPayment.transactionRef}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Shipping Address Snapshot */}
          <div className="surface-3d rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-3">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <MapPin className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Delivery Destination</h2>
            </div>

            <div className="text-xs text-slate-600 space-y-1.5">
              <p className="font-bold text-slate-900 text-sm">{order.recipientName}</p>
              <p className="font-mono text-slate-500">{order.recipientPhone}</p>
              <p className="text-slate-700 leading-relaxed font-medium">{order.shippingStreet}</p>
              <p className="text-slate-700 font-medium">
                {order.shippingCity}
                {order.shippingState ? `, ${order.shippingState}` : ''} -{' '}
                <span className="font-mono">{order.shippingPostalCode}</span>
              </p>
            </div>
          </div>

          {/* Courier Shipment Details */}
          {latestShipment && (
            <div className="surface-3d rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-3">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Truck className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">Shipment Details</h2>
              </div>

              <div className="text-xs text-slate-600 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Courier</span>
                  <span className="font-semibold text-slate-900">{latestShipment.courierName}</span>
                </div>
                {latestShipment.trackingNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tracking Number</span>
                    <span className="font-mono font-bold text-slate-900">
                      {latestShipment.trackingNumber}
                    </span>
                  </div>
                )}
                {latestShipment.trackingUrl && (
                  <a
                    href={latestShipment.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-semibold text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  >
                    <span>Open Live Tracking</span> <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancellation Modal Dialog */}
      {isCancelModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-dialog-title"
          aria-describedby="cancel-dialog-desc"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overscroll-contain"
        >
          <div className="surface-3d rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="cancel-dialog-title" className="text-base font-bold text-slate-900">
                    Cancel Order {order.orderNumber}?
                  </h3>
                  <p id="cancel-dialog-desc" className="text-xs text-slate-500">
                    Please confirm if you want to cancel this order
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl text-xs text-slate-600 mb-4 border border-slate-100 leading-relaxed">
              Cancelling will immediately release reserved items back into available stock. This action cannot be reversed.
            </div>

            {cancelError && (
              <div
                role="alert"
                className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs"
              >
                {cancelError}
              </div>
            )}

            <form onSubmit={handleCancelOrder} className="space-y-4">
              <div>
                <label htmlFor="cancel-reason-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Reason for Cancellation (Optional)
                </label>
                <textarea
                  id="cancel-reason-input"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Changed my mind, found another product, incorrect address…"
                  rows={3}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  disabled={isCancelling}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  disabled={isCancelling}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-rose-600/25 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                >
                  {isCancelling ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Cancelling…</span>
                    </>
                  ) : (
                    <span>Confirm Cancellation</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}