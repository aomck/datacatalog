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
          create: data.datasetIds.map((datasetId) => ({
            datasetId,
            approveStatus: 'REQUESTED',
          })),
        },
        requestServices: {
          create: data.serviceIds.map((serviceId) => ({
            serviceId,
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
        requestDatasets: {
          include: { dataset: true },
        },
        requestServices: {
          include: { service: true },
        },
        requestFiles: true,
      },
    });

    revalidatePath('/app/my-catalog');
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
  status: ApproveStatus,
  comment: string,
  userId: string
) {
  try {
    await prisma.$transaction([
      prisma.requestDataset.updateMany({
        where: {
          id: { in: datasetIds },
        },
        data: {
          approveStatus: status,
          approvedBy: userId,
          approvedAt: new Date(),
          comment,
        },
      }),
      prisma.requestService.updateMany({
        where: {
          id: { in: serviceIds },
        },
        data: {
          approveStatus: status,
          approvedBy: userId,
          approvedAt: new Date(),
          comment,
        },
      }),
    ]);

    revalidatePath('/app/approver');
    revalidatePath('/app/my-catalog');

    return { success: true };
  } catch (error: any) {
    console.error('Bulk update request status error:', error);
    return { success: false, error: error.message };
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
