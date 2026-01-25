'use client';

import { useRouter } from 'next/navigation';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Timestamp } from '@/components/ui/Timestamp';
import { User } from '@/components/ui/User';
import type { ServiceUsageAnalytics } from '@/lib/actions/analytics-actions';

interface DashboardClientProps {
  initialData: ServiceUsageAnalytics;
  initialDateRange: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function DashboardClient({ initialData, initialDateRange }: DashboardClientProps) {
  const router = useRouter();
  const data = initialData;
  const dateRange = initialDateRange;

  const handleDateRangeChange = (days: number) => {
    router.push(`/app/dashboard?days=${days}`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">สถิติการใช้งานบริการ</h1>
          <p className="text-gray-600 mt-1">
            วิเคราะห์และติดตามการใช้งานบริการข้อมูล
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleDateRangeChange(7)}
            className={`px-4 py-2 rounded-md ${
              dateRange === 7 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            7 วัน
          </button>
          <button
            onClick={() => handleDateRangeChange(30)}
            className={`px-4 py-2 rounded-md ${
              dateRange === 30 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            30 วัน
          </button>
          <button
            onClick={() => handleDateRangeChange(90)}
            className={`px-4 py-2 rounded-md ${
              dateRange === 90 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            90 วัน
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <h3 className="text-gray-600 text-sm font-medium">จำนวนคำขอทั้งหมด</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {data.summary.totalRequests.toLocaleString()}
          </p>
          <p className="text-gray-500 text-xs mt-1">
            ช่วง {dateRange} วันที่ผ่านมา
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <h3 className="text-gray-600 text-sm font-medium">ผู้ใช้งานที่ไม่ซ้ำ</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {data.summary.uniqueUsers.toLocaleString()}
          </p>
          <p className="text-gray-500 text-xs mt-1">
            ผู้ใช้งานที่มีการเข้าใช้
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <h3 className="text-gray-600 text-sm font-medium">เฉลี่ยต่อวัน</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {Math.round(data.summary.totalRequests / dateRange).toLocaleString()}
          </p>
          <p className="text-gray-500 text-xs mt-1">
            คำขอเฉลี่ยต่อวัน
          </p>
        </div>
      </div>

      {/* Daily Usage Trend */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">แนวโน้มการใช้งานรายวัน</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.dailyUsage}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getDate()}/${date.getMonth() + 1}`;
              }}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('th-TH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                });
              }}
              formatter={(value: any) => [value, 'จำนวนคำขอ']}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={2}
              name="จำนวนคำขอ"
              dot={{ fill: '#3b82f6' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Hourly and Weekday Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Usage Pattern */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">รูปแบบการใช้งานตามชั่วโมง</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.hourlyUsage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip formatter={(value: any) => [value, 'จำนวนคำขอ']} />
              <Bar dataKey="count" fill="#10b981" name="จำนวนคำขอ" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Day of Week Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">การกระจายตามวัน</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.weekdayUsage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(value: any) => [value, 'จำนวนคำขอ']} />
              <Bar dataKey="count" fill="#f59e0b" name="จำนวนคำขอ" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Services and Datasets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Services */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">10 บริการที่ใช้มากที่สุด</h2>
          <div className="overflow-auto max-h-96">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">อันดับ</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">บริการ</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ชุดข้อมูล</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">หน่วยงาน</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">จำนวน</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.topServices.map((service, index) => (
                  <tr key={service.serviceId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        index === 0 ? 'bg-yellow-400 text-yellow-900' :
                        index === 1 ? 'bg-gray-300 text-gray-900' :
                        index === 2 ? 'bg-orange-400 text-orange-900' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{service.serviceName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-600">{service.datasetName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-600">{service.unitOwnerName}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {service.count.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Datasets */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">10 ชุดข้อมูลที่ใช้มากที่สุด</h2>
          <div className="space-y-3">
            {data.topDatasets.map((dataset, index) => (
              <div
                key={dataset.datasetId}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className={`flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                    index === 0 ? 'bg-yellow-400 text-yellow-900' :
                    index === 1 ? 'bg-gray-300 text-gray-900' :
                    index === 2 ? 'bg-orange-400 text-orange-900' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {dataset.datasetName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {dataset.unitOwner.shortName}
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {dataset.count.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">คำขอ</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Users and Unit Owners */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Users */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">10 ผู้ใช้งานที่มีกิจกรรมมากที่สุด</h2>
          <div className="space-y-2">
            {data.topUsers.map((user, index) => (
              <div
                key={user.userId}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className={`flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                    index === 0 ? 'bg-yellow-400 text-yellow-900' :
                    index === 1 ? 'bg-gray-300 text-gray-900' :
                    index === 2 ? 'bg-orange-400 text-orange-900' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <User userId={user.userId} type="avatar-name" size="small" />
                  </div>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {user.count.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">คำขอ</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Unit Owners */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">10 หน่วยงานที่ชุดข้อมูลถูกใช้มากที่สุด</h2>
          <div className="space-y-2">
            {data.topUnitOwners.map((unitOwner, index) => (
              <div
                key={unitOwner.unitOwnerId}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className={`flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                    index === 0 ? 'bg-yellow-400 text-yellow-900' :
                    index === 1 ? 'bg-gray-300 text-gray-900' :
                    index === 2 ? 'bg-orange-400 text-orange-900' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {unitOwner.unitOwnerName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {unitOwner.unitOwnerShortName}
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {unitOwner.count.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">คำขอ</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
