-- CreateTable: ReportUnitOwner junction table for m:m relationship
CREATE TABLE "report_unit_owners" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "unit_owner_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_unit_owners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "report_unit_owners_report_id_idx" ON "report_unit_owners"("report_id");

-- CreateIndex
CREATE INDEX "report_unit_owners_unit_owner_id_idx" ON "report_unit_owners"("unit_owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "report_unit_owners_report_id_unit_owner_id_key" ON "report_unit_owners"("report_id", "unit_owner_id");

-- AddForeignKey
ALTER TABLE "report_unit_owners" ADD CONSTRAINT "report_unit_owners_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_unit_owners" ADD CONSTRAINT "report_unit_owners_unit_owner_id_fkey" FOREIGN KEY ("unit_owner_id") REFERENCES "unit_owners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing data: Copy unit_owner_id from reports to report_unit_owners
INSERT INTO "report_unit_owners" ("id", "report_id", "unit_owner_id", "created_at")
SELECT
    gen_random_uuid(),
    "id" as "report_id",
    "unit_owner_id",
    CURRENT_TIMESTAMP
FROM "reports"
WHERE "unit_owner_id" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "reports" DROP CONSTRAINT "reports_unit_owner_id_fkey";

-- DropIndex (if exists)
DROP INDEX IF EXISTS "reports_unit_owner_id_idx";

-- AlterTable: Remove unit_owner_id column from reports
ALTER TABLE "reports" DROP COLUMN "unit_owner_id";
