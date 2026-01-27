import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Public API - Summary Statistics
 * GET /api/public/stats
 *
 * Query Parameters:
 * - unitOwnerId: string (optional) - Filter by unit owner ID
 * - categoryId: string (optional) - Filter by category ID
 * - datasetType: string (optional) - Filter by dataset type (shortName or name)
 * - startDate: string (optional) - Filter service usage from this date (ISO format)
 * - endDate: string (optional) - Filter service usage until this date (ISO format)
 *
 * Response:
 * {
 *   unitOwnerCount: number,
 *   datasetCount: number,
 *   serviceCount: number,
 *   serviceUsageCount: number
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const unitOwnerId = searchParams.get('unitOwnerId');
    const categoryId = searchParams.get('categoryId');
    const datasetType = searchParams.get('datasetType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build dataset filter - only show OPEN datasets for public API
    const datasetWhere: any = {
      deletedAt: null,
      type: {
        OR: [
          { shortName: 'OPEN' },
          { name: 'OPEN' },
        ],
      },
    };

    if (unitOwnerId) {
      datasetWhere.unitOwnerId = unitOwnerId;
    }

    if (categoryId) {
      datasetWhere.categoryId = categoryId;
    }

    // Note: datasetType parameter is ignored as we only show OPEN datasets

    // Build service usage filter
    const serviceUsageWhere: any = {};

    if (startDate || endDate) {
      serviceUsageWhere.createdAt = {};
      if (startDate) {
        serviceUsageWhere.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        serviceUsageWhere.createdAt.lte = new Date(endDate);
      }
    }

    // Count unit owners that have OPEN datasets
    let unitOwnerCount;
    if (unitOwnerId) {
      // If filtering by specific unit owner, check if it exists and has OPEN datasets
      unitOwnerCount = await prisma.unitOwner.count({
        where: {
          id: unitOwnerId,
          deletedAt: null,
          datasets: {
            some: datasetWhere,
          },
        },
      });
    } else {
      // Count all unit owners that have OPEN datasets
      unitOwnerCount = await prisma.unitOwner.count({
        where: {
          deletedAt: null,
          datasets: {
            some: datasetWhere,
          },
        },
      });
    }

    // Count datasets with filters
    const datasetCount = await prisma.dataset.count({
      where: datasetWhere,
    });

    // Count services related to filtered datasets
    const serviceWhere: any = {
      deletedAt: null,
    };

    // If there are dataset filters, apply them to services
    if (unitOwnerId || categoryId || datasetType) {
      serviceWhere.dataset = datasetWhere;
    }

    const serviceCount = await prisma.service.count({
      where: serviceWhere,
    });

    // Count service usage with date filters
    let serviceUsageCount;
    if (unitOwnerId || categoryId || datasetType) {
      // If filtering by dataset-related fields, count usage of services from those datasets
      serviceUsageCount = await prisma.userServiceLog.count({
        where: {
          ...serviceUsageWhere,
          service: {
            dataset: datasetWhere,
          },
        },
      });
    } else {
      // Otherwise just count with date filters
      serviceUsageCount = await prisma.userServiceLog.count({
        where: serviceUsageWhere,
      });
    }

    const response = NextResponse.json(
      {
        unitOwnerCount,
        datasetCount,
        serviceCount,
        serviceUsageCount,
      },
      { status: 200 }
    );
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;

  } catch (error: any) {
    console.error('Public stats API error:', error);
    const response = NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message,
      },
      { status: 500 }
    );
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}
