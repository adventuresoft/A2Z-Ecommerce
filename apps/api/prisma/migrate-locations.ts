import pg from 'pg';

async function main() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:62348787@localhost:5432/az_ecommerce?schema=public'
  });
  await client.connect();
  console.log('Connected to PostgreSQL database');

  await client.query('BEGIN');

  try {
    // 1. Rename upazilas to paurashavas if upazilas table exists
    const checkUpazilas = await client.query(`
      SELECT to_regclass('public.upazilas') AS exists_upazilas,
             to_regclass('public.paurashavas') AS exists_paurashavas;
    `);

    if (checkUpazilas.rows[0].exists_upazilas && !checkUpazilas.rows[0].exists_paurashavas) {
      console.log('Renaming upazilas table to paurashavas...');
      await client.query(`ALTER TABLE "upazilas" RENAME TO "paurashavas";`);
    }

    // Ensure district_id in paurashavas is NOT NULL
    console.log('Configuring paurashavas columns and constraints...');
    await client.query(`
      DELETE FROM "paurashavas" WHERE "district_id" IS NULL;
      ALTER TABLE "paurashavas" ALTER COLUMN "district_id" SET NOT NULL;
    `);

    // Ensure index on paurashavas(district_id)
    await client.query(`
      CREATE INDEX IF NOT EXISTS "paurashavas_district_id_idx" ON "paurashavas"("district_id");
    `);

    // 2. Update wards table
    console.log('Updating wards table schema...');
    // Drop existing placeholder rows from wards (since they lack city_corporation_id)
    await client.query(`TRUNCATE TABLE "wards" RESTART IDENTITY;`);

    // Add city_corporation_id and ward_no columns if they don't exist
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wards' AND column_name = 'city_corporation_id') THEN
          ALTER TABLE "wards" ADD COLUMN "city_corporation_id" INTEGER NOT NULL;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wards' AND column_name = 'ward_no') THEN
          ALTER TABLE "wards" ADD COLUMN "ward_no" INTEGER NOT NULL;
        END IF;
      END $$;
    `);

    // Add FK constraint if not exists
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wards_city_corporation_id_fkey') THEN
          ALTER TABLE "wards"
          ADD CONSTRAINT "wards_city_corporation_id_fkey"
          FOREIGN KEY ("city_corporation_id") REFERENCES "city_corporations"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    // Add unique constraint and index on wards
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wards_city_corporation_id_ward_no_key') THEN
          ALTER TABLE "wards" ADD CONSTRAINT "wards_city_corporation_id_ward_no_key" UNIQUE ("city_corporation_id", "ward_no");
        END IF;
      END $$;
      CREATE INDEX IF NOT EXISTS "wards_city_corporation_id_idx" ON "wards"("city_corporation_id");
    `);

    // 3. Seed sample wards for city corporations if table is empty
    const countWards = await client.query(`SELECT count(*) FROM "wards";`);
    if (parseInt(countWards.rows[0].count, 10) === 0) {
      console.log('Seeding initial wards for City Corporations...');
      const cityCorps = await client.query(`SELECT id, name FROM "city_corporations" ORDER BY id;`);
      
      const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      const toBangla = (num: number) => num.toString().split('').map(d => banglaDigits[parseInt(d, 10)]).join('');

      for (const cc of cityCorps.rows) {
        // Seed 10 wards per city corporation for testing & display
        for (let w = 1; w <= 10; w++) {
          await client.query(
            `INSERT INTO "wards" ("city_corporation_id", "ward_no", "name", "bn_name", "created_at", "updated_at")
             VALUES ($1, $2, $3, $4, NOW(), NOW())
             ON CONFLICT ("city_corporation_id", "ward_no") DO NOTHING;`,
            [cc.id, w, `Ward ${w}`, `ওয়ার্ড ${toBangla(w)}`]
          );
        }
      }
      console.log(`Seeded 10 wards each for ${cityCorps.rowCount} city corporations.`);
    }

    await client.query('COMMIT');
    console.log('Migration completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

