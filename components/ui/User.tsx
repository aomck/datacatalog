'use client';

import { useState, useEffect } from 'react';
import { Avatar, Tooltip } from '@mui/material';
import { Icon } from '@iconify/react';
import { getUserFromCore } from '@/lib/actions/user-actions';

interface UserProps {
  userId: string;
  displayName?: string;
  type?: 'avatar' | 'avatar-name';
  size?: 'small' | 'medium' | 'large';
}

interface UserData {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  avatarUrl?: string;
  position?: string;
}

const sizeMap = {
  small: 24,
  medium: 40,
  large: 56,
};

export function User({ userId, displayName, type = 'avatar', size = 'medium' }: UserProps) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      console.log('👤 Fetching user in component:', userId);
      const result = await getUserFromCore(userId);
      if (result.success && result.data) {
        console.log('✅ User data received in component:', result.data);
        setUser(result.data);
      } else {
        console.error('❌ Failed to fetch user:', result.error);
      }
    } catch (error) {
      console.error('❌ Error fetching user in component:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className={`rounded-full bg-gray-200 animate-pulse`} style={{ width: sizeMap[size], height: sizeMap[size] }} />
        {type === 'avatar-name' && <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />}
      </div>
    );
  }

  // Fallback to displayName if user fetch failed
  const name = user ? `${user.firstname} ${user.lastname}` : (displayName || userId.substring(0, 8));

  // Get initials from display name
  const getInitials = (name: string) => {
    const words = name.split(' ');
    if (words.length >= 2) {
      return `${words[0][0]}${words[words.length - 1][0]}`;
    }
    return name.substring(0, 2).toUpperCase();
  };

  const avatarContent = user?.avatarUrl ? (
    <Avatar src={user.avatarUrl} alt={name} sx={{ width: sizeMap[size], height: sizeMap[size] }} />
  ) : (
    <Avatar sx={{ width: sizeMap[size], height: sizeMap[size], bgcolor: 'primary.main' }}>
      {getInitials(name)}
    </Avatar>
  );

  if (type === 'avatar') {
    return (
      <Tooltip title={`${name}${user?.position ? ` (${user.position})` : ''}`}>
        {avatarContent}
      </Tooltip>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {avatarContent}
      <div>
        <p className="font-medium text-sm">{name}</p>
        {user?.position && <p className="text-xs text-gray-600">{user.position}</p>}
      </div>
    </div>
  );
}
