'use server';

import { prisma } from '@/lib/prisma';

export interface RecentLogsFilters {
  startDate: string;
  endDate: string;
  serviceId?: string;
  datasetId?: string;
  unitOwnerId?: string;
  userId?: string;
  page?: number;
  pageSize?: number;
}

export interface RecentLogsResult {
  logs: Array<{
    id: string;
    createdAt: string;
    userId: string;
    requestIp: string;
    userAgent: string;
    service: {
      id: string;
      name: string;
      method: string;
      dataset: {
        id: string;
        name: string;
        unitOwner: {
          id: string;
          name: string;
          shortName: string;
        };
      };
    };
  }>;
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

/**
 * Get recent service usage logs with pagination and filters
 */
export async function getRecentLogs(filters: RecentLogsFilters): Promise<RecentLogsResult> {
  try {
    const {
      startDate,
      endDate,
      serviceId,
      datasetId,
      unitOwnerId,
      userId,
      page = 1,
      pageSize = 20,
    } = filters;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Build where clause
    const whereClause: any = {
      createdAt: {
        gte: start,
        lte: end,
      },
    };

    if (serviceId) {
      whereClause.serviceId = serviceId;
    }

    if (userId) {
      whereClause.userId = userId;
    }

    if (datasetId || unitOwnerId) {
      whereClause.service = {};

      if (datasetId) {
        whereClause.service.datasetId = datasetId;
      }

      if (unitOwnerId) {
        whereClause.service.dataset = {
          unitOwnerId: unitOwnerId,
        };
      }
    }

    // Get total count
    const total = await prisma.userServiceLog.count({
      where: whereClause,
    });

    // Calculate pagination
    const totalPages = Math.ceil(total / pageSize);
    const skip = (page - 1) * pageSize;

    // Get logs
    const logsData = await prisma.userServiceLog.findMany({
      where: whereClause,
      select: {
        id: true,
        createdAt: true,
        requestIp: true,
        userAgent: true,
        userId: true,
        service: {
          select: {
            id: true,
            name: true,
            method: true,
            dataset: {
              select: {
                id: true,
                name: true,
                unitOwner: {
                  select: {
                    id: true,
                    name: true,
                    shortName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: pageSize,
    });

    // Convert dates to ISO strings for serialization
    const logs = logsData.map((log) => ({
      ...log,
      createdAt: log.createdAt.toISOString(),
      requestIp: log.requestIp || '',
      userAgent: log.userAgent || '',
    }));

    return {
      logs,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
      },
    };
  } catch (error) {
    console.error('Recent logs error:', error);
    throw new Error('Failed to fetch recent logs');
  }
}

/**
 * Get filter options for dropdown
 */
export async function getLogFilterOptions(startDate: string, endDate: string) {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const whereClause = {
      createdAt: {
        gte: start,
        lte: end,
      },
    };

    // Get unique services
    const services = await prisma.userServiceLog.findMany({
      where: whereClause,
      select: {
        service: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      distinct: ['serviceId'],
      take: 100,
    });

    // Get unique datasets
    const datasets = await prisma.userServiceLog.findMany({
      where: whereClause,
      select: {
        service: {
          select: {
            dataset: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      distinct: ['serviceId'],
      take: 100,
    });

    // Get unique unit owners
    const unitOwners = await prisma.userServiceLog.findMany({
      where: whereClause,
      select: {
        service: {
          select: {
            dataset: {
              select: {
                unitOwner: {
                  select: {
                    id: true,
                    name: true,
                    shortName: true,
                  },
                },
              },
            },
          },
        },
      },
      distinct: ['serviceId'],
      take: 100,
    });

    // Get unique users
    const users = await prisma.userServiceLog.findMany({
      where: whereClause,
      select: {
        userId: true,
      },
      distinct: ['userId'],
      take: 100,
    });

    // Deduplicate datasets and unit owners
    const uniqueDatasets = Array.from(
      new Map(
        datasets.map((d) => [d.service.dataset.id, d.service.dataset])
      ).values()
    );

    const uniqueUnitOwners = Array.from(
      new Map(
        unitOwners.map((u) => [
          u.service.dataset.unitOwner.id,
          u.service.dataset.unitOwner,
        ])
      ).values()
    );

    return {
      services: services.map((s) => s.service),
      datasets: uniqueDatasets,
      unitOwners: uniqueUnitOwners,
      users: users.map((u) => ({ userId: u.userId })),
    };
  } catch (error) {
    console.error('Filter options error:', error);
    throw new Error('Failed to fetch filter options');
  }
}
