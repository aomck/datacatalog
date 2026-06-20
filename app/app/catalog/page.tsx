'use client';

import { useState, useEffect } from 'react';
import { Tab, Tabs, Card, CardContent, IconButton, Tooltip, Chip } from '@mui/material';
import { Icon } from '@iconify/react';
import { usePermission } from '@/components/providers/permission-provider';
import { getCatalogUnitOwners, getCatalogCategories, getCategoriesByUnitOwner, getUnitOwnersByCategory, getUserRequestStatus } from '@/lib/actions/catalog-actions';
import { getDatasetTypes } from '@/lib/actions/admin-actions';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { NestedCollapsibleTable } from '@/components/ui/NestedCollapsibleTable';
import { RefreshButton } from '@/components/ui/RefreshButton';
import { CartModal } from '@/components/modals/CartModal';
import { FilterPanel, type FilterState } from '@/components/ui/FilterPanel';
import { getFileUrl } from '@/lib/file-url';
import type { UnitOwner, Category, Dataset, CartItem } from '@/types';

export default function CatalogPage() {
  const { user } = usePermission();
  const [activeTab, setActiveTab] = useState(0);
  const [unitOwners, setUnitOwners] = useState<UnitOwner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [datasetTypes, setDatasetTypes] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<UnitOwner | Category | null>(null);
  const [nestedData, setNestedData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [cart, setCart, clearCart] = useLocalStorage<CartItem[]>('datacatalog_cart', []);
  const [requestStatus, setRequestStatus] = useState<any>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'flat' | 'grouped'>('flat');
  const [rawGroupedData, setRawGroupedData] = useState<any[]>([]);

  useEffect(() => {
    loadData();
    loadDatasetTypes();
    if (user) {
      console.log("USER:::", user)
      loadRequestStatus();
    }
  }, [activeTab, user]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 0) {
        const result = await getCatalogCategories(1, 100);
        setCategories(result.data);
      } else {
        const result = await getCatalogUnitOwners(1, 100);
        setUnitOwners(result.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadDatasetTypes = async () => {
    try {
      const result = await getDatasetTypes(1, 100);
      setDatasetTypes(result.data);
    } catch (error) {
      console.error('Error loading dataset types:', error);
    }
  };

  const loadRequestStatus = async () => {
    if (user) {
      const status = await getUserRequestStatus(user.id);
      setRequestStatus(status);
    }
  };

  const flattenGroupedData = (groupedData: any[]) => {
    const allDatasets: any[] = [];
    const seenIds = new Set<string>();
    for (const group of groupedData) {
      for (const dataset of (group.datasets || [])) {
        if (!seenIds.has(dataset.id)) {
          seenIds.add(dataset.id);
          allDatasets.push(dataset);
        }
      }
    }
    return allDatasets;
  };

  // When viewMode changes, re-derive data from rawGroupedData
  useEffect(() => {
    if (rawGroupedData.length > 0 && activeTab === 1 && selectedId) {
      if (viewMode === 'flat') {
        const flat = flattenGroupedData(rawGroupedData);
        setNestedData(flat);
        setFilteredData(flat);
      } else {
        setNestedData(rawGroupedData);
        setFilteredData(rawGroupedData);
      }
    }
  }, [viewMode]);

  const loadNestedData = async (id: string, item: UnitOwner | Category) => {
    setSelectedId(id);
    setSelectedItem(item);
    setLoading(true);
    try {
      const result = activeTab === 0
        ? await getUnitOwnersByCategory(id, 1, 100)
        : await getCategoriesByUnitOwner(id, 1, 100);

      console.log('Raw nested data:', result.data);
      console.log('User confidentiality access:', user?.access?.confidentiality_access);

      // Log first dataset's security level if available
      if (result.data[0]?.datasets?.[0]) {
        console.log('First dataset:', result.data[0].datasets[0]);
        console.log('Security level:', result.data[0].datasets[0].securityLevel);
      }

      // Apply confidentiality access control immediately after loading
      const processedData = result.data.map((parent: any) => {
        const filteredDatasets = parent.datasets?.filter((d: any) => {
          // Add parent context to dataset for access control
          const datasetWithContext = {
            ...d,
            unitOwner: activeTab === 0 ? { id: parent.id } : { id: id }, // parent is unitOwner in tab 0, id is unitOwner in tab 1
            category: activeTab === 0 ? { id: id } : { id: parent.id }   // id is category in tab 0, parent is category in tab 1
          };
          return getDatasetAccessLevel(datasetWithContext) !== 'hidden';
        }).map((d: any) => {
          const datasetWithContext = {
            ...d,
            unitOwner: activeTab === 0 ? { id: parent.id } : { id: id },
            category: activeTab === 0 ? { id: id } : { id: parent.id },
            _accessLevel: getDatasetAccessLevel({
              ...d,
              unitOwner: activeTab === 0 ? { id: parent.id } : { id: id },
              category: activeTab === 0 ? { id: id } : { id: parent.id }
            })
          };
          return datasetWithContext;
        }) || [];

        return { ...parent, datasets: filteredDatasets };
      }).filter((parent: any) => parent.datasets.length > 0);

      console.log('Processed data after access control:', processedData);

      setRawGroupedData(processedData);

      if (viewMode === 'flat' && activeTab === 1) {
        const flatData = flattenGroupedData(processedData);
        setNestedData(flatData);
        setFilteredData(flatData);
      } else {
        setNestedData(processedData);
        setFilteredData(processedData);
      }
    } finally {
      setLoading(false);
    }
  };

  // Map security level number to text
  const securityLevelMap: { [key: number]: string | null } = {
    0: null, // ทั่วไป
    1: null, // ข้อมูลภายในองค์กร
    2: "ลับ",
    3: "ลับมาก",
    4: "ลับที่สุด"
  };

  // Check dataset access level based on user permissions
  const getDatasetAccessLevel = (dataset: any): 'full' | 'disabled' | 'hidden' => {
    // Check dataservice_access for unitOwner and category
    const unitOwnerId = dataset.unitOwner?.id;
    const categoryId = dataset.category?.id;

    const unitOwnerAccess = unitOwnerId ? user?.access?.dataservice_access?.[unitOwnerId] : undefined;
    const categoryAccess = categoryId ? user?.access?.dataservice_access?.[categoryId] : undefined;

    console.log('Checking dataset:', dataset.name);
    console.log('-> unitOwnerId:', unitOwnerId, 'access:', unitOwnerAccess);
    console.log('-> categoryId:', categoryId, 'access:', categoryAccess);

    // If either unitOwner or category is hidden (2), hide the dataset
    if (unitOwnerAccess === 2 || categoryAccess === 2) {
      console.log('-> Returning hidden (dataservice_access)');
      return 'hidden';
    }

    // If either unitOwner or category is disabled (1), disable the dataset
    if (unitOwnerAccess === 1 || categoryAccess === 1) {
      console.log('-> Returning disabled (dataservice_access)');
      return 'disabled';
    }

    // Check confidentiality_access (security level)
    const securityLevel = typeof dataset.securityLevel === 'string'
      ? parseInt(dataset.securityLevel, 10)
      : dataset.securityLevel;
    const securityLabel = securityLevelMap[securityLevel];

    console.log('-> securityLevel:', securityLevel, 'securityLabel:', securityLabel);

    // ถ้าเป็น level 0 หรือ 1 = เข้าถึงได้เสมอ
    if (!securityLabel) {
      console.log('-> No security label, returning full access');
      return 'full';
    }

    const accessLevel = user?.access?.confidentiality_access?.[securityLabel];
    console.log('-> User access level for', securityLabel, ':', accessLevel);

    if (accessLevel === 2) {
      console.log('-> Returning hidden (confidentiality)');
      return 'hidden'; // ไม่แสดง
    }
    if (accessLevel === 1) {
      console.log('-> Returning disabled (confidentiality)');
      return 'disabled'; // แสดงแต่ disabled
    }
    console.log('-> Returning full access');
    return 'full'; // เข้าถึงได้
  };

  const handleFilterChange = (filters: FilterState) => {
    // Flat mode: data is a flat array of datasets
    if (viewMode === 'flat' && activeTab === 1) {
      let filtered = [...nestedData];

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter((d: any) => {
          const nameMatch = d.name.toLowerCase().includes(searchLower);
          const serviceMatch = d.services?.some((s: any) => s.name.toLowerCase().includes(searchLower));
          return nameMatch || serviceMatch;
        });
      }

      if (filters.typeId) {
        filtered = filtered.filter((d: any) => d.typeId === filters.typeId);
      }

      if (filters.securityLevel) {
        filtered = filtered.filter((d: any) => d.securityLevel === filters.securityLevel);
      }

      if (filters.categoryId) {
        filtered = filtered.filter((d: any) =>
          d.categories?.some((dc: any) => dc.categoryId === filters.categoryId || dc.category?.id === filters.categoryId)
        );
      }

      setFilteredData(filtered);
      return;
    }

    // Grouped mode: data is grouped by parent (category/unit owner)
    let filtered = nestedData;

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.map((parent) => {
        const filteredDatasets = parent.datasets?.filter((d: any) => {
          const nameMatch = d.name.toLowerCase().includes(searchLower);
          const serviceMatch = d.services?.some((s: any) => s.name.toLowerCase().includes(searchLower));
          return nameMatch || serviceMatch;
        }) || [];

        return { ...parent, datasets: filteredDatasets };
      }).filter((parent) => parent.datasets.length > 0);
    }

    if (filters.typeId) {
      filtered = filtered.map((parent) => {
        const filteredDatasets = parent.datasets?.filter((d: any) => d.typeId === filters.typeId) || [];
        return { ...parent, datasets: filteredDatasets };
      }).filter((parent) => parent.datasets.length > 0);
    }

    if (filters.securityLevel) {
      filtered = filtered.map((parent) => {
        const filteredDatasets = parent.datasets?.filter((d: any) => d.securityLevel === filters.securityLevel) || [];
        return { ...parent, datasets: filteredDatasets };
      }).filter((parent) => parent.datasets.length > 0);
    }

    // Filter by unit owner (when in category tab)
    if (activeTab === 0 && filters.unitOwnerId) {
      filtered = filtered.filter((unitOwner) => unitOwner.id === filters.unitOwnerId);
    }

    // Filter by category (when in unit owner tab)
    if (activeTab === 1 && filters.categoryId) {
      filtered = filtered.filter((category) => category.id === filters.categoryId);
    }

    // Note: Access control is already applied in loadNestedData, no need to re-apply here
    // Just preserve the existing _accessLevel that was calculated with proper context

    setFilteredData(filtered);
  };

  const addToCart = (item: CartItem) => {
    if (!cart.find((i) => i.id === item.id && i.type === item.type)) {
      // If adding a service, ensure the dataset is also in cart
      if (item.type === 'service' && item.datasetId) {
        const datasetInCart = cart.find((i) => i.id === item.datasetId && i.type === 'dataset');
        if (!datasetInCart && item.datasetName) {
          setCart([...cart, { type: 'dataset', id: item.datasetId, name: item.datasetName }, item]);
          return;
        }
      }
      setCart([...cart, item]);
    }
  };

  const removeFromCart = (id: string, type: 'dataset' | 'service' | 'report') => {
    if (type === 'dataset') {
      // Remove dataset and all its services
      setCart(cart.filter((i) => !(i.id === id && i.type === 'dataset') && !(i.datasetId === id && i.type === 'service')));
    } else {
      // Remove only the service or report
      setCart(cart.filter((i) => !(i.id === id && i.type === type)));
    }
  };

  const toggleCart = (item: CartItem) => {
    const inCart = cart.find((i) => i.id === item.id && i.type === item.type);
    if (inCart) {
      removeFromCart(item.id, item.type);
    } else {
      addToCart(item);
    }
  };

  const getButtonLabel = (id: string, type: 'dataset' | 'service') => {
    const status = type === 'dataset' ? requestStatus.datasets?.[id] : requestStatus.services?.[id];
    const inCart = cart.find((i) => i.id === id && i.type === type);

    if (status === 'APPROVED') return 'ขอใช้งานแล้ว';
    if (status) return 'อยู่ในคำขอแล้ว';
    if (inCart) return 'ลบออกจากคำขอ';
    return 'เพิ่มลงคำขอ';
  };

  const isDisabled = (id: string, type: 'dataset' | 'service') => {
    const status = type === 'dataset' ? requestStatus.datasets?.[id] : requestStatus.services?.[id];
    return !!status;
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">บัญชีข้อมูลด้านความมั่นคง (Data Catalog)</h1>
          <p className="text-gray-600">ค้นหาและขอใช้งานชุดข้อมูลและบริการข้อมูล</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Security Level Legend */}
          <div className="flex items-center gap-4 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-1.5">
              <Icon icon="mdi:file-document-outline" className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-700">ทั่วไป</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Icon icon="mdi:eye" className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-700">ข้อมูลภายในองค์กร</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Icon icon="mdi:lock" className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-700">ลับ</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Icon icon="mdi:shield-lock" className="w-5 h-5 text-orange-600" />
              <span className="text-sm text-gray-700">ลับมาก</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Icon icon="mdi:shield-key" className="w-5 h-5 text-red-600" />
              <span className="text-sm text-gray-700">ลับที่สุด</span>
            </div>
          </div>
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

      <Tabs value={activeTab} onChange={(_, v) => { setActiveTab(v); setSelectedId(null); setSelectedItem(null); setNestedData([]); setRawGroupedData([]); setSearchTerm(''); }}>
        <Tab label="นโยบายและแผนความมั่นคง" />
        <Tab label="หน่วยงาน" />
      </Tabs>

      {!selectedId ? (
        <>
          <div className="mt-6 mb-4">
            <div className="relative">
              <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={`ค้นหา${activeTab === 0 ? 'นโยบายและแผนความมั่นคง' : 'หน่วยงาน'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <Icon icon="mdi:loading" className="w-12 h-12 text-blue-600 animate-spin" />
                <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(activeTab === 0 ? categories : unitOwners)
                .filter((item) => {
                  // Check dataservice_access - hide if access level is 2
                  const accessLevel = user?.access?.dataservice_access?.[item.id];
                  if (accessLevel === 2) return false;

                  if (!searchTerm) return true;
                  const search = searchTerm.toLowerCase();
                  return item.name.toLowerCase().includes(search) || item.shortName.toLowerCase().includes(search);
                })
                .map((item) => (
                  <Card key={item.id} className="cursor-pointer hover:shadow-lg transition-shadow h-64" onClick={() => loadNestedData(item.id, item)}>
                    <CardContent className="h-full flex flex-col justify-between p-4">
                      {/* Logo Section - 40% */}
                      <div className="flex items-center justify-center" style={{ height: '40%' }}>
                        {item.icon ? (
                          <img src={getFileUrl(item.icon) || ''} alt={item.name} className={`w-16 h-16 rounded object-contain ${activeTab === 0 ? 'opacity-60' : ''}`} />
                        ) : (
                          <Icon icon="mdi:folder" className="w-16 h-16 text-gray-400" />
                        )}
                      </div>

                      {/* Name Section - 50% */}
                      <div className="flex flex-col items-center justify-center gap-1" style={{ height: '50%' }}>
                        {(item as any).order !== undefined && (
                          <p className="text-sm text-gray-600">นยม.{(item as any).order}</p>
                        )}
                        <h3 className="font-semibold text-lg text-center">{item.name}</h3>
                        <p className="text-sm text-gray-600 text-center">{item.shortName}</p>
                      </div>

                      {/* Dataset Count Section - 10% */}
                      <div className="flex flex-col items-center justify-center gap-1 mt-3" style={{ height: '10%' }}>
                        {/* <p className="text-xs text-gray-500">{activeTab === 0 ? (item as any)._count?.datasetCategories || 0 : (item as any)._count?.datasets || 0} ชุดข้อมูล</p> */}
                        {/* Security Level Breakdown */}
                        {(item as any)._securityCounts && (
                          <div className="flex items-center gap-2.5 text-sm">
                            {(item as any)._securityCounts.general > 0 && (
                              <div className="flex items-center gap-1">
                                <Icon icon="mdi:file-document-outline" className="w-4 h-4 text-gray-600" />
                                <span className="text-gray-700 font-medium">{(item as any)._securityCounts.general}</span>
                              </div>
                            )}
                            {(item as any)._securityCounts.internal > 0 && (
                              <div className="flex items-center gap-1">
                                <Icon icon="mdi:eye" className="w-4 h-4 text-blue-600" />
                                <span className="text-gray-700 font-medium">{(item as any)._securityCounts.internal}</span>
                              </div>
                            )}
                            {(item as any)._securityCounts.secret > 0 && (
                              <div className="flex items-center gap-1">
                                <Icon icon="mdi:lock" className="w-4 h-4 text-green-600" />
                                <span className="text-gray-700 font-medium">{(item as any)._securityCounts.secret}</span>
                              </div>
                            )}
                            {(item as any)._securityCounts.verySecret > 0 && (
                              <div className="flex items-center gap-1">
                                <Icon icon="mdi:shield-lock" className="w-4 h-4 text-orange-600" />
                                <span className="text-gray-700 font-medium">{(item as any)._securityCounts.verySecret}</span>
                              </div>
                            )}
                            {(item as any)._securityCounts.topSecret > 0 && (
                              <div className="flex items-center gap-1">
                                <Icon icon="mdi:shield-key" className="w-4 h-4 text-red-600" />
                                <span className="text-gray-700 font-medium">{(item as any)._securityCounts.topSecret}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </>
      ) : (
        <div className="mt-6">
          {/* Breadcrumb */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={() => { setSelectedId(null); setSelectedItem(null); setNestedData([]); setRawGroupedData([]); }}
                className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
              >
                <Icon icon="mdi:home" className="w-4 h-4" />
                {activeTab === 0 ? 'นโยบายและแผนความมั่นคง' : 'หน่วยงาน'}
              </button>
              <Icon icon="mdi:chevron-right" className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700 font-medium">{selectedItem?.name}</span>
            </div>

            {activeTab === 1 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">มุมมอง:</span>
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setViewMode('flat')}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === 'flat'
                        ? 'bg-white shadow-sm text-blue-600 font-medium'
                        : 'text-gray-600 hover:text-gray-800'
                      }`}
                  >
                    ชุดข้อมูล
                  </button>
                  <button
                    onClick={() => setViewMode('grouped')}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === 'grouped'
                        ? 'bg-white shadow-sm text-blue-600 font-medium'
                        : 'text-gray-600 hover:text-gray-800'
                      }`}
                  >
                    จัดกลุ่มตาม นยม.
                  </button>
                </div>
              </div>
            )}
          </div>

          <FilterPanel
            onFilterChange={handleFilterChange}
            datasetTypes={datasetTypes}
            unitOwners={activeTab === 0 ? unitOwners : []}
            categories={activeTab === 1 ? categories : []}
            showDatasetType
            showUnitOwner={activeTab === 0}
            showCategory={activeTab === 1}
            showSecurityLevel
            showSearch
          />

          <NestedCollapsibleTable
            rows={filteredData}
            getRowId={(row) => row.id}
            flatMode={viewMode === 'flat' && activeTab === 1}
            level1Header={activeTab === 0 ? 'หน่วยงาน' : 'นโยบายและแผนความมั่นคง'}
            level1NameField="name"
            level1ShortNameField="shortName"
            level1IconField="icon"
            level1ChildrenField="datasets"
            level2NameField="name"
            level2DetailField="detail"
            level2MetadataField="metadata"
            level2DatadictField="datadict"
            level2SecurityLevelField="securityLevel"
            level2ChildrenField="services"
            level2Actions={(dataset) => {
              const accessLevel = dataset._accessLevel || 'full';
              const isAccessDisabled = accessLevel === 'disabled' || isDisabled(dataset.id, 'dataset');

              return (
                <button
                  onClick={() => toggleCart({ type: 'dataset', id: dataset.id, name: dataset.name })}
                  disabled={isAccessDisabled}
                  className={`px-3 py-1 text-sm rounded ${accessLevel === 'disabled'
                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                    : cart.find((i) => i.id === dataset.id && i.type === 'dataset')
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                    } disabled:bg-gray-300 disabled:cursor-not-allowed`}
                >
                  {accessLevel === 'disabled' ? 'ไม่มีสิทธิ์เข้าถึง' : getButtonLabel(dataset.id, 'dataset')}
                </button>
              );
            }}
            level3NameField="name"
            level3DetailField="detail"
            level3MethodField="method"
            level3ApiField="api"
            level3Actions={(service, dataset) => {
              const accessLevel = dataset._accessLevel || 'full';
              const isAccessDisabled = accessLevel === 'disabled' || isDisabled(service.id, 'service');

              return (
                <button
                  onClick={() => toggleCart({ type: 'service', id: service.id, name: service.name, datasetId: dataset.id, datasetName: dataset.name })}
                  disabled={isAccessDisabled}
                  className={`px-3 py-1 text-sm rounded ${accessLevel === 'disabled'
                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                    : cart.find((i) => i.id === service.id && i.type === 'service')
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                    } disabled:bg-gray-300 disabled:cursor-not-allowed`}
                >
                  {accessLevel === 'disabled' ? 'ไม่มีสิทธิ์เข้าถึง' : getButtonLabel(service.id, 'service')}
                </button>
              );
            }}
          />
        </div>
      )}

      <CartModal
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
        user={user}
      />
    </div>
  );
}
