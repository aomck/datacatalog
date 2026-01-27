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

  useEffect(() => {
    loadData();
    loadDatasetTypes();
    if (user) {
      console.log("USER:::",user)
      loadRequestStatus();
    }
  }, [activeTab, user]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 0) {
        const result = await getCatalogUnitOwners(1, 100);
        setUnitOwners(result.data);
      } else {
        const result = await getCatalogCategories(1, 100);
        setCategories(result.data);
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

  const loadNestedData = async (id: string, item: UnitOwner | Category) => {
    setSelectedId(id);
    setSelectedItem(item);
    setLoading(true);
    try {
      const result = activeTab === 0
        ? await getCategoriesByUnitOwner(id, 1, 100)
        : await getUnitOwnersByCategory(id, 1, 100);

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
          return getDatasetAccessLevel(d) !== 'hidden';
        }).map((d: any) => ({
          ...d,
          _accessLevel: getDatasetAccessLevel(d)
        })) || [];

        return { ...parent, datasets: filteredDatasets };
      }).filter((parent: any) => parent.datasets.length > 0);

      console.log('Processed data after access control:', processedData);

      setNestedData(processedData);
      setFilteredData(processedData);
    } finally {
      setLoading(false);
    }
  };

  // Map security level number to text
  const securityLevelMap: { [key: number]: string | null } = {
    0: null, // ไม่มีชั้นความลับ
    1: null, // ทั่วไป
    2: "ลับ",
    3: "ลับมาก",
    4: "ลับที่สุด"
  };

  // Check dataset access level based on user permissions
  const getDatasetAccessLevel = (dataset: any): 'full' | 'disabled' | 'hidden' => {
    // Convert string to number if needed
    const securityLevel = typeof dataset.securityLevel === 'string'
      ? parseInt(dataset.securityLevel, 10)
      : dataset.securityLevel;
    const securityLabel = securityLevelMap[securityLevel];

    console.log('Checking dataset:', dataset.name, 'securityLevel:', securityLevel, 'securityLabel:', securityLabel);

    // ถ้าเป็น level 0 หรือ 1 = เข้าถึงได้เสมอ
    if (!securityLabel) {
      console.log('-> No security label, returning full access');
      return 'full';
    }

    const accessLevel = user?.access?.confidentiality_access?.[securityLabel];
    console.log('-> User access level for', securityLabel, ':', accessLevel);

    if (accessLevel === 2) {
      console.log('-> Returning hidden');
      return 'hidden'; // ไม่แสดง
    }
    if (accessLevel === 1) {
      console.log('-> Returning disabled');
      return 'disabled'; // แสดงแต่ disabled
    }
    console.log('-> Returning full access');
    return 'full'; // เข้าถึงได้
  };

  const handleFilterChange = (filters: FilterState) => {
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

    // Filter by category (when in unit owner tab)
    if (activeTab === 0 && filters.categoryId) {
      filtered = filtered.filter((category) => category.id === filters.categoryId);
    }

    // Filter by unit owner (when in category tab)
    if (activeTab === 1 && filters.unitOwnerId) {
      filtered = filtered.filter((unitOwner) => unitOwner.id === filters.unitOwnerId);
    }

    // Apply confidentiality access control
    filtered = filtered.map((parent) => {
      const filteredDatasets = parent.datasets?.filter((d: any) => {
        return getDatasetAccessLevel(d) !== 'hidden';
      }).map((d: any) => ({
        ...d,
        _accessLevel: getDatasetAccessLevel(d)
      })) || [];

      return { ...parent, datasets: filteredDatasets };
    }).filter((parent) => parent.datasets.length > 0);

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

  const removeFromCart = (id: string, type: 'dataset' | 'service') => {
    if (type === 'dataset') {
      // Remove dataset and all its services
      setCart(cart.filter((i) => !(i.id === id && i.type === 'dataset') && !(i.datasetId === id && i.type === 'service')));
    } else {
      // Remove only the service
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">แคตาล็อกข้อมูล</h1>
          <p className="text-gray-600">ค้นหาและขอใช้งานชุดข้อมูลและบริการข้อมูล</p>
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

      <Tabs value={activeTab} onChange={(_, v) => { setActiveTab(v); setSelectedId(null); setSelectedItem(null); setNestedData([]); }}>
        <Tab label="หน่วยงาน" />
        <Tab label="นโยบายด้านความมั่นคง" />
      </Tabs>

      {!selectedId ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {(activeTab === 0 ? unitOwners : categories).map((item) => (
            <Card key={item.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => loadNestedData(item.id, item)}>
              <CardContent className="text-center">
                {item.icon ? (
                  <img src={getFileUrl(item.icon) || ''} alt={item.name} className="w-16 h-16 mx-auto mb-3 rounded" />
                ) : (
                  <Icon icon="mdi:folder" className="w-16 h-16 mx-auto mb-3 text-gray-400" />
                )}
                <h3 className="font-semibold text-lg">{item.name}</h3>
                <p className="text-sm text-gray-600">{item.shortName}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="mt-6">
          {/* Breadcrumb */}
          <div className="mb-6 flex items-center gap-2 text-sm">
            <button
              onClick={() => { setSelectedId(null); setSelectedItem(null); setNestedData([]); }}
              className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
            >
              <Icon icon="mdi:home" className="w-4 h-4" />
              {activeTab === 0 ? 'หน่วยงาน' : 'นโยบายความมั่นคง'}
            </button>
            <Icon icon="mdi:chevron-right" className="w-4 h-4 text-gray-400" />
            <span className="text-gray-700 font-medium">{selectedItem?.name}</span>
          </div>

          <FilterPanel
            onFilterChange={handleFilterChange}
            datasetTypes={datasetTypes}
            unitOwners={activeTab === 1 ? unitOwners : []}
            categories={activeTab === 0 ? categories : []}
            showDatasetType
            showUnitOwner={activeTab === 1}
            showCategory={activeTab === 0}
            showSecurityLevel
            showSearch
          />

          <NestedCollapsibleTable
            rows={filteredData}
            getRowId={(row) => row.id}
            level1Header={activeTab === 0 ? 'นโยบายความมั่นคง' : 'หน่วยงาน'}
            level1NameField="name"
            level1ShortNameField="shortName"
            level1IconField="icon"
            level1ChildrenField="datasets"
            level2NameField="name"
            level2DetailField="detail"
            level2MetadataField="metadata"
            level2SecurityLevelField="securityLevel"
            level2ChildrenField="services"
            level2Actions={(dataset) => {
              const accessLevel = dataset._accessLevel || 'full';
              const isAccessDisabled = accessLevel === 'disabled' || isDisabled(dataset.id, 'dataset');

              return (
                <button
                  onClick={() => toggleCart({ type: 'dataset', id: dataset.id, name: dataset.name })}
                  disabled={isAccessDisabled}
                  className={`px-3 py-1 text-sm rounded ${
                    accessLevel === 'disabled'
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
                  className={`px-3 py-1 text-sm rounded ${
                    accessLevel === 'disabled'
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
