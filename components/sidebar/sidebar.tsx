'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';
import { usePermission } from '@/components/providers/permission-provider';
import { hasAnyAction } from '@/lib/permission-utils';
import { logoutAction } from '@/lib/auth-actions';

interface MenuItem {
  name: string;
  nameTh: string;
  href: string;
  icon: React.ReactNode;
  service: string;
  route: string;
}

const menuItems: MenuItem[] = [
  {
    name: 'Data Catalog',
    nameTh: 'แคตาล็อกข้อมูล',
    href: '/app/catalog',
    service: '', // No permission required, everyone can access
    route: '',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    ),
  },
  {
    name: 'My Datasets',
    nameTh: 'ชุดข้อมูลของฉัน',
    href: '/app/my-catalog',
    service: '', // No permission required, everyone can access their own data
    route: '',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    name: 'Approval',
    nameTh: 'การอนุมัติ',
    href: '/app/approver',
    service: 'datacatalog',
    route: 'approve',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    name: 'Dashboard',
    nameTh: 'สถิติการใช้งาน',
    href: '/app/dashboard',
    service: 'datacatalog',
    route: 'admin',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    name: 'Admin',
    nameTh: 'จัดการข้อมูล',
    href: '/app/admin',
    service: 'datacatalog',
    route: 'admin',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  }
];

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(true);
  const pathname = usePathname();
  const { user, permissions } = usePermission();

  console.log('=== SIDEBAR PERMISSIONS DEBUG ===');
  console.log('Full permissions object:', JSON.stringify(permissions, null, 2));
  console.log('Action permissions:', permissions?.action_permission);
  console.log('datacatalog permissions:', permissions?.action_permission?.datacatalog);

  const handleLogout = async () => {
    await logoutAction();
  };

  // Filter menu items based on permissions
  const visibleMenuItems = menuItems.filter((item) => {
    // If service and route are empty, show to everyone
    if (!item.service || !item.route) return true;
    // Otherwise check permission
    const hasPermission = hasAnyAction(permissions, item.service, item.route);
    console.log(`Menu: ${item.nameTh} (${item.service}.${item.route}) - Has Permission: ${hasPermission}`);
    return hasPermission;
  });

  return (
    <aside
      className={`${
        isExpanded ? 'w-64' : 'w-20'
      } bg-white border-r border-gray-200 min-h-screen flex flex-col transition-all duration-300 ease-in-out`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${isExpanded ? 'space-x-3' : 'justify-center'}`}>
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                />
              </svg>
            </div>
            {isExpanded && (
              <span className="font-bold text-gray-900 text-lg">Data Catalog</span>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${
                isExpanded ? '' : 'rotate-180'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* User Profile */}
      {user && (
        <div className="p-4 border-b border-gray-200">
          <div className={`flex items-center ${isExpanded ? 'space-x-3' : 'justify-center'}`}>
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={`${user.firstname} ${user.lastname}`}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <span className="text-primary-700 font-semibold text-sm">
                  {user.firstname?.charAt(0)}{user.lastname?.charAt(0)}
                </span>
              )}
            </div>
            {isExpanded && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.firstname} {user.lastname}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.position || user.activeUnit?.nameTh || user.email}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {visibleMenuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center ${
                isExpanded ? 'space-x-3 px-4' : 'justify-center px-2'
              } py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-primary-50 text-primary-700 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title={!isExpanded ? item.nameTh : undefined}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {isExpanded && <span>{item.nameTh}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center ${
            isExpanded ? 'space-x-3 px-4' : 'justify-center px-2'
          } py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all`}
          title={!isExpanded ? 'ออกจากระบบ' : undefined}
        >
          <Icon icon="mdi:logout" className="w-6 h-6 flex-shrink-0" />
          {isExpanded && <span>ออกจากระบบ</span>}
        </button>
      </div>
    </aside>
  );
}
