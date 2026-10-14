import 'reflect-metadata';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '@prisma/client';
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

async function seed() {
  const superAdminEmail =
    process.env.SUPER_ADMIN_EMAIL || 'admin@az-ecommerce.local';
  const superAdminPassword =
    process.env.SUPER_ADMIN_PASSWORD || 'Admin123456!';
  const superAdminName =
    process.env.SUPER_ADMIN_NAME || 'Super Administrator';

  console.log(`Checking existing super admin: ${superAdminEmail}`);
  const existing = await prisma.user.findUnique({
    where: { email: superAdminEmail },
  });

  if (existing) {
    console.log(`Super admin ${superAdminEmail} already exists. Skipping.`);
    return;
  }

  const passwordHash = await argon2.hash(superAdminPassword, {
    type: argon2.argon2id,
  });

  const created = await prisma.user.create({
    data: {
      email: superAdminEmail,
      passwordHash,
      name: superAdminName,
      role: Role.SUPER_ADMIN,
      isActive: true,
      emailVerifiedAt: new Date(),
    },
  });

  console.log(
    `Provisioned initial SUPER_ADMIN user: ${created.email} (${created.id})`,
  );
}

seed()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
