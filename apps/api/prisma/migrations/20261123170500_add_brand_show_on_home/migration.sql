-- Add showOnHome flag to Brand for Home Page Authorized Distribution slider
ALTER TABLE "Brand" ADD COLUMN IF NOT EXISTS "showOnHome" BOOLEAN NOT NULL DEFAULT false;

-- Preserve visibility of existing active brands on the home page until curated in Admin
UPDATE "Brand" SET "showOnHome" = true WHERE "isActive" = true;

-- Index for fast home page brand slider queries
CREATE INDEX IF NOT EXISTS "Brand_isActive_showOnHome_sortOrder_idx" ON "Brand"("isActive", "showOnHome", "sortOrder");

