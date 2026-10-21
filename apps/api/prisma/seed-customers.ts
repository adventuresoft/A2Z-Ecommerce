import 'reflect-metadata';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  Role,
  OrderStatus,
  PaymentStatus,
  ReviewStatus,
} from '@prisma/client';
import * as argon2 from 'argon2';

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

async function seedCustomers() {
  console.log('Seeding rich demonstration customer accounts, addresses, and orders distribution...');

  const defaultPassword = await argon2.hash('CustomerPass123!', {
    type: argon2.argon2id,
  });

  const demoCustomers = [
    {
      name: 'Tanvir Hossain',
      email: 'tanvir.hossain@example.com',
      phone: '+8801711223344',
      isActive: true,
      city: 'Dhaka',
      state: 'Dhaka Division',
      streetAddress: 'House 42, Road 11, Banani',
      postalCode: '1213',
      label: 'Home',
    },
    {
      name: 'Nusrat Jahan',
      email: 'nusrat.jahan@example.com',
      phone: '+8801819876543',
      isActive: true,
      city: 'Chittagong',
      state: 'Chittagong Division',
      streetAddress: 'GEC Circle, Nasirabad Housing Society',
      postalCode: '4000',
      label: 'Office',
    },
    {
      name: 'Farhan Ahmed',
      email: 'farhan.ahmed@example.com',
      phone: '+8801912345678',
      isActive: true,
      city: 'Sylhet',
      state: 'Sylhet Division',
      streetAddress: 'Zindabazar, Amberkhana Point',
      postalCode: '3100',
      label: 'Residence',
    },
    {
      name: 'Sadia Karim',
      email: 'sadia.karim@example.com',
      phone: '+8801611002299',
      isActive: true,
      city: 'Dhaka',
      state: 'Dhaka Division',
      streetAddress: 'House 14, Road 27, Dhanmondi R/A',
      postalCode: '1209',
      label: 'Home',
    },
    {
      name: 'Mahmudur Rahman',
      email: 'mahmud.rahman@example.com',
      phone: '+8801511447788',
      isActive: true,
      city: 'Rajshahi',
      state: 'Rajshahi Division',
      streetAddress: 'Shaheb Bazar Commercial Area',
      postalCode: '6000',
      label: 'Shop',
    },
    {
      name: 'Anika Tabassum',
      email: 'anika.tabassum@example.com',
      phone: '+8801722334455',
      isActive: true,
      city: 'Dhaka',
      state: 'Dhaka Division',
      streetAddress: 'Sector 4, Uttara Model Town',
      postalCode: '1230',
      label: 'Apartment',
    },
    {
      name: 'Imtiaz Chowdhury',
      email: 'imtiaz.chowdhury@example.com',
      phone: '+8801933445566',
      isActive: true,
      city: 'Khulna',
      state: 'Khulna Division',
      streetAddress: 'Shibbari More, Sonadanga',
      postalCode: '9100',
      label: 'Home',
    },
    {
      name: 'Shamim Reza',
      email: 'shamim.reza@example.com',
      phone: '+8801799887766',
      isActive: false, // Inactive / suspended demo customer
      city: 'Dhaka',
      state: 'Dhaka Division',
      streetAddress: 'Block D, Section 10, Mirpur',
      postalCode: '1216',
      label: 'Flat',
    },
  ];

  const createdCustomerUsers: { id: string; email: string; name: string }[] = [];

  for (const cust of demoCustomers) {
    const existing = await prisma.user.findUnique({
      where: { email: cust.email },
    });

    let userId: string;
    if (existing) {
      userId = existing.id;
      await prisma.user.update({
        where: { id: userId },
        data: {
          name: cust.name,
          phone: cust.phone,
          isActive: cust.isActive,
          location: `${cust.city}, Bangladesh`,
        },
      });
    } else {
      const created = await prisma.user.create({
        data: {
          email: cust.email,
          name: cust.name,
          phone: cust.phone,
          passwordHash: defaultPassword,
          role: Role.CUSTOMER,
          isActive: cust.isActive,
          location: `${cust.city}, Bangladesh`,
          emailVerifiedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000),
        },
      });
      userId = created.id;
    }

    createdCustomerUsers.push({ id: userId, email: cust.email, name: cust.name });

    // Upsert primary address
    const existingAddr = await prisma.userAddress.findFirst({
      where: { userId },
    });

    if (!existingAddr) {
      await prisma.userAddress.create({
        data: {
          userId,
          label: cust.label,
          recipientName: cust.name,
          phone: cust.phone,
          streetAddress: cust.streetAddress,
          city: cust.city,
          state: cust.state,
          postalCode: cust.postalCode,
          country: 'Bangladesh',
          isDefaultShipping: true,
          isDefaultBilling: true,
        },
      });
    }
  }

  // Re-distribute orders among customers to create rich, varied analytics:
  // Customers:
  // - Tanvir Hossain: VIP (8 orders)
  // - Farhan Ahmed: VIP (6 orders)
  // - Nusrat Jahan: Regular (3 orders)
  // - Sadia Karim: Regular (2 orders)
  // - Mahmudur Rahman: One-Time (1 order)
  // - Anika Tabassum: One-Time (1 order)
  // - Imtiaz Chowdhury: Zero-Order (0 orders)
  // - Shamim Reza: Inactive (1 past order)
  const allOrders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
  });

  if (allOrders.length > 0) {
    const assignments = [
      { custIdx: 0, orderIndices: [0, 1, 2, 3, 4, 5, 6, 7] }, // Tanvir (VIP)
      { custIdx: 2, orderIndices: [8, 9, 10, 11, 12, 13] },    // Farhan (VIP)
      { custIdx: 1, orderIndices: [14, 15, 16] },             // Nusrat (Regular)
      { custIdx: 3, orderIndices: [17, 18] },                 // Sadia (Regular)
      { custIdx: 4, orderIndices: [19] },                     // Mahmudur (One-time)
      { custIdx: 5, orderIndices: [20] },                     // Anika (One-time)
      { custIdx: 7, orderIndices: [21] },                     // Shamim (Inactive past order)
    ];

    for (const plan of assignments) {
      const cust = createdCustomerUsers[plan.custIdx];
      if (!cust) continue;

      for (const oIdx of plan.orderIndices) {
        const order = allOrders[oIdx];
        if (!order) continue;

        await prisma.order.update({
          where: { id: order.id },
          data: {
            userId: cust.id,
            recipientName: cust.name,
          },
        });
      }
    }
  }

  // Seed sample reviews for customers if products exist
  const sampleProducts = await prisma.product.findMany({ take: 3 });
  if (sampleProducts.length > 0 && createdCustomerUsers.length > 0) {
    const tanvir = createdCustomerUsers[0];
    const nusrat = createdCustomerUsers[1];

    const existingReview1 = await prisma.review.findFirst({
      where: { userId: tanvir.id },
    });

    if (!existingReview1) {
      await prisma.review.create({
        data: {
          productId: sampleProducts[0].id,
          userId: tanvir.id,
          rating: 5,
          title: 'Outstanding quality and fast delivery!',
          comment:
            'Ordered on Tuesday and received the parcel on Wednesday in Banani. Authentic product with original warranty sealed.',
          status: ReviewStatus.APPROVED,
          isVerifiedPurchase: true,
        },
      });
    }

    const existingReview2 = await prisma.review.findFirst({
      where: { userId: nusrat.id },
    });

    if (!existingReview2) {
      await prisma.review.create({
        data: {
          productId: sampleProducts[1 % sampleProducts.length].id,
          userId: nusrat.id,
          rating: 4,
          title: 'Very satisfied with packaging',
          comment: 'Delivery to Chittagong took 3 days. Box was in pristine condition and product works flawlessly.',
          status: ReviewStatus.APPROVED,
          isVerifiedPurchase: true,
        },
      });
    }
  }

  console.log(`Successfully seeded ${createdCustomerUsers.length} rich demo customer accounts with addresses and distributed orders.`);
}

seedCustomers()
  .catch((e) => {
    console.error('Customer seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
