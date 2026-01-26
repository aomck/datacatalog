'use server';

import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { apiClient } from '@/lib/api';
import { getAccessToken } from '@/lib/cookies';

/**
 * Ensure user exists in local database
 * Creates user if not exists, returns existing user otherwise
 */
export async function ensureUserExists(userId: string): Promise<{
  success: boolean;
  user?: {
    id: string;
    token: string;
  };
  error?: string;
}> {
  try {
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, token: true },
    });

    // Create user if not exists
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          token: uuidv4(),
          createdBy: userId,
        },
        select: { id: true, token: true },
      });
    }

    return {
      success: true,
      user,
    };
  } catch (error: any) {
    console.error('Ensure user exists error:', error);
    return {
      success: false,
      error: error.message || 'Failed to ensure user exists',
    };
  }
}

/**
 * Get user token
 */
export async function getUserToken(userId: string): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { token: true },
    });

    return user?.token || null;
  } catch (error) {
    console.error('Get user token error:', error);
    return null;
  }
}

/**
 * Regenerate user token
 */
export async function regenerateUserToken(userId: string): Promise<{
  success: boolean;
  token?: string;
  error?: string;
}> {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        token: uuidv4(),
        updatedBy: userId,
      },
      select: { token: true },
    });

    return {
      success: true,
      token: user.token,
    };
  } catch (error: any) {
    console.error('Regenerate user token error:', error);
    return {
      success: false,
      error: error.message || 'Failed to regenerate token',
    };
  }
}

// Cache for user data from Core API
const userCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get user info from Core API with caching
 */
export async function getUserFromCore(userId: string): Promise<{
  success: boolean;
  data?: {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
    avatarUrl?: string;
    position?: string;
  };
  error?: string;
}> {
  try {
    // Check cache first
    const cached = userCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('✅ User cache hit:', userId);
      return { success: true, data: cached.data };
    }

    // Get token from cookies (same as auth/me)
    const token = await getAccessToken();
    console.log('🔑 Token retrieved:', token ? `${token.substring(0, 20)}...` : 'null');

    if (!token) {
      console.error('❌ No authentication token');
      return {
        success: false,
        error: 'No authentication token',
      };
    }

    // Fetch from Core API using apiClient
    console.log('📡 Fetching user from Core API:', userId);
    console.log('🌐 URL:', `${process.env.CORE_API_URL}/user/${userId}`);

    const response = await apiClient.get(`/user/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response data:', JSON.stringify(response.data, null, 2));

    if (response.data?.status === 200 && response.data?.data) {
      // Update cache
      userCache.set(userId, {
        data: response.data.data,
        timestamp: Date.now(),
      });

      console.log('✅ User fetched successfully:', response.data.data);
      return {
        success: true,
        data: response.data.data,
      };
    }

    console.error('❌ User not found in response');
    return {
      success: false,
      error: 'User not found',
    };
  } catch (error: any) {
    console.error('❌ Get user from core error:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    return {
      success: false,
      error: error.message || 'Failed to get user from core',
    };
  }
}

/**
 * Get multiple users from Core API with caching
 */
export async function getUsersFromCore(userIds: string[]): Promise<{
  success: boolean;
  data?: Record<string, {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
    avatarUrl?: string;
    position?: string;
  }>;
  error?: string;
}> {
  try {
    const users: Record<string, any> = {};
    const uncachedIds: string[] = [];

    // Check cache first
    for (const userId of userIds) {
      const cached = userCache.get(userId);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        users[userId] = cached.data;
      } else {
        uncachedIds.push(userId);
      }
    }

    // Fetch uncached users
    if (uncachedIds.length > 0) {
      const results = await Promise.all(
        uncachedIds.map((id) => getUserFromCore(id))
      );

      results.forEach((result: { success: boolean; data?: any }, index: number) => {
        if (result.success && result.data) {
          users[uncachedIds[index]] = result.data;
        }
      });
    }

    return {
      success: true,
      data: users,
    };
  } catch (error: any) {
    console.error('Get users from core error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get users from core',
    };
  }
}

/**
 * Clear user cache (for testing or manual refresh)
 */
export async function clearUserCache(userId?: string): Promise<void> {
  if (userId) {
    userCache.delete(userId);
  } else {
    userCache.clear();
  }
}
