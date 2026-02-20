-- CreateTable
CREATE TABLE "report_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "short_name" TEXT NOT NULL,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "report_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "detail" TEXT,
    "type_id" TEXT NOT NULL,
    "url" TEXT,
    "unit_owner_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "security_level" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_categories" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_datasets" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "dataset_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_datasets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_files" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "report_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_reports" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "report_id" TEXT,
    "approve_status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "comment" TEXT,
    "title" TEXT,
    "detail" TEXT,

    CONSTRAINT "request_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_report_design_files" (
    "id" TEXT NOT NULL,
    "request_report_id" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "request_report_design_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_report_datasets" (
    "id" TEXT NOT NULL,
    "request_report_id" TEXT NOT NULL,
    "dataset_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_report_datasets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_report_approval_files" (
    "id" TEXT NOT NULL,
    "request_report_id" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "request_report_approval_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "report_categories_report_id_category_id_key" ON "report_categories"("report_id", "category_id");

-- CreateIndex
CREATE INDEX "report_categories_report_id_idx" ON "report_categories"("report_id");

-- CreateIndex
CREATE INDEX "report_categories_category_id_idx" ON "report_categories"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "report_datasets_report_id_dataset_id_key" ON "report_datasets"("report_id", "dataset_id");

-- CreateIndex
CREATE INDEX "report_datasets_report_id_idx" ON "report_datasets"("report_id");

-- CreateIndex
CREATE INDEX "report_datasets_dataset_id_idx" ON "report_datasets"("dataset_id");

-- CreateIndex
CREATE UNIQUE INDEX "request_report_datasets_request_report_id_dataset_id_key" ON "request_report_datasets"("request_report_id", "dataset_id");

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "report_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_unit_owner_id_fkey" FOREIGN KEY ("unit_owner_id") REFERENCES "unit_owners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_categories" ADD CONSTRAINT "report_categories_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_categories" ADD CONSTRAINT "report_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_datasets" ADD CONSTRAINT "report_datasets_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_datasets" ADD CONSTRAINT "report_datasets_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "datasets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_files" ADD CONSTRAINT "report_files_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_reports" ADD CONSTRAINT "request_reports_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_reports" ADD CONSTRAINT "request_reports_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_reports" ADD CONSTRAINT "request_reports_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_report_design_files" ADD CONSTRAINT "request_report_design_files_request_report_id_fkey" FOREIGN KEY ("request_report_id") REFERENCES "request_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_report_datasets" ADD CONSTRAINT "request_report_datasets_request_report_id_fkey" FOREIGN KEY ("request_report_id") REFERENCES "request_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_report_datasets" ADD CONSTRAINT "request_report_datasets_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "datasets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_report_approval_files" ADD CONSTRAINT "request_report_approval_files_request_report_id_fkey" FOREIGN KEY ("request_report_id") REFERENCES "request_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
