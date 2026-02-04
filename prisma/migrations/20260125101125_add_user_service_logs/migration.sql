-- CreateTable
CREATE TABLE "user_service_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "request_ip" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_service_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_service_logs_user_id_idx" ON "user_service_logs"("user_id");

-- CreateIndex
CREATE INDEX "user_service_logs_service_id_idx" ON "user_service_logs"("service_id");

-- CreateIndex
CREATE INDEX "user_service_logs_created_at_idx" ON "user_service_logs"("created_at");

-- AddForeignKey
ALTER TABLE "user_service_logs" ADD CONSTRAINT "user_service_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_service_logs" ADD CONSTRAINT "user_service_logs_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
