import { NextRequest, NextResponse } from 'next/server';

/**
 * Example API Endpoint for Testing
 * GET /api/example
 *
 * Headers:
 * - Authorization: Bearer <token>
 * - X-Service-Id: <service_id>
 *
 * Response:
 * {
 *   success: true,
 *   message: string,
 *   data: {...}
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Get token and service_id from headers
    const authHeader = request.headers.get('authorization');
    const serviceId = request.headers.get('x-service-id');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing or invalid Authorization header. Use: Authorization: Bearer <token>',
        },
        { status: 401 }
      );
    }

    if (!serviceId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing X-Service-Id header',
        },
        { status: 400 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Call verify-token API
    const baseUrl = request.nextUrl.origin;
    const verifyResponse = await fetch(`http://localhost:3000/datacatalog/api/verify-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: serviceId,
        token: token,
      }),
    });

    const verifyResult = await verifyResponse.json();

    // If not authorized, return the error
    if (!verifyResult.authorized) {
      return NextResponse.json(
        {
          success: false,
          message: verifyResult.message || 'Unauthorized',
          authorized: false,
        },
        { status: verifyResponse.status }
      );
    }

    // If authorized, return example data
    const response = NextResponse.json(
      {
        success: true,
        authorized: true,
        message: 'ยินดีต้อนรับ! การเรียกใช้ API สำเร็จ',
        user: {
          user_id: verifyResult.user_id,
          service_name: verifyResult.service_name,
        },
        data: {
          example: 'ตัวอย่างข้อมูล',
          items: [
            {
              id: 1,
              name: 'รายการที่ 1',
              description: 'รายละเอียดตัวอย่าง',
              value: 100,
              createdAt: new Date().toISOString(),
            },
            {
              id: 2,
              name: 'รายการที่ 2',
              description: 'รายละเอียดตัวอย่าง',
              value: 200,
              createdAt: new Date().toISOString(),
            },
            {
              id: 3,
              name: 'รายการที่ 3',
              description: 'รายละเอียดตัวอย่าง',
              value: 300,
              createdAt: new Date().toISOString(),
            },
          ],
          statistics: {
            total_items: 3,
            total_value: 600,
            average_value: 200,
          },
          metadata: {
            api_version: '1.0.0',
            response_time: new Date().toISOString(),
            server: 'Data Catalog API',
          },
        },
      },
      { status: 200 }
    );

    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Service-Id');

    return response;
  } catch (error: any) {
    console.error('Example API error:', error);
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
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Service-Id');

    return errorResponse;
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Service-Id');
  return response;
}
