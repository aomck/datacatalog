'use server';

import { prisma } from '@/lib/prisma';

export interface ServiceUsageAnalytics {
  summary: {
    totalRequests: number;
    uniqueUsers: number;
    dateRange: {
      start: string;
      end: string;
    };
  };
  dailyUsage: Array<{ date: string; count: number }>;
  hourlyUsage: Array<{ hour: string; count: number }>;
  weekdayUsage: Array<{ day: string; count: number }>;
  topServices: Array<{
    serviceId: string;
    serviceName: string;
    datasetId: string;
    datasetName: string;
    unitOwnerId: string;
    unitOwnerName: string;
    unitOwnerShortName: string;
    count: number;
  }>;
  topDatasets: Array<{
    datasetId: string;
    datasetName: string;
    unitOwner: {
      id: string;
      name: string;
      shortName: string;
    };
    count: number;
  }>;
  topUsers: Array<{
    userId: string;
    count: number;
  }>;
  topUnitOwners: Array<{
    unitOwnerId: string;
    unitOwnerName: string;
    unitOwnerShortName: string;
    count: number;
  }>;
  recentLogs: Array<{
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
}

/**
 * Get service usage analytics
 * @param startDate - Start date for the analytics (ISO string)
 * @param endDate - End date for the analytics (ISO string)
 * @param serviceId - Optional filter by service ID
 * @param datasetId - Optional filter by dataset ID
 */
export async function getServiceUsageAnalytics(
  startDate: string,
  endDate: string,
  serviceId?: string,
  datasetId?: string
): Promise<ServiceUsageAnalytics> {
  try {
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

    if (datasetId) {
      whereClause.service = {
        datasetId: datasetId,
      };
    }

    // Total requests
    const totalRequests = await prisma.userServiceLog.count({
      where: whereClause,
    });

    // Unique users
    const uniqueUsersResult = await prisma.userServiceLog.findMany({
      where: whereClause,
      select: { userId: true },
      distinct: ['userId'],
    });
    const uniqueUsers = uniqueUsersResult.length;

    // Get all logs for processing
    const logs = await prisma.userServiceLog.findMany({
      where: whereClause,
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by date for daily usage
    const dailyUsageMap = new Map<string, number>();
    logs.forEach((log: { createdAt: Date }) => {
      const date = log.createdAt.toISOString().split('T')[0];
      dailyUsageMap.set(date, (dailyUsageMap.get(date) || 0) + 1);
    });

    const dailyUsage = Array.from(dailyUsageMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top services
    const serviceUsage = await prisma.userServiceLog.groupBy({
      by: ['serviceId'],
      where: whereClause,
      _count: {
        serviceId: true,
      },
      orderBy: {
        _count: {
          serviceId: 'desc',
        },
      },
      take: 10,
    });

    const topServicesData = await Promise.all(
      serviceUsage.map(async (item: { serviceId: string; _count: { serviceId: number } }) => {
        const service = await prisma.service.findUnique({
          where: { id: item.serviceId },
          select: {
            id: true,
            name: true,
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
        });

        return {
          serviceId: item.serviceId,
          serviceName: service?.name || 'Unknown',
          datasetId: service?.dataset.id || '',
          datasetName: service?.dataset.name || 'Unknown',
          unitOwnerId: service?.dataset.unitOwner.id || '',
          unitOwnerName: service?.dataset.unitOwner.name || 'Unknown',
          unitOwnerShortName: service?.dataset.unitOwner.shortName || 'Unknown',
          count: item._count.serviceId,
        };
      })
    );

    // Top datasets (aggregate from services)
    const datasetUsageMap = new Map<
      string,
      { name: string; unitOwner: any; count: number }
    >();
    topServicesData.forEach((service: { datasetId: string; datasetName: string; unitOwnerId: string; unitOwnerName: string; unitOwnerShortName: string; count: number }) => {
      const existing = datasetUsageMap.get(service.datasetId);
      if (existing) {
        existing.count += service.count;
      } else {
        datasetUsageMap.set(service.datasetId, {
          name: service.datasetName,
          unitOwner: {
            id: service.unitOwnerId,
            name: service.unitOwnerName,
            shortName: service.unitOwnerShortName,
          },
          count: service.count,
        });
      }
    });

    const topDatasets = Array.from(datasetUsageMap.entries())
      .map(([datasetId, data]) => ({
        datasetId,
        datasetName: data.name,
        unitOwner: data.unitOwner,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top users
    const userUsage = await prisma.userServiceLog.groupBy({
      by: ['userId'],
      where: whereClause,
      _count: {
        userId: true,
      },
      orderBy: {
        _count: {
          userId: 'desc',
        },
      },
      take: 10,
    });

    const topUsers = userUsage.map((item: { userId: string; _count: { userId: number } }) => ({
      userId: item.userId,
      count: item._count.userId,
    }));

    // Top unit owners (aggregate from services)
    const unitOwnerUsageMap = new Map<
      string,
      { name: string; shortName: string; count: number }
    >();
    topServicesData.forEach((service: { unitOwnerId: string; unitOwnerName: string; unitOwnerShortName: string; count: number }) => {
      const existing = unitOwnerUsageMap.get(service.unitOwnerId);
      if (existing) {
        existing.count += service.count;
      } else {
        unitOwnerUsageMap.set(service.unitOwnerId, {
          name: service.unitOwnerName,
          shortName: service.unitOwnerShortName,
          count: service.count,
        });
      }
    });

    const topUnitOwners = Array.from(unitOwnerUsageMap.entries())
      .map(([unitOwnerId, data]) => ({
        unitOwnerId,
        unitOwnerName: data.name,
        unitOwnerShortName: data.shortName,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Recent logs (last 100)
    const recentLogsData = await prisma.userServiceLog.findMany({
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
      take: 100,
    });

    // Hourly distribution (for heatmap)
    const hourlyDistribution = new Array(24).fill(0);
    logs.forEach((log: { createdAt: Date }) => {
      const hour = log.createdAt.getHours();
      hourlyDistribution[hour]++;
    });

    const hourlyUsage = hourlyDistribution.map((count, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      count,
    }));

    // Day of week distribution
    const dayOfWeekDistribution = new Array(7).fill(0);
    const dayNames = [
      'อาทิตย์',
      'จันทร์',
      'อังคาร',
      'พุธ',
      'พฤหัสบดี',
      'ศุกร์',
      'เสาร์',
    ];
    logs.forEach((log: { createdAt: Date }) => {
      const day = log.createdAt.getDay();
      dayOfWeekDistribution[day]++;
    });

    const weekdayUsage = dayOfWeekDistribution.map((count, day) => ({
      day: dayNames[day],
      count,
    }));

    // Convert dates to ISO strings for serialization
    const recentLogs = recentLogsData.map((log: any) => ({
      ...log,
      createdAt: log.createdAt.toISOString(),
      requestIp: log.requestIp || '',
      userAgent: log.userAgent || '',
    }));

    return {
      summary: {
        totalRequests,
        uniqueUsers,
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      },
      dailyUsage,
      hourlyUsage,
      weekdayUsage,
      topServices: topServicesData,
      topDatasets,
      topUsers,
      topUnitOwners,
      recentLogs,
    };
  } catch (error) {
    console.error('Service usage analytics error:', error);
    throw new Error('Failed to fetch service usage analytics');
  }
}
