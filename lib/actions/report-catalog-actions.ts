'use server';

import { prisma } from '@/lib/prisma';
import type { Report, UnitOwner, Category, PaginatedResult } from '@/types';

// ============================================================================
// Report Catalog Actions (Public - ทุกคนเข้าถึงได้)
// ============================================================================

/**
 * Get all unit owners for report catalog browsing with report count
 */
export async function getReportCatalogUnitOwners(
  page = 1,
  limit = 30
): Promise<PaginatedResult<UnitOwner>> {
  try {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.unitOwner.findMany({
        where: { deletedAt: null },
        include: {
          reportUnits: {
            where: { report: { deletedAt: null } },
            include: {
              report: {
                include: {
                  type: true,
                },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.unitOwner.count({
        where: { deletedAt: null },
      }),
    ]);

    // Calculate report counts by type
    const unitOwnersWithCounts = data.map((unitOwner: any) => {
      const reportCounts = {
        document: 0,
        infographic: 0,
        dashboard: 0,
      };

      unitOwner.reportUnits.forEach((ru: any) => {
        const typeName = ru.report?.type?.name;
        if (typeName === 'document') reportCounts.document++;
        else if (typeName === 'infographic') reportCounts.infographic++;
        else if (typeName === 'dashboard') reportCounts.dashboard++;
      });

      const { reportUnits, ...rest } = unitOwner;
      return {
        ...rest,
        reportCounts,
      };
    });

    return {
      data: unitOwnersWithCounts as UnitOwner[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    console.error('Get report catalog unit owners error:', error);
    throw error;
  }
}

/**
 * Get all categories for report catalog browsing with report count
 */
export async function getReportCatalogCategories(
  page = 1,
  limit = 30
): Promise<PaginatedResult<Category>> {
  try {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.category.findMany({
        where: { deletedAt: null },
        include: {
          reportCategories: {
            where: { report: { deletedAt: null } },
            include: {
              report: {
                include: {
                  type: true,
                },
              },
            },
          },
        },
        orderBy: { order: 'asc' },
        skip,
        take: limit,
      }),
      prisma.category.count({
        where: { deletedAt: null },
      }),
    ]);

    // Calculate report counts by type
    const categoriesWithCounts = data.map((category: any) => {
      const reportCounts = {
        document: 0,
        infographic: 0,
        dashboard: 0,
      };

      category.reportCategories.forEach((rc: any) => {
        const typeName = rc.report?.type?.name;
        if (typeName === 'document') reportCounts.document++;
        else if (typeName === 'infographic') reportCounts.infographic++;
        else if (typeName === 'dashboard') reportCounts.dashboard++;
      });

      const { reportCategories, ...rest } = category;
      return {
        ...rest,
        reportCounts,
      };
    });

    return {
      data: categoriesWithCounts as Category[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    console.error('Get report catalog categories error:', error);
    throw error;
  }
}

/**
 * Get reports by unit owner
 */
export async function getReportsByUnitOwner(
  unitOwnerId: string,
  page = 1,
  limit = 30
): Promise<PaginatedResult<Report>> {
  try {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.report.findMany({
        where: {
          unitOwners: {
            some: {
              unitOwnerId,
            },
          },
          deletedAt: null,
        },
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
          files: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.report.count({
        where: {
          unitOwners: {
            some: {
              unitOwnerId,
            },
          },
          deletedAt: null,
        },
      }),
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
    console.error('Get reports by unit owner error:', error);
    throw error;
  }
}

/**
 * Get reports by category
 */
export async function getReportsByCategory(
  categoryId: string,
  page = 1,
  limit = 30
): Promise<PaginatedResult<Report>> {
  try {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.report.findMany({
        where: {
          categories: {
            some: {
              categoryId,
            },
          },
          deletedAt: null,
        },
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
          files: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.report.count({
        where: {
          categories: {
            some: {
              categoryId,
            },
          },
          deletedAt: null,
        },
      }),
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
    console.error('Get reports by category error:', error);
    throw error;
  }
}

/**
 * Search reports
 */
export async function searchReports(
  searchTerm: string,
  page = 1,
  limit = 30,
  filters?: {
    typeId?: string;
    unitOwnerId?: string;
    categoryId?: string;
  }
): Promise<PaginatedResult<Report>> {
  try {
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { detail: { contains: searchTerm, mode: 'insensitive' } },
      ],
    };

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
          files: true,
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
    console.error('Search reports error:', error);
    throw error;
  }
}

/**
 * Get report by ID for catalog view
 */
export async function getReportForCatalog(id: string) {
  try {
    const report = await prisma.report.findUnique({
      where: {
        id,
        deletedAt: null,
      },
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
                type: true,
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
    console.error('Get report for catalog error:', error);
    throw error;
  }
}
