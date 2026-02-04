-- CreateTable
CREATE TABLE "dataset_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "short_name" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "dataset_types_pkey" PRIMARY KEY ("id")
);

-- Insert initial data
INSERT INTO "dataset_types" ("id", "name", "short_name", "createdAt", "updatedAt") VALUES
('OPEN', 'ข้อมูลสาธารณะ', 'OPEN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('INTERNAL', 'ข้อมูลภายใน', 'INTERNAL', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('EXTERNAL', 'ข้อมูลภายนอก', 'EXTERNAL', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Add typeId column to datasets table (allow null temporarily)
ALTER TABLE "datasets" ADD COLUMN "type_id" TEXT;

-- Set default value for existing records (set to OPEN)
UPDATE "datasets" SET "type_id" = 'OPEN' WHERE "type_id" IS NULL;

-- Make typeId NOT NULL
ALTER TABLE "datasets" ALTER COLUMN "type_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "datasets" ADD CONSTRAINT "datasets_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "dataset_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
