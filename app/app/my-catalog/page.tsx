'use client';

import { useState, useEffect } from 'react';
import { TextField, InputAdornment, IconButton, Tooltip } from '@mui/material';
import { Icon } from '@iconify/react';
import { usePermission } from '@/components/providers/permission-provider';
import { getUserApprovedItems } from '@/lib/actions/catalog-actions';
import { getUserToken, regenerateUserToken } from '@/lib/actions/user-actions';
import { getUnitOwners, getCategories, getDatasetTypes } from '@/lib/actions/admin-actions';
import { CollapsibleTable } from '@/components/ui/CollapsibleTable';
import { RefreshButton } from '@/components/ui/RefreshButton';
import { ApiTestModal } from '@/components/modals/ApiTestModal';
import { RequestDetailModal } from '@/components/modals/RequestDetailModal';
import { ApprovalDetailModal } from '@/components/modals/ApprovalDetailModal';
import { FilterPanel, type FilterState } from '@/components/ui/FilterPanel';
import { SecurityLevelBadge } from '@/components/ui/SecurityLevelBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Dataset, Service } from '@/types';

export default function MyCatalogPage() {
  const { user } = usePermission();
  const [datasets, setDatasets] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [unitOwners, setUnitOwners] = useState<Array<{ id: string; name: string }>>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [datasetTypes, setDatasetTypes] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [userToken, setUserToken] = useState<string>('');
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [apiTestOpen, setApiTestOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [approvalDetailOpen, setApprovalDetailOpen] = useState(false);
  const [selectedApprovalItem, setSelectedApprovalItem] = useState<any>(null);
  const [selectedApprovalType, setSelectedApprovalType] = useState<'dataset' | 'service'>('dataset');

  useEffect(() => {
    if (user) {
      loadData();
      loadToken();
      loadFilterOptions();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await getUserApprovedItems(user.id);
      setDatasets(result.datasets);
      setServices(result.services);
    } finally {
      setLoading(false);
    }
  };

  const loadToken = async () => {
    if (!user) return;
    const token = await getUserToken(user.id);
    setUserToken(token || '');
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

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    unitOwnerId: '',
    categoryId: '',
    status: '',
    typeId: '',
  });

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  // Apply filters when datasets, services, or filters change
  useEffect(() => {
    const grouped = datasets.map((rd) => {
      const datasetServices = services.filter((rs) => rs.service?.datasetId === rd.dataset?.id);
      return {
        requestDataset: rd,
        dataset: rd.dataset,
        services: datasetServices,
      };
    });

    let filtered = grouped;

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((item) => {
        const datasetMatch = item.dataset?.name.toLowerCase().includes(searchLower);
        const serviceMatch = item.services?.some((s: any) =>
          s.service?.name.toLowerCase().includes(searchLower)
        );
        return datasetMatch || serviceMatch;
      });
    }

    if (filters.unitOwnerId) {
      filtered = filtered.filter((item) => item.dataset?.unitOwnerId === filters.unitOwnerId);
    }

    if (filters.categoryId) {
      filtered = filtered.filter((item) => item.dataset?.categoryId === filters.categoryId);
    }

    if (filters.status) {
      filtered = filtered.filter((item) => item.requestDataset?.approveStatus === filters.status);
    }

    if (filters.typeId) {
      filtered = filtered.filter((item) => item.dataset?.typeId === filters.typeId);
    }

    setFilteredData(filtered);
  }, [datasets, services, filters]);

  const handleCopyToken = () => {
    if (userToken) {
      navigator.clipboard.writeText(userToken);
      alert('คัดลอก Token แล้ว');
    }
  };

  const handleRefreshToken = async () => {
    if (!user) return;
    if (confirm('คุณต้องการ Reset Token ใช่หรือไม่? Token เดิมจะไม่สามารถใช้งานได้อีก')) {
      const result = await regenerateUserToken(user.id);
      if (result.success && result.token) {
        setUserToken(result.token);
        alert('Reset Token สำเร็จ');
      } else {
        alert('เกิดข้อผิดพลาด: ' + (result.error || 'ไม่สามารถ Reset Token ได้'));
      }
    }
  };

  const handleOpenApiTest = (service: any) => {
    setSelectedService(service);
    setApiTestOpen(true);
  };

  const handleViewApprovalDetail = (item: any, type: 'dataset' | 'service') => {
    setSelectedApprovalItem(item);
    setSelectedApprovalType(type);
    setApprovalDetailOpen(true);
  };

  const handleViewRequest = (requestId: string) => {
    // Find all datasets and services for this request
    const requestDatasets = datasets.filter((rd) => rd.request?.id === requestId);
    const requestServices = services.filter((rs) => rs.request?.id === requestId);

    // Get the request object from the first item
    const request = requestDatasets[0]?.request || requestServices[0]?.request;

    if (request) {
      setSelectedRequest({
        ...request,
        requestDatasets: requestDatasets,
        requestServices: requestServices,
      });
      setRequestDialogOpen(true);
    }
  };

  const displayData = filteredData;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ชุดข้อมูลของฉัน</h1>
          <p className="text-gray-600">ดูรายการชุดข้อมูลและบริการที่ได้รับอนุมัติ</p>
        </div>
        <RefreshButton onRefresh={loadData} />
      </div>

      {/* Token Field */}
      <div className="bg-blue-50 p-4 rounded-lg mb-4">
        <div className="flex items-center gap-2">
          <TextField
            fullWidth
            label="API Token"
            type={showToken ? 'text' : 'password'}
            value={userToken || 'ไม่มี Token'}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowToken(!showToken)} edge="end" size="small">
                    <Icon icon={showToken ? 'mdi:eye-off' : 'mdi:eye'} className="w-5 h-5" />
                  </IconButton>
                  <Tooltip title="คัดลอก Token">
                    <IconButton onClick={handleCopyToken} edge="end" size="small">
                      <Icon icon="mdi:content-copy" className="w-5 h-5" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Refresh Token">
                    <IconButton onClick={handleRefreshToken} edge="end" size="small" color="warning">
                      <Icon icon="mdi:refresh" className="w-5 h-5" />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
            size="small"
            sx={{ bgcolor: 'white' }}
          />
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
      />

      {displayData.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center py-12">
            <Icon icon="mdi:database-off" className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีชุดข้อมูล</h3>
            <p className="text-gray-500">คุณยังไม่มีชุดข้อมูลที่ได้รับอนุมัติ</p>
          </div>
        </div>
      ) : (
        <CollapsibleTable
          columns={[
            { id: 'name', label: 'ชื่อชุดข้อมูล' },
            { id: 'unitOwner', label: 'หน่วยงาน', format: (row: any) => row.dataset?.unitOwner?.name || '-' },
            { id: 'category', label: 'นโยบาย', format: (row: any) => row.dataset?.category?.name || '-' },
            {
              id: 'securityLevel',
              label: 'ชั้นความลับ',
              align: 'center',
              format: (row: any) => <SecurityLevelBadge level={row.dataset?.securityLevel} size="sm" />
            },
            {
              id: 'metadata',
              label: 'Metadata',
              align: 'center',
              format: (row: any) => row.dataset?.metadata ? (
                <Tooltip title="ดู Metadata">
                  <IconButton size="small" onClick={() => window.open(row.dataset.metadata, '_blank')}>
                    <Icon icon="mdi:file-document" className="w-5 h-5 text-blue-600" />
                  </IconButton>
                </Tooltip>
              ) : '-'
            },
            { id: 'status', label: 'สถานะ', align: 'center' },
            { id: 'actions', label: 'รายละเอียดคำขอ', align: 'center' },
          ]}
          rows={displayData.map((item) => ({
            ...item,
            name: item.dataset?.name,
            status: (
              <StatusBadge
                status={item.requestDataset?.approveStatus}
                onClick={() => handleViewApprovalDetail(item.requestDataset, 'dataset')}
                clickable={item.requestDataset?.approveStatus !== 'REQUESTED'}
              />
            ),
            actions: (
              <Tooltip title="ดูรายละเอียดคำขอ">
                <IconButton
                  size="small"
                  onClick={() => handleViewRequest(item.requestDataset?.request?.id)}
                >
                  <Icon icon="mdi:text-box-search" className="w-5 h-5 text-blue-600" />
                </IconButton>
              </Tooltip>
            ),
          }))}
          getRowId={(row) => row.requestDataset?.id || row.dataset?.id}
          renderCollapse={(row) => (
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold mb-3">บริการข้อมูล</h4>
              {row.services?.length === 0 ? (
                <p className="text-sm text-gray-600">ไม่มีบริการข้อมูลที่อนุมัติ</p>
              ) : (
                <div className="space-y-2">
                  {row.services?.map((rs: any) => {
                    const isApproved = rs.approveStatus === 'APPROVED';
                    return (
                      <div key={rs.id} className="flex justify-between items-center bg-white p-3 rounded">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{rs.service?.name}</p>
                            <StatusBadge
                              status={rs.approveStatus}
                              onClick={() => handleViewApprovalDetail(rs, 'service')}
                              clickable={rs.approveStatus !== 'REQUESTED'}
                            />
                          </div>
                          <p className="text-xs text-gray-600">{rs.service?.method} {rs.service?.api}</p>
                        </div>
                        <div className="flex gap-1">
                          <Tooltip title={isApproved ? "ทดสอบ API" : "รออนุมัติก่อนใช้งาน"}>
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => handleOpenApiTest(rs.service)}
                                disabled={!isApproved}
                              >
                                <Icon icon="mdi:api" className={`w-5 h-5 ${isApproved ? 'text-green-600' : 'text-gray-400'}`} />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="ดูรายละเอียดคำขอ">
                            <IconButton
                              size="small"
                              onClick={() => handleViewRequest(rs.request?.id)}
                            >
                              <Icon icon="mdi:text-box-search" className="w-5 h-5 text-blue-600" />
                            </IconButton>
                          </Tooltip>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        />
      )}

      {/* Request Detail Dialog */}
      <RequestDetailModal
        open={requestDialogOpen}
        onClose={() => setRequestDialogOpen(false)}
        request={selectedRequest}
      />

      {/* Approval Detail Modal */}
      <ApprovalDetailModal
        open={approvalDetailOpen}
        onClose={() => setApprovalDetailOpen(false)}
        item={selectedApprovalItem}
        type={selectedApprovalType}
      />

      {/* API Test Modal */}
      <ApiTestModal
        open={apiTestOpen}
        onClose={() => setApiTestOpen(false)}
        service={selectedService}
        token={userToken}
      />
    </div>
  );
}
