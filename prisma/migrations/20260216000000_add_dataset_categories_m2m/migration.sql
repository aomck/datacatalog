-- CreateTable: dataset_categories (Many-to-Many junction table)
CREATE TABLE "dataset_categories" (
    "id" TEXT NOT NULL,
    "dataset_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dataset_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dataset_categories_dataset_id_category_id_key" ON "dataset_categories"("dataset_id", "category_id");

-- CreateIndex
CREATE INDEX "dataset_categories_dataset_id_idx" ON "dataset_categories"("dataset_id");

-- CreateIndex
CREATE INDEX "dataset_categories_category_id_idx" ON "dataset_categories"("category_id");

-- AddForeignKey
ALTER TABLE "dataset_categories" ADD CONSTRAINT "dataset_categories_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "datasets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dataset_categories" ADD CONSTRAINT "dataset_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ==============================================================================
-- DATA MIGRATION: Migrate existing category_id to dataset_categories
-- ==============================================================================

-- Step 1: Identify duplicates and the dataset to keep (oldest by createdAt)
WITH ranked_datasets AS (
  SELECT
    id,
    name,
    category_id,
    "createdAt",
    ROW_NUMBER() OVER (PARTITION BY name ORDER BY "createdAt" ASC, id ASC) as row_num
  FROM datasets
  WHERE "deletedAt" IS NULL AND category_id IS NOT NULL
),
datasets_to_keep AS (
  SELECT id, name
  FROM ranked_datasets
  WHERE row_num = 1
),
-- Map duplicates to the dataset we're keeping
duplicate_mapping AS (
  SELECT
    dup.id as duplicate_id,
    keep.id as keep_id,
    dup.name,
    dup.category_id
  FROM ranked_datasets dup
  JOIN datasets_to_keep keep ON dup.name = keep.name
  WHERE dup.row_num >= 1  -- Include ALL datasets (both kept and duplicates)
)
-- Step 2: Insert ALL unique category combinations (from kept dataset AND all duplicates)
INSERT INTO dataset_categories (id, dataset_id, category_id, created_at)
SELECT DISTINCT
  gen_random_uuid(),
  dm.keep_id as dataset_id,
  dm.category_id,
  NOW()
FROM duplicate_mapping dm
WHERE dm.category_id IS NOT NULL
ON CONFLICT (dataset_id, category_id) DO NOTHING;

-- Step 3: Update related tables to point to the kept dataset
-- Update services
WITH datasets_to_merge AS (
  SELECT
    d.id as duplicate_id,
    k.id as keep_id
  FROM (
    SELECT
      id,
      name,
      "createdAt",
      ROW_NUMBER() OVER (PARTITION BY name ORDER BY "createdAt" ASC, id ASC) as row_num
    FROM datasets
    WHERE "deletedAt" IS NULL
  ) d
  JOIN (
    SELECT
      id,
      name
    FROM (
      SELECT
        id,
        name,
        ROW_NUMBER() OVER (PARTITION BY name ORDER BY "createdAt" ASC, id ASC) as row_num
      FROM datasets
      WHERE "deletedAt" IS NULL
    ) ranked
    WHERE row_num = 1
  ) k ON d.name = k.name AND d.row_num > 1
)
UPDATE services s
SET dataset_id = dtm.keep_id
FROM datasets_to_merge dtm
WHERE s.dataset_id = dtm.duplicate_id;

-- Update request_datasets
WITH datasets_to_merge AS (
  SELECT
    d.id as duplicate_id,
    k.id as keep_id
  FROM (
    SELECT
      id,
      name,
      "createdAt",
      ROW_NUMBER() OVER (PARTITION BY name ORDER BY "createdAt" ASC, id ASC) as row_num
    FROM datasets
    WHERE "deletedAt" IS NULL
  ) d
  JOIN (
    SELECT
      id,
      name
    FROM (
      SELECT
        id,
        name,
        ROW_NUMBER() OVER (PARTITION BY name ORDER BY "createdAt" ASC, id ASC) as row_num
      FROM datasets
      WHERE "deletedAt" IS NULL
    ) ranked
    WHERE row_num = 1
  ) k ON d.name = k.name AND d.row_num > 1
)
UPDATE request_datasets rd
SET dataset_id = dtm.keep_id
FROM datasets_to_merge dtm
WHERE rd.dataset_id = dtm.duplicate_id;

-- Step 4: Hard delete duplicate datasets
WITH ranked_datasets AS (
  SELECT
    id,
    name,
    ROW_NUMBER() OVER (PARTITION BY name ORDER BY "createdAt" ASC, id ASC) as row_num
  FROM datasets
  WHERE "deletedAt" IS NULL
)
DELETE FROM datasets
WHERE id IN (
  SELECT id FROM ranked_datasets WHERE row_num > 1
);
