-- AlterTable: Add is_new_report and report_type_id columns to request_reports table
ALTER TABLE "request_reports" ADD COLUMN "is_new_report" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "request_reports" ADD COLUMN "report_type_id" TEXT;
