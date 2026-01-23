'use client';

import { useState, useEffect } from 'react';
import { Checkbox, Button, Tooltip, IconButton } from '@mui/material';
import { Icon } from '@iconify/react';
import { usePermission } from '@/components/providers/permission-provider';
import { getAllRequests, getRequestStatistics } from '@/lib/actions/request-actions';
import { getUnitOwners, getCategories } from '@/lib/actions/admin-actions';
import { getUserToken } from '@/lib/actions/user-actions';
import { CollapsibleTable } from '@/components/ui/CollapsibleTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { RefreshButton } from '@/components/ui/RefreshButton';
import { ApprovalModal } from '@/components/modals/ApprovalModal';
import { FilterPanel, type FilterState } from '@/components/ui/FilterPanel';
import { RequestDetailModal } from '@/components/modals/RequestDetailModal';
import { ApprovalHistoryModal } from '@/components/modals/ApprovalHistoryModal';
import { ApiTestModal } from '@/components/modals/ApiTestModal';
import { User } from '@/components/ui/User';
import type { Request } from '@/types';

export default function ApproverPage() {
  const { user } = usePermission();
  const [requests, setRequests] = useState<Request[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([]);
  const [unitOwners, setUnitOwners] = useState<Array<{ id: string; name: string }>>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [stats, setStats] = useState({ requested: 0, pending: 0, approved: 0, disapproved: 0 });
  const [selected, setSelected] = useState<{ datasetIds: string[]; serviceIds: string[] }>({ datasetIds: [], serviceIds: [] });
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [requestDetailOpen, setRequestDetailOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [apiTestOpen, setApiTestOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [adminToken, setAdminToken] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    unitOwnerId: '',
    categoryId: '',
    status: '',
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
      const [unitOwnersResult, categoriesResult] = await Promise.all([
        getUnitOwners(1, 100),
        getCategories(1, 100),
      ]);
      setUnitOwners(unitOwnersResult.data);
      setCategories(categoriesResult.data);
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

  const handleSelectRequest = (request: Request, checked: boolean) => {
    const datasetIds = request.requestDatasets?.map((rd) => rd.id) || [];
    const serviceIds = request.requestServices?.map((rs) => rs.id) || [];

    if (checked) {
      setSelected((prev) => ({
        datasetIds: [...prev.datasetIds, ...datasetIds],
        serviceIds: [...prev.serviceIds, ...serviceIds],
      }));
    } else {
      setSelected((prev) => ({
        datasetIds: prev.datasetIds.filter((id) => !datasetIds.includes(id)),
        serviceIds: prev.serviceIds.filter((id) => !serviceIds.includes(id)),
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

  const handleTestApi = (service: any) => {
    setSelectedService(service);
    setApiTestOpen(true);
  };

  const totalSelected = selected.datasetIds.length + selected.serviceIds.length;

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
        showUnitOwner
        showCategory
        showSearch
        showStatus
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
                    ];
                    return allIds.every((id) =>
                      [...selected.datasetIds, ...selected.serviceIds].includes(id)
                    );
                  })}
                  onChange={(e) => {
                    if (e.target.checked) {
                      filteredRequests.forEach((r) => handleSelectRequest(r, true));
                    } else {
                      setSelected({ datasetIds: [], serviceIds: [] });
                    }
                  }}
                />
              ) as any,
            },
            { id: 'createdAt', label: 'วันที่' },
            { id: 'name', label: 'ชื่อผู้ขอ' },
            { id: 'unit', label: 'หน่วยงาน' },
            { id: 'requestedBy', label: 'ผู้ขอ', align: 'center' },
            { id: 'actions', label: '', align: 'right' },
          ]}
          rows={filteredRequests.map((r) => {
            const allIds = [
              ...(r.requestDatasets?.map((rd) => rd.id) || []),
              ...(r.requestServices?.map((rs) => rs.id) || []),
            ];
            const isSelected = allIds.length > 0 && allIds.every((id) =>
              [...selected.datasetIds, ...selected.serviceIds].includes(id)
            );

            return {
              ...r,
              createdAt: new Date(r.createdAt).toLocaleDateString('th-TH'),
              requestedBy: r.requestedBy && <User userId={r.requestedBy} displayName={r.name} type="avatar" size="small" />,
              select: (
                <Checkbox
                  size="small"
                  checked={isSelected}
                  onChange={(e) => handleSelectRequest(r, e.target.checked)}
                />
              ),
              actions: (
                <div className="flex gap-1">
                  <Tooltip title="ดูรายละเอียดคำขอ">
                    <IconButton size="small" onClick={() => handleViewRequest(r)}>
                      <Icon icon="mdi:file-document" className="w-5 h-5" />
                    </IconButton>
                  </Tooltip>
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
                </div>
              ),
            };
          })}
          getRowId={(row) => row.id}
          renderCollapse={(row) => (
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
                        </div>
                        <div className="flex items-center gap-2">
                          {rd.dataset?.metadata && (
                            <Tooltip title="ดู Metadata">
                              <IconButton size="small" onClick={() => window.open(rd.dataset.metadata, '_blank')}>
                                <Icon icon="mdi:file-document" className="w-5 h-5 text-blue-600" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="ดูประวัติการอนุมัติ">
                            <IconButton size="small" onClick={() => handleViewHistory(rd)}>
                              <Icon icon="mdi:history" className="w-5 h-5" />
                            </IconButton>
                          </Tooltip>
                          <StatusBadge status={rd.approveStatus} />
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
                                <div className="flex items-center gap-2">
                                  <Tooltip title="ทดสอบ API">
                                    <IconButton size="small" onClick={() => handleTestApi(rs.service)}>
                                      <Icon icon="mdi:play-circle" className="w-5 h-5 text-green-600" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="ดูประวัติการอนุมัติ">
                                    <IconButton size="small" onClick={() => handleViewHistory(rs)}>
                                      <Icon icon="mdi:history" className="w-5 h-5" />
                                    </IconButton>
                                  </Tooltip>
                                  <StatusBadge status={rs.approveStatus} />
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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
          setSelected({ datasetIds: [], serviceIds: [] });
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

      <ApiTestModal
        open={apiTestOpen}
        onClose={() => setApiTestOpen(false)}
        service={selectedService}
        token={adminToken}
      />
    </div>
  );
}
