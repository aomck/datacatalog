"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { UnitOwner, Category, Dataset, PaginatedResult } from "@/types";

// ============================================================================
// Public Catalog Actions (ทุกคนเข้าถึงได้)
// ============================================================================

/**
 * Get all unit owners for catalog browsing
 */
export async function getCatalogUnitOwners(
  page = 1,
  limit = 30,
): Promise<PaginatedResult<UnitOwner>> {
  try {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.unitOwner.findMany({
        where: { deletedAt: null },
        include: {
          _count: {
            select: { datasets: { where: { deletedAt: null } } },
          },
        },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.unitOwner.count({
        where: { deletedAt: null },
      }),
    ]);

    // Count security levels efficiently using raw query
    // Only run if there are unit owners to query
    let securityCounts: Array<{
      unit_owner_id: string;
      security_level: string;
      count: bigint;
    }> = [];

    if (data.length > 0) {
      const unitOwnerIds = data.map(u => u.id);
      securityCounts = await prisma.$queryRaw`
        SELECT
          unit_owner_id,
          CASE
            WHEN security_level IN ('0', '1') THEN '0'
            ELSE security_level
          END as security_level,
          COUNT(*)::bigint as count
        FROM datasets
        WHERE "deletedAt" IS NULL
          AND unit_owner_id IN (${Prisma.join(unitOwnerIds)})
        GROUP BY unit_owner_id,
          CASE
            WHEN security_level IN ('0', '1') THEN '0'
            ELSE security_level
          END
      `;
    }

    // Map counts to unit owners
    const dataWithCounts = data.map((unitOwner: any) => {
      const counts = { open: 0, secret: 0, verySecret: 0, topSecret: 0 };
      const unitCounts = securityCounts.filter(sc => sc.unit_owner_id === unitOwner.id);

      unitCounts.forEach(sc => {
        const count = Number(sc.count);
        if (sc.security_level === '0') counts.open = count;
        else if (sc.security_level === '2') counts.secret = count;
        else if (sc.security_level === '3') counts.verySecret = count;
        else if (sc.security_level === '4') counts.topSecret = count;
      });

      return { ...unitOwner, _securityCounts: counts };
    });

    return {
      data: dataWithCounts as UnitOwner[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    console.error("Get catalog unit owners error:", error);
    throw error;
  }
}

/**
 * Get all categories for catalog browsing
 */
export async function getCatalogCategories(
  page = 1,
  limit = 30,
): Promise<PaginatedResult<Category>> {
  try {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.category.findMany({
        where: { deletedAt: null },
        include: {
          _count: {
            select: {
              datasetCategories: {
                where: { dataset: { deletedAt: null } }
              }
            },
          },
        },
        orderBy: { order: "asc" },
        skip,
        take: limit,
      }),
      prisma.category.count({
        where: { deletedAt: null },
      }),
    ]);

    // Count security levels efficiently using raw query
    // Only run if there are categories to query
    let securityCounts: Array<{
      category_id: string;
      security_level: string;
      count: bigint;
    }> = [];

    if (data.length > 0) {
      const categoryIds = data.map(c => c.id);
      securityCounts = await prisma.$queryRaw`
        SELECT
          dc.category_id,
          CASE
            WHEN d.security_level IN ('0', '1') THEN '0'
            ELSE d.security_level
          END as security_level,
          COUNT(*)::bigint as count
        FROM dataset_categories dc
        INNER JOIN datasets d ON dc.dataset_id = d.id
        WHERE d."deletedAt" IS NULL
          AND dc.category_id IN (${Prisma.join(categoryIds)})
        GROUP BY dc.category_id,
          CASE
            WHEN d.security_level IN ('0', '1') THEN '0'
            ELSE d.security_level
          END
      `;
    }

    // Map counts to categories
    const dataWithCounts = data.map((category: any) => {
      const counts = { open: 0, secret: 0, verySecret: 0, topSecret: 0 };
      const catCounts = securityCounts.filter(sc => sc.category_id === category.id);

      catCounts.forEach(sc => {
        const count = Number(sc.count);
        if (sc.security_level === '0') counts.open = count;
        else if (sc.security_level === '2') counts.secret = count;
        else if (sc.security_level === '3') counts.verySecret = count;
        else if (sc.security_level === '4') counts.topSecret = count;
      });

      return { ...category, _securityCounts: counts };
    });

    return {
      data: dataWithCounts as Category[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    console.error("Get catalog categories error:", error);
    throw error;
  }
}

/**
 * Get datasets by unit owner
 */
export async function getDatasetsByUnitOwner(
  unitOwnerId: string,
  page = 1,
  limit = 30,
): Promise<PaginatedResult<Dataset>> {
  try {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.dataset.findMany({
        where: {
          unitOwnerId,
          deletedAt: null,
        },
        include: {
          unitOwner: true,
          category: true,
          services: {
            where: { deletedAt: null },
            orderBy: { name: "asc" },
          },
        },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.dataset.count({
        where: {
          unitOwnerId,
          deletedAt: null,
        },
      }),
    ]);

    return {
      data: data as Dataset[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    console.error("Get datasets by unit owner error:", error);
    throw error;
  }
}

/**
 * Get datasets by category
 */
export async function getDatasetsByCategory(
  categoryId: string,
  page = 1,
  limit = 30,
): Promise<PaginatedResult<Dataset>> {
  try {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.dataset.findMany({
        where: {
          categoryId,
          deletedAt: null,
        },
        include: {
          unitOwner: true,
          category: true,
          services: {
            where: { deletedAt: null },
            orderBy: { name: "asc" },
          },
        },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.dataset.count({
        where: {
          categoryId,
          deletedAt: null,
        },
      }),
    ]);

    return {
      data: data as Dataset[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    console.error("Get datasets by category error:", error);
    throw error;
  }
}

/**
 * Check if user has already requested a dataset
 */
export async function hasRequestedDataset(
  userId: string,
  datasetId: string,
): Promise<boolean> {
  try {
    const count = await prisma.requestDataset.count({
      where: {
        dataset: { id: datasetId },
        request: {
          requestedBy: userId,
          deletedAt: null,
        },
      },
    });

    return count > 0;
  } catch (error: any) {
    console.error("Check requested dataset error:", error);
    return false;
  }
}

/**
 * Check if user has already requested a service
 */
export async function hasRequestedService(
  userId: string,
  serviceId: string,
): Promise<boolean> {
  try {
    const count = await prisma.requestService.count({
      where: {
        service: { id: serviceId },
        request: {
          requestedBy: userId,
          deletedAt: null,
        },
      },
    });

    return count > 0;
  } catch (error: any) {
    console.error("Check requested service error:", error);
    return false;
  }
}

/**
 * Check if user has approved access to a service
 */
export async function hasApprovedService(
  userId: string,
  serviceId: string,
): Promise<boolean> {
  try {
    const count = await prisma.requestService.count({
      where: {
        service: { id: serviceId },
        request: {
          requestedBy: userId,
          deletedAt: null,
        },
        approveStatus: "APPROVED",
      },
    });

    return count > 0;
  } catch (error: any) {
    console.error("Check approved service error:", error);
    return false;
  }
}

/**
 * Get user's requested datasets and services with request info (all statuses)
 */
export async function getUserApprovedItems(userId: string) {
  try {
    const [datasets, services, reports] = await Promise.all([
      prisma.requestDataset.findMany({
        where: {
          request: {
            requestedBy: userId,
            deletedAt: null,
          },
        },
        include: {
          dataset: {
            include: {
              unitOwner: true,
              category: true,
              type: true,
              services: {
                where: { deletedAt: null },
              },
            },
          },
          request: true,
          approver: true,
          approvalFiles: {
            orderBy: { createdAt: "desc" },
          },
        },
      }),
      prisma.requestService.findMany({
        where: {
          request: {
            requestedBy: userId,
            deletedAt: null,
          },
        },
        include: {
          service: {
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
          request: true,
          approver: true,
          approvalFiles: {
            orderBy: { createdAt: "desc" },
          },
        },
      }),
      prisma.requestReport.findMany({
        where: {
          request: {
            requestedBy: userId,
            deletedAt: null,
          },
        },
        include: {
          report: {
            include: {
              type: true,
              files: true,
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
            },
          },
          request: {
            include: {
              requestFiles: {
                orderBy: { createdAt: "desc" },
              },
            },
          },
          selectedDatasets: {
            include: {
              dataset: true,
            },
          },
          designFiles: {
            orderBy: { createdAt: "desc" },
          },
          approver: true,
          approvalFiles: {
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: {
          request: {
            createdAt: "desc",
          },
        },
      }),
    ]);

    return { datasets, services, reports };
  } catch (error: any) {
    console.error("Get user requested items error:", error);
    throw error;
  }
}

/**
 * Get user's request status for datasets/services
 */
export async function getUserRequestStatus(userId: string) {
  try {
    const [datasets, services] = await Promise.all([
      prisma.requestDataset.findMany({
        where: {
          request: {
            requestedBy: userId,
            deletedAt: null,
          },
        },
        select: {
          datasetId: true,
          approveStatus: true,
        },
      }),
      prisma.requestService.findMany({
        where: {
          request: {
            requestedBy: userId,
            deletedAt: null,
          },
        },
        select: {
          serviceId: true,
          approveStatus: true,
        },
      }),
    ]);

    return {
      datasets: datasets.reduce(
        (acc, item) => {
          acc[item.datasetId] = item.approveStatus;
          return acc;
        },
        {} as Record<string, string>,
      ),
      services: services.reduce(
        (acc, item) => {
          acc[item.serviceId] = item.approveStatus;
          return acc;
        },
        {} as Record<string, string>,
      ),
    };
  } catch (error: any) {
    console.error("Get user request status error:", error);
    return { datasets: {}, services: {} };
  }
}

/**
 * Get categories grouped by unit owner (for tab หน่วยงาน)
 * Updated to support m:m relation
 */
export async function getCategoriesByUnitOwner(
  unitOwnerId: string,
  page = 1,
  limit = 100,
): Promise<PaginatedResult<any>> {
  try {
    const skip = (page - 1) * limit;

    // Get all categories that have datasets from this unit owner (via m:m relation)
    const categories = await prisma.category.findMany({
      where: {
        deletedAt: null,
        datasetCategories: {
          some: {
            dataset: {
              unitOwnerId,
              deletedAt: null,
            },
          },
        },
      },
      include: {
        datasetCategories: {
          where: {
            dataset: {
              unitOwnerId,
              deletedAt: null,
            },
          },
          include: {
            dataset: {
              include: {
                categories: {
                  include: {
                    category: true,
                  },
                },
                services: {
                  where: { deletedAt: null },
                  orderBy: { name: "asc" },
                },
              },
            },
          },
        },
      },
      orderBy: { order: "asc" },
      skip,
      take: limit,
    });

    // Transform to match expected structure
    const transformedCategories = categories.map((cat: any) => ({
      ...cat,
      datasets: cat.datasetCategories.map((dc: any) => dc.dataset),
    }));

    const total = await prisma.category.count({
      where: {
        deletedAt: null,
        datasetCategories: {
          some: {
            dataset: {
              unitOwnerId,
              deletedAt: null,
            },
          },
        },
      },
    });

    return {
      data: transformedCategories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    console.error("Get categories by unit owner error:", error);
    throw error;
  }
}

/**
 * Get unit owners grouped by category (for tab นโยบายและแผนความมั่นคง)
 * Updated to support m:m relation
 */
export async function getUnitOwnersByCategory(
  categoryId: string,
  page = 1,
  limit = 100,
): Promise<PaginatedResult<any>> {
  try {
    const skip = (page - 1) * limit;

    // Get all unit owners that have datasets in this category (via m:m relation)
    const unitOwners = await prisma.unitOwner.findMany({
      where: {
        deletedAt: null,
        datasets: {
          some: {
            deletedAt: null,
            categories: {
              some: {
                categoryId,
              },
            },
          },
        },
      },
      include: {
        datasets: {
          where: {
            deletedAt: null,
            categories: {
              some: {
                categoryId,
              },
            },
          },
          include: {
            categories: {
              include: {
                category: true,
              },
            },
            services: {
              where: { deletedAt: null },
              orderBy: { name: "asc" },
            },
          },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
      skip,
      take: limit,
    });

    const total = await prisma.unitOwner.count({
      where: {
        deletedAt: null,
        datasets: {
          some: {
            deletedAt: null,
            categories: {
              some: {
                categoryId,
              },
            },
          },
        },
      },
    });

    return {
      data: unitOwners,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    console.error("Get unit owners by category error:", error);
    throw error;
  }
}
