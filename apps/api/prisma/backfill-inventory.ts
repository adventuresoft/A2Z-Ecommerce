import 'reflect-metadata';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role, StockMovementType } from '@prisma/client';

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

async function backfillInventory() {
  console.log('Checking for product variants without inventory records...');

  const variantsWithoutInventory = await prisma.productVariant.findMany({
    where: {
      inventory: null,
    },
    include: {
      product: {
        select: { title: true },
      },
    },
  });

  if (variantsWithoutInventory.length === 0) {
    console.log('All product variants already have an associated inventory record.');
    return;
  }

  console.log(
    `Found ${variantsWithoutInventory.length} variant(s) without inventory. Creating initial inventory records...`,
  );

  const superAdmin = await prisma.user.findFirst({
    where: { role: Role.SUPER_ADMIN },
  });

  let createdCount = 0;
  for (const variant of variantsWithoutInventory) {
    const defaultQty = 20;
    const defaultThreshold = 5;

    await prisma.inventory.create({
      data: {
        variantId: variant.id,
        quantity: defaultQty,
        reservedQuantity: 0,
        lowStockThreshold: defaultThreshold,
      },
    });

    await prisma.stockMovement.create({
      data: {
        variantId: variant.id,
        type: StockMovementType.INITIAL,
        quantityChange: defaultQty,
        previousQuantity: 0,
        newQuantity: defaultQty,
        referenceId: 'BACKFILL-INIT',
        notes: `Backfilled initial stock for variant ${variant.sku} (${variant.product.title})`,
        performedByUserId: superAdmin?.id ?? null,
      },
    });

    createdCount++;
    console.log(`Backfilled inventory for variant: ${variant.sku}`);
  }

  console.log(`Successfully backfilled inventory for ${createdCount} variant(s).`);
}

backfillInventory()
  .catch((e) => {
    console.error('Inventory backfill failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
