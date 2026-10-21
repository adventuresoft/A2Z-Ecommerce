import 'reflect-metadata';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  ReviewStatus,
  NotificationType,
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

async function seedEngagement() {
  console.log('Seeding Product Reviews and Notifications...');

  const [existingReviewsCount, existingNotifsCount] = await Promise.all([
    prisma.review.count(),
    prisma.notification.count(),
  ]);

  const [products, users, orders] = await Promise.all([
    prisma.product.findMany({ take: 10 }),
    prisma.user.findMany({ take: 10 }),
    prisma.order.findMany({ take: 10 }),
  ]);

  if (products.length === 0 || users.length === 0) {
    console.log('No products or users available to attach engagement data.');
    return;
  }

  // 1. Seed Reviews if empty
  if (existingReviewsCount === 0) {
    console.log('Seeding sample product reviews...');
    const customerUsers = users.filter((u) => u.role === 'CUSTOMER');
    const reviewerPool = customerUsers.length > 0 ? customerUsers : users;

    const sampleReviews = [
      {
        productIndex: 0,
        userIndex: 0,
        rating: 5,
        title: 'Exceptional build quality and sound',
        comment: 'I have been using this daily for 2 weeks now. Battery life exceeds expectations and the build feels premium.',
        isVerifiedPurchase: true,
        status: ReviewStatus.APPROVED,
      },
      {
        productIndex: 0,
        userIndex: 1 % reviewerPool.length,
        rating: 4,
        title: 'Very good, minor software quirk',
        comment: 'Great value for money. The connection was seamless. Only minor issue was the companion app setup.',
        isVerifiedPurchase: true,
        status: ReviewStatus.APPROVED,
      },
      {
        productIndex: 1 % products.length,
        userIndex: 2 % reviewerPool.length,
        rating: 5,
        title: 'Absolute game changer!',
        comment: 'Fast shipping and well packaged. The performance is top-notch. Would definitely recommend to others.',
        isVerifiedPurchase: true,
        status: ReviewStatus.APPROVED,
      },
      {
        productIndex: 1 % products.length,
        userIndex: 0,
        rating: 2,
        title: 'Slightly disappointed with sizing',
        comment: 'The dimensions were slightly different than listed in specifications. Otherwise functional.',
        isVerifiedPurchase: false,
        status: ReviewStatus.PENDING,
      },
      {
        productIndex: 2 % products.length,
        userIndex: 1 % reviewerPool.length,
        rating: 5,
        title: 'Fantastic design and ergonomics',
        comment: 'Super sleek design and very comfortable to use over extended periods. Worth every penny!',
        isVerifiedPurchase: true,
        status: ReviewStatus.APPROVED,
      },
      {
        productIndex: 2 % products.length,
        userIndex: 2 % reviewerPool.length,
        rating: 1,
        title: 'Spam review placeholder',
        comment: 'Visit my external blog at spam-link.biz to win prizes now!',
        isVerifiedPurchase: false,
        status: ReviewStatus.REJECTED,
      },
      {
        productIndex: 3 % products.length,
        userIndex: 0,
        rating: 4,
        title: 'Clean aesthetic and reliable',
        comment: 'Works straight out of the box with zero complications. Customer service was also very responsive.',
        isVerifiedPurchase: true,
        status: ReviewStatus.PENDING,
      },
    ];

    for (const r of sampleReviews) {
      const prod = products[r.productIndex];
      const user = reviewerPool[r.userIndex];
      const order = orders.length > 0 ? orders[r.userIndex % orders.length] : null;

      await prisma.review.create({
        data: {
          productId: prod.id,
          userId: user.id,
          orderId: r.isVerifiedPurchase && order ? order.id : null,
          rating: r.rating,
          title: r.title,
          comment: r.comment,
          isVerifiedPurchase: r.isVerifiedPurchase,
          status: r.status,
        },
      });
    }
    console.log(`Created ${sampleReviews.length} sample reviews.`);
  } else {
    console.log(`Reviews already seeded (${existingReviewsCount} records found).`);
  }

  // 2. Seed Notifications if empty
  if (existingNotifsCount === 0) {
    console.log('Seeding sample notifications...');
    const adminUser = users.find((u) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN') || users[0];

    const sampleNotifications = [
      {
        userId: adminUser.id,
        type: NotificationType.LOW_STOCK,
        title: 'Low Stock Alert: Premium Wireless Headphones',
        message: 'Inventory has reached 2 units, below the safety threshold of 5 units.',
        linkUrl: '/inventory/low-stock',
        isRead: false,
      },
      {
        userId: adminUser.id,
        type: NotificationType.ORDER_STATUS,
        title: 'New Order Received (#AZ-2026-N491L0)',
        message: 'Customer John Doe placed a Cash on Delivery order totaling ৳3,450.00.',
        linkUrl: '/orders',
        isRead: false,
      },
      {
        userId: adminUser.id,
        type: NotificationType.PAYMENT,
        title: 'Cash on Delivery Collected: ৳1,850.00',
        message: 'Steadfast courier confirmed cash handover for Order #AZ-2026-X8K2M9.',
        linkUrl: '/payments/transactions',
        isRead: true,
      },
      {
        userId: adminUser.id,
        type: NotificationType.SYSTEM,
        title: 'Database Backup Completed',
        message: 'Automated nightly PostgreSQL snapshot finished successfully.',
        linkUrl: '/system/settings',
        isRead: true,
      },
      {
        userId: adminUser.id,
        type: NotificationType.PROMOTION,
        title: 'Upcoming Campaign: Eid Flash Sale 2026',
        message: 'Promotional discounts and coupons are scheduled to go live in 48 hours.',
        linkUrl: '/marketing/coupons',
        isRead: false,
      },
    ];

    for (const n of sampleNotifications) {
      await prisma.notification.create({
        data: n,
      });
    }
    console.log(`Created ${sampleNotifications.length} sample notifications.`);
  } else {
    console.log(`Notifications already seeded (${existingNotifsCount} records found).`);
  }
}

seedEngagement()
  .catch((e) => {
    console.error('Seed engagement error:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
