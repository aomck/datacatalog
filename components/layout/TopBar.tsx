'use client';

import { Avatar } from '@mui/material';
import { getFileUrl } from '@/lib/file-url';
import type { User } from '@/types';

interface TopBarProps {
  user: User;
}

export function TopBar({ user }: TopBarProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-end">
        <div className="flex items-center space-x-3 px-3 py-2">
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
        </div>
      </div>
    </div>
  );
}
