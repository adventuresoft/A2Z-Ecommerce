import 'reflect-metadata';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  OrderStatus,
  PaymentStatus,
  ShipmentStatus,
  PaymentMethod,
  RefundStatus,
} from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
try {
  process.loadEnvFile(path.join(__dirname, '..', '.env'));
} catch {
  // Ignored if file does not exist
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set in environment');
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedOrders() {
  console.log('Seeding rich demonstration sales orders and transaction data...');

  const orderCount = await prisma.order.count();
  if (orderCount > 10) {
    console.log(`Already have ${orderCount} orders in database. Skipping seed.`);
    return;
  }

  const [users, variants] = await Promise.all([
    prisma.user.findMany({ where: { role: 'CUSTOMER' }, take: 5 }),
    prisma.productVariant.findMany({
      include: {
        product: { include: { category: true } },
      },
      take: 20,
    }),
  ]);

  const customerUser =
    users[0] || (await prisma.user.findFirst({ where: { role: 'ADMIN' } }));

  if (!customerUser) {
    console.log('No user available to associate orders.');
    return;
  }

  if (variants.length === 0) {
    console.log('No product variants available to generate line items.');
    return;
  }

  const sampleCustomers = [
    { name: 'Tanvir Hossain', email: 'tanvir.hossain@example.com', phone: '01711223344', city: 'Dhaka', address: 'House 42, Road 11, Banani' },
    { name: 'Nusrat Jahan', email: 'nusrat.jahan@example.com', phone: '01819876543', city: 'Chittagong', address: 'GEC Circle, Nasirabad' },
    { name: 'Farhan Ahmed', email: 'farhan.ahmed@example.com', phone: '01912345678', city: 'Sylhet', address: 'Zindabazar, Amberkhana' },
    { name: 'Sadia Karim', email: 'sadia.karim@example.com', phone: '01611002299', city: 'Dhaka', address: 'Dhanmondi 27, R/A' },
    { name: 'Mahmudur Rahman', email: 'mahmud.rahman@example.com', phone: '01511447788', city: 'Rajshahi', address: 'Shaheb Bazar' },
    { name: 'Anika Tabassum', email: 'anika.tabassum@example.com', phone: '01722334455', city: 'Dhaka', address: 'Sector 4, Uttara' },
    { name: 'Imtiaz Chowdhury', email: 'imtiaz.chowdhury@example.com', phone: '01933445566', city: 'Khulna', address: 'Shibbari More' },
  ];

  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  // Generate 32 orders across the last 45 days
  const ordersData = [
    // Today
    { daysAgo: 0, hoursAgo: 2, status: OrderStatus.CONFIRMED, paymentStatus: PaymentStatus.PAID, method: PaymentMethod.MOBILE_BANKING, customerIdx: 0, variantIdxs: [0, 1], discount: 200, shipping: 60 },
    { daysAgo: 0, hoursAgo: 5, status: OrderStatus.PROCESSING, paymentStatus: PaymentStatus.PAID, method: PaymentMethod.CREDIT_CARD, customerIdx: 1, variantIdxs: [2], discount: 0, shipping: 120 },
    { daysAgo: 0, hoursAgo: 8, status: OrderStatus.PENDING, paymentStatus: PaymentStatus.PENDING, method: PaymentMethod.CASH_ON_DELIVERY, customerIdx: 2, variantIdxs: [3, 4], discount: 0, shipping: 60 },
    
    // Yesterday
    { daysAgo: 1, hoursAgo: 10, status: OrderStatus.PROCESSING, paymentStatus: PaymentStatus.PAID, method: PaymentMethod.MOBILE_BANKING, customerIdx: 3, variantIdxs: [0, 2], discount: 500, shipping: 60 },
    { daysAgo: 1, hoursAgo: 14, status: OrderStatus.CONFIRMED, paymentStatus: PaymentStatus.PAID, method: PaymentMethod.CREDIT_CARD, customerIdx: 4, variantIdxs: [1], discount: 0, shipping: 120 },
    { daysAgo: 1, hoursAgo: 18, status: OrderStatus.SHIPPED, paymentStatus: PaymentStatus.PAID, method: PaymentMethod.CASH_ON_DELIVERY, customerIdx: 5, variantIdxs: [4, 5], discount: 100, shipping: 60 },
    
    // 2-5 days ago
    { daysAgo: 2, hoursAgo: 11, status: OrderStatus.DELIVERED, paymentStatus: PaymentStatus.PAID, method: PaymentMethod.MOBILE_BANKING, customerIdx: 6, variantIdxs: [2, 3], discount: 0, shipping: 60 },
    { daysAgo: 3, hoursAgo: 9, status: OrderStatus.DELIVERED, paymentStatus: PaymentStatus.PAID, method: PaymentMethod.CASH_ON_DELIVERY, customerIdx: 0, variantIdxs: [0], discount: 300, shipping: 60 },
    { daysAgo: 3, hoursAgo: 16, status: OrderStatus.DELIVERED, paymentStatus: PaymentStatus.PAID, method: PaymentMethod.CREDIT_CARD, customerIdx: 1, variantIdxs: [1, 5], discount: 0, shipping: 120 },
    { daysAgo: 4, hoursAgo: 12, status: OrderStatus.DELIVERED, paymentStatus: PaymentStatus.PAID, method: PaymentMethod.MOBILE_BANKING, customerIdx: 2, variantIdxs: [2], discount: 150, shipping: 60 },
    { daysAgo: 5, hoursAgo: 15, status: OrderStatus.CANCELLED, paymentStatus: PaymentStatus.REFUNDED, method: PaymentMethod.MOBILE_BANKING, customerIdx: 3, variantIdxs: [3], discount: 0, shipping: 0, refundAmount: 2500 },

    // 6-10 days ago
    { daysAgo: 6, hoursAgo: 10, status: OrderStatus.DELIVERED, paymentStatus: PaymentStatus.PAID, method: PaymentMethod.CASH_ON_DELIVERY, customerIdx: 4, variantIdxs: [0, 4], discount: 200, shipping: 60 },
    { daysAgo: 7, hoursAgo: 14, status: OrderStatus.DELIVERED, paymentStatus: PaymentStatus.PAID, method: PaymentMethod.CREDIT_CARD, customerIdx: 5, variantIdxs: [1], discount: 0, shipping: 60 },
    { daysAgo: 8, hoursAgo: 11, status: OrderStatus.DELIVERED, paymentStatus: PaymentStatus.PAID, method: PaymentMethod.MOBILE_BANKING, customerIdx: 6, variantIdxs: [2, 5], discount: 400, shipping: 120 },
    { daysAgo: 9, hoursAgo: 13, status: OrderStatus.RETURNED, paymentStatus: PaymentStatus.REFUNDED, method: PaymentMethod.CASH_ON_DELIVERY, customerIdx: 0, variantIdxs: [3], discount: 0, shipping: 60, refundAmount: 1800 },
    { daysAgo: 10, hoursAgo: 17, status: OrderStatus.DELIVERED, paymentStatus: PaymentStatus.PAID, method: PaymentMethod.CASH_ON_DELIVERY, customerIdx: 1, variantIdxs: [0, 1], discount: 250, shipping: 60 },

    // 12-20 days ago
    { daysAgo: 12, hoursAgo: 10, status: OrderStatus.DELIVERED, paymentStatus: PaymentStatus.PAID, method: PaymentMethod.CREDIT_CARD, customerIdx: 2, variantIdxs: [4], discount: 0, shipping: 60 },
    { daysAgo: 14, hoursAgo: 15, status: OrderStatus.DELIVERED, paymentStatus: PaymentStatus.PAID, method: PaymentMethod.MOBILE_BANKING, customerIdx: 3, variantIdxs: [0, 2], discount: 600, shipping: 120 },
    { daysAgo: 15, hoursAgo: 11, status: OrderStatus.DELIVERED, paymentStatus: PaymentStatus.PAID, method: PaymentMethod.CASH_ON_DELIVERY, customerIdx: 4, variantIdxs: [1, 3], discount: 0, shipping: 60 },
    { daysAgo: 17, hoursAgo: 16, status: OrderStatus.DELIVERED, paymentStatus: PaymentStatus.PAID, method: PaymentMethod.MOBILE_BANKING, customerIdx: 5, variantIdxs: [2], discount: 100, shipping: 60 },
    { daysAgo: 19, hoursAgo: 14, status: OrderStatus.DELIVERED, paymentStatus: PaymentStatus.PAID, method: PaymentMethod.CREDIT_CARD, customerIdx: 6, variantIdxs: [0, 5], discount: 350, shipping: 60 },

    // 21-30 days ago
    { daysAgo: 22, hoursAgo: 10, status: OrderStatus.DELIVERED, paymentStatus: PaymentStatus.PAID, method: PaymentMethod.CASH_ON_DELIVERY, customerIdx: 0, variantIdxs: [1], discount: 0, shipping: 60 },
    { daysAgo: 24, hoursAgo: 12, status: OrderStatus.DELIVERED, paymentStatus: PaymentStatus.PAID, method: PaymentMethod.MOBILE_BANKING, customerIdx: 1, variantIdxs: [2, 4], discount: 300, shipping: 120 },
    { daysAgo: 26, hoursAgo: 9, status: OrderStatus.DELIVERED, paymentStatus: PaymentStatus.PAID, method: PaymentMethod.CREDIT_CARD, customerIdx: 2, variantIdxs: [0], discount: 0, shipping: 60 },
    { daysAgo: 28, hoursAgo: 14, status: OrderStatus.DELIVERED, paymentStatus: PaymentStatus.PAID, method: PaymentMethod.CASH_ON_DELIVERY, customerIdx: 3, variantIdxs: [3, 5], discount: 150, shipping: 60 },
    { daysAgo: 30, hoursAgo: 11, status: OrderStatus.DELIVERED, paymentStatus: PaymentStatus.PAID, method: PaymentMethod.MOBILE_BANKING, customerIdx: 4, variantIdxs: [1], discount: 0, shipping: 60 },

    // 32-45 days ago
    { daysAgo: 33, hoursAgo: 16, status: OrderStatus.DELIVERED, paymentStatus: PaymentStatus.PAID, method: PaymentMethod.CASH_ON_DELIVERY, customerIdx: 5, variantIdxs: [2, 3], discount: 200, shipping: 60 },
    { daysAgo: 36, hoursAgo: 10, status: OrderStatus.DELIVERED, paymentStatus: PaymentStatus.PAID, method: PaymentMethod.CREDIT_CARD, customerIdx: 6, variantIdxs: [0], discount: 0, shipping: 60 },
    { daysAgo: 39, hoursAgo: 13, status: OrderStatus.DELIVERED, paymentStatus: PaymentStatus.PAID, method: PaymentMethod.MOBILE_BANKING, customerIdx: 0, variantIdxs: [4, 5], discount: 250, shipping: 120 },
    { daysAgo: 42, hoursAgo: 15, status: OrderStatus.DELIVERED, paymentStatus: PaymentStatus.PAID, method: PaymentMethod.CASH_ON_DELIVERY, customerIdx: 1, variantIdxs: [1], discount: 0, shipping: 60 },
    { daysAgo: 45, hoursAgo: 11, status: OrderStatus.DELIVERED, paymentStatus: PaymentStatus.PAID, method: PaymentMethod.CREDIT_CARD, customerIdx: 2, variantIdxs: [0, 2], discount: 450, shipping: 60 },
  ];

  let counter = 1;
  for (const def of ordersData) {
    const cust = sampleCustomers[def.customerIdx % sampleCustomers.length];
    const orderDate = new Date(now.getTime() - def.daysAgo * dayMs - def.hoursAgo * 3600 * 1000);
    const orderNumber = `AZ-2026-${String(counter).padStart(4, '0')}`;
    counter++;

    // Calculate line items
    let subtotal = 0;
    const itemsData = [];

    for (const vIdx of def.variantIdxs) {
      const variant = variants[vIdx % variants.length];
      const unitPrice = Number(variant.salePrice || variant.regularPrice || 1200);
      const quantity = (vIdx % 2) + 1;
      const totalPrice = unitPrice * quantity;
      subtotal += totalPrice;

      itemsData.push({
        variantId: variant.id,
        productTitle: variant.product.title,
        sku: variant.sku,
        variantAttributes: 'Standard Variant',
        unitPrice,
        quantity,
        totalPrice,
      });
    }

    const discountAmount = Math.min(def.discount, subtotal * 0.3);
    const shippingFee = def.shipping;
    const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee);

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: customerUser.id,
        orderStatus: def.status,
        paymentStatus: def.paymentStatus,
        shipmentStatus:
          def.status === OrderStatus.DELIVERED
            ? ShipmentStatus.DELIVERED
            : def.status === OrderStatus.SHIPPED
              ? ShipmentStatus.IN_TRANSIT
              : ShipmentStatus.PREPARING,
        subtotal,
        discountAmount,
        shippingFee,
        grandTotal,
        recipientName: cust.name,
        recipientPhone: cust.phone,
        shippingStreet: cust.address,
        shippingCity: cust.city,
        shippingPostalCode: '1212',
        customerNotes: 'Please call before delivery.',
        createdAt: orderDate,
        updatedAt: orderDate,
        items: {
          create: itemsData,
        },
        payments: {
          create: {
            method: def.method,
            status: def.paymentStatus,
            amount: grandTotal,
            currency: 'BDT',
            transactionRef: `TRX-${orderNumber}`,
            paidAt: def.paymentStatus === PaymentStatus.PAID ? orderDate : null,
            createdAt: orderDate,
          },
        },
      },
    });

    if (def.refundAmount && def.refundAmount > 0) {
      const payment = await prisma.payment.findFirst({
        where: { orderId: order.id },
      });
      if (payment) {
        await prisma.refund.create({
          data: {
            orderId: order.id,
            paymentId: payment.id,
            amount: def.refundAmount,
            reason: def.status === OrderStatus.RETURNED ? 'Customer item return' : 'Order cancellation refund',
            status: RefundStatus.COMPLETED,
            refundMethod: def.method,
            transactionRef: `REF-${orderNumber}`,
            createdAt: new Date(orderDate.getTime() + 2 * 3600 * 1000),
          },
        });
      }
    }
  }

  console.log(`Successfully seeded ${ordersData.length} demonstration sales orders with timeline, payments, line items, and refunds!`);
}

seedOrders()
  .catch((e) => {
    console.error('Seeding orders failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
