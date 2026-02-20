'use client';

import { useState, useEffect } from 'react';
import { Checkbox, Button, Tooltip, IconButton } from '@mui/material';
import { Icon } from '@iconify/react';
import { usePermission } from '@/components/providers/permission-provider';
import { getAllRequests, getRequestStatistics } from '@/lib/actions/request-actions';
import { getUnitOwners, getCategories, getDatasetTypes } from '@/lib/actions/admin-actions';
import { getUserToken } from '@/lib/actions/user-actions';
import { CollapsibleTable } from '@/components/ui/CollapsibleTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { RefreshButton } from '@/components/ui/RefreshButton';
import { ApprovalModal } from '@/components/modals/ApprovalModal';
import { NewReportApprovalModal } from '@/components/modals/NewReportApprovalModal';
import { FilterPanel, type FilterState } from '@/components/ui/FilterPanel';
import { RequestDetailModal } from '@/components/modals/RequestDetailModal';
import { ApprovalHistoryModal } from '@/components/modals/ApprovalHistoryModal';
import { ApprovalDetailModal } from '@/components/modals/ApprovalDetailModal';
import { ApiTestModal } from '@/components/modals/ApiTestModal';
import { User } from '@/components/ui/User';
import { SecurityLevelBadge } from '@/components/ui/SecurityLevelBadge';
import { Timestamp } from '@/components/ui/Timestamp';
import { getFileUrl } from '@/lib/file-url';
import type { Request } from '@/types';

export default function ApproverPage() {
  const { user } = usePermission();
  const [requests, setRequests] = useState<Request[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([]);
  const [unitOwners, setUnitOwners] = useState<Array<{ id: string; name: string }>>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [datasetTypes, setDatasetTypes] = useState<Array<{ id: string; name: string }>>([]);
  const [stats, setStats] = useState({ requested: 0, pending: 0, approved: 0, disapproved: 0 });
  const [selected, setSelected] = useState<{ datasetIds: string[]; serviceIds: string[]; reportIds: string[] }>({ datasetIds: [], serviceIds: [], reportIds: [] });
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [newReportApprovalOpen, setNewReportApprovalOpen] = useState(false);
  const [requestDetailOpen, setRequestDetailOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [approvalDetailOpen, setApprovalDetailOpen] = useState(false);
  const [apiTestOpen, setApiTestOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedApprovalItem, setSelectedApprovalItem] = useState<any>(null);
  const [selectedApprovalType, setSelectedApprovalType] = useState<'dataset' | 'service'>('dataset');
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedReportRequest, setSelectedReportRequest] = useState<any>(null);
  const [adminToken, setAdminToken] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    unitOwnerId: '',
    categoryId: '',
    status: '',
    typeId: '',
    securityLevel: '',
  });

  useEffect(() => {
    loadData();
    loadFilterOptions();
    if (user) {
      loadAdminToken();
    }
  }, [user]);

  // Apply filters when requests or filters change
  useEffect(() => {
    let filtered = requests;

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((r) => {
        const nameMatch = r.name.toLowerCase().includes(searchLower);
        const datasetMatch = r.requestDatasets?.some((rd: any) =>
          rd.dataset?.name.toLowerCase().includes(searchLower)
        );
        const serviceMatch = r.requestServices?.some((rs: any) =>
          rs.service?.name.toLowerCase().includes(searchLower)
        );
        return nameMatch || datasetMatch || serviceMatch;
      });
    }

    if (filters.unitOwnerId) {
      filtered = filtered.filter((r) =>
        r.requestDatasets?.some((rd: any) => rd.dataset?.unitOwnerId === filters.unitOwnerId)
      );
    }

    if (filters.categoryId) {
      filtered = filtered.filter((r) =>
        r.requestDatasets?.some((rd: any) => rd.dataset?.categoryId === filters.categoryId)
      );
    }

    if (filters.status) {
      filtered = filtered.filter((r) => {
        const hasDatasetStatus = r.requestDatasets?.some((rd: any) => rd.approveStatus === filters.status);
        const hasServiceStatus = r.requestServices?.some((rs: any) => rs.approveStatus === filters.status);
        return hasDatasetStatus || hasServiceStatus;
      });
    }

    if (filters.typeId) {
      filtered = filtered.filter((r) =>
        r.requestDatasets?.some((rd: any) => rd.dataset?.typeId === filters.typeId)
      );
    }

    setFilteredRequests(filtered);
  }, [requests, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [requestsResult, statsResult] = await Promise.all([
        getAllRequests(1, 100),
        getRequestStatistics(),
      ]);
      setRequests(requestsResult.data);
      setStats(statsResult);
    } finally {
      setLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const [unitOwnersResult, categoriesResult, typesResult] = await Promise.all([
        getUnitOwners(1, 100),
        getCategories(1, 100),
        getDatasetTypes(1, 100),
      ]);
      setUnitOwners(unitOwnersResult.data);
      setCategories(categoriesResult.data);
      setDatasetTypes(typesResult.data);
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const loadAdminToken = async () => {
    if (!user) return;
    const token = await getUserToken(user.id);
    setAdminToken(token || '');
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleSelectDataset = (id: string, checked: boolean) => {
    setSelected((prev) => ({
      ...prev,
      datasetIds: checked ? [...prev.datasetIds, id] : prev.datasetIds.filter((x) => x !== id),
    }));
  };

  const handleSelectService = (id: string, checked: boolean) => {
    setSelected((prev) => ({
      ...prev,
      serviceIds: checked ? [...prev.serviceIds, id] : prev.serviceIds.filter((x) => x !== id),
    }));
  };

  const handleSelectReport = (id: string, checked: boolean) => {
    setSelected((prev) => ({
      ...prev,
      reportIds: checked ? [...prev.reportIds, id] : prev.reportIds.filter((x) => x !== id),
    }));
  };

  const handleSelectRequest = (request: Request, checked: boolean) => {
    const datasetIds = request.requestDatasets?.map((rd) => rd.id) || [];
    const serviceIds = request.requestServices?.map((rs) => rs.id) || [];
    // Only select existing reports (not new report requests)
    const reportIds = request.requestReports?.filter((rr: any) => rr.report).map((rr: any) => rr.id) || [];

    if (checked) {
      setSelected((prev) => ({
        datasetIds: [...prev.datasetIds, ...datasetIds],
        serviceIds: [...prev.serviceIds, ...serviceIds],
        reportIds: [...prev.reportIds, ...reportIds],
      }));
    } else {
      setSelected((prev) => ({
        datasetIds: prev.datasetIds.filter((id) => !datasetIds.includes(id)),
        serviceIds: prev.serviceIds.filter((id) => !serviceIds.includes(id)),
        reportIds: prev.reportIds.filter((id) => !reportIds.includes(id)),
      }));
    }
  };

  const handleViewRequest = (request: any) => {
    setSelectedRequest(request);
    setRequestDetailOpen(true);
  };

  const handleViewHistory = (item: any) => {
    setSelectedItem(item);
    setHistoryOpen(true);
  };

  const handleViewApprovalDetail = (item: any, type: 'dataset' | 'service') => {
    setSelectedApprovalItem(item);
    setSelectedApprovalType(type);
    setApprovalDetailOpen(true);
  };

  const handleTestApi = (service: any) => {
    setSelectedService(service);
    setApiTestOpen(true);
  };

  const totalSelected = selected.datasetIds.length + selected.serviceIds.length + selected.reportIds.length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">การอนุมัติ</h1>
          <p className="text-gray-600">อนุมัติคำขอใช้ข้อมูล</p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton onRefresh={loadData} />
          {totalSelected > 0 && (
            <Button variant="contained" onClick={() => setApprovalOpen(true)}>
              ดำเนินการ ({totalSelected})
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
              <Icon icon="mdi:file-document" className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">คำขอใหม่</p>
              <p className="text-2xl font-bold text-gray-900">{stats.requested}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-orange-100 rounded-lg p-3">
              <Icon icon="mdi:clock" className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">กำลังพิจารณา</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
              <Icon icon="mdi:check-circle" className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">อนุมัติแล้ว</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-red-100 rounded-lg p-3">
              <Icon icon="mdi:close-circle" className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">ไม่อนุมัติ</p>
              <p className="text-2xl font-bold text-gray-900">{stats.disapproved}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        onFilterChange={handleFilterChange}
        unitOwners={unitOwners}
        categories={categories}
        datasetTypes={datasetTypes}
        showUnitOwner
        showCategory
        showSearch
        showStatus
        showDatasetType
        placeholder="ค้นหาชื่อผู้ขอ, ชุดข้อมูล, บริการ..."
      />

      {/* Requests Table */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center py-12">
            <Icon icon="mdi:check-circle" className="mx-auto w-12 h-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่มีรายการรออนุมัติ</h3>
          </div>
        </div>
      ) : (
        <CollapsibleTable
          columns={[
            {
              id: 'select',
              label: (
                <Checkbox
                  size="small"
                  checked={filteredRequests.length > 0 && filteredRequests.every((r) => {
                    const allIds = [
                      ...(r.requestDatasets?.map((rd) => rd.id) || []),
                      ...(r.requestServices?.map((rs) => rs.id) || []),
                      ...(r.requestReports?.filter((rr: any) => rr.report).map((rr: any) => rr.id) || []),
                    ];
                    return allIds.length === 0 || allIds.every((id) =>
                      [...selected.datasetIds, ...selected.serviceIds, ...selected.reportIds].includes(id)
                    );
                  })}
                  onChange={(e) => {
                    if (e.target.checked) {
                      filteredRequests.forEach((r) => handleSelectRequest(r, true));
                    } else {
                      setSelected({ datasetIds: [], serviceIds: [], reportIds: [] });
                    }
                  }}
                />
              ) as any,
            },
            { id: 'createdAt', label: 'วันที่' },
            { id: 'name', label: 'ชื่อผู้ขอ' },
            { id: 'unit', label: 'หน่วยงาน' },
            { id: 'type', label: 'ประเภท', align: 'center' },
            { id: 'requestedBy', label: 'ผู้ขอ', align: 'center' },
            { id: 'actions', label: '', align: 'right' },
          ]}
          rows={filteredRequests.map((r) => {
            const allIds = [
              ...(r.requestDatasets?.map((rd) => rd.id) || []),
              ...(r.requestServices?.map((rs) => rs.id) || []),
              ...(r.requestReports?.filter((rr: any) => rr.report && !rr.isNewReport).map((rr: any) => rr.id) || []),
            ];
            const isSelected = allIds.length > 0 && allIds.every((id) =>
              [...selected.datasetIds, ...selected.serviceIds, ...selected.reportIds].includes(id)
            );

            // Check if request has selectable items (not only new reports)
            const hasSelectableItems = allIds.length > 0;

            // Check if this request has ONLY new reports (and nothing else)
            const hasOnlyNewReports = !hasSelectableItems &&
              r.requestReports &&
              r.requestReports.length > 0 &&
              r.requestReports.every((rr: any) => rr.isNewReport);

            // Get the first new report if this is a new report request
            const firstNewReport = hasOnlyNewReports ? r.requestReports[0] : null;

            // New report: show button for all status EXCEPT REQUESTED (PENDING, INPROGRESS, APPROVED, DISAPPROVED can edit)
            const canEditNewReport = firstNewReport && firstNewReport.approveStatus !== 'REQUESTED';

            return {
              ...r,
              createdAt: <Timestamp date={r.createdAt} type="date-time" />,
              type: (
                <div className="flex flex-wrap gap-1 justify-center">
                  {r.requestDatasets && r.requestDatasets.length > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      ชุดข้อมูล ({r.requestDatasets.length})
                    </span>
                  )}
                  {r.requestReports && r.requestReports.filter((rr: any) =>
                    rr.report && !rr.isNewReport
                  ).length > 0 && (
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                      รายงาน ({r.requestReports.filter((rr: any) =>
                        rr.report && !rr.isNewReport
                      ).length})
                    </span>
                  )}
                  {r.requestReports && r.requestReports.filter((rr: any) =>
                    rr.isNewReport
                  ).length > 0 && (
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded">
                      รายงานใหม่ ({r.requestReports.filter((rr: any) =>
                        rr.isNewReport
                      ).length})
                    </span>
                  )}
                </div>
              ),
              requestedBy: r.requestedBy && <User userId={r.requestedBy} displayName={r.name} type="avatar" size="small" />,
              select: hasSelectableItems ? (
                <Checkbox
                  size="small"
                  checked={isSelected}
                  onChange={(e) => handleSelectRequest(r, e.target.checked)}
                />
              ) : null,
              actions: (
                <div className="flex gap-1">
                  <Tooltip title="ดูรายละเอียดคำขอ">
                    <IconButton size="small" onClick={() => handleViewRequest(r)}>
                      <Icon icon="mdi:text-box-search" className="w-5 h-5 text-blue-600" />
                    </IconButton>
                  </Tooltip>
                  {/* Show button for selectable items (datasets/services/existing reports) */}
                  {hasSelectableItems && (
                    <Tooltip title="ดำเนินการ">
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => {
                          handleSelectRequest(r, true);
                          setApprovalOpen(true);
                        }}
                      >
                        <Icon icon="mdi:cog" className="w-5 h-5" />
                      </Button>
                    </Tooltip>
                  )}
                  {/* Show button for new report (when no other items) - all status except REQUESTED */}
                  {hasOnlyNewReports && canEditNewReport && (
                    <Tooltip title="แก้ไขรายงาน">
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => {
                          setSelectedReportRequest(firstNewReport);
                          setNewReportApprovalOpen(true);
                        }}
                      >
                        <Icon icon="mdi:pencil" className="w-5 h-5" />
                      </Button>
                    </Tooltip>
                  )}
                  {/* Show button for new report with REQUESTED status */}
                  {hasOnlyNewReports && firstNewReport && firstNewReport.approveStatus === 'REQUESTED' && (
                    <Tooltip title="อนุมัติและสร้างรายงาน">
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => {
                          setSelectedReportRequest(firstNewReport);
                          setNewReportApprovalOpen(true);
                        }}
                      >
                        <Icon icon="mdi:plus-circle" className="w-5 h-5" />
                      </Button>
                    </Tooltip>
                  )}
                </div>
              ),
            };
          })}
          getRowId={(row) => row.id}
          renderCollapse={(row) => {
            // Check if this request has ONLY new reports
            const hasOnlyNewReports = (
              (!row.requestDatasets || row.requestDatasets.length === 0) &&
              (!row.requestServices || row.requestServices.length === 0) &&
              row.requestReports &&
              row.requestReports.length > 0 &&
              row.requestReports.every((rr: any) => rr.isNewReport)
            );

            return (
            <div className="space-y-3 p-4">
              {/* Datasets */}
              {row.requestDatasets && row.requestDatasets.length > 0 && (
                <div className="space-y-2">
                  {row.requestDatasets.map((rd: any) => (
                    <div key={rd.id} className="bg-blue-50 rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between p-3 bg-blue-100">
                        <div className="flex items-center gap-3 flex-1">
                          <Checkbox
                            size="small"
                            checked={selected.datasetIds.includes(rd.id)}
                            onChange={(e) => handleSelectDataset(rd.id, e.target.checked)}
                          />
                          <Icon icon="mdi:database" className="w-5 h-5 text-blue-700" />
                          <span className="font-semibold text-blue-900">{rd.dataset?.name}</span>
                          {rd.dataset?.securityLevel && (
                            <SecurityLevelBadge level={rd.dataset.securityLevel} size="sm" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {rd.dataset?.metadata && (
                            <Tooltip title="ดู Metadata">
                              <IconButton size="small" onClick={() => window.open(getFileUrl(rd.dataset.metadata) || rd.dataset.metadata, '_blank')}>
                                <Icon icon="mdi:file-document" className="w-5 h-5 text-blue-600" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {rd.dataset?.datadict && (
                            <Tooltip title="ดู Data Dictionary">
                              <IconButton size="small" onClick={() => window.open(getFileUrl(rd.dataset.datadict) || rd.dataset.datadict, '_blank')}>
                                <Icon icon="mdi:file-document" className="w-5 h-5 text-green-600" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="ดูประวัติการอนุมัติ">
                            <IconButton size="small" onClick={() => handleViewHistory(rd)}>
                              <Icon icon="mdi:history" className="w-5 h-5" />
                            </IconButton>
                          </Tooltip>
                          <StatusBadge
                            status={rd.approveStatus}
                            onClick={() => handleViewApprovalDetail(rd, 'dataset')}
                            clickable={rd.approveStatus !== 'REQUESTED'}
                          />
                        </div>
                      </div>

                      {/* Services under this dataset */}
                      {row.requestServices && row.requestServices.filter((rs: any) => rs.service?.datasetId === rd.dataset?.id).length > 0 && (
                        <div className="p-2 space-y-1">
                          {row.requestServices
                            .filter((rs: any) => rs.service?.datasetId === rd.dataset?.id)
                            .map((rs: any) => (
                              <div key={rs.id} className="flex items-center justify-between bg-white p-2 rounded">
                                <div className="flex items-center gap-3 flex-1">
                                  <Checkbox
                                    size="small"
                                    checked={selected.serviceIds.includes(rs.id)}
                                    onChange={(e) => handleSelectService(rs.id, e.target.checked)}
                                  />
                                  <Icon icon="mdi:api" className="w-4 h-4 text-green-600" />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">{rs.service?.name}</p>
                                    <p className="text-xs text-gray-600">{rs.service?.method} {rs.service?.api}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Tooltip title="ทดสอบ API">
                                    <IconButton size="small" onClick={() => handleTestApi(rs.service)}>
                                      <Icon icon="mdi:api" className="w-5 h-5 text-green-600" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="ดูประวัติการอนุมัติ">
                                    <IconButton size="small" onClick={() => handleViewHistory(rs)}>
                                      <Icon icon="mdi:history" className="w-5 h-5" />
                                    </IconButton>
                                  </Tooltip>
                                  <StatusBadge
                                    status={rs.approveStatus}
                                    onClick={() => handleViewApprovalDetail(rs, 'service')}
                                    clickable={rs.approveStatus !== 'REQUESTED'}
                                  />
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Reports */}
              {row.requestReports && row.requestReports.length > 0 && (
                <div className="space-y-2">
                  {row.requestReports.map((rr: any) => (
                    <div key={rr.id} className="bg-purple-50 rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between p-3 bg-purple-100">
                        <div className="flex items-center gap-3 flex-1">
                          {rr.report && (
                            <Checkbox
                              size="small"
                              checked={selected.reportIds.includes(rr.id)}
                              onChange={(e) => handleSelectReport(rr.id, e.target.checked)}
                            />
                          )}
                          <Icon icon="mdi:file-chart" className="w-5 h-5 text-purple-700" />
                          <div className="flex-1">
                            <span className="font-semibold text-purple-900">
                              {rr.report?.name || rr.title || 'รายงานใหม่'}
                            </span>
                            {!rr.report && (
                              <span className="ml-2 text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded">
                                รอสร้าง
                              </span>
                            )}
                            {rr.report?.securityLevel && (
                              <SecurityLevelBadge level={rr.report.securityLevel} size="sm" />
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Hide green button if this is a "new report only" request (button is at request level) */}
                          {!hasOnlyNewReports && rr.isNewReport && ['REQUESTED', 'PENDING', 'INPROGRESS'].includes(rr.approveStatus) && (
                            <Tooltip title={rr.approveStatus === 'REQUESTED' ? 'อนุมัติและสร้างรายงาน' : 'แก้ไขรายงาน'}>
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={() => {
                                  setSelectedReportRequest(rr);
                                  setNewReportApprovalOpen(true);
                                }}
                              >
                                <Icon icon={rr.approveStatus === 'REQUESTED' ? 'mdi:plus-circle' : 'mdi:pencil'} className="w-5 h-5" />
                              </Button>
                            </Tooltip>
                          )}
                          <Tooltip title="ดูประวัติการอนุมัติ">
                            <IconButton size="small" onClick={() => handleViewHistory(rr)}>
                              <Icon icon="mdi:history" className="w-5 h-5" />
                            </IconButton>
                          </Tooltip>
                          <StatusBadge
                            status={rr.approveStatus}
                            onClick={() => handleViewApprovalDetail(rr, 'report' as any)}
                            clickable={rr.approveStatus !== 'REQUESTED'}
                          />
                        </div>
                      </div>

                      {/* Show new report request details */}
                      {!rr.report && (
                        <div className="p-3 bg-purple-25 space-y-2">
                          {rr.detail && (
                            <p className="text-sm text-gray-700">{rr.detail}</p>
                          )}
                          {rr.selectedDatasets && rr.selectedDatasets.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-600">ชุดข้อมูลที่เลือก:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {rr.selectedDatasets.map((ds: any) => (
                                  <span key={ds.id} className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                    {ds.dataset?.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {rr.designFiles && rr.designFiles.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-600">Design Files:</p>
                              <div className="space-y-1 mt-1">
                                {rr.designFiles.map((file: any) => (
                                  <a
                                    key={file.id}
                                    href={getFileUrl(file.filePath) || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                                  >
                                    <Icon icon="mdi:file-design" className="w-3.5 h-3.5" />
                                    {file.fileName}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                          {row.request?.requestFiles && row.request.requestFiles.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-600">หลักฐานประกอบ:</p>
                              <div className="space-y-1 mt-1">
                                {row.request.requestFiles.map((file: any) => (
                                  <a
                                    key={file.id}
                                    href={getFileUrl(file.filePath) || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                                  >
                                    <Icon icon="mdi:file-document" className="w-3.5 h-3.5" />
                                    {file.fileName}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            );
          }}
        />
      )}

      {/* Modals */}
      <ApprovalModal
        open={approvalOpen}
        onClose={() => setApprovalOpen(false)}
        selectedItems={selected}
        requests={requests}
        onSuccess={() => {
          loadData();
          setSelected({ datasetIds: [], serviceIds: [], reportIds: [] });
        }}
        userId={user?.id || ''}
      />

      <RequestDetailModal
        open={requestDetailOpen}
        onClose={() => setRequestDetailOpen(false)}
        request={selectedRequest}
      />

      <ApprovalHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        item={selectedItem}
      />

      <ApprovalDetailModal
        open={approvalDetailOpen}
        onClose={() => setApprovalDetailOpen(false)}
        item={selectedApprovalItem}
        type={selectedApprovalType}
      />

      <ApiTestModal
        open={apiTestOpen}
        onClose={() => setApiTestOpen(false)}
        service={selectedService}
        token={adminToken}
      />

      <NewReportApprovalModal
        open={newReportApprovalOpen}
        onClose={() => {
          setNewReportApprovalOpen(false);
          setSelectedReportRequest(null);
        }}
        requestReport={selectedReportRequest}
        userId={user?.id || ''}
      />
    </div>
  );
}
