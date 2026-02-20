'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { Request, ApproveStatus, PaginatedResult } from '@/types';

// ============================================================================
// Request Creation & Management
// ============================================================================

/**
 * Create a new request with datasets and services
 */
export async function createRequest(data: {
  userId: string;
  name: string;
  unit: string;
  email: string;
  tel: string;
  detail?: string;
  datasetIds: string[];
  serviceIds: string[];
  reportIds?: string[]; // existing reports
  files: { filePath: string; fileName: string; fileType: string; fileSize: number }[];
}) {
  try {
    const request = await prisma.request.create({
      data: {
        requestedBy: data.userId,
        name: data.name,
        unit: data.unit,
        email: data.email,
        tel: data.tel,
        detail: data.detail,
        createdBy: data.userId,
        requestDatasets: {
          create: data.datasetIds.map((datasetId: string) => ({
            datasetId,
            approveStatus: 'REQUESTED',
          })),
        },
        requestServices: {
          create: data.serviceIds.map((serviceId: string) => ({
            serviceId,
            approveStatus: 'REQUESTED',
          })),
        },
        requestReports: {
          create: (data.reportIds || []).map((reportId: string) => ({
            reportId,
            approveStatus: 'REQUESTED',
          })),
        },
        requestFiles: {
          create: data.files.map((file: { filePath: string; fileName: string; fileType: string; fileSize: number }) => ({
            filePath: file.filePath,
            fileName: file.fileName,
            fileType: file.fileType,
            fileSize: file.fileSize,
            createdBy: data.userId,
          })),
        },
      },
      include: {
        requestDatasets: {
          include: { dataset: true },
        },
        requestServices: {
          include: { service: true },
        },
        requestReports: {
          include: { report: true },
        },
        requestFiles: true,
      },
    });

    revalidatePath('/app/my-catalog');
    revalidatePath('/app/my-reports');
    revalidatePath('/app/approver');

    return { success: true, data: request };
  } catch (error: any) {
    console.error('Create request error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get user's own requests
 */
export async function getUserRequests(
  userId: string,
  page = 1,
  limit = 30
): Promise<PaginatedResult<Request>> {
  try {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.request.findMany({
        where: {
          requestedBy: userId,
          deletedAt: null,
        },
        include: {
          requestDatasets: {
            include: {
              dataset: {
                include: {
                  unitOwner: true,
                  category: true,
                },
              },
            },
          },
          requestServices: {
            include: {
              service: {
                include: {
                  dataset: true,
                },
              },
            },
          },
          requestReports: {
            include: {
              report: {
                include: {
                  type: true,
                  files: true,
                },
              },
            },
          },
          requestFiles: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.request.count({
        where: {
          requestedBy: userId,
          deletedAt: null,
        },
      }),
    ]);

    return {
      data: data as Request[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    console.error('Get user requests error:', error);
    throw error;
  }
}

// ============================================================================
// Approval Actions
// ============================================================================

/**
 * Get all pending requests for approval
 */
export async function getAllRequests(page = 1, limit = 30): Promise<PaginatedResult<Request>> {
  try {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.request.findMany({
        where: {
          deletedAt: null,
        },
        include: {
          requestDatasets: {
            include: {
              dataset: {
                include: {
                  unitOwner: true,
                  category: true,
                  type: true,
                },
              },
              approver: true,
              approvalFiles: {
                orderBy: { createdAt: 'desc' },
              },
            },
          },
          requestServices: {
            include: {
              service: {
                include: {
                  dataset: true,
                },
              },
              approver: true,
              approvalFiles: {
                orderBy: { createdAt: 'desc' },
              },
            },
          },
          requestReports: {
            include: {
              report: {
                include: {
                  type: true,
                  unitOwners: {
                    include: {
                      unitOwner: true,
                    },
                  },
                  category: true,
                  categories: {
                    include: {
                      category: true,
                    },
                  },
                  datasets: {
                    include: {
                      dataset: true,
                    },
                  },
                  files: true,
                },
              },
              approver: true,
              designFiles: true,
              selectedDatasets: {
                include: {
                  dataset: true,
                },
              },
              approvalFiles: {
                orderBy: { createdAt: 'desc' },
              },
            },
          },
          requestFiles: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.request.count({
        where: {
          deletedAt: null,
        },
      }),
    ]);

    return {
      data: data as Request[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    console.error('Get all requests error:', error);
    throw error;
  }
}

/**
 * Update request dataset status
 */
export async function updateRequestDatasetStatus(
  requestDatasetIds: string[],
  status: ApproveStatus,
  comment: string,
  userId: string
) {
  try {
    await prisma.requestDataset.updateMany({
      where: {
        id: { in: requestDatasetIds },
      },
      data: {
        approveStatus: status,
        approvedBy: userId,
        approvedAt: new Date(),
        comment,
      },
    });

    revalidatePath('/app/approver');
    revalidatePath('/app/my-catalog');

    return { success: true };
  } catch (error: any) {
    console.error('Update request dataset status error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update request service status
 */
export async function updateRequestServiceStatus(
  requestServiceIds: string[],
  status: ApproveStatus,
  comment: string,
  userId: string
) {
  try {
    await prisma.requestService.updateMany({
      where: {
        id: { in: requestServiceIds },
      },
      data: {
        approveStatus: status,
        approvedBy: userId,
        approvedAt: new Date(),
        comment,
      },
    });

    revalidatePath('/app/approver');
    revalidatePath('/app/my-catalog');

    return { success: true };
  } catch (error: any) {
    console.error('Update request service status error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Bulk update request items status
 */
export async function bulkUpdateRequestStatus(
  datasetIds: string[],
  serviceIds: string[],
  reportIds: string[],
  status: ApproveStatus,
  comment: string,
  userId: string,
  uploadedFiles?: { filePath: string; fileName: string; fileSize: number }[]
) {
  try {

    await prisma.$transaction(async (tx) => {
      // Update datasets
      if (datasetIds.length > 0) {
        await tx.requestDataset.updateMany({
          where: {
            id: { in: datasetIds },
          },
          data: {
            approveStatus: status,
            approvedBy: userId,
            approvedAt: new Date(),
            comment,
          },
        });

        // Create approval files for each dataset
        if (uploadedFiles && uploadedFiles.length > 0) {
          for (const datasetId of datasetIds) {
            await tx.requestDatasetApprovalFile.createMany({
              data: uploadedFiles.map((file: { filePath: string; fileName: string; fileSize: number }) => ({
                requestDatasetId: datasetId,
                filePath: file.filePath,
                fileName: file.fileName,
                fileType: '', // Will be determined from file extension
                fileSize: file.fileSize,
                createdBy: userId,
              })),
            });
          }
        }
      }

      // Update services
      if (serviceIds.length > 0) {
        await tx.requestService.updateMany({
          where: {
            id: { in: serviceIds },
          },
          data: {
            approveStatus: status,
            approvedBy: userId,
            approvedAt: new Date(),
            comment,
          },
        });

        // Create approval files for each service
        if (uploadedFiles && uploadedFiles.length > 0) {
          for (const serviceId of serviceIds) {
            await tx.requestServiceApprovalFile.createMany({
              data: uploadedFiles.map((file: { filePath: string; fileName: string; fileSize: number }) => ({
                requestServiceId: serviceId,
                filePath: file.filePath,
                fileName: file.fileName,
                fileType: '', // Will be determined from file extension
                fileSize: file.fileSize,
                createdBy: userId,
              })),
            });
          }
        }
      }

      // Update reports
      if (reportIds.length > 0) {
        await tx.requestReport.updateMany({
          where: {
            id: { in: reportIds },
          },
          data: {
            approveStatus: status,
            approvedBy: userId,
            approvedAt: new Date(),
            comment,
          },
        });

        // Create approval files for each report
        if (uploadedFiles && uploadedFiles.length > 0) {
          for (const reportId of reportIds) {
            await tx.requestReportApprovalFile.createMany({
              data: uploadedFiles.map((file: { filePath: string; fileName: string; fileSize: number }) => ({
                requestReportId: reportId,
                filePath: file.filePath,
                fileName: file.fileName,
                fileType: '', // Will be determined from file extension
                fileSize: file.fileSize,
                createdBy: userId,
              })),
            });
          }
        }
      }
    });

    revalidatePath('/app/approver');
    revalidatePath('/app/my-catalog');
    revalidatePath('/app/my-reports');

    return { success: true };
  } catch (error: any) {
    console.error('Bulk update request status error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get user's requested report IDs and their statuses
 */
export async function getUserRequestedReports(userId: string) {
  try {
    const reports = await prisma.requestReport.findMany({
      where: {
        request: {
          requestedBy: userId,
          deletedAt: null,
        },
      },
      select: {
        reportId: true,
        approveStatus: true,
      },
    });

    return {
      requestedIds: reports.map(r => r.reportId).filter((id): id is string => id !== null),
      approvedIds: reports.filter(r => r.approveStatus === 'APPROVED').map(r => r.reportId).filter((id): id is string => id !== null),
      pendingIds: reports.filter(r => r.approveStatus === 'PENDING' || r.approveStatus === 'REQUESTED').map(r => r.reportId).filter((id): id is string => id !== null),
    };
  } catch (error) {
    console.error('Get user requested reports error:', error);
    return { requestedIds: [], approvedIds: [], pendingIds: [] };
  }
}

/**
 * Get request statistics
 */
export async function getRequestStatistics() {
  try {
    const [requested, pending, approved, disapproved] = await Promise.all([
      prisma.requestService.count({
        where: {
          approveStatus: 'REQUESTED',
          request: { deletedAt: null },
        },
      }),
      prisma.requestService.count({
        where: {
          approveStatus: 'PENDING',
          request: { deletedAt: null },
        },
      }),
      prisma.requestService.count({
        where: {
          approveStatus: 'APPROVED',
          request: { deletedAt: null },
        },
      }),
      prisma.requestService.count({
        where: {
          approveStatus: 'DISAPPROVED',
          request: { deletedAt: null },
        },
      }),
    ]);

    return {
      requested,
      pending,
      approved,
      disapproved,
      total: requested + pending + approved + disapproved,
    };
  } catch (error: any) {
    console.error('Get request statistics error:', error);
    return {
      requested: 0,
      pending: 0,
      approved: 0,
      disapproved: 0,
      total: 0,
    };
  }
}

// ============================================================================
// Report Request Actions
// ============================================================================

/**
 * Create a new report request (for existing or new report)
 */
export async function createReportRequest(data: {
  userId: string;
  name: string;
  unit: string;
  email: string;
  tel: string;
  detail?: string;
  reportIds: string[]; // existing reports in cart
  files: { filePath: string; fileName: string; fileType: string; fileSize: number }[];
}) {
  try {
    const request = await prisma.request.create({
      data: {
        requestedBy: data.userId,
        name: data.name,
        unit: data.unit,
        email: data.email,
        tel: data.tel,
        detail: data.detail,
        createdBy: data.userId,
        requestReports: {
          create: data.reportIds.map((reportId) => ({
            reportId,
            approveStatus: 'REQUESTED',
          })),
        },
        requestFiles: {
          create: data.files.map((file) => ({
            filePath: file.filePath,
            fileName: file.fileName,
            fileType: file.fileType,
            fileSize: file.fileSize,
            createdBy: data.userId,
          })),
        },
      },
      include: {
        requestReports: {
          include: {
            report: true,
          },
        },
        requestFiles: true,
      },
    });

    revalidatePath('/app/my-reports');
    revalidatePath('/app/approver');
    revalidatePath('/app/report-catalog');

    return { success: true, data: request };
  } catch (error: any) {
    console.error('Create report request error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a new report request (user requesting a brand new report)
 */
export async function createNewReportRequest(data: {
  userId: string;
  title: string;
  detail: string;
  reportTypeId: string;
  name: string;
  unit: string;
  email: string;
  tel: string;
  datasetIds: string[];
  designFiles: { filePath: string; fileName: string; fileType: string; fileSize: number }[];
  evidenceFiles: { filePath: string; fileName: string; fileType: string; fileSize: number }[];
}) {
  try {
    const request = await prisma.request.create({
      data: {
        requestedBy: data.userId,
        name: data.name,
        unit: data.unit,
        email: data.email,
        tel: data.tel,
        detail: data.detail,
        createdBy: data.userId,
        requestReports: {
          create: {
            reportId: null, // null means new report request
            isNewReport: true, // Flag to indicate this is a new report request
            title: data.title,
            detail: data.detail,
            reportTypeId: data.reportTypeId,
            approveStatus: 'REQUESTED',
            selectedDatasets: {
              create: data.datasetIds.map((datasetId) => ({
                datasetId,
              })),
            },
            designFiles: {
              create: data.designFiles.map((file) => ({
                filePath: file.filePath,
                fileName: file.fileName,
                fileType: file.fileType,
                fileSize: file.fileSize,
                createdBy: data.userId,
              })),
            },
          },
        },
        requestFiles: {
          create: data.evidenceFiles.map((file) => ({
            filePath: file.filePath,
            fileName: file.fileName,
            fileType: file.fileType,
            fileSize: file.fileSize,
            createdBy: data.userId,
          })),
        },
      },
    });

    revalidatePath('/app/my-reports');
    revalidatePath('/app/approver');
    revalidatePath('/app/report-catalog');

    return { success: true, data: request };
  } catch (error: any) {
    console.error('Create new report request error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update request report status
 */
export async function updateRequestReportStatus(
  requestReportIds: string[],
  status: ApproveStatus,
  comment: string,
  userId: string
) {
  try {
    await prisma.requestReport.updateMany({
      where: {
        id: { in: requestReportIds },
      },
      data: {
        approveStatus: status,
        approvedBy: userId,
        approvedAt: new Date(),
        comment,
      },
    });

    revalidatePath('/app/approver');
    revalidatePath('/app/my-reports');

    return { success: true };
  } catch (error: any) {
    console.error('Update request report status error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Approve new report request and create report
 */
export async function approveNewReportRequest(
  requestReportId: string,
  reportData: {
    name: string;
    detail?: string;
    typeId: string;
    url?: string;
    unitOwnerIds: string[]; // m:m unit owners (involved units)
    categoryId: string;
    categoryIds: string[];
    datasetIds: string[];
    securityLevel?: string;
    files: { filePath: string; fileName: string; fileType: string; fileSize: number }[];
  },
  approvalStatus: 'PENDING' | 'INPROGRESS' | 'APPROVED' | 'DISAPPROVED',
  comment: string,
  userId: string,
  approvalFiles?: { filePath: string; fileName: string; fileSize: number }[]
) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Get current request report to check if report already exists
      const requestReport = await tx.requestReport.findUnique({
        where: { id: requestReportId },
      });

      if (!requestReport) {
        throw new Error('Request report not found');
      }

      let report = null;

      // Determine is_active based on approval status
      const isActive = approvalStatus === 'APPROVED';

      // Always create/update report (regardless of status)
      if (requestReport.reportId) {
        // UPDATE existing report
        report = await tx.report.update({
          where: { id: requestReport.reportId },
          data: {
            name: reportData.name,
            detail: reportData.detail,
            typeId: reportData.typeId,
            url: reportData.url,
            categoryId: reportData.categoryId,
            securityLevel: reportData.securityLevel,
            isActive, // Update is_active based on approval status
            updatedBy: userId,
            // Delete and recreate relations
            unitOwners: {
              deleteMany: {},
              create: reportData.unitOwnerIds.map((unitOwnerId) => ({
                unitOwnerId,
              })),
            },
            categories: {
              deleteMany: {},
              create: reportData.categoryIds.map((categoryId) => ({
                categoryId,
              })),
            },
            datasets: {
              deleteMany: {},
              create: reportData.datasetIds.map((datasetId) => ({
                datasetId,
              })),
            },
            // Add new files (don't delete existing ones)
            files: {
              create: reportData.files.map((file) => ({
                filePath: file.filePath,
                fileName: file.fileName,
                fileType: file.fileType,
                fileSize: file.fileSize,
                createdBy: userId,
              })),
            },
          },
        });
      } else {
        // CREATE new report
        report = await tx.report.create({
          data: {
            name: reportData.name,
            detail: reportData.detail,
            typeId: reportData.typeId,
            url: reportData.url,
            categoryId: reportData.categoryId,
            securityLevel: reportData.securityLevel,
            isActive, // Set is_active based on approval status
            createdBy: userId,
            updatedBy: userId,
            unitOwners: {
              create: reportData.unitOwnerIds.map((unitOwnerId) => ({
                unitOwnerId,
              })),
            },
            categories: {
              create: reportData.categoryIds.map((categoryId) => ({
                categoryId,
              })),
            },
            datasets: {
              create: reportData.datasetIds.map((datasetId) => ({
                datasetId,
              })),
            },
            files: {
              create: reportData.files.map((file) => ({
                filePath: file.filePath,
                fileName: file.fileName,
                fileType: file.fileType,
                fileSize: file.fileSize,
                createdBy: userId,
              })),
            },
          },
        });
      }

      // Update request report status
      await tx.requestReport.update({
        where: { id: requestReportId },
        data: {
          reportId: report?.id || requestReport.reportId,
          approveStatus: approvalStatus,
          approvedBy: userId,
          approvedAt: new Date(),
          comment,
        },
      });

      // Add approval files if any
      if (approvalFiles && approvalFiles.length > 0) {
        await tx.requestReportApprovalFile.createMany({
          data: approvalFiles.map((file) => ({
            requestReportId,
            filePath: file.filePath,
            fileName: file.fileName,
            fileType: '',
            fileSize: file.fileSize,
            createdBy: userId,
          })),
        });
      }

      return report;
    });

    revalidatePath('/app/approver');
    revalidatePath('/app/my-reports');
    revalidatePath('/app/report-catalog');
    revalidatePath('/app/admin');

    return { success: true, data: result };
  } catch (error: any) {
    console.error('Approve new report request error:', error);
    return { success: false, error: error.message };
  }
}
