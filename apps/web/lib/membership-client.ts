import { request } from './api-client';

export interface MembershipPlan {
  id: string;
  name: string;
  durationDays: number;
  price: number;
  features?: unknown;
  isActive: boolean;
  sortOrder: number;
}

export interface MembershipSubscription {
  id: string;
  planId: string;
  startsAt: string;
  expiresAt: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  createdAt?: string;
  plan?: MembershipPlan;
}

export interface MembershipStatus {
  isActive: boolean;
  subscription: MembershipSubscription | null;
  daysRemaining: number;
}

export type MembershipPaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface MembershipPayment {
  id: string;
  planId: string;
  amount: number;
  gateway: string;
  status: MembershipPaymentStatus;
  paidAt?: string | null;
  createdAt: string;
  plan?: MembershipPlan;
}

export interface MembershipHistory {
  subscriptions: MembershipSubscription[];
  payments: MembershipPayment[];
}

export interface MembershipCheckoutResult {
  paymentId: string;
  amount: number;
  invoiceNumber: string;
  paymentUrl: string;
}

export interface MembershipCallbackResult {
  success: boolean;
  message: string;
  subscription?: MembershipSubscription | null;
  payment?: MembershipPayment | null;
}

/** Number of days at or below which a membership is flagged as expiring. */
export const EXPIRING_SOON_DAYS = 7;

export const membershipClient = {
  getPlans() {
    return request<MembershipPlan[]>('/memberships/plans', { skipAuth: true });
  },

  getMine() {
    return request<MembershipStatus>('/memberships/me');
  },

  getHistory() {
    return request<MembershipHistory>('/memberships/history');
  },

  checkout(planId: string) {
    return request<MembershipCheckoutResult>('/memberships/checkout', {
      method: 'POST',
      body: JSON.stringify({ planId }),
    });
  },

  /** Forwards the gateway return parameters so the API can finalize the payment. */
  confirmCallback(params: {
    paymentId: string;
    status?: string | null;
    invoice_number?: string | null;
    trx_id?: string | null;
  }) {
    const qs = new URLSearchParams();
    qs.set('paymentId', params.paymentId);
    if (params.status) qs.set('status', params.status);
    if (params.invoice_number) qs.set('invoice_number', params.invoice_number);
    if (params.trx_id) qs.set('trx_id', params.trx_id);
    return request<MembershipCallbackResult>(`/memberships/callback?${qs.toString()}`, {
      skipAuth: true,
    });
  },
};

export function formatBdt(amount: number): string {
  return `৳${amount.toLocaleString('en-US')}`;
}

export function durationLabel(days: number): string {
  if (days % 365 === 0) {
    const years = days / 365;
    return years === 1 ? '1 year' : `${years} years`;
  }
  if (days % 30 === 0) {
    const months = days / 30;
    return months === 1 ? '1 month' : `${months} months`;
  }
  return `${days} days`;
}

/** Price per month, rounded, for comparing plans of different length. */
export function perMonthPrice(plan: Pick<MembershipPlan, 'price' | 'durationDays'>): number {
  return Math.round(plan.price / (plan.durationDays / 30));
}

export function isExpiringSoon(status: MembershipStatus | null): boolean {
  return Boolean(
    status?.isActive && status.daysRemaining <= EXPIRING_SOON_DAYS,
  );
}

/** Reads a list of feature strings from the plan's features JSON, if present. */
export function planFeatureList(plan: Pick<MembershipPlan, 'features'>): string[] {
  const f = plan.features as unknown;
  if (Array.isArray(f)) return f.filter((x): x is string => typeof x === 'string');
  if (f && typeof f === 'object') {
    const list = (f as { list?: unknown }).list;
    if (Array.isArray(list)) return list.filter((x): x is string => typeof x === 'string');
  }
  return [];
}

