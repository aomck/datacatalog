-- CreateTable
CREATE TABLE "user_notification_reads" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "request_dataset_id" TEXT,
    "request_service_id" TEXT,
    "last_read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_notification_reads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_notification_reads_user_id_idx" ON "user_notification_reads"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_notification_reads_user_id_request_dataset_id_key" ON "user_notification_reads"("user_id", "request_dataset_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_notification_reads_user_id_request_service_id_key" ON "user_notification_reads"("user_id", "request_service_id");
