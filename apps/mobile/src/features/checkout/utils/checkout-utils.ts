import type {
  CreateOrderDto,
  CreateOrderDtoPaymentMethod,
  UserAddressResponseDto,
} from '@repo/api-client';

export const PAYSTATION_MOBILE_CALLBACK_URL = 'azecommerce://checkout/payment-callback';

export function generateIdempotencyKey(): string {
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i += 1) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function buildCheckoutFingerprint(params: {
  items: { variantId: string; quantity: number }[];
  addressId?: string | null;
  shippingMethodId?: string | null;
  paymentMethod?: string | null;
  couponCode?: string | null;
}): string {
  const itemPart = [...params.items]
    .sort((a, b) => a.variantId.localeCompare(b.variantId))
    .map((i) => `${i.variantId}:${i.quantity}`)
    .join(',');
  return [
    itemPart,
    params.addressId ?? '',
    params.shippingMethodId ?? '',
    params.paymentMethod ?? '',
    (params.couponCode ?? '').toUpperCase(),
  ].join('|');
}

function asOptionalString(val: unknown): string | undefined {
  return typeof val === 'string' && val.trim().length > 0 ? val : undefined;
}

function asOptionalNumber(val: unknown): number | undefined {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string' && val.trim() !== '') {
    const n = Number(val);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

export function mapAddressToOrderDto(params: {
  address: UserAddressResponseDto;
  items: { variantId: string; quantity: number }[];
  shippingMethodId?: string;
  couponCode?: string;
  paymentMethod: CreateOrderDtoPaymentMethod;
  paymentReference?: string;
  customerNotes?: string;
}): CreateOrderDto {
  return {
    recipientName: params.address.recipientName,
    recipientPhone: params.address.phone,
    shippingStreet: params.address.streetAddress,
    shippingCity: params.address.city,
    shippingState: asOptionalString(params.address.state),
    shippingThana: asOptionalString(params.address.thana),
    shippingDivisionId: asOptionalNumber(params.address.divisionId),
    shippingDistrictId: asOptionalNumber(params.address.districtId),
    shippingThanaId: asOptionalNumber(params.address.thanaId),
    shippingPostalCode: params.address.postalCode,
    shippingMethodId: params.shippingMethodId,
    couponCode: params.couponCode?.trim() || undefined,
    paymentMethod: params.paymentMethod,
    paymentReference: params.paymentReference?.trim() || undefined,
    customerNotes: params.customerNotes?.trim() || undefined,
    items: params.items,
  };
}

export interface ParsedPaystationCallback {
  invoiceNumber: string | null;
  trxId: string | null;
  rawStatus: string | null;
}

export function parsePaystationCallbackUrl(url: string): ParsedPaystationCallback {
  try {
    const queryIndex = url.indexOf('?');
    if (queryIndex === -1) {
      return { invoiceNumber: null, trxId: null, rawStatus: null };
    }
    const params = new URLSearchParams(url.slice(queryIndex + 1));
    return {
      invoiceNumber:
        params.get('invoice_number') ?? params.get('invoiceNumber') ?? null,
      trxId: params.get('trx_id') ?? params.get('trxId') ?? null,
      rawStatus: params.get('status') ?? null,
    };
  } catch {
    return { invoiceNumber: null, trxId: null, rawStatus: null };
  }
}

export function normalizePaymentMethodCode(code: string): CreateOrderDtoPaymentMethod {
  const upper = code.trim().toUpperCase();
  if (
    upper === 'CASH_ON_DELIVERY' ||
    upper === 'PAYSTATION' ||
    upper === 'MOBILE_BANKING' ||
    upper === 'BANK_TRANSFER' ||
    upper === 'CREDIT_CARD' ||
    upper === 'CHECK_PAYMENT'
  ) {
    return upper;
  }
  return 'CASH_ON_DELIVERY';
}
