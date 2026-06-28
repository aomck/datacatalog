import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import axios from "axios";

const CORE_API_URL =
  process.env.CORE_API_URL || "https://isoc360-core.isoc.go.th/user-api";

/**
 * GET /api/statistics
 *
 * Headers:
 * - Authorization: Bearer <token>
 *
 * Query Parameters:
 * - startDate: ISO date (optional, for access logs)
 * - endDate: ISO date (optional, for access logs)
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from headers
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing or invalid Authorization header",
        },
        { status: 401 },
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
            message: "Unauthorized",
          },
          { status: 401 },
        );
      }
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired token",
        },
        { status: 401 },
      );
    }

    // Get query parameters for date filtering
    const { searchParams } = request.nextUrl;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build date filter for access logs
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    // Get distinct dataset names first
    const distinctDatasets = await prisma.dataset.findMany({
      where: {
        deletedAt: null,
      },
      // distinct: ["name"],
      select: {
        id: true,
        name: true,
        typeId: true,
        securityLevel: true,
      },
    });

    // Extract distinct dataset IDs for further queries
    const distinctDatasetIds = distinctDatasets.map((d) => d.id);

    // Parallel queries for statistics
    const [totalServices, accessLogs] = await Promise.all([
      // Total active services
      prisma.service.count({
        where: {
          deletedAt: null,
        },
      }),
      // Access logs count (with optional date filter)
      prisma.userServiceLog.count({
        where:
          Object.keys(dateFilter).length > 0
            ? { createdAt: dateFilter }
            : undefined,
      }),
    ]);

    // Count datasets by type from distinct datasets
    const datasetsByTypeMap = new Map<string, number>();
    distinctDatasets.forEach((dataset) => {
      const count = datasetsByTypeMap.get(dataset.typeId) || 0;
      datasetsByTypeMap.set(dataset.typeId, count + 1);
    });
    const datasetsByType = Array.from(datasetsByTypeMap.entries()).map(
      ([typeId, count]) => ({
        typeId,
        _count: { id: count },
      }),
    );

    // Count datasets by security level from distinct datasets
    const datasetsBySecurityLevelMap = new Map<string | null, number>();
    distinctDatasets.forEach((dataset) => {
      const level = dataset.securityLevel || null;
      const count = datasetsBySecurityLevelMap.get(level) || 0;
      datasetsBySecurityLevelMap.set(level, count + 1);
    });
    const datasetsBySecurityLevel = Array.from(
      datasetsBySecurityLevelMap.entries(),
    ).map(([securityLevel, count]) => ({
      securityLevel,
      _count: { id: count },
    }));

    // Total distinct datasets
    const totalDatasets = distinctDatasets.length;

    // Get type names for the grouped data
    const typeIds = datasetsByType.map((item) => item.typeId);
    const types = await prisma.datasetType.findMany({
      where: {
        id: { in: typeIds },
      },
      select: {
        id: true,
        name: true,
        shortName: true,
      },
    });

    // Map type names to counts
    const typeMap = new Map(types.map((t) => [t.id, t]));
    const catalogsByType = datasetsByType.map((item) => ({
      typeId: item.typeId,
      typeName: typeMap.get(item.typeId)?.name || "Unknown",
      typeShortName: typeMap.get(item.typeId)?.shortName || "Unknown",
      count: item._count.id,
    }));

    // Map security levels
    const securityLevelMap: { [key: string]: string } = {
      "0": "เปิดเผย",
      "1": "เผยแพร่ภายในองค์กร",
      "2": "ลับ",
      "3": "ลับมาก",
      "4": "ลับที่สุด",
    };

    const datasetsBySecurityLevelMapped = datasetsBySecurityLevel.map(
      (item) => ({
        securityLevel: item.securityLevel || "null",
        securityLevelName: item.securityLevel
          ? securityLevelMap[item.securityLevel] || "Unknown"
          : "ไม่ระบุ",
        count: item._count.id,
      }),
    );

    const response = NextResponse.json({
      success: true,
      data: {
        catalogsByType,
        datasetsBySecurityLevel: datasetsBySecurityLevelMapped,
        totalDatasets,
        totalServices,
        accessCount: accessLogs,
        dateRange: {
          startDate: startDate || null,
          endDate: endDate || null,
        },
      },
    });

    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );

    return response;
  } catch (error: any) {
    console.error("Statistics API error:", error);
    const errorResponse = NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error.message,
      },
      { status: 500 },
    );

    errorResponse.headers.set("Access-Control-Allow-Origin", "*");
    errorResponse.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    errorResponse.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );

    return errorResponse;
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );
  return response;
}
