'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { Report, ReportType, PaginatedResult } from '@/types';

// ============================================================================
// ReportType Actions
// ============================================================================

/**
 * Get all report types
 */
export async function getReportTypes() {
  try {
    const reportTypes = await prisma.reportType.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });

    return reportTypes as ReportType[];
  } catch (error: any) {
    console.error('Get report types error:', error);
    throw error;
  }
}

// ============================================================================
// Report CRUD Actions
// ============================================================================

/**
 * Get all reports with pagination and filters
 */
export async function getReports(
  page = 1,
  limit = 30,
  filters?: {
    search?: string;
    typeId?: string;
    unitOwnerId?: string;
    categoryId?: string;
  }
): Promise<PaginatedResult<Report>> {
  try {
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { detail: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.typeId) {
      where.typeId = filters.typeId;
    }

    if (filters?.unitOwnerId) {
      where.unitOwners = {
        some: {
          unitOwnerId: filters.unitOwnerId,
        },
      };
    }

    if (filters?.categoryId) {
      where.categories = {
        some: {
          categoryId: filters.categoryId,
        },
      };
    }

    const [data, total] = await Promise.all([
      prisma.report.findMany({
        where,
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
              dataset: {
                include: {
                  unitOwner: true,
                  category: true,
                },
              },
            },
          },
          files: {
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.report.count({ where }),
    ]);

    return {
      data: data as Report[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    console.error('Get reports error:', error);
    throw error;
  }
}

/**
 * Get a single report by ID
 */
export async function getReportById(id: string) {
  try {
    const report = await prisma.report.findUnique({
      where: { id },
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
            dataset: {
              include: {
                unitOwner: true,
                category: true,
              },
            },
          },
        },
        files: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return report as Report | null;
  } catch (error: any) {
    console.error('Get report by ID error:', error);
    throw error;
  }
}

/**
 * Create a new report
 */
export async function createReport(
  data: {
    name: string;
    detail?: string;
    typeId: string;
    url?: string;
    unitOwnerIds: string[]; // m:m unit owners (involved units)
    categoryId: string; // for backward compatibility
    categoryIds: string[]; // m:m categories
    datasetIds: string[]; // m:m datasets
    securityLevel?: string;
    files: { filePath: string; fileName: string; fileType: string; fileSize: number }[];
  },
  userId: string
) {
  try {
    const report = await prisma.report.create({
      data: {
        name: data.name,
        detail: data.detail,
        typeId: data.typeId,
        url: data.url,
        categoryId: data.categoryId,
        securityLevel: data.securityLevel,
        createdBy: userId,
        updatedBy: userId,
        unitOwners: {
          create: data.unitOwnerIds.map((unitOwnerId) => ({
            unitOwnerId,
          })),
        },
        categories: {
          create: data.categoryIds.map((categoryId) => ({
            categoryId,
          })),
        },
        datasets: {
          create: data.datasetIds.map((datasetId) => ({
            datasetId,
          })),
        },
        files: {
          create: data.files.map((file) => ({
            filePath: file.filePath,
            fileName: file.fileName,
            fileType: file.fileType,
            fileSize: file.fileSize,
            createdBy: userId,
          })),
        },
      },
      include: {
        type: true,
        unitOwners: {
          include: {
            unitOwner: true,
          },
        },
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
    });

    revalidatePath('/app/admin');
    revalidatePath('/app/report-catalog');

    return { success: true, data: report };
  } catch (error: any) {
    console.error('Create report error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update an existing report
 */
export async function updateReport(
  id: string,
  data: {
    name?: string;
    detail?: string;
    typeId?: string;
    url?: string;
    unitOwnerIds?: string[]; // m:m unit owners (involved units)
    categoryId?: string;
    categoryIds?: string[];
    datasetIds?: string[];
    securityLevel?: string;
    files?: { filePath: string; fileName: string; fileType: string; fileSize: number }[];
  },
  userId: string
) {
  try {
    // Start transaction
    const report = await prisma.$transaction(async (tx) => {
      // Update unit owners if provided
      if (data.unitOwnerIds !== undefined) {
        await tx.reportUnitOwner.deleteMany({
          where: { reportId: id },
        });
        await tx.reportUnitOwner.createMany({
          data: data.unitOwnerIds.map((unitOwnerId) => ({
            reportId: id,
            unitOwnerId,
          })),
        });
      }

      // Update categories if provided
      if (data.categoryIds !== undefined) {
        await tx.reportCategory.deleteMany({
          where: { reportId: id },
        });
        await tx.reportCategory.createMany({
          data: data.categoryIds.map((categoryId) => ({
            reportId: id,
            categoryId,
          })),
        });
      }

      // Update datasets if provided
      if (data.datasetIds !== undefined) {
        await tx.reportDataset.deleteMany({
          where: { reportId: id },
        });
        await tx.reportDataset.createMany({
          data: data.datasetIds.map((datasetId) => ({
            reportId: id,
            datasetId,
          })),
        });
      }

      // Add new files if provided
      if (data.files && data.files.length > 0) {
        await tx.reportFile.createMany({
          data: data.files.map((file) => ({
            reportId: id,
            filePath: file.filePath,
            fileName: file.fileName,
            fileType: file.fileType,
            fileSize: file.fileSize,
            createdBy: userId,
          })),
        });
      }

      // Update report
      return await tx.report.update({
        where: { id },
        data: {
          name: data.name,
          detail: data.detail,
          typeId: data.typeId,
          url: data.url,
          categoryId: data.categoryId,
          securityLevel: data.securityLevel,
          updatedBy: userId,
        },
        include: {
          type: true,
          unitOwners: {
            include: {
              unitOwner: true,
            },
          },
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
      });
    });

    revalidatePath('/app/admin');
    revalidatePath('/app/report-catalog');

    return { success: true, data: report };
  } catch (error: any) {
    console.error('Update report error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a report (soft delete)
 */
export async function deleteReport(id: string, userId: string) {
  try {
    await prisma.report.update({
      where: { id },
      data: {
        deletedBy: userId,
        deletedAt: new Date(),
      },
    });

    revalidatePath('/app/admin');
    revalidatePath('/app/report-catalog');

    return { success: true };
  } catch (error: any) {
    console.error('Delete report error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a report file
 */
export async function deleteReportFile(fileId: string) {
  try {
    await prisma.reportFile.delete({
      where: { id: fileId },
    });

    revalidatePath('/app/admin');

    return { success: true };
  } catch (error: any) {
    console.error('Delete report file error:', error);
    return { success: false, error: error.message };
  }
}
