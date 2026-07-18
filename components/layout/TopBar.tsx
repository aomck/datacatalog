'use client';

import { useState } from 'react';
import { Avatar } from '@mui/material';
import { Icon } from '@iconify/react';
import { getFileUrl } from '@/lib/file-url';
import { clearSessionAction } from '@/lib/auth-actions';
import type { User } from '@/types';

interface TopBarProps {
  user: User;
}

export function TopBar({ user }: TopBarProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = async () => {
    await clearSessionAction();
    window.location.href = 'https://isoc360.isoc.go.th';
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-end">
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors"
          >
            <Avatar
              src={user.avatarUrl ? (getFileUrl(user.avatarUrl) || user.avatarUrl) : undefined}
              alt={`${user.firstname} ${user.lastname}`}
              sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}
            >
              {user.firstname?.charAt(0)}
            </Avatar>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">
                {user.firstname} {user.lastname}
              </p>
              <p className="text-xs text-gray-500">
                {user.position || user.activeUnit?.nameTh || user.email}
              </p>
            </div>
            <Icon icon="mdi:chevron-down" className="w-5 h-5 text-gray-400" />
          </button>

          {/* Dropdown menu */}
          {showProfileMenu && (
            <>
              {/* Backdrop to close menu when clicking outside */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowProfileMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Icon icon="mdi:logout" className="w-5 h-5" />
                  <span>ออกจากระบบ</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
