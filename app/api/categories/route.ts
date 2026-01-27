import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import axios from 'axios';

const CORE_API_URL = process.env.CORE_API_URL || 'https://isoc360-core.isoc.go.th/user-api';

/**
 * GET /api/categories
 *
 * Headers:
 * - Authorization: Bearer <token>
 *
 * Query Parameters:
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const skip = (page - 1) * limit;

    // Get categories
    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where: {
          deletedAt: null,
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.category.count({
        where: {
          deletedAt: null,
        },
      }),
    ]);

    const response = NextResponse.json({
      success: true,
      data: categories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;
  } catch (error: any) {
    console.error('Categories API error:', error);
    const errorResponse = NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error.message,
      },
      { status: 500 }
    );

    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return errorResponse;
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}
