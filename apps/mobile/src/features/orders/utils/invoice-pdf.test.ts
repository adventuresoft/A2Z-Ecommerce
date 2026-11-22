import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { OrderResponseDto } from '@repo/api-client';
import { buildOrderInvoiceHtml, generateAndShareOrderPdf } from './invoice-pdf';

const mockOrder: OrderResponseDto = {
  id: 'ord-1',
  orderNumber: 'AZ-2026-0042',
  userId: 'u-1',
  orderStatus: 'DELIVERED',
  paymentStatus: 'PAID',
  paymentMethod: 'PAYSTATION' as unknown as Record<string, unknown>,
  shipmentStatus: 'DELIVERED',
  subtotal: 125000,
  discountAmount: 5000,
  shippingFee: 120,
  totalTaxAmount: 1500,
  grandTotal: 120120,
  recipientName: 'Tanvir <script>alert(1)</script>',
  recipientPhone: '01707819647',
  shippingStreet: 'Road 7, Banani',
  shippingCity: 'Dhaka',
  shippingPostalCode: '1213',
  items: [
    {
      id: 'oi-1',
      productTitle: 'Smartphone Pro',
      sku: 'SP-256',
      unitPrice: 125000,
      quantity: 1,
      totalPrice: 125000,
      taxRate: 5,
      taxAmount: 1500,
    },
  ],
  createdAt: '2026-11-20T10:00:00.000Z',
  updatedAt: '2026-11-21T10:00:00.000Z',
};

describe('invoice-pdf', () => {
  it('escapes HTML injection and formats totals in BDT lakh/crore grouping', () => {
    const html = buildOrderInvoiceHtml(mockOrder);
    expect(html).toContain('Order #AZ-2026-0042');
    expect(html).toContain('BDT 1,25,000');
    expect(html).toContain('BDT 1,20,120');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('generates PDF via expo-print and triggers native share sheet', async () => {
    const uri = await generateAndShareOrderPdf(mockOrder);
    expect(uri).toBe('file:///mock-invoice.pdf');
    expect(Print.printToFileAsync).toHaveBeenCalledTimes(1);
    expect(Sharing.shareAsync).toHaveBeenCalledWith(
      'file:///mock-invoice.pdf',
      expect.objectContaining({ mimeType: 'application/pdf' }),
    );
  });
});
