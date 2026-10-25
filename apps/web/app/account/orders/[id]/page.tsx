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
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs font-medium text-slate-500">Loading order invoice details...</p>
      </div>
    );
  }

  if (errorMsg || !order) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Unable to Display Order</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
          {errorMsg || 'The requested order details are not available.'}
        </p>
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white font-medium text-xs rounded-xl shadow-xs transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to My Orders
        </Link>
      </div>
    );
  }

  // Calculate current timeline progression
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
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Order History
        </Link>
        <span className="text-[11px] font-mono text-slate-400">Order Ref: {order.id.slice(0, 8)}</span>
      </div>

      {/* Success alert on cancellation */}
      {cancelSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{cancelSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setCancelSuccessMsg(null)}
            className="text-emerald-600 hover:text-emerald-800 text-xs font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Order Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono tracking-wide">
                {order.orderNumber}
              </h1>
              <OrderStatusBadge status={order.orderStatus} size="md" />
              <PaymentStatusBadge status={order.paymentStatus} size="md" />
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
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
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-rose-200 bg-rose-50/50 hover:bg-rose-100/70 text-rose-700 font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
              >
                <Ban className="w-3.5 h-3.5" /> Cancel Order
              </button>
            )}

            {latestShipment?.trackingUrl && (
              <a
                href={latestShipment.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-xs transition-all"
              >
                <Truck className="w-3.5 h-3.5" /> Track Courier
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            )}
          </div>
        </div>

        {/* Fulfillment Timeline Stepper */}
        {isCancelled ? (
          <div className="mt-6 p-4 rounded-xl bg-rose-50/80 border border-rose-200/80 text-rose-800 text-xs flex items-start gap-3">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Order Cancelled</p>
              <p className="mt-0.5 text-rose-700">
                This order was cancelled. Reserved items have been returned to warehouse inventory.
              </p>
              {order.statusHistory?.find((h) => h.toStatus === 'CANCELLED')?.notes && (
                <p className="text-[11px] text-rose-600/90 mt-1">
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
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-2 transition-all ${
                        status === 'completed'
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-50'
                          : status === 'current'
                          ? 'bg-blue-600 text-white ring-4 ring-blue-50 shadow-sm animate-pulse'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span
                      className={`text-[11px] leading-tight font-medium ${
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
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
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
                  <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200/80 overflow-hidden relative shrink-0">
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

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1.5 font-mono">
                      <span>SKU: {item.sku}</span>
                      <span>Qty: {item.quantity}</span>
                      {item.taxAmount > 0 && (
                        <span>VAT (incl): ৳{item.taxAmount.toLocaleString()}</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-900 font-mono">
                      ৳{item.totalPrice.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      ৳{item.unitPrice.toLocaleString()} each
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Timeline History Card */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                <FileText className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Status Transition Audit History
                </h2>
              </div>

              <div className="space-y-4">
                {order.statusHistory.map((history, idx) => {
                  const historyDate = new Date(history.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                  });

                  return (
                    <div key={history.id || idx} className="flex items-start gap-3 text-xs">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <OrderStatusBadge status={history.toStatus} size="sm" />
                          <span className="text-slate-400 text-[11px] font-mono">{historyDate}</span>
                        </div>
                        {history.notes && (
                          <p className="text-slate-600 text-xs mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            {history.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (4 cols): Financial Breakdown & Courier Details */}
        <div className="lg:col-span-4 space-y-6">
          {/* Financial Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
            <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
              Payment Summary
            </h2>

            <div className="space-y-2.5 py-4 text-xs border-b border-slate-100 text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono text-slate-900 font-semibold">
                  ৳{order.subtotal.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Shipping Fee</span>
                <span className="font-mono text-slate-900 font-semibold">
                  {order.shippingFee === 0 ? 'FREE' : `৳${order.shippingFee.toLocaleString()}`}
                </span>
              </div>

              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    Coupon Discount {order.couponCode ? `(${order.couponCode})` : ''}
                  </span>
                  <span className="font-mono font-bold">-৳{order.discountAmount.toLocaleString()}</span>
                </div>
              )}

              {order.totalTaxAmount > 0 && (
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Estimated VAT (Inclusive)</span>
                  <span className="font-mono">৳{order.totalTaxAmount.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="pt-4 flex items-center justify-between">
              <span className="text-sm font-extrabold text-slate-900">Grand Total</span>
              <span className="text-xl font-extrabold text-slate-900 font-mono">
                ৳{order.grandTotal.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Delivery Destination Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-3">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <MapPin className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Delivery Destination</h2>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <p className="font-bold text-slate-900 text-sm">{order.recipientName}</p>
              <p className="font-mono text-slate-500">{order.recipientPhone}</p>
              <p className="leading-relaxed text-slate-700 mt-1">{order.shippingStreet}</p>
              <p className="text-slate-700">
                {order.shippingCity}
                {order.shippingState ? `, ${order.shippingState}` : ''} -{' '}
                <span className="font-mono">{order.shippingPostalCode}</span>
              </p>
            </div>

            {order.customerNotes && (
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <span className="font-semibold block text-slate-700">Customer Delivery Instructions:</span>
                <p className="italic mt-0.5">{order.customerNotes}</p>
              </div>
            )}
          </div>

          {/* Payment Method Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-3">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Payment Information</h2>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Method</span>
                <span className="font-bold text-slate-900">
                  {latestPayment?.method === 'MOBILE_BANKING'
                    ? 'Mobile Banking (bKash/Nagad)'
                    : latestPayment?.method === 'CREDIT_CARD'
                    ? 'Credit/Debit Card'
                    : 'Cash on Delivery'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Payment Status</span>
                <PaymentStatusBadge status={order.paymentStatus} size="sm" />
              </div>

              {latestPayment?.transactionRef && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Transaction ID</span>
                  <span className="font-mono font-bold text-slate-800">
                    {latestPayment.transactionRef}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Courier Details Card if Available */}
          {latestShipment && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-3">
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
                    className="mt-2 w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-semibold text-xs transition-colors"
                  >
                    Open Live Tracking <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancellation Modal Dialog */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Cancel Order {order.orderNumber}?
                </h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to cancel this order?
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 mb-4 border border-slate-100">
              <p>
                Cancelling will immediately release reserved items back into available stock.
                This action is permanent and cannot be reversed.
              </p>
            </div>

            {cancelError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {cancelError}
              </div>
            )}

            <form onSubmit={handleCancelOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Reason for Cancellation (Optional)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Changed my mind, found another product, incorrect address..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  disabled={isCancelling}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  disabled={isCancelling}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isCancelling ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    'Confirm Cancellation'
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
