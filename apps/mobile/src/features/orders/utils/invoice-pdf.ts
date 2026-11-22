import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { OrderResponseDto } from '@repo/api-client';
import { formatBDT } from '@/shared/utils/format-bdt';

function escapeHtml(value: unknown): string {
  const str = typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildOrderInvoiceHtml(order: OrderResponseDto): string {
  const createdDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-GB')
    : '';
  const paymentMethod =
    typeof order.paymentMethod === 'string' ? order.paymentMethod : 'N/A';

  const rowsHtml = (order.items ?? [])
    .map(
      (item) => `
      <tr>
        <td>
          <strong>${escapeHtml(item.productTitle)}</strong><br/>
          <span class="muted">SKU: ${escapeHtml(item.sku)}</span>
        </td>
        <td class="num">${escapeHtml(item.quantity)}</td>
        <td class="num">${escapeHtml(formatBDT(item.unitPrice))}</td>
        <td class="num">${escapeHtml(formatBDT(item.totalPrice))}</td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0F172A; padding: 24px; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #1D4ED8; padding-bottom: 16px; margin-bottom: 20px; }
    .brand { font-size: 22px; font-weight: 800; color: #1D4ED8; }
    .meta { text-align: right; font-size: 13px; color: #475569; }
    .box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
    th { text-align: left; background: #EFF6FF; color: #0F172A; padding: 10px 8px; border-bottom: 1px solid #CBD5E1; }
    td { padding: 10px 8px; border-bottom: 1px solid #E2E8F0; vertical-align: top; }
    .num { text-align: right; white-space: nowrap; }
    .muted { color: #64748B; font-size: 12px; }
    .totals { width: 280px; margin-left: auto; font-size: 14px; }
    .totals tr td { border: none; padding: 5px 8px; }
    .grand td { font-weight: 800; font-size: 16px; border-top: 2px solid #0F172A; padding-top: 10px; color: #1D4ED8; }
    .footer { margin-top: 32px; font-size: 12px; color: #64748B; text-align: center; border-top: 1px solid #E2E8F0; padding-top: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">A to Z Ecommerce</div>
      <div class="muted">Official Order Receipt</div>
    </div>
    <div class="meta">
      <div><strong>Order #${escapeHtml(order.orderNumber)}</strong></div>
      <div>Date: ${escapeHtml(createdDate)}</div>
      <div>Status: ${escapeHtml(order.orderStatus)} • Payment: ${escapeHtml(order.paymentStatus)}</div>
      <div>Method: ${escapeHtml(paymentMethod)}</div>
    </div>
  </div>

  <div class="box">
    <strong>Deliver To:</strong><br/>
    ${escapeHtml(order.recipientName)} (${escapeHtml(order.recipientPhone)})<br/>
    ${escapeHtml(order.shippingStreet)}, ${escapeHtml(order.shippingCity)} ${escapeHtml(order.shippingPostalCode)}
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th class="num">Qty</th>
        <th class="num">Unit Price</th>
        <th class="num">Total</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <table class="totals">
    <tr><td>Subtotal</td><td class="num">${escapeHtml(formatBDT(order.subtotal))}</td></tr>
    ${
      order.discountAmount > 0
        ? `<tr><td>Discount</td><td class="num">- ${escapeHtml(formatBDT(order.discountAmount))}</td></tr>`
        : ''
    }
    <tr><td>Shipping</td><td class="num">${escapeHtml(formatBDT(order.shippingFee))}</td></tr>
    ${
      order.totalTaxAmount > 0
        ? `<tr><td>VAT Included</td><td class="num">${escapeHtml(formatBDT(order.totalTaxAmount))}</td></tr>`
        : ''
    }
    <tr class="grand"><td>Grand Total</td><td class="num">${escapeHtml(formatBDT(order.grandTotal))}</td></tr>
  </table>

  <div class="footer">
    Thank you for shopping with A to Z Ecommerce Bangladesh. Prices are in BDT (Bangladeshi Taka).
  </div>
</body>
</html>`;
}

export async function generateAndShareOrderPdf(order: OrderResponseDto): Promise<string> {
  const html = buildOrderInvoiceHtml(order);
  const { uri } = await Print.printToFileAsync({ html });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Order #${order.orderNumber} Receipt`,
      UTI: 'com.adobe.pdf',
    });
  }
  return uri;
}
