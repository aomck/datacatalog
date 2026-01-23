'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import type { User, PermissionResponse } from '@/types';

interface PermissionContextType {
  user: User | null;
  permissions: PermissionResponse | null;
  isLoading: boolean;
}

const PermissionContext = createContext<PermissionContextType>({
  user: null,
  permissions: null,
  isLoading: true,
});

interface PermissionProviderProps {
  children: ReactNode;
  user: User | null;
  permissions: PermissionResponse | null;
}

export function PermissionProvider({
  children,
  user,
  permissions,
}: PermissionProviderProps) {
  return (
    <PermissionContext.Provider
      value={{
        user,
        permissions,
        isLoading: false,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermission() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermission must be used within PermissionProvider');
  }
  return context;
}

export function useUser() {
  const { user } = usePermission();
  return user;
}
