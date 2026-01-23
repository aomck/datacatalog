'use server';

import { apiClient } from './api';
import { setAuthCookies, getAccessToken, clearAuthCookies, getRefreshToken } from './cookies';
import { redirect } from 'next/navigation';
import type {
  ApiResponse,
  LoginResponse,
  User,
  PermissionResponse
} from '@/types';

/**
 * Login action - calls /auth/local endpoint
 */
export async function loginAction(email: string, password: string) {
  try {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/local', {
      email: email.toLowerCase(),
      password,
    });

    if (response.data.status === 200 && response.data.data) {
      const { token, refresh_token } = response.data.data;

      // Store tokens in httpOnly cookies
      await setAuthCookies(token, refresh_token);

      return {
        success: true,
        message: response.data.message,
      };
    }

    return {
      success: false,
      message: response.data.message || 'Login failed',
    };
  } catch (error: any) {
    console.error('Login error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบอีเมลและรหัสผ่าน',
    };
  }
}

/**
 * Get current user - calls /auth/me endpoint
 */
export async function getMeAction(): Promise<User | null> {
  try {
    const token = await getAccessToken();

    if (!token) {
      return null;
    }

    const response = await apiClient.get<ApiResponse<User>>('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data.status === 200 && response.data.data) {
      return response.data.data;
    }

    return null;
  } catch (error: any) {
    console.error('Get me error:', error);

    // If token expired, try to refresh
    if (error.response?.status === 401) {
      const refreshed = await refreshTokenAction();
      if (refreshed) {
        // Retry with new token
        return getMeAction();
      }
    }

    return null;
  }
}

/**
 * Get user permissions for specific service and route
 * Uses GraphQL-based permission endpoint as per AUTH_PERM_DOC.md
 * Endpoint: GET /permission/:service/:route
 */
export async function getPermissionAction(
  service: string = 'datacatalog',
  route: string = 'catalog'
): Promise<PermissionResponse | null> {
  try {
    const token = await getAccessToken();

    if (!token) {
      return null;
    }

    const response = await apiClient.get<PermissionResponse>(
      `/permission/${service}/${route}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // The response is directly the permission object, not wrapped in ApiResponse
    if (response.data) {
      return response.data;
    }

    return null;
  } catch (error: any) {
    console.error('Get permission error:', error);

    // If token expired, try to refresh
    if (error.response?.status === 401) {
      const refreshed = await refreshTokenAction();
      if (refreshed) {
        // Retry with new token
        return getPermissionAction(service, route);
      }
    }

    return null;
  }
}

/**
 * Refresh access token - calls /auth/refresh endpoint
 */
export async function refreshTokenAction(): Promise<boolean> {
  try {
    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
      return false;
    }

    const response = await apiClient.post<{ token: string; refresh_token: string }>('/auth/refresh', {
      refresh_token: refreshToken,
    });

    if (response.data.token && response.data.refresh_token) {
      await setAuthCookies(response.data.token, response.data.refresh_token);
      return true;
    }

    return false;
  } catch (error: any) {
    console.error('Refresh token error:', error);
    return false;
  }
}

/**
 * Logout action - clears cookies and redirects to login
 */
export async function logoutAction() {
  await clearAuthCookies();
  redirect('/login');
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) {
    return false;
  }

  const user = await getMeAction();
  return user !== null;
}
