import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * API Token Verification Endpoint
 * POST /api/verify-token
 *
 * Request body:
 * {
 *   service_id: string,
 *   token: string
 * }
 *
 * Response:
 * {
 *   authorized: boolean,
 *   user_id?: string,
 *   service_name?: string,
 *   message?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { service_id, token } = body;

    // Validate input
    if (!service_id || !token) {
      return NextResponse.json(
        {
          authorized: false,
          message: 'Missing service_id or token',
        },
        { status: 400 }
      );
    }

    // Find user by token
    const user = await prisma.user.findUnique({
      where: { token },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        {
          authorized: false,
          message: 'Invalid token',
        },
        { status: 401 }
      );
    }

    // Find service
    const service = await prisma.service.findUnique({
      where: { id: service_id },
      select: {
        id: true,
        name: true,
        deletedAt: true,
      },
    });

    if (!service || service.deletedAt) {
      return NextResponse.json(
        {
          authorized: false,
          message: 'Service not found',
        },
        { status: 404 }
      );
    }

    // Check if user has approved access to this service
    const approvedRequest = await prisma.requestService.findFirst({
      where: {
        serviceId: service_id,
        request: {
          requestedBy: user.id,
          deletedAt: null,
        },
        approveStatus: 'APPROVED',
      },
    });

    if (!approvedRequest) {
      return NextResponse.json(
        {
          authorized: false,
          user_id: user.id,
          service_name: service.name,
          message: 'User does not have approved access to this service',
        },
        { status: 403 }
      );
    }

    // Access granted
    return NextResponse.json(
      {
        authorized: true,
        user_id: user.id,
        service_name: service.name,
        message: 'Access granted',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      {
        authorized: false,
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
