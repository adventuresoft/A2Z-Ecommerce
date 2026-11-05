import type { FreelancerAvailability, ServicePriceType } from './freelancer-client';

export interface AvailabilityStyle {
  label: string;
  bnLabel: string;
  /** Tailwind classes for the leading edge of a card. */
  edge: string;
  /** Tailwind classes for the text badge. */
  badge: string;
}

export const AVAILABILITY_STYLES: Record<FreelancerAvailability, AvailabilityStyle> = {
  AVAILABLE: {
    label: 'Available',
    bnLabel: 'কাজের জন্য প্রস্তুত',
    edge: 'bg-green-700',
    badge: 'bg-green-50 text-green-800 ring-green-700/30',
  },
  BUSY: {
    label: 'Busy',
    bnLabel: 'ব্যস্ত',
    edge: 'bg-slate-400',
    badge: 'bg-slate-100 text-slate-700 ring-slate-500/30',
  },
  UNAVAILABLE: {
    label: 'Unavailable',
    bnLabel: 'এখন নেই',
    edge: 'bg-slate-300',
    badge: 'bg-slate-50 text-slate-600 ring-slate-400/30',
  },
};

const PRICE_SUFFIX: Record<ServicePriceType, string> = {
  FIXED: '',
  HOURLY: '/hour',
  DAILY: '/day',
  NEGOTIABLE: '',
};

export function formatPrice(
  amount: number | null | undefined,
  type: ServicePriceType | null | undefined,
): string {
  if (type === 'NEGOTIABLE' || amount === null || amount === undefined) {
    return 'Negotiable';
  }
  return `৳${amount.toLocaleString('en-US')}${PRICE_SUFFIX[type ?? 'FIXED']}`;
}

export function priceTypeLabel(type: ServicePriceType): string {
  switch (type) {
    case 'FIXED':
      return 'Fixed price';
    case 'HOURLY':
      return 'Per hour';
    case 'DAILY':
      return 'Per day';
    default:
      return 'Negotiable';
  }
}

export function experienceLabel(years: number): string {
  if (years <= 0) return 'New';
  return years === 1 ? '1 year' : `${years} years`;
}

export function locationLabel(
  location: { district: { name: string }; thana: { name: string } } | null | undefined,
): string {
  if (!location) return 'Location not set';
  return `${location.thana.name}, ${location.district.name}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

