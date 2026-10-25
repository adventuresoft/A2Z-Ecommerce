'use client';

import React from 'react';
import {
  Clock,
  CheckCircle2,
  PackageCheck,
  Truck,
  CheckCheck,
  XCircle,
  RotateCcw,
} from 'lucide-react';

export type OrderStatusType =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED';

interface OrderStatusBadgeProps {
  status: OrderStatusType | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function OrderStatusBadge({
  status,
  size = 'md',
  showIcon = true,
}: OrderStatusBadgeProps) {
  const normalized = (status || '').toUpperCase() as OrderStatusType;

  let config = {
    label: status,
    bg: 'bg-slate-50 text-slate-700 border-slate-200',
    icon: Clock,
  };

  switch (normalized) {
    case 'PENDING':
      config = {
        label: 'Pending',
        bg: 'bg-amber-50 text-amber-800 border-amber-200/80',
        icon: Clock,
      };
      break;
    case 'CONFIRMED':
      config = {
        label: 'Confirmed',
        bg: 'bg-blue-50 text-blue-700 border-blue-200/80',
        icon: CheckCircle2,
      };
      break;
    case 'PROCESSING':
      config = {
        label: 'Processing',
        bg: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
        icon: PackageCheck,
      };
      break;
    case 'SHIPPED':
      config = {
        label: 'Shipped',
        bg: 'bg-purple-50 text-purple-700 border-purple-200/80',
        icon: Truck,
      };
      break;
    case 'DELIVERED':
      config = {
        label: 'Delivered',
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
        icon: CheckCheck,
      };
      break;
    case 'CANCELLED':
      config = {
        label: 'Cancelled',
        bg: 'bg-rose-50 text-rose-700 border-rose-200/80',
        icon: XCircle,
      };
      break;
    case 'RETURNED':
      config = {
        label: 'Returned',
        bg: 'bg-slate-100 text-slate-700 border-slate-300',
        icon: RotateCcw,
      };
      break;
  }

  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${config.bg} ${sizeClasses[size]}`}
    >
      {showIcon && <Icon className={`${iconSizes[size]} shrink-0`} />}
      <span>{config.label}</span>
    </span>
  );
}

export function PaymentStatusBadge({
  status,
  size = 'sm',
}: {
  status: string;
  size?: 'sm' | 'md';
}) {
  const norm = (status || '').toUpperCase();
  let bg = 'bg-slate-50 text-slate-600 border-slate-200';
  let label = status;

  if (norm === 'PAID') {
    bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    label = 'Paid';
  } else if (norm === 'PENDING') {
    bg = 'bg-amber-50 text-amber-700 border-amber-200';
    label = 'Payment Pending';
  } else if (norm === 'FAILED') {
    bg = 'bg-rose-50 text-rose-700 border-rose-200';
    label = 'Payment Failed';
  } else if (norm === 'REFUNDED') {
    bg = 'bg-purple-50 text-purple-700 border-purple-200';
    label = 'Refunded';
  }

  const sizeClass = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${bg} ${sizeClass}`}>
      {label}
    </span>
  );
}
