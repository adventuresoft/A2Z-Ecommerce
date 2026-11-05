import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

async function main() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://postgres:62348787@localhost:5432/az_ecommerce?schema=public';

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('Seeding Membership Plans...');

  const plans = [
    {
      name: 'মাসিক প্ল্যান (Monthly)',
      durationDays: 30,
      price: 299,
      sortOrder: 1,
      isActive: true,
      features: {
        dailyRevealsQuota: 20,
        unlimitedChat: true,
        supportLevel: 'STANDARD',
        verifiedBadgeAccess: true,
      },
    },
    {
      name: 'ত্রৈমাসিক প্ল্যান (Quarterly)',
      durationDays: 90,
      price: 799,
      sortOrder: 2,
      isActive: true,
      features: {
        dailyRevealsQuota: 25,
        unlimitedChat: true,
        supportLevel: 'PRIORITY',
        verifiedBadgeAccess: true,
        savingsPercent: 11,
      },
    },
    {
      name: 'বার্ষিক প্ল্যান (Annual)',
      durationDays: 365,
      price: 2499,
      sortOrder: 3,
      isActive: true,
      features: {
        dailyRevealsQuota: 30,
        unlimitedChat: true,
        supportLevel: 'VIP',
        verifiedBadgeAccess: true,
        savingsPercent: 30,
      },
    },
  ];

  for (const plan of plans) {
    const existing = await prisma.membershipPlan.findFirst({
      where: { durationDays: plan.durationDays },
    });
    if (!existing) {
      await prisma.membershipPlan.create({ data: plan });
      console.log(`Created plan: ${plan.name} (৳${plan.price})`);
    } else {
      await prisma.membershipPlan.update({
        where: { id: existing.id },
        data: plan,
      });
      console.log(`Updated plan: ${plan.name}`);
    }
  }

  console.log('Seeding Initial Filter Terms...');
  const badWords = [
    { term: 'scam', language: 'en' },
    { term: 'fraud', language: 'en' },
    { term: 'প্রতারক', language: 'bn' },
    { term: 'প্রতারণা', language: 'bn' },
    { term: 'বাটপার', language: 'bn' },
    { term: 'দালাল', language: 'bn' },
  ];

  for (const item of badWords) {
    await prisma.filterTerm.upsert({
      where: { term: item.term },
      update: {},
      create: {
        term: item.term,
        language: item.language,
        isActive: true,
      },
    });
  }

  console.log('Membership and filter terms seeded successfully!');
  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

