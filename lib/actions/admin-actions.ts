'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { UnitOwner, Category, Dataset, Service, PaginatedResult } from '@/types';

// ============================================================================
// Unit Owner Actions
// ============================================================================

export async function getUnitOwners(page = 1, limit = 30): Promise<PaginatedResult<UnitOwner>> {
  try {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.unitOwner.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.unitOwner.count({
        where: { deletedAt: null },
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

export async function getCategories(page = 1, limit = 30): Promise<PaginatedResult<Category>> {
  try {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.category.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.category.count({
        where: { deletedAt: null },
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

export async function getDatasets(page = 1, limit = 30): Promise<PaginatedResult<Dataset>> {
  try {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.dataset.findMany({
        where: { deletedAt: null },
        include: {
          unitOwner: true,
          category: true,
          type: true,
          services: {
            where: { deletedAt: null },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.dataset.count({
        where: { deletedAt: null },
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
  data: { name: string; detail?: string; unitOwnerId: string; categoryId: string; typeId: string; metadata?: string },
  userId: string
) {
  try {
    const dataset = await prisma.dataset.create({
      data: {
        name: data.name,
        detail: data.detail,
        unitOwnerId: data.unitOwnerId,
        categoryId: data.categoryId,
        typeId: data.typeId,
        metadata: data.metadata,
        createdBy: userId,
      },
      include: {
        unitOwner: true,
        category: true,
      },
    });

    revalidatePath('/app/admin');
    return { success: true, data: dataset };
  } catch (error: any) {
    console.error('Create dataset error:', error);
    return { success: false, error: error.message };
  }
}

export async function updateDataset(
  id: string,
  data: { name?: string; detail?: string; unitOwnerId?: string; categoryId?: string; typeId?: string; metadata?: string },
  userId: string
) {
  try {
    const dataset = await prisma.dataset.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
      },
      include: {
        unitOwner: true,
        category: true,
        type: true,
      },
    });

    revalidatePath('/app/admin');
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
