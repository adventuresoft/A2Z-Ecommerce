import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PaymentsAdminController } from './payments.admin.controller.js';
import { RefundsAdminController } from './refunds.admin.controller.js';
import { PaymentMethod, PaymentStatus, RefundStatus } from '@prisma/client';

describe('Payments & Refunds Controllers', () => {
  let paymentsController: PaymentsAdminController;
  let refundsController: RefundsAdminController;
  let serviceMock: any;

  beforeEach(() => {
    serviceMock = {
      getPayments: vi.fn(),
      getPaymentById: vi.fn(),
      createPayment: vi.fn(),
      updatePaymentStatus: vi.fn(),
      getPaymentStats: vi.fn(),
      getRefunds: vi.fn(),
      getRefundById: vi.fn(),
      createRefund: vi.fn(),
      updateRefundStatus: vi.fn(),
    };

    paymentsController = new PaymentsAdminController(serviceMock);
    refundsController = new RefundsAdminController(serviceMock);
  });

  it('paymentsController.getTransactions delegates to service', async () => {
    serviceMock.getPayments.mockResolvedValue({ data: [], meta: { total: 0 } });
    const query = { page: 1, limit: 10 };
    const res = await paymentsController.getTransactions(query);
    expect(serviceMock.getPayments).toHaveBeenCalledWith(query);
    expect(res.data).toEqual([]);
  });

  it('paymentsController.getTransactionById delegates to service', async () => {
    serviceMock.getPaymentById.mockResolvedValue({ id: 'pay-1', amount: 500 });
    const res = await paymentsController.getTransactionById('pay-1');
    expect(serviceMock.getPaymentById).toHaveBeenCalledWith('pay-1');
    expect(res.id).toBe('pay-1');
  });

  it('paymentsController.createTransaction delegates to service', async () => {
    const dto = {
      orderId: 'order-1',
      amount: 500,
      method: PaymentMethod.CASH_ON_DELIVERY,
    };
    serviceMock.createPayment.mockResolvedValue({ id: 'pay-1', ...dto });
    const res = await paymentsController.createTransaction(dto);
    expect(serviceMock.createPayment).toHaveBeenCalledWith(dto);
    expect(res.id).toBe('pay-1');
  });

  it('paymentsController.updateStatus delegates to service', async () => {
    const dto = { status: PaymentStatus.PAID, notes: 'Collected' };
    serviceMock.updatePaymentStatus.mockResolvedValue({ id: 'pay-1', status: PaymentStatus.PAID });
    const res = await paymentsController.updateStatus('pay-1', dto, { sub: 'admin-1' } as any);
    expect(serviceMock.updatePaymentStatus).toHaveBeenCalledWith('pay-1', dto, 'admin-1');
    expect(res.status).toBe(PaymentStatus.PAID);
  });

  it('refundsController.getRefunds delegates to service', async () => {
    serviceMock.getRefunds.mockResolvedValue({ data: [], meta: { total: 0 } });
    const query = { page: 1, limit: 10 };
    const res = await refundsController.getRefunds(query);
    expect(serviceMock.getRefunds).toHaveBeenCalledWith(query);
    expect(res.data).toEqual([]);
  });

  it('refundsController.createRefund delegates to service', async () => {
    const dto = { orderId: 'order-1', amount: 200, reason: 'Broken box' };
    serviceMock.createRefund.mockResolvedValue({ id: 'ref-1', status: RefundStatus.COMPLETED });
    const res = await refundsController.createRefund(dto, { sub: 'admin-1' } as any);
    expect(serviceMock.createRefund).toHaveBeenCalledWith(dto, 'admin-1');
    expect(res.id).toBe('ref-1');
  });

  it('refundsController.updateRefundStatus delegates to service', async () => {
    const dto = { status: RefundStatus.COMPLETED, notes: 'Approved' };
    serviceMock.updateRefundStatus.mockResolvedValue({ id: 'ref-1', status: RefundStatus.COMPLETED });
    const res = await refundsController.updateRefundStatus('ref-1', dto, { sub: 'admin-1' } as any);
    expect(serviceMock.updateRefundStatus).toHaveBeenCalledWith('ref-1', dto, 'admin-1');
    expect(res.status).toBe(RefundStatus.COMPLETED);
  });
});
