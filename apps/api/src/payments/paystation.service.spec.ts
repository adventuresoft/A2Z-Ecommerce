import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants.js';
import { OrderStatus, PaymentMethod, PaymentStatus, Role } from '@prisma/client';
import { PaystationService } from './paystation.service.js';
import { PaystationController } from './paystation.controller.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

describe('PaystationService & PaystationController', () => {
  let service: PaystationService;
  let controller: PaystationController;
  let prismaMock: any;
  let configMock: any;
  const originalEnv = process.env.NODE_ENV;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    prismaMock = {
      order: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      payment: {
        create: vi.fn(),
        update: vi.fn(),
      },
      orderStatusHistory: {
        create: vi.fn(),
      },
      paymentMethodSetting: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
      $transaction: vi.fn(async (cb: any) => cb(prismaMock)),
    };
    configMock = {
      get: vi.fn((key: string, defaultVal?: string) => {
        if (key === 'CORS_ORIGIN') return 'https://atozecommerce.com';
        if (key === 'PAYSTATION_ALLOWED_CALLBACK_ORIGINS') return 'https://atozecommerce.com';
        return defaultVal;
      }),
    };
    service = new PaystationService(prismaMock, configMock);
    controller = new PaystationController(service);
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('protects PaystationController.initiate with JwtAuthGuard', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      PaystationController.prototype.initiate,
    );
    expect(guards).toContain(JwtAuthGuard);
  });

  it('rejects initiation when customer does not own the order', async () => {
    prismaMock.order.findFirst.mockResolvedValue({
      id: 'ord-1',
      orderNumber: 'ORD-100',
      userId: 'owner-user',
      orderStatus: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.UNPAID,
      grandTotal: 1200,
      items: [],
      payments: [],
    });

    await expect(
      service.initiatePayment('ord-1', 'https://atozecommerce.com/checkout/payment-callback', {
        sub: 'attacker-user',
        role: Role.CUSTOMER,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects initiation for already paid or cancelled orders', async () => {
    prismaMock.order.findFirst.mockResolvedValue({
      id: 'ord-2',
      orderNumber: 'ORD-101',
      userId: 'u-1',
      orderStatus: OrderStatus.CANCELLED,
      paymentStatus: PaymentStatus.UNPAID,
      grandTotal: 1200,
      items: [],
      payments: [],
    });

    await expect(
      service.initiatePayment('ord-2', 'azecommerce://payment-callback', {
        sub: 'u-1',
        role: Role.CUSTOMER,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects disallowed third-party callback URLs', async () => {
    prismaMock.order.findFirst.mockResolvedValue({
      id: 'ord-3',
      orderNumber: 'ORD-102',
      userId: 'u-1',
      orderStatus: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.UNPAID,
      grandTotal: 1200,
      items: [],
      payments: [],
    });

    await expect(
      service.initiatePayment('ord-3', 'https://evil-phishing.example/callback', {
        sub: 'u-1',
        role: Role.CUSTOMER,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('allows azecommerce:// mobile deep link callback and initiates session for owner', async () => {
    prismaMock.order.findFirst.mockResolvedValue({
      id: 'ord-4',
      orderNumber: 'ORD-103',
      userId: 'u-1',
      recipientName: 'Rahim',
      recipientPhone: '01711111111',
      shippingStreet: 'House 1',
      shippingCity: 'Dhaka',
      orderStatus: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.UNPAID,
      grandTotal: 1500,
      items: [{ productTitle: 'Smart Watch' }],
      payments: [],
    });
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'success',
        payment_url: 'https://sandbox.paystation.com.bd/pay/103',
        invoice_number: 'ORD-103',
      }),
    }) as any;

    const res = await controller.initiate(
      { orderId: 'ord-4', callbackUrl: 'azecommerce://payment-callback' },
      { sub: 'u-1', role: Role.CUSTOMER },
    );

    expect(res.status).toBe('success');
    expect(res.payment_url).toBe('https://sandbox.paystation.com.bd/pay/103');
    expect(prismaMock.payment.create).toHaveBeenCalled();
  });

  it('reconciles verified callback idempotently without duplicating status history when already PAID', async () => {
    prismaMock.order.findUnique.mockResolvedValue({
      id: 'ord-5',
      orderNumber: 'ORD-105',
      orderStatus: OrderStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PAID,
      grandTotal: 2000,
      payments: [{ id: 'p-1', method: PaymentMethod.PAYSTATION, status: PaymentStatus.PAID }],
    });
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'success',
        data: { invoice_number: 'ORD-105', trx_status: 'Success', trx_id: 'TRX-555' },
      }),
    }) as any;

    const res = await controller.handleCallbackPost({
      invoice_number: 'ORD-105',
      status: 'Success',
    });

    expect(res.verified).toBe(true);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('refuses to mark order PAID when callback claims Success but PayStation reports Failed', async () => {
    prismaMock.order.findUnique.mockResolvedValue({
      id: 'ord-6',
      orderNumber: 'ORD-106',
      orderStatus: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.UNPAID,
      grandTotal: 2000,
      payments: [{ id: 'p-6', method: PaymentMethod.PAYSTATION, status: PaymentStatus.PENDING }],
    });
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'success',
        data: { invoice_number: 'ORD-106', trx_status: 'Failed', trx_id: '' },
      }),
    }) as any;

    const res = await controller.handleCallbackGet('ORD-106');
    expect(res.verified).toBe(false);
    expect(prismaMock.order.update).not.toHaveBeenCalled();
    expect(prismaMock.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: PaymentStatus.FAILED }),
      }),
    );
  });

  it('rejects missing PayStation credentials in production mode', async () => {
    process.env.NODE_ENV = 'production';
    const prodService = new PaystationService(prismaMock, {
      get: vi.fn((key: string, def?: string) =>
        key === 'PAYSTATION_ALLOWED_CALLBACK_ORIGINS' ? 'https://atozecommerce.com' : def,
      ),
    } as any);

    prismaMock.order.findFirst.mockResolvedValue({
      id: 'ord-7',
      orderNumber: 'ORD-107',
      userId: 'u-1',
      orderStatus: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.UNPAID,
      grandTotal: 1500,
      items: [],
      payments: [],
    });

    await expect(
      prodService.initiatePayment('ord-7', 'https://atozecommerce.com/checkout/payment-callback', {
        sub: 'u-1',
        role: Role.CUSTOMER,
      }),
    ).rejects.toThrow(/PayStation credentials are not configured in production/);
  });
});
