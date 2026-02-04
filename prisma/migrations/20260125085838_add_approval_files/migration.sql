-- CreateTable
CREATE TABLE "request_dataset_approval_files" (
    "id" TEXT NOT NULL,
    "request_dataset_id" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "request_dataset_approval_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_service_approval_files" (
    "id" TEXT NOT NULL,
    "request_service_id" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "request_service_approval_files_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "request_dataset_approval_files" ADD CONSTRAINT "request_dataset_approval_files_request_dataset_id_fkey" FOREIGN KEY ("request_dataset_id") REFERENCES "request_datasets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_service_approval_files" ADD CONSTRAINT "request_service_approval_files_request_service_id_fkey" FOREIGN KEY ("request_service_id") REFERENCES "request_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
