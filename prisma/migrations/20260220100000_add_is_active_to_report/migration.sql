-- Add is_active column to Report table
ALTER TABLE "reports" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT false;
