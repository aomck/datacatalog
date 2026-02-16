'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { UnitOwner, Category, Dataset, Service, PaginatedResult } from '@/types';

// ============================================================================
// Unit Owner Actions
// ============================================================================

export async function getUnitOwners(page = 1, limit = 30, search?: string): Promise<PaginatedResult<UnitOwner>> {
  try {
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { shortName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.unitOwner.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.unitOwner.count({
        where,
      }),
    ]);

    return {
      data: data as UnitOwner[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    console.error('Get unit owners error:', error);
    throw error;
  }
}

export async function createUnitOwner(
  data: { name: string; shortName: string; icon?: string },
  userId: string
) {
  try {
    const unitOwner = await prisma.unitOwner.create({
      data: {
        name: data.name,
        shortName: data.shortName,
        icon: data.icon,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    revalidatePath('/app/admin');
    return { success: true, data: unitOwner };
  } catch (error: any) {
    console.error('Create unit owner error:', error);
    return { success: false, error: error.message };
  }
}

export async function updateUnitOwner(
  id: string,
  data: { name?: string; shortName?: string; icon?: string },
  userId: string
) {
  try {
    const unitOwner = await prisma.unitOwner.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
      },
    });

    revalidatePath('/app/admin');
    return { success: true, data: unitOwner };
  } catch (error: any) {
    console.error('Update unit owner error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteUnitOwner(id: string, userId: string) {
  try {
    await prisma.unitOwner.update({
      where: { id },
      data: {
        deletedBy: userId,
        deletedAt: new Date(),
      },
    });

    revalidatePath('/app/admin');
    return { success: true };
  } catch (error: any) {
    console.error('Delete unit owner error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// DatasetType Actions
// ============================================================================

export async function getDatasetTypes(page = 1, limit = 30) {
  try {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.datasetType.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.datasetType.count({
        where: { deletedAt: null },
      }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    console.error('Get dataset types error:', error);
    throw error;
  }
}

// ============================================================================
// Category Actions
// ============================================================================

export async function getCategories(page = 1, limit = 30, search?: string): Promise<PaginatedResult<Category>> {
  try {
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { shortName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.category.findMany({
        where,
        orderBy: { order: 'asc' },
        skip,
        take: limit,
      }),
      prisma.category.count({
        where,
      }),
    ]);

    return {
      data: data as Category[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    console.error('Get categories error:', error);
    throw error;
  }
}

export async function createCategory(
  data: { name: string; shortName: string; icon?: string },
  userId: string
) {
  try {
    const category = await prisma.category.create({
      data: {
        name: data.name,
        shortName: data.shortName,
        icon: data.icon,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    revalidatePath('/app/admin');
    return { success: true, data: category };
  } catch (error: any) {
    console.error('Create category error:', error);
    return { success: false, error: error.message };
  }
}

export async function updateCategory(
  id: string,
  data: { name?: string; shortName?: string; icon?: string },
  userId: string
) {
  try {
    const category = await prisma.category.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
      },
    });

    revalidatePath('/app/admin');
    return { success: true, data: category };
  } catch (error: any) {
    console.error('Update category error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteCategory(id: string, userId: string) {
  try {
    await prisma.category.update({
      where: { id },
      data: {
        deletedBy: userId,
        deletedAt: new Date(),
      },
    });

    revalidatePath('/app/admin');
    return { success: true };
  } catch (error: any) {
    console.error('Delete category error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// Dataset Actions
// ============================================================================

export async function getDatasets(
  page = 1,
  limit = 30,
  filters?: {
    search?: string;
    unitOwnerId?: string;
    categoryId?: string;
    typeId?: string;
  }
): Promise<PaginatedResult<Dataset>> {
  try {
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    // Apply filters
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
        {
          services: {
            some: {
              name: { contains: filters.search, mode: 'insensitive' },
              deletedAt: null,
            },
          },
        },
      ];
    }

    if (filters?.unitOwnerId) {
      where.unitOwnerId = filters.unitOwnerId;
    }

    // Filter by category using m:m relation
    if (filters?.categoryId) {
      where.categories = {
        some: {
          categoryId: filters.categoryId,
        },
      };
    }

    if (filters?.typeId) {
      where.typeId = filters.typeId;
    }

    const [data, total] = await Promise.all([
      prisma.dataset.findMany({
        where,
        include: {
          unitOwner: true,
          category: true, // Keep for backward compatibility
          type: true,
          categories: {
            include: {
              category: true,
            },
          },
          services: {
            where: { deletedAt: null },
          },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.dataset.count({
        where,
      }),
    ]);

    return {
      data: data as Dataset[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    console.error('Get datasets error:', error);
    throw error;
  }
}

export async function createDataset(
  data: {
    name: string;
    code: string;
    detail?: string;
    unitOwnerId: string;
    categoryId: string; // Keep for backward compatibility
    categoryIds?: string[]; // New m:m categories
    typeId: string;
    securityLevel?: string;
    metadata?: string;
    datadict?: string;
  },
  userId: string
) {
  try {
    const categoryIds = data.categoryIds && data.categoryIds.length > 0 ? data.categoryIds : [data.categoryId];

    const dataset = await prisma.dataset.create({
      data: {
        name: data.name,
        code: data.code,
        detail: data.detail,
        unitOwnerId: data.unitOwnerId,
        categoryId: data.categoryId, // Keep for backward compatibility
        typeId: data.typeId,
        securityLevel: data.securityLevel,
        metadata: data.metadata,
        datadict: data.datadict,
        createdBy: userId,
        updatedBy: userId,
        // Create m:m relations
        categories: {
          create: categoryIds.map((categoryId) => ({
            categoryId: categoryId,
          })),
        },
      },
      include: {
        unitOwner: true,
        category: true,
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    revalidatePath('/app/admin');
    revalidatePath('/app/catalog');
    return { success: true, data: dataset };
  } catch (error: any) {
    console.error('Create dataset error:', error);
    return { success: false, error: error.message };
  }
}

export async function updateDataset(
  id: string,
  data: {
    name?: string;
    code?: string;
    detail?: string;
    unitOwnerId?: string;
    categoryId?: string;
    categoryIds?: string[]; // New m:m categories
    typeId?: string;
    securityLevel?: string;
    metadata?: string;
    datadict?: string;
  },
  userId: string
) {
  try {
    const updateData: any = {
      updatedBy: userId,
    };

    // Only include fields that are provided and valid for Prisma update
    if (data.name !== undefined) updateData.name = data.name;
    if (data.code !== undefined) updateData.code = data.code;
    if (data.detail !== undefined) updateData.detail = data.detail;
    if (data.securityLevel !== undefined) updateData.securityLevel = data.securityLevel;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;
    if (data.datadict !== undefined) updateData.datadict = data.datadict;

    // Handle relation fields
    if (data.unitOwnerId) {
      updateData.unitOwner = { connect: { id: data.unitOwnerId } };
    }
    if (data.categoryId) {
      updateData.category = { connect: { id: data.categoryId } };
    }
    if (data.typeId) {
      updateData.type = { connect: { id: data.typeId } };
    }

    // Handle m:m categories update
    if (data.categoryIds !== undefined) {
      // Delete all existing category relations
      await prisma.datasetCategory.deleteMany({
        where: { datasetId: id },
      });

      // Create new category relations
      if (data.categoryIds.length > 0) {
        updateData.categories = {
          create: data.categoryIds.map((categoryId) => ({
            categoryId: categoryId,
          })),
        };
      }
    }

    const dataset = await prisma.dataset.update({
      where: { id },
      data: updateData,
      include: {
        unitOwner: true,
        category: true,
        type: true,
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    revalidatePath('/app/admin');
    revalidatePath('/app/catalog');
    return { success: true, data: dataset };
  } catch (error: any) {
    console.error('Update dataset error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteDataset(id: string, userId: string) {
  try {
    await prisma.dataset.update({
      where: { id },
      data: {
        deletedBy: userId,
        deletedAt: new Date(),
      },
    });

    revalidatePath('/app/admin');
    return { success: true };
  } catch (error: any) {
    console.error('Delete dataset error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// Service Actions
// ============================================================================

export async function getServices(datasetId?: string, page = 1, limit = 30): Promise<PaginatedResult<Service>> {
  try {
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(datasetId && { datasetId }),
    };

    const [data, total] = await Promise.all([
      prisma.service.findMany({
        where,
        include: {
          dataset: {
            include: {
              unitOwner: true,
              category: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.service.count({ where }),
    ]);

    return {
      data: data as Service[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    console.error('Get services error:', error);
    throw error;
  }
}

export async function createService(
  data: {
    name: string;
    detail?: string;
    datasetId: string;
    method: 'GET' | 'POST' | 'PATCH';
    api: string;
    howTo?: string;
  },
  userId: string
) {
  try {
    const service = await prisma.service.create({
      data: {
        name: data.name,
        detail: data.detail,
        datasetId: data.datasetId,
        method: data.method,
        api: data.api,
        howTo: data.howTo,
        createdBy: userId,
        updatedBy: userId,
      },
      include: {
        dataset: true,
      },
    });

    revalidatePath('/app/admin');
    return { success: true, data: service };
  } catch (error: any) {
    console.error('Create service error:', error);
    return { success: false, error: error.message };
  }
}

export async function updateService(
  id: string,
  data: {
    name?: string;
    detail?: string;
    method?: 'GET' | 'POST' | 'PATCH';
    api?: string;
    howTo?: string;
  },
  userId: string
) {
  try {
    const service = await prisma.service.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
      },
      include: {
        dataset: true,
      },
    });

    revalidatePath('/app/admin');
    return { success: true, data: service };
  } catch (error: any) {
    console.error('Update service error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteService(id: string, userId: string) {
  try {
    await prisma.service.update({
      where: { id },
      data: {
        deletedBy: userId,
        deletedAt: new Date(),
      },
    });

    revalidatePath('/app/admin');
    return { success: true };
  } catch (error: any) {
    console.error('Delete service error:', error);
    return { success: false, error: error.message };
  }
}
