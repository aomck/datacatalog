'use client';

import { useState, useEffect } from 'react';
import { Tab, Tabs, Card, CardContent, Button, Chip, IconButton, Tooltip } from '@mui/material';
import { Icon } from '@iconify/react';
import { usePermission } from '@/components/providers/permission-provider';
import {
  getReportCatalogUnitOwners,
  getReportCatalogCategories,
  getReportsByUnitOwner,
  getReportsByCategory,
} from '@/lib/actions/report-catalog-actions';
import { ReportRequestModal } from '@/components/modals/ReportRequestModal';
import { getReportTypes } from '@/lib/actions/report-actions';
import { getUserRequestedReports } from '@/lib/actions/request-actions';
import { RefreshButton } from '@/components/ui/RefreshButton';
import { FilterPanel, type FilterState } from '@/components/ui/FilterPanel';
import { getFileUrl } from '@/lib/file-url';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { UnitOwner, Category, Report, ReportType, CartItem } from '@/types';

export default function ReportCatalogPage() {
  const { user } = usePermission();
  const [activeTab, setActiveTab] = useState(0);
  const [unitOwners, setUnitOwners] = useState<UnitOwner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reportTypes, setReportTypes] = useState<ReportType[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<UnitOwner | Category | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [cart, setCart, clearCart] = useLocalStorage<CartItem[]>('reportcatalog_cart', []);
  const [cartOpen, setCartOpen] = useState(false);
  const [requestedReportIds, setRequestedReportIds] = useState<string[]>([]);

  useEffect(() => {
    loadData();
    loadReportTypes();
    if (user?.id) {
      loadRequestedReports();
    }
  }, [activeTab, user?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 0) {
        const result = await getReportCatalogCategories(1, 100);
        setCategories(result.data);
      } else {
        const result = await getReportCatalogUnitOwners(1, 100);
        setUnitOwners(result.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadReportTypes = async () => {
    try {
      const types = await getReportTypes();
      setReportTypes(types);
    } catch (error) {
      console.error('Error loading report types:', error);
    }
  };

  const loadRequestedReports = async () => {
    if (!user?.id) return;
    try {
      const { requestedIds } = await getUserRequestedReports(user.id);
      setRequestedReportIds(requestedIds);
    } catch (error) {
      console.error('Error loading requested reports:', error);
    }
  };

  const loadReports = async (id: string, item: UnitOwner | Category) => {
    setSelectedId(id);
    setSelectedItem(item);
    setLoading(true);
    try {
      const result =
        activeTab === 0
          ? await getReportsByCategory(id, 1, 100)
          : await getReportsByUnitOwner(id, 1, 100);

      setReports(result.data);
      setFilteredReports(result.data);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filters: FilterState) => {
    let filtered = reports;

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(searchLower) ||
          r.detail?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.typeId) {
      filtered = filtered.filter((r) => r.typeId === filters.typeId);
    }

    setFilteredReports(filtered);
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'document':
        return 'mdi:file-document';
      case 'infographic':
        return 'mdi:image-multiple';
      case 'dashboard':
        return 'mdi:chart-line';
      default:
        return 'mdi:file';
    }
  };

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'document':
        return 'เอกสาร';
      case 'infographic':
        return 'อินโฟกราฟิก';
      case 'dashboard':
        return 'แดชบอร์ด';
      default:
        return type;
    }
  };

  const toggleCart = (item: CartItem) => {
    const inCart = cart.find((i) => i.id === item.id && i.type === item.type);
    if (inCart) {
      setCart(cart.filter((i) => !(i.id === item.id && i.type === item.type)));
    } else {
      setCart([...cart, item]);
    }
  };

  const getButtonLabel = (id: string) => {
    if (requestedReportIds.includes(id)) return 'ร้องขอแล้ว';
    const inCart = cart.find((i) => i.id === id && i.type === 'report');
    return inCart ? 'ลบออกจากคำขอ' : 'เพิ่มลงคำขอ';
  };

  const isReportRequested = (id: string) => requestedReportIds.includes(id);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">รายงาน</h1>
          <p className="text-gray-600 mt-1">
            เลือกดูรายงานตามหน่วยงานหรือนโยบาย
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton onRefresh={loadData} />
          <Tooltip title="รายการคำร้องขอ">
            <div className="relative">
              <IconButton onClick={() => setCartOpen(true)} color="primary">
                <Icon icon="mdi:cart" className="w-6 h-6" />
              </IconButton>
              {cart.length > 0 && (
                <Chip
                  label={cart.length}
                  size="small"
                  color="error"
                  sx={{ position: 'absolute', top: -4, right: -4, minWidth: 20, height: 20 }}
                />
              )}
            </div>
          </Tooltip>
        </div>
      </div>

      {/* Tabs */}
      <Card>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab
            label={
              <div className="flex items-center gap-2">
                <Icon icon="mdi:tag-multiple" className="w-5 h-5" />
                <span>นโยบายและแผนความมั่นคง</span>
              </div>
            }
          />
          <Tab
            label={
              <div className="flex items-center gap-2">
                <Icon icon="mdi:office-building" className="w-5 h-5" />
                <span>หน่วยงาน</span>
              </div>
            }
          />
        </Tabs>
      </Card>

      {/* Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Panel - List */}
        <div className="col-span-4">
          <Card>
            <CardContent>
              <div className="space-y-2">
                {loading && !selectedId ? (
                  <div className="text-center py-8">
                    <Icon
                      icon="mdi:loading"
                      className="w-8 h-8 animate-spin mx-auto text-gray-400"
                    />
                  </div>
                ) : (
                  <>
                    {activeTab === 0
                      ? categories.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => loadReports(cat.id, cat)}
                            className={`w-full text-left p-4 rounded-lg transition-colors ${
                              selectedId === cat.id
                                ? 'bg-primary-50 border-2 border-primary-500'
                                : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {cat.icon && (
                                <img
                                  src={getFileUrl(cat.icon) || ''}
                                  alt={cat.name}
                                  className="w-10 h-10 object-contain"
                                />
                              )}
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900">
                                  {cat.name} (นยม.{cat.order})
                                </p>
                                {cat.reportCounts && (
                                  <div className="flex gap-2 mt-1">
                                    {cat.reportCounts.document > 0 && (
                                      <Tooltip title={`${getReportTypeLabel('document')}: ${cat.reportCounts.document}`}>
                                        <Chip
                                          icon={<Icon icon={getReportIcon('document')} />}
                                          label={cat.reportCounts.document}
                                          size="small"
                                          sx={{ height: 20, fontSize: '0.7rem' }}
                                        />
                                      </Tooltip>
                                    )}
                                    {cat.reportCounts.infographic > 0 && (
                                      <Tooltip title={`${getReportTypeLabel('infographic')}: ${cat.reportCounts.infographic}`}>
                                        <Chip
                                          icon={<Icon icon={getReportIcon('infographic')} />}
                                          label={cat.reportCounts.infographic}
                                          size="small"
                                          sx={{ height: 20, fontSize: '0.7rem' }}
                                        />
                                      </Tooltip>
                                    )}
                                    {cat.reportCounts.dashboard > 0 && (
                                      <Tooltip title={`${getReportTypeLabel('dashboard')}: ${cat.reportCounts.dashboard}`}>
                                        <Chip
                                          icon={<Icon icon={getReportIcon('dashboard')} />}
                                          label={cat.reportCounts.dashboard}
                                          size="small"
                                          sx={{ height: 20, fontSize: '0.7rem' }}
                                        />
                                      </Tooltip>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        ))
                      : unitOwners.map((unit) => (
                          <button
                            key={unit.id}
                            onClick={() => loadReports(unit.id, unit)}
                            className={`w-full text-left p-4 rounded-lg transition-colors ${
                              selectedId === unit.id
                                ? 'bg-primary-50 border-2 border-primary-500'
                                : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {unit.icon && (
                                <img
                                  src={getFileUrl(unit.icon) || ''}
                                  alt={unit.name}
                                  className="w-10 h-10 object-contain"
                                />
                              )}
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900">
                                  {unit.name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {unit.shortName}
                                </p>
                                {unit.reportCounts && (
                                  <div className="flex gap-2 mt-1">
                                    {unit.reportCounts.document > 0 && (
                                      <Tooltip title={`${getReportTypeLabel('document')}: ${unit.reportCounts.document}`}>
                                        <Chip
                                          icon={<Icon icon={getReportIcon('document')} />}
                                          label={unit.reportCounts.document}
                                          size="small"
                                          sx={{ height: 20, fontSize: '0.7rem' }}
                                        />
                                      </Tooltip>
                                    )}
                                    {unit.reportCounts.infographic > 0 && (
                                      <Tooltip title={`${getReportTypeLabel('infographic')}: ${unit.reportCounts.infographic}`}>
                                        <Chip
                                          icon={<Icon icon={getReportIcon('infographic')} />}
                                          label={unit.reportCounts.infographic}
                                          size="small"
                                          sx={{ height: 20, fontSize: '0.7rem' }}
                                        />
                                      </Tooltip>
                                    )}
                                    {unit.reportCounts.dashboard > 0 && (
                                      <Tooltip title={`${getReportTypeLabel('dashboard')}: ${unit.reportCounts.dashboard}`}>
                                        <Chip
                                          icon={<Icon icon={getReportIcon('dashboard')} />}
                                          label={unit.reportCounts.dashboard}
                                          size="small"
                                          sx={{ height: 20, fontSize: '0.7rem' }}
                                        />
                                      </Tooltip>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Reports */}
        <div className="col-span-8">
          {selectedId ? (
            <Card>
              <CardContent>
                {/* Filter */}
                <FilterPanel
                  onFilterChange={handleFilterChange}
                  datasetTypes={reportTypes.map((t) => ({
                    id: t.id,
                    name: t.shortName,
                  }))}
                  showDatasetType
                  showSearch
                />

                {/* Reports Grid */}
                <div className="mt-6 grid grid-cols-1 gap-4">
                  {loading ? (
                    <div className="text-center py-12">
                      <Icon
                        icon="mdi:loading"
                        className="w-12 h-12 animate-spin mx-auto text-gray-400"
                      />
                    </div>
                  ) : filteredReports.length === 0 ? (
                    <div className="text-center py-12">
                      <Icon
                        icon="mdi:file-search"
                        className="w-16 h-16 mx-auto text-gray-300 mb-2"
                      />
                      <p className="text-gray-500">ไม่พบรายงาน</p>
                    </div>
                  ) : (
                    filteredReports.map((report) => (
                      <div
                        key={report.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Icon
                                icon={getReportIcon(report.type?.name || '')}
                                className="w-6 h-6 text-blue-600"
                              />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">
                                  {report.name}
                                </h3>
                                {report.detail && (
                                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                    {report.detail}
                                  </p>
                                )}
                                <div className="flex flex-wrap gap-2 mt-2">
                                  <Chip
                                    label={report.type?.shortName}
                                    size="small"
                                    color="primary"
                                  />
                                  {report.securityLevel && (
                                    <Chip
                                      label={`ชั้น${report.securityLevel}`}
                                      size="small"
                                      color="warning"
                                    />
                                  )}
                                  {report.url && (
                                    <Chip
                                      icon={<Icon icon="mdi:link" />}
                                      label="มี URL"
                                      size="small"
                                    />
                                  )}
                                  {report.files && report.files.length > 0 && (
                                    <Chip
                                      icon={<Icon icon="mdi:file-multiple" />}
                                      label={`${report.files.length} ไฟล์`}
                                      size="small"
                                    />
                                  )}
                                </div>
                              </div>
                              <Button
                                variant={cart.find((i) => i.id === report.id && i.type === 'report') ? 'contained' : 'outlined'}
                                color={cart.find((i) => i.id === report.id && i.type === 'report') ? 'error' : 'primary'}
                                size="small"
                                onClick={() => toggleCart({ type: 'report', id: report.id, name: report.name })}
                                disabled={isReportRequested(report.id)}
                              >
                                {getButtonLabel(report.id)}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <div className="text-center py-12">
                  <Icon
                    icon="mdi:arrow-left"
                    className="w-16 h-16 mx-auto text-gray-300 mb-4"
                  />
                  <p className="text-gray-500">
                    เลือก{activeTab === 0 ? 'นโยบาย' : 'หน่วยงาน'}
                    เพื่อดูรายงาน
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Report Request Modal */}
      <ReportRequestModal
        open={cartOpen}
        onClose={() => {
          setCartOpen(false);
          loadData();
          loadRequestedReports();
        }}
        items={cart}
        onRemoveItem={(id) => setCart(cart.filter((i) => i.id !== id))}
        onClearCart={clearCart}
        user={user}
      />
    </div>
  );
}
