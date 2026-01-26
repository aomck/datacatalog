'use server';

import { prisma } from '@/lib/prisma';

// ============================================================================
// Notification Actions
// ============================================================================

/**
 * Get unread notification count for a user
 * นับจำนวนชุดข้อมูล/บริการที่มีการอัพเดทสถานะหลังจาก lastReadAt หรือยังไม่เคยอ่าน
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    // Get all user's datasets and services
    const [datasets, services] = await Promise.all([
      prisma.requestDataset.findMany({
        where: {
          request: {
            requestedBy: userId,
            deletedAt: null,
          },
        },
        select: {
          id: true,
          approvedAt: true,
        },
      }),
      prisma.requestService.findMany({
        where: {
          request: {
            requestedBy: userId,
            deletedAt: null,
          },
        },
        select: {
          id: true,
          approvedAt: true,
        },
      }),
    ]);

    // Get all read records for this user
    const readRecords = await prisma.userNotificationRead.findMany({
      where: { userId },
      select: {
        requestDatasetId: true,
        requestServiceId: true,
        lastReadAt: true,
      },
    });

    // Create a map for quick lookup
    const readMap = new Map<string, Date>();
    readRecords.forEach((record) => {
      if (record.requestDatasetId) {
        readMap.set(`dataset_${record.requestDatasetId}`, record.lastReadAt);
      }
      if (record.requestServiceId) {
        readMap.set(`service_${record.requestServiceId}`, record.lastReadAt);
      }
    });

    let unreadCount = 0;

    console.log('[Notification] Checking unread status for user:', userId);
    console.log('[Notification] Total datasets:', datasets.length);
    console.log('[Notification] Total services:', services.length);
    console.log('[Notification] Read records:', readRecords.length);

    // Check datasets
    for (const dataset of datasets) {
      const lastReadAt = readMap.get(`dataset_${dataset.id}`);
      const lastUpdateAt = dataset.approvedAt;

      // ถ้ายังไม่เคยอ่าน หรือ มีการอัพเดทหลังจากอ่านครั้งล่าสุด
      const isUnread = !lastReadAt || (lastUpdateAt && lastUpdateAt > lastReadAt);
      if (isUnread) {
        console.log('[Notification] Unread dataset:', dataset.id, 'lastUpdate:', lastUpdateAt, 'lastRead:', lastReadAt);
        unreadCount++;
      }
    }

    // Check services
    for (const service of services) {
      const lastReadAt = readMap.get(`service_${service.id}`);
      const lastUpdateAt = service.approvedAt;

      // ถ้ายังไม่เคยอ่าน หรือ มีการอัพเดทหลังจากอ่านครั้งล่าสุด
      const isUnread = !lastReadAt || (lastUpdateAt && lastUpdateAt > lastReadAt);
      if (isUnread) {
        console.log('[Notification] Unread service:', service.id, 'lastUpdate:', lastUpdateAt, 'lastRead:', lastReadAt);
        unreadCount++;
      }
    }

    console.log('[Notification] Total unread count:', unreadCount);
    return unreadCount;
  } catch (error: any) {
    console.error('Get unread notification count error:', error);
    return 0;
  }
}

/**
 * Mark notifications as read for a user
 * บันทึกเวลาที่ user เข้าดูชุดข้อมูล/บริการ
 */
export async function markNotificationsAsRead(
  userId: string,
  items: { datasetIds?: string[]; serviceIds?: string[] }
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date();
    const operations: any[] = [];

    // Mark datasets as read
    if (items.datasetIds && items.datasetIds.length > 0) {
      for (const datasetId of items.datasetIds) {
        operations.push(
          prisma.userNotificationRead.upsert({
            where: {
              userId_requestDatasetId: {
                userId,
                requestDatasetId: datasetId,
              },
            },
            create: {
              userId,
              requestDatasetId: datasetId,
              lastReadAt: now,
            },
            update: {
              lastReadAt: now,
            },
          })
        );
      }
    }

    // Mark services as read
    if (items.serviceIds && items.serviceIds.length > 0) {
      for (const serviceId of items.serviceIds) {
        operations.push(
          prisma.userNotificationRead.upsert({
            where: {
              userId_requestServiceId: {
                userId,
                requestServiceId: serviceId,
              },
            },
            create: {
              userId,
              requestServiceId: serviceId,
              lastReadAt: now,
            },
            update: {
              lastReadAt: now,
            },
          })
        );
      }
    }

    await Promise.all(operations);

    return { success: true };
  } catch (error: any) {
    console.error('Mark notifications as read error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get unread status for user's datasets and services
 * ส่งข้อมูลว่า item ไหนยังไม่ได้อ่าน เพื่อแสดงจุดสีแดง
 */
export async function getUnreadStatus(userId: string): Promise<{
  datasets: Record<string, boolean>;
  services: Record<string, boolean>;
}> {
  try {
    // Get all user's datasets and services
    const [datasets, services] = await Promise.all([
      prisma.requestDataset.findMany({
        where: {
          request: {
            requestedBy: userId,
            deletedAt: null,
          },
        },
        select: {
          id: true,
          approvedAt: true,
        },
      }),
      prisma.requestService.findMany({
        where: {
          request: {
            requestedBy: userId,
            deletedAt: null,
          },
        },
        select: {
          id: true,
          approvedAt: true,
        },
      }),
    ]);

    // Get all read records for this user
    const readRecords = await prisma.userNotificationRead.findMany({
      where: { userId },
      select: {
        requestDatasetId: true,
        requestServiceId: true,
        lastReadAt: true,
      },
    });

    // Create a map for quick lookup
    const readMap = new Map<string, Date>();
    readRecords.forEach((record) => {
      if (record.requestDatasetId) {
        readMap.set(`dataset_${record.requestDatasetId}`, record.lastReadAt);
      }
      if (record.requestServiceId) {
        readMap.set(`service_${record.requestServiceId}`, record.lastReadAt);
      }
    });

    // Build unread status maps
    const datasetUnreadStatus: Record<string, boolean> = {};
    const serviceUnreadStatus: Record<string, boolean> = {};

    console.log('[UnreadStatus] Checking for user:', userId);
    console.log('[UnreadStatus] Datasets count:', datasets.length);
    console.log('[UnreadStatus] Services count:', services.length);

    // Check datasets
    for (const dataset of datasets) {
      const lastReadAt = readMap.get(`dataset_${dataset.id}`);
      const lastUpdateAt = dataset.approvedAt;

      // ถ้ายังไม่เคยอ่าน หรือ มีการอัพเดทหลังจากอ่านครั้งล่าสุด
      const isUnread = !lastReadAt || (lastUpdateAt && lastUpdateAt > lastReadAt);
      datasetUnreadStatus[dataset.id] = !!isUnread;

      if (isUnread) {
        console.log('[UnreadStatus] Dataset unread:', dataset.id, 'lastUpdate:', lastUpdateAt, 'lastRead:', lastReadAt);
      }
    }

    // Check services
    for (const service of services) {
      const lastReadAt = readMap.get(`service_${service.id}`);
      const lastUpdateAt = service.approvedAt;

      // ถ้ายังไม่เคยอ่าน หรือ มีการอัพเดทหลังจากอ่านครั้งล่าสุด
      const isUnread = !lastReadAt || (lastUpdateAt && lastUpdateAt > lastReadAt);
      serviceUnreadStatus[service.id] = !!isUnread;

      if (isUnread) {
        console.log('[UnreadStatus] Service unread:', service.id, 'lastUpdate:', lastUpdateAt, 'lastRead:', lastReadAt);
      }
    }

    console.log('[UnreadStatus] Dataset unread status:', datasetUnreadStatus);
    console.log('[UnreadStatus] Service unread status:', serviceUnreadStatus);

    return {
      datasets: datasetUnreadStatus,
      services: serviceUnreadStatus,
    };
  } catch (error: any) {
    console.error('Get unread status error:', error);
    return { datasets: {}, services: {} };
  }
}
