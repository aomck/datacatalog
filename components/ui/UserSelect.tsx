'use client';

import { useState, useRef, useEffect } from 'react';
import { User } from '@/components/ui/User';

interface UserSelectProps {
  value: string;
  onChange: (userId: string) => void;
  users: Array<{ userId: string }>;
  disabled?: boolean;
  placeholder?: string;
}

export function UserSelect({ value, onChange, users, disabled = false, placeholder = 'ทั้งหมด' }: UserSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredUsers = users.filter((user) =>
    user.userId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedUser = users.find((u) => u.userId === value);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Value Display */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md text-left bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:border-gray-400'
        }`}
      >
        {value && selectedUser ? (
          <User userId={value} type="avatar-name" size="small" />
        ) : (
          <span className="text-gray-500">{placeholder}</span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              placeholder="ค้นหา User ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Options List */}
          <div className="overflow-y-auto max-h-64">
            {/* "ทั้งหมด" Option */}
            <div
              onClick={() => {
                onChange('');
                setIsOpen(false);
                setSearchTerm('');
              }}
              className={`px-3 py-2 cursor-pointer hover:bg-blue-50 ${
                !value ? 'bg-blue-100' : ''
              }`}
            >
              <span className="text-gray-700">{placeholder}</span>
            </div>

            {/* User Options */}
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div
                  key={user.userId}
                  onClick={() => {
                    onChange(user.userId);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`px-3 py-2 cursor-pointer hover:bg-blue-50 ${
                    value === user.userId ? 'bg-blue-100' : ''
                  }`}
                >
                  <User userId={user.userId} type="avatar-name" size="small" />
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-gray-500 text-sm">
                ไม่พบผู้ใช้งาน
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
