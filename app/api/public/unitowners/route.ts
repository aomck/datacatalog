import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Public API - Unit Owners with Datasets and Services
 * GET /api/public/unitowners
 *
 * Query Parameters:
 * - search: string (ค้นหาจาก name, short_name, dataset.name, dataset.detail, service.name, service.detail)
 * - unitOwnerId: string (filter ตาม unit owner id)
 * - categoryId: string (filter ตาม category id)
 * - securityLevel: string (filter ตาม security level)
 *
 * Note: API นี้จะแสดงเฉพาะ dataset ที่มี type เป็น OPEN เท่านั้น (ไม่สามารถเปลี่ยนแปลงได้)
 *
 * Response:
 * Array of objects with hierarchy: unitOwner > datasets > services
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const unitOwnerId = searchParams.get('unitOwnerId');
    const categoryId = searchParams.get('categoryId');
    const securityLevel = searchParams.get('securityLevel');

    // Build filter conditions
    const whereConditions: any = {
      deletedAt: null,
    };

    // Filter by unit owner id
    if (unitOwnerId) {
      whereConditions.id = unitOwnerId;
    }

    // Build dataset filter conditions
    const datasetWhereConditions: any = {
      deletedAt: null,
      // Only show OPEN datasets for public API
      type: {
        OR: [
          { shortName: 'OPEN' },
          { name: 'OPEN' },
        ],
      },
    };

    if (categoryId) {
      datasetWhereConditions.categoryId = categoryId;
    }

    if (securityLevel) {
      datasetWhereConditions.securityLevel = securityLevel;
    }

    // Search across multiple fields
    if (search) {
      const searchTerm = search.trim();

      // If there's a search term, we need to filter unit owners that match
      // OR have datasets/services that match
      whereConditions.OR = [
        // Search in unit owner name
        { name: { contains: searchTerm, mode: 'insensitive' } },
        // Search in unit owner short name
        { shortName: { contains: searchTerm, mode: 'insensitive' } },
        // Search in datasets
        {
          datasets: {
            some: {
              deletedAt: null,
              OR: [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { detail: { contains: searchTerm, mode: 'insensitive' } },
                // Search in services within datasets
                {
                  services: {
                    some: {
                      deletedAt: null,
                      OR: [
                        { name: { contains: searchTerm, mode: 'insensitive' } },
                        { detail: { contains: searchTerm, mode: 'insensitive' } },
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
      ];
    }

    // Query unit owners with datasets and services
    const unitOwners = await prisma.unitOwner.findMany({
      where: whereConditions,
      select: {
        id: true,
        name: true,
        shortName: true,
        icon: true,
        createdAt: true,
        updatedAt: true,
        datasets: {
          where: datasetWhereConditions,
          select: {
            id: true,
            name: true,
            detail: true,
            securityLevel: true,
            metadata: true,
            createdAt: true,
            updatedAt: true,
            category: {
              select: {
                id: true,
                name: true,
                shortName: true,
                icon: true,
              },
            },
            type: {
              select: {
                id: true,
                name: true,
                shortName: true,
              },
            },
            services: {
              where: {
                deletedAt: null,
              },
              select: {
                id: true,
                name: true,
                detail: true,
                method: true,
                api: true,
                howTo: true,
                createdAt: true,
                updatedAt: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Filter out unit owners with no datasets (when filters are applied)
    const filteredUnitOwners = unitOwners.filter(unitOwner => {
      // If there are dataset filters or search, only include unit owners with matching datasets
      if (categoryId || securityLevel || search) {
        return unitOwner.datasets.length > 0;
      }
      return true;
    });

    // Additional filtering for search within datasets and services
    if (search) {
      const searchTerm = search.trim().toLowerCase();

      const searchFilteredUnitOwners = filteredUnitOwners.map(unitOwner => {
        // Check if unit owner matches
        const unitOwnerMatches =
          unitOwner.name.toLowerCase().includes(searchTerm) ||
          unitOwner.shortName.toLowerCase().includes(searchTerm);

        // Filter datasets
        const filteredDatasets = unitOwner.datasets
          .map(dataset => {
            // Check if dataset matches
            const datasetMatches =
              dataset.name.toLowerCase().includes(searchTerm) ||
              (dataset.detail && dataset.detail.toLowerCase().includes(searchTerm));

            // Filter services
            const filteredServices = dataset.services.filter(service => {
              const serviceMatches =
                service.name.toLowerCase().includes(searchTerm) ||
                (service.detail && service.detail.toLowerCase().includes(searchTerm));
              return serviceMatches;
            });

            // If dataset matches or has matching services, include it
            if (datasetMatches || filteredServices.length > 0) {
              return {
                ...dataset,
                services: datasetMatches ? dataset.services : filteredServices,
              };
            }
            return null;
          })
          .filter(dataset => dataset !== null);

        // If unit owner matches, include all datasets; otherwise only matching datasets
        if (unitOwnerMatches) {
          return unitOwner;
        } else if (filteredDatasets.length > 0) {
          return {
            ...unitOwner,
            datasets: filteredDatasets,
          };
        }
        return null;
      })
      .filter(unitOwner => unitOwner !== null);

      return NextResponse.json(searchFilteredUnitOwners, { status: 200 });
    }

    return NextResponse.json(filteredUnitOwners, { status: 200 });

  } catch (error: any) {
    console.error('Public unit owners API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
