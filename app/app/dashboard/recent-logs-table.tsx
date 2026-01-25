'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User } from '@/components/ui/User';
import { UserSelect } from '@/components/ui/UserSelect';
import { Timestamp } from '@/components/ui/Timestamp';
import type { RecentLogsResult } from '@/lib/actions/recent-logs-actions';

interface RecentLogsTableProps {
  initialData: RecentLogsResult;
  filterOptions: {
    services: Array<{ id: string; name: string }>;
    datasets: Array<{ id: string; name: string }>;
    unitOwners: Array<{ id: string; name: string; shortName: string }>;
    users: Array<{ userId: string }>;
  };
  dateRange: number;
}

export default function RecentLogsTable({
  initialData,
  filterOptions,
  dateRange,
}: RecentLogsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [filters, setFilters] = useState({
    serviceId: searchParams.get('serviceId') || '',
    datasetId: searchParams.get('datasetId') || '',
    unitOwnerId: searchParams.get('unitOwnerId') || '',
    userId: searchParams.get('userId') || '',
    page: parseInt(searchParams.get('page') || '1'),
  });

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    const updated = { ...filters, ...newFilters, page: 1 }; // Reset to page 1 on filter change
    setFilters(updated);

    // Build query string
    const params = new URLSearchParams(searchParams.toString());
    params.set('days', dateRange.toString());

    Object.entries(updated).forEach(([key, value]) => {
      if (value) {
        params.set(key, value.toString());
      } else {
        params.delete(key);
      }
    });

    startTransition(() => {
      router.push(`/app/dashboard?${params.toString()}`);
    });
  };

  const changePage = (page: number) => {
    const updated = { ...filters, page };
    setFilters(updated);

    const params = new URLSearchParams(searchParams.toString());
    params.set('days', dateRange.toString());
    params.set('page', page.toString());

    startTransition(() => {
      router.push(`/app/dashboard?${params.toString()}`);
    });
  };

  const clearFilters = () => {
    setFilters({
      serviceId: '',
      datasetId: '',
      unitOwnerId: '',
      userId: '',
      page: 1,
    });

    const params = new URLSearchParams();
    params.set('days', dateRange.toString());

    startTransition(() => {
      router.push(`/app/dashboard?${params.toString()}`);
    });
  };

  const hasFilters = filters.serviceId || filters.datasetId || filters.unitOwnerId || filters.userId;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        กิจกรรมล่าสุด
        <span className="text-sm font-normal text-gray-500 ml-2">
          ({initialData.pagination.total.toLocaleString()} รายการ)
        </span>
      </h2>

      {/* Filters */}
      <div className="mb-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Service Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              บริการ
            </label>
            <select
              value={filters.serviceId}
              onChange={(e) => updateFilters({ serviceId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isPending}
            >
              <option value="">ทั้งหมด</option>
              {filterOptions.services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          {/* Dataset Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ชุดข้อมูล
            </label>
            <select
              value={filters.datasetId}
              onChange={(e) => updateFilters({ datasetId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isPending}
            >
              <option value="">ทั้งหมด</option>
              {filterOptions.datasets.map((dataset) => (
                <option key={dataset.id} value={dataset.id}>
                  {dataset.name}
                </option>
              ))}
            </select>
          </div>

          {/* Unit Owner Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              หน่วยงาน
            </label>
            <select
              value={filters.unitOwnerId}
              onChange={(e) => updateFilters({ unitOwnerId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isPending}
            >
              <option value="">ทั้งหมด</option>
              {filterOptions.unitOwners.map((unitOwner) => (
                <option key={unitOwner.id} value={unitOwner.id}>
                  {unitOwner.name}
                </option>
              ))}
            </select>
          </div>

          {/* User Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ผู้ใช้งาน
            </label>
            <UserSelect
              value={filters.userId}
              onChange={(userId) => updateFilters({ userId })}
              users={filterOptions.users}
              disabled={isPending}
              placeholder="ทั้งหมด"
            />
          </div>
        </div>

        {/* Clear Filters Button */}
        {hasFilters && (
          <div className="flex justify-end">
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              disabled={isPending}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              ล้างตัวกรอง
            </button>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {isPending && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="text-gray-600">กำลังโหลด...</div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto relative">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                เวลา
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                ผู้ใช้งาน
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                บริการ
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                ชุดข้อมูล
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                หน่วยงาน
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Method
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                IP
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {initialData.logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  <Timestamp date={log.createdAt} type="date-time" />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <User userId={log.userId} type="avatar-name" size="small" />
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {log.service.name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {log.service.dataset.name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {log.service.dataset.unitOwner.shortName}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded ${
                      log.service.method === 'GET'
                        ? 'bg-green-100 text-green-800'
                        : log.service.method === 'POST'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {log.service.method}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono">
                  {log.requestIp}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {initialData.logs.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            ไม่พบข้อมูล
          </div>
        )}
      </div>

      {/* Pagination */}
      {initialData.pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
          <div className="text-sm text-gray-700">
            แสดง {((filters.page - 1) * initialData.pagination.pageSize) + 1} -{' '}
            {Math.min(filters.page * initialData.pagination.pageSize, initialData.pagination.total)} จาก{' '}
            {initialData.pagination.total.toLocaleString()} รายการ
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => changePage(filters.page - 1)}
              disabled={filters.page === 1 || isPending}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              ก่อนหน้า
            </button>

            {/* Page Numbers */}
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, initialData.pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (initialData.pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (filters.page <= 3) {
                  pageNum = i + 1;
                } else if (filters.page >= initialData.pagination.totalPages - 2) {
                  pageNum = initialData.pagination.totalPages - 4 + i;
                } else {
                  pageNum = filters.page - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => changePage(pageNum)}
                    disabled={isPending}
                    className={`px-3 py-1 border rounded-md text-sm ${
                      filters.page === pageNum
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => changePage(filters.page + 1)}
              disabled={filters.page === initialData.pagination.totalPages || isPending}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              ถัดไป
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
