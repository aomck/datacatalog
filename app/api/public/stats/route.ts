import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Public API - Statistics
 * GET /api/public/stats
 *
 * Response:
 * {
 *   unitOwnerCount: number,
 *   openDatasetCount: number
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Count unit owners (not deleted)
    const unitOwnerCount = await prisma.unitOwner.count({
      where: {
        deletedAt: null,
      },
    });

    // Count datasets with type OPEN (not deleted)
    const openDatasetCount = await prisma.dataset.count({
      where: {
        deletedAt: null,
        type: {
          OR: [
            { shortName: 'OPEN' },
            { name: 'OPEN' },
          ],
        },
      },
    });

    return NextResponse.json(
      {
        unitOwnerCount,
        openDatasetCount,
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Public stats API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
