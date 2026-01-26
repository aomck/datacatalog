import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import axios from 'axios';

const CORE_API_URL = process.env.CORE_API_URL || 'https://isoc360-core.isoc.go.th/user-api';

/**
 * GET /api/datasets
 *
 * Headers:
 * - Authorization: Bearer <token>
 *
 * Query Parameters:
 * - unitOwnerId: string (optional)
 * - categoryId: string (optional)
 * - typeId: string (optional)
 * - securityLevel: 0|1|2|3|4 (optional)
 * - page: number (default: 1)
 * - limit: number (default: 10, max: 100)
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from headers
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing or invalid Authorization header',
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify token with Core API
    try {
      const verifyResponse = await axios.get(`${CORE_API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (verifyResponse.data.status !== 200 || !verifyResponse.data.data) {
        return NextResponse.json(
          {
            success: false,
            message: 'Unauthorized',
          },
          { status: 401 }
        );
      }
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid or expired token',
        },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = request.nextUrl;
    const unitOwnerId = searchParams.get('unitOwnerId') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;
    const typeId = searchParams.get('typeId') || undefined;
    const securityLevel = searchParams.get('securityLevel') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      deletedAt: null,
    };

    if (unitOwnerId) where.unitOwnerId = unitOwnerId;
    if (categoryId) where.categoryId = categoryId;
    if (typeId) where.typeId = typeId;
    if (securityLevel !== undefined) where.securityLevel = securityLevel;

    // Get datasets
    const [datasets, total] = await Promise.all([
      prisma.dataset.findMany({
        where,
        skip,
        take: limit,
        include: {
          unitOwner: true,
          category: true,
          type: true,
          services: {
            where: {
              deletedAt: null,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.dataset.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: datasets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Datasets API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
