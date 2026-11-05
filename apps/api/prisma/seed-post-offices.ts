import 'reflect-metadata';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

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

const DEFAULT_CSV_PATH = path.join(__dirname, 'post_offices.csv');
const DOWNLOADS_CSV_PATH = 'C:/Users/Administrator/Downloads/post_offices.csv';

interface PostOfficeRecord {
  id: number;
  thanaId: number;
  name: string | null;
  bnName: string | null;
  postalCode: string | null;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function parseCsvLine(line: string): string[] {
  const parts: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      parts.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  parts.push(cur.trim());
  return parts.map((p) => p.replace(/^"|"$/g, '').trim());
}

async function seedPostOffices() {
  const csvPath = fs.existsSync(DOWNLOADS_CSV_PATH) ? DOWNLOADS_CSV_PATH : DEFAULT_CSV_PATH;
  console.log(`Reading post offices CSV from: ${csvPath}`);

  const thanas = await prisma.thana.findMany({ select: { id: true } });
  const validThanaIds = new Set(thanas.map((t) => t.id));
  console.log(`Loaded ${validThanaIds.size} valid thanas from database.`);

  const rl = readline.createInterface({
    input: fs.createReadStream(csvPath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  const now = new Date();
  const records: PostOfficeRecord[] = [];
  let lineCount = 0;
  let skippedNoThana = 0;

  for await (const line of rl) {
    lineCount++;
    if (lineCount === 1) continue; // Skip header

    const cols = parseCsvLine(line);
    if (cols.length < 7) continue;

    const id = parseInt(cols[0], 10);
    const name = cols[1] || null;
    const bnName = cols[2] || null;
    const postalCode = cols[3] || null;
    // cols[4] is url -> removed/ignored
    const statusVal = cols[5];
    const thanaId = parseInt(cols[6], 10);

    if (isNaN(id) || isNaN(thanaId)) continue;

    if (!validThanaIds.has(thanaId)) {
      skippedNoThana++;
      continue;
    }

    records.push({
      id,
      thanaId,
      name,
      bnName,
      postalCode,
      status: statusVal === '1' || statusVal === 'true' || statusVal === '',
      createdAt: now,
      updatedAt: now,
    });
  }

  console.log(`Parsed ${records.length} post office records (skipped ${skippedNoThana} with invalid thana).`);

  // Clear existing records before re-seeding
  await prisma.postOffice.deleteMany({});

  // Insert in batches
  const batchSize = 500;
  for (let i = 0; i < records.length; i += batchSize) {
    const chunk = records.slice(i, i + batchSize);
    await prisma.postOffice.createMany({
      data: chunk,
    });
  }

  // Reset auto-increment sequence
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"post_offices"', 'id'), COALESCE((SELECT MAX(id) FROM "post_offices"), 1), true);`
  );

  const totalCount = await prisma.postOffice.count();
  const namedCount = await prisma.postOffice.count({
    where: {
      name: { not: null },
    },
  });

  console.log(`Successfully seeded post_offices table:`, {
    totalRecords: totalCount,
    namedRecords: namedCount,
  });
}

seedPostOffices()
  .catch((err) => {
    console.error('Error seeding post offices:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

