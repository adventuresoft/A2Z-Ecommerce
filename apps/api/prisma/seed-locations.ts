import 'reflect-metadata';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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

const SQL_DUMP_PATH = 'C:\\Users\\ripon\\Downloads\\cioas_dev (2).sql';
const JSON_DATA_PATH = path.join(__dirname, 'locations-data.json');

// Fix broken district_id mappings in city_corporations from the SQL dump
// so they reference the actual districts (1..64) in the database.
const CITY_CORP_DISTRICT_FIX: Record<number, number> = {
  1: 14,  // Dhaka North -> Dhaka (14)
  2: 14,  // Dhaka South -> Dhaka (14)
  3: 10,  // Chattogram -> Chittagong (10)
  4: 62,  // Sylhet -> Sylhet (62)
  5: 4,   // Barishal -> Barishal (4)
  6: 29,  // Khulna -> Khulna (29)
  7: 54,  // Rajshahi -> Rajshahi (54)
  8: 19,  // Gazipur -> Gazipur (19)
  9: 43,  // Narayanganj -> Narayanganj (43)
  10: 56, // Rangpur -> Rangpur (56)
  11: 12, // Cumilla -> Comilla (12)
  12: 40, // Mymensingh -> Mymensingh (40)
};

type SqlValue = string | number | null;

function parseSqlTupleLine(line: string): SqlValue[] | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith('(')) return null;

  // Strip leading '(' and trailing '),' or ');'
  const endIdx = trimmed.endsWith('),') || trimmed.endsWith(');')
    ? trimmed.length - 2
    : trimmed.endsWith(')')
      ? trimmed.length - 1
      : trimmed.length;
  const content = trimmed.slice(1, endIdx);

  const values: SqlValue[] = [];
  let i = 0;
  const len = content.length;

  while (i < len) {
    while (i < len && (content[i] === ' ' || content[i] === '\t')) i++;
    if (i >= len) break;

    if (content[i] === "'") {
      // Quoted string
      i++;
      let str = '';
      while (i < len) {
        if (content[i] === '\\' && i + 1 < len) {
          const next = content[i + 1];
          if (next === 'r') str += '\r';
          else if (next === 'n') str += '\n';
          else if (next === 't') str += '\t';
          else str += next;
          i += 2;
        } else if (content[i] === "'" && content[i + 1] === "'") {
          str += "'";
          i += 2;
        } else if (content[i] === "'") {
          i++;
          break;
        } else {
          str += content[i];
          i++;
        }
      }
      values.push(str.trim());
      while (i < len && content[i] !== ',') i++;
      if (content[i] === ',') i++;
    } else {
      // Unquoted token (NULL or number)
      let token = '';
      while (i < len && content[i] !== ',') {
        token += content[i];
        i++;
      }
      if (content[i] === ',') i++;
      const t = token.trim();
      if (t.toUpperCase() === 'NULL') {
        values.push(null);
      } else {
        values.push(Number(t));
      }
    }
  }

  return values;
}

interface LocationsDataset {
  divisions: Array<{
    id: number;
    name: string;
    bnName: string;
    status: boolean;
    createdAt: string | null;
    updatedAt: string | null;
  }>;
  districts: Array<{
    id: number;
    divisionId: number;
    name: string;
    bnName: string | null;
    status: boolean;
    createdAt: string | null;
    updatedAt: string | null;
  }>;
  cityCorporations: Array<{
    id: number;
    districtId: number;
    name: string;
    bnName: string | null;
    status: boolean;
    createdAt: string | null;
    updatedAt: string | null;
  }>;
  thanas: Array<{
    id: number;
    districtId: number;
    name: string;
    bnName: string | null;
    status: boolean;
    createdAt: string | null;
    updatedAt: string | null;
  }>;
  unions: Array<{
    id: number;
    thanaId: number;
    name: string;
    bnName: string | null;
    status: boolean;
    createdAt: string | null;
    updatedAt: string | null;
  }>;
  upazilas: Array<{
    id: number;
    districtId: number | null;
    name: string;
    bnName: string | null;
    status: boolean;
    createdAt: string | null;
    updatedAt: string | null;
  }>;
  wards: Array<{
    id: number;
    name: string | null;
    bnName: string | null;
    createdAt: string | null;
    updatedAt: string | null;
  }>;
}

function toIsoOrNull(val: SqlValue): string | null {
  if (!val || typeof val !== 'string') return null;
  const d = new Date(val.replace(' ', 'T') + 'Z');
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function buildDatasetFromSql(sqlPath: string): LocationsDataset {
  const raw = fs.readFileSync(sqlPath, 'utf8');
  const lines = raw.split(/\r?\n/);

  const dataset: LocationsDataset = {
    divisions: [],
    districts: [],
    cityCorporations: [],
    thanas: [],
    unions: [],
    upazilas: [],
    wards: [],
  };

  let currentTable: string | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    const insertMatch = trimmed.match(/^INSERT INTO `(\w+)`/i);
    if (insertMatch) {
      currentTable = insertMatch[1];
      continue;
    }

    if (!currentTable) continue;
    if (!trimmed.startsWith('(')) {
      if (trimmed === '' || trimmed.startsWith('--') || trimmed.startsWith('CREATE') || trimmed.startsWith('ALTER')) {
        currentTable = null;
      }
      continue;
    }

    const row = parseSqlTupleLine(trimmed);
    if (!row) continue;

    switch (currentTable) {
      case 'divisions': {
        // (`id`, `country_id`, `name`, `bn_name`, `status`, `deleted_at`, `created_at`, `updated_at`)
        const id = Number(row[0]);
        const name = String(row[2] ?? '').trim();
        const bnName = String(row[3] ?? '').trim();
        const status = Number(row[4] ?? 1) === 1;
        const createdAt = toIsoOrNull(row[6]);
        const updatedAt = toIsoOrNull(row[7]);
        dataset.divisions.push({ id, name, bnName, status, createdAt, updatedAt });
        break;
      }
      case 'districts': {
        // (`id`, `name`, `bn_name`, `code`, `lat`, `lon`, `url`, `status`, `division_id`, `deleted_at`, `created_at`, `updated_at`)
        const id = Number(row[0]);
        const name = String(row[1] ?? '').trim();
        const bnName = row[2] !== null ? String(row[2]).trim() : null;
        const status = Number(row[7] ?? 1) === 1;
        const divisionId = Number(row[8]);
        const createdAt = toIsoOrNull(row[10]);
        const updatedAt = toIsoOrNull(row[11]);
        dataset.districts.push({ id, divisionId, name, bnName, status, createdAt, updatedAt });
        break;
      }
      case 'city_corporations': {
        // (`id`, `district_id`, `name`, `bn_name`, `category`, `slug`, `lat`, `lon`, `url`, `status`, `deleted_at`, `created_at`, `updated_at`)
        const id = Number(row[0]);
        const rawDistrictId = Number(row[1]);
        const districtId = CITY_CORP_DISTRICT_FIX[id] ?? rawDistrictId;
        const name = String(row[2] ?? '').trim();
        const bnName = row[3] !== null ? String(row[3]).trim() : null;
        const status = Number(row[9] ?? 1) === 1;
        const createdAt = toIsoOrNull(row[11]);
        const updatedAt = toIsoOrNull(row[12]);
        dataset.cityCorporations.push({ id, districtId, name, bnName, status, createdAt, updatedAt });
        break;
      }
      case 'thanas': {
        // (`id`, `name`, `bn_name`, `url`, `status`, `district_id`, `deleted_at`, `created_at`, `updated_at`)
        const id = Number(row[0]);
        const name = String(row[1] ?? '').trim();
        const bnName = row[2] !== null ? String(row[2]).trim() : null;
        const status = Number(row[4] ?? 1) === 1;
        const districtId = Number(row[5]);
        const createdAt = toIsoOrNull(row[7]);
        const updatedAt = toIsoOrNull(row[8]);
        dataset.thanas.push({ id, districtId, name, bnName, status, createdAt, updatedAt });
        break;
      }
      case 'unions': {
        // (`id`, `name`, `bn_name`, `url`, `status`, `thana_id`, `deleted_at`, `created_at`, `created_by`, `updated_at`)
        const id = Number(row[0]);
        const name = String(row[1] ?? '').trim();
        const bnName = row[2] !== null ? String(row[2]).trim() : null;
        const status = Number(row[4] ?? 1) === 1;
        const thanaId = Number(row[5]);
        const createdAt = toIsoOrNull(row[7]);
        const updatedAt = toIsoOrNull(row[9]);
        dataset.unions.push({ id, thanaId, name, bnName, status, createdAt, updatedAt });
        break;
      }
      case 'upazilas': {
        // (`id`, `district_id`, `record`, `name`, `bn_name`, `code`, `status`, `created_at`, `updated_at`)
        const id = Number(row[0]);
        const districtId = row[1] !== null ? Number(row[1]) : null;
        const name = String(row[3] ?? '').trim();
        const bnName = row[4] !== null ? String(row[4]).trim() : null;
        const status = Number(row[6] ?? 1) === 1;
        const createdAt = toIsoOrNull(row[7]);
        const updatedAt = toIsoOrNull(row[8]);
        dataset.upazilas.push({ id, districtId, name, bnName, status, createdAt, updatedAt });
        break;
      }
      case 'wards': {
        // (`id`, `name`, `bn_name`, `created_at`, `updated_at`)
        const id = Number(row[0]);
        const name = row[1] !== null ? String(row[1]).trim() : null;
        const bnName = row[2] !== null ? String(row[2]).trim() : null;
        const createdAt = toIsoOrNull(row[3]);
        const updatedAt = toIsoOrNull(row[4]);
        dataset.wards.push({ id, name, bnName, createdAt, updatedAt });
        break;
      }
    }

    if (trimmed.endsWith(');')) {
      currentTable = null;
    }
  }

  return dataset;
}

async function seedLocations() {
  let dataset: LocationsDataset;

  if (fs.existsSync(SQL_DUMP_PATH)) {
    console.log(`Parsing SQL dump from ${SQL_DUMP_PATH}...`);
    dataset = buildDatasetFromSql(SQL_DUMP_PATH);
    fs.writeFileSync(JSON_DATA_PATH, JSON.stringify(dataset, null, 2), 'utf8');
    console.log(`Saved normalized location dataset to ${JSON_DATA_PATH}`);
  } else if (fs.existsSync(JSON_DATA_PATH)) {
    console.log(`Loading location dataset from ${JSON_DATA_PATH}...`);
    dataset = JSON.parse(fs.readFileSync(JSON_DATA_PATH, 'utf8')) as LocationsDataset;
  } else {
    throw new Error(`Neither ${SQL_DUMP_PATH} nor ${JSON_DATA_PATH} was found.`);
  }

  console.log('Parsed row counts:', {
    divisions: dataset.divisions.length,
    districts: dataset.districts.length,
    cityCorporations: dataset.cityCorporations.length,
    thanas: dataset.thanas.length,
    unions: dataset.unions.length,
    upazilas: dataset.upazilas.length,
    wards: dataset.wards.length,
  });

  const now = new Date();

  console.log('Seeding location tables into PostgreSQL...');

  // Clean existing rows in reverse dependency order
  await prisma.union.deleteMany();
  await prisma.thana.deleteMany();
  await prisma.cityCorporation.deleteMany();
  await prisma.upazila.deleteMany();
  await prisma.district.deleteMany();
  await prisma.division.deleteMany();
  await prisma.ward.deleteMany();

  // 1. Divisions (10)
  await prisma.division.createMany({
    data: dataset.divisions.map((r) => ({
      id: r.id,
      name: r.name,
      bnName: r.bnName,
      status: r.status,
      createdAt: r.createdAt ? new Date(r.createdAt) : now,
      updatedAt: r.updatedAt ? new Date(r.updatedAt) : now,
    })),
  });

  // 2. Districts (64)
  await prisma.district.createMany({
    data: dataset.districts.map((r) => ({
      id: r.id,
      divisionId: r.divisionId,
      name: r.name,
      bnName: r.bnName,
      status: r.status,
      createdAt: r.createdAt ? new Date(r.createdAt) : now,
      updatedAt: r.updatedAt ? new Date(r.updatedAt) : now,
    })),
  });

  // 3. City Corporations (12)
  await prisma.cityCorporation.createMany({
    data: dataset.cityCorporations.map((r) => ({
      id: r.id,
      districtId: r.districtId,
      name: r.name,
      bnName: r.bnName,
      status: r.status,
      createdAt: r.createdAt ? new Date(r.createdAt) : now,
      updatedAt: r.updatedAt ? new Date(r.updatedAt) : now,
    })),
  });

  // 4. Thanas (540)
  await prisma.thana.createMany({
    data: dataset.thanas.map((r) => ({
      id: r.id,
      districtId: r.districtId,
      name: r.name,
      bnName: r.bnName,
      status: r.status,
      createdAt: r.createdAt ? new Date(r.createdAt) : now,
      updatedAt: r.updatedAt ? new Date(r.updatedAt) : now,
    })),
  });

  // 5. Unions (4540) in batches of 1000
  const batchSize = 1000;
  for (let i = 0; i < dataset.unions.length; i += batchSize) {
    const chunk = dataset.unions.slice(i, i + batchSize);
    await prisma.union.createMany({
      data: chunk.map((r) => ({
        id: r.id,
        thanaId: r.thanaId,
        name: r.name,
        bnName: r.bnName,
        status: r.status,
        createdAt: r.createdAt ? new Date(r.createdAt) : now,
        updatedAt: r.updatedAt ? new Date(r.updatedAt) : now,
      })),
    });
  }

  // 6. Upazilas (43)
  await prisma.upazila.createMany({
    data: dataset.upazilas.map((r) => ({
      id: r.id,
      districtId: r.districtId,
      name: r.name,
      bnName: r.bnName,
      status: r.status,
      createdAt: r.createdAt ? new Date(r.createdAt) : now,
      updatedAt: r.updatedAt ? new Date(r.updatedAt) : now,
    })),
  });

  // 7. Wards (20)
  await prisma.ward.createMany({
    data: dataset.wards.map((r) => ({
      id: r.id,
      name: r.name,
      bnName: r.bnName,
      createdAt: r.createdAt ? new Date(r.createdAt) : now,
      updatedAt: r.updatedAt ? new Date(r.updatedAt) : now,
    })),
  });

  // Reset PostgreSQL auto-increment sequences to MAX(id)
  const tables = [
    'divisions',
    'districts',
    'city_corporations',
    'thanas',
    'unions',
    'upazilas',
    'wards',
  ];

  for (const tbl of tables) {
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"${tbl}"', 'id'), COALESCE((SELECT MAX(id) FROM "${tbl}"), 1), true);`
    );
  }

  const [
    divisionsCount,
    districtsCount,
    cityCorporationsCount,
    thanasCount,
    unionsCount,
    upazilasCount,
    wardsCount,
  ] = await Promise.all([
    prisma.division.count(),
    prisma.district.count(),
    prisma.cityCorporation.count(),
    prisma.thana.count(),
    prisma.union.count(),
    prisma.upazila.count(),
    prisma.ward.count(),
  ]);

  console.log('Successfully seeded all 7 location tables in PostgreSQL:', {
    divisions: divisionsCount,
    districts: districtsCount,
    city_corporations: cityCorporationsCount,
    thanas: thanasCount,
    unions: unionsCount,
    upazilas: upazilasCount,
    wards: wardsCount,
  });
}

seedLocations()
  .catch((err) => {
    console.error('Error seeding locations:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

