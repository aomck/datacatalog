import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Service Usage Analytics API
 * GET /api/analytics/service-usage
 *
 * Query Parameters:
 * - startDate: ISO date string (default: 30 days ago)
 * - endDate: ISO date string (default: now)
 * - serviceId: filter by specific service
 * - datasetId: filter by specific dataset
 *
 * Response:
 * {
 *   totalRequests: number,
 *   uniqueUsers: number,
 *   dailyUsage: Array<{date: string, count: number}>,
 *   topServices: Array<{serviceId, serviceName, datasetName, count}>,
 *   topDatasets: Array<{datasetId, datasetName, count}>,
 *   topUsers: Array<{userId, count}>,
 *   recentLogs: Array<{...}>
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Date range - default to last 30 days
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : new Date();
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const serviceId = searchParams.get('serviceId');
    const datasetId = searchParams.get('datasetId');

    // Build where clause
    const whereClause: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
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

    // Daily usage (group by date)
    const logs = await prisma.userServiceLog.findMany({
      where: whereClause,
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by date
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
      serviceUsage.map(async (item) => {
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
    const datasetUsageMap = new Map<string, { name: string; unitOwner: any; count: number }>();
    topServicesData.forEach((service) => {
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

    const topUsers = userUsage.map((item) => ({
      userId: item.userId,
      count: item._count.userId,
    }));

    // Recent logs (last 100)
    const recentLogs = await prisma.userServiceLog.findMany({
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
    logs.forEach((log) => {
      const hour = log.createdAt.getHours();
      hourlyDistribution[hour]++;
    });

    const hourlyUsage = hourlyDistribution.map((count, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      count,
    }));

    // Day of week distribution
    const dayOfWeekDistribution = new Array(7).fill(0);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    logs.forEach((log) => {
      const day = log.createdAt.getDay();
      dayOfWeekDistribution[day]++;
    });

    const weekdayUsage = dayOfWeekDistribution.map((count, day) => ({
      day: dayNames[day],
      count,
    }));

    return NextResponse.json(
      {
        summary: {
          totalRequests,
          uniqueUsers,
          dateRange: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
          },
        },
        dailyUsage,
        hourlyUsage,
        weekdayUsage,
        topServices: topServicesData,
        topDatasets,
        topUsers,
        recentLogs,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Service usage analytics error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
