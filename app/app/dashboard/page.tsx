export const dynamic = 'force-dynamic';

import { getServiceUsageAnalytics } from '@/lib/actions/analytics-actions';
import { getRecentLogs, getLogFilterOptions } from '@/lib/actions/recent-logs-actions';
import DashboardClient from './dashboard-client';
import RecentLogsTable from './recent-logs-table';

interface DashboardPageProps {
  searchParams: {
    days?: string;
    serviceId?: string;
    datasetId?: string;
    unitOwnerId?: string;
    userId?: string;
    page?: string;
  };
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const dateRange = parseInt(searchParams.days || '30');
  const endDate = new Date();
  const startDate = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000);

  // Fetch analytics data
  const data = await getServiceUsageAnalytics(
    startDate.toISOString(),
    endDate.toISOString()
  );

  // Fetch recent logs with filters and pagination
  const logsData = await getRecentLogs({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    serviceId: searchParams.serviceId,
    datasetId: searchParams.datasetId,
    unitOwnerId: searchParams.unitOwnerId,
    userId: searchParams.userId,
    page: parseInt(searchParams.page || '1'),
    pageSize: 20,
  });

  // Fetch filter options
  const filterOptions = await getLogFilterOptions(
    startDate.toISOString(),
    endDate.toISOString()
  );

  return (
    <>
      <DashboardClient initialData={data} initialDateRange={dateRange} />
      <div className="container mx-auto px-6 pb-8">
        <RecentLogsTable
          initialData={logsData}
          filterOptions={filterOptions as any}
          dateRange={dateRange}
        />
      </div>
    </>
  );
}
