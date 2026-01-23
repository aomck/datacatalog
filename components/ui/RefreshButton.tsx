'use client';

import { Icon } from '@iconify/react';
import { Tooltip } from '@mui/material';
import { useState } from 'react';

interface RefreshButtonProps {
  onRefresh: () => void | Promise<void>;
}

export function RefreshButton({ onRefresh }: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleClick = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  return (
    <Tooltip title="รีเฟรช">
      <button
        onClick={handleClick}
        disabled={isRefreshing}
        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
      >
        <Icon
          icon="mdi:refresh"
          className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`}
        />
      </button>
    </Tooltip>
  );
}
