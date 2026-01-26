'use client';

import { useState, useEffect } from 'react';
import { Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Tooltip, IconButton } from '@mui/material';
import { Icon } from '@iconify/react';
import { usePermission } from '@/components/providers/permission-provider';
import { checkAdminPermission } from '@/lib/permission-utils';
import {
  getDatasets, createDataset, updateDataset, deleteDataset,
  getServices, createService, updateService, deleteService,
  getUnitOwners, createUnitOwner, updateUnitOwner, deleteUnitOwner,
  getCategories, createCategory, updateCategory, deleteCategory,
  getDatasetTypes
} from '@/lib/actions/admin-actions';
import { uploadUnitOwnerIcon, uploadCategoryIcon, uploadServiceHowTo, uploadDatasetMetadata, deleteUploadedFile } from '@/lib/actions/file-actions';
import { DataTable } from '@/components/ui/DataTable';
import { CollapsibleTable } from '@/components/ui/CollapsibleTable';
import { RefreshButton } from '@/components/ui/RefreshButton';
import { FileUpload } from '@/components/ui/FileUpload';
import { FilterPanel, type FilterState } from '@/components/ui/FilterPanel';
import { SecurityLevelBadge } from '@/components/ui/SecurityLevelBadge';
import { ApiTestModal } from '@/components/modals/ApiTestModal';
import { getUserToken } from '@/lib/actions/user-actions';
import { User } from '@/components/ui/User';
import { Timestamp } from '@/components/ui/Timestamp';
import type { Dataset, Service, UnitOwner, Category } from '@/types';

export default function AdminPage() {
  const { user, permissions } = usePermission();
  const [activeTab, setActiveTab] = useState(0);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [filteredDatasets, setFilteredDatasets] = useState<Dataset[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [unitOwners, setUnitOwners] = useState<UnitOwner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [datasetTypes, setDatasetTypes] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [isServiceDialog, setIsServiceDialog] = useState(false);
  const [apiTestOpen, setApiTestOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [adminToken, setAdminToken] = useState<string>('');

  // Check admin permission
  if (!checkAdminPermission(permissions)) {
    window.location.href = '/app/catalog';
    return null;
  }

  useEffect(() => {
    loadData();
  }, [activeTab]);

  useEffect(() => {
    // Load all data on mount for dropdown options
    loadAllData();
    loadToken();
  }, []);

  const loadToken = async () => {
    if (user?.id) {
      const token = await getUserToken(user.id);
      if (token) {
        setAdminToken(token);
      }
    }
  };

  const loadAllData = async () => {
    try {
      const [datasetsResult, unitOwnersResult, categoriesResult, typesResult] = await Promise.all([
        getDatasets(1, 100),
        getUnitOwners(1, 100),
        getCategories(1, 100),
        getDatasetTypes(1, 100),
      ]);
      setDatasets(datasetsResult.data);
      setUnitOwners(unitOwnersResult.data);
      setCategories(categoriesResult.data);
      setDatasetTypes(typesResult.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 0) {
        const result = await getDatasets(1, 100);
        setDatasets(result.data);
        setFilteredDatasets(result.data);
      } else if (activeTab === 1) {
        const result = await getUnitOwners(1, 100);
        setUnitOwners(result.data);
      } else if (activeTab === 2) {
        const result = await getCategories(1, 100);
        setCategories(result.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filters: FilterState) => {
    if (activeTab === 0) {
      let filtered = datasets;

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter((d) => {
          const nameMatch = d.name.toLowerCase().includes(searchLower);
          const serviceMatch = d.services?.some((s: any) => s.name.toLowerCase().includes(searchLower));
          return nameMatch || serviceMatch;
        });
      }

      if (filters.unitOwnerId) {
        filtered = filtered.filter((d) => d.unitOwnerId === filters.unitOwnerId);
      }

      if (filters.categoryId) {
        filtered = filtered.filter((d) => d.categoryId === filters.categoryId);
      }

      if (filters.typeId) {
        filtered = filtered.filter((d) => d.typeId === filters.typeId);
      }

      setFilteredDatasets(filtered);
    }
  };

  const handleOpenDialog = (item?: any) => {
    setEditingItem(item);
    setIsServiceDialog(false); // Reset service dialog state
    if (item) {
      setFormData(item);
    } else {
      // Reset form for new item
      if (activeTab === 0) {
        setFormData({ name: '', detail: '', unitOwnerId: '', categoryId: '', typeId: '', securityLevel: '' });
      } else if (activeTab === 1) {
        setFormData({ name: '', shortName: '' });
      } else if (activeTab === 2) {
        setFormData({ name: '', shortName: '' });
      }
    }
    setFiles([]);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let iconPath = formData.icon;
      let howTo = formData.howTo;
      let metadata = formData.metadata;

      console.log('=== SAVE DEBUG ===');
      console.log('Files:', files);
      console.log('ActiveTab:', activeTab);
      console.log('FormData before:', formData);

      // Handle file upload
      if (files.length > 0) {
        const file = files[0];
        console.log('Uploading file:', file.name, 'Size:', file.size);
        console.log('isServiceDialog:', isServiceDialog);

        if (isServiceDialog) {
          // Service how-to - when service dialog is open
          console.log('Uploading Service how-to...');
          const result = await uploadServiceHowTo(file);
          console.log('Upload result:', result);
          if (result.success && result.filePath) howTo = result.filePath;
        } else if (activeTab === 0) {
          // Dataset metadata
          console.log('Uploading Dataset metadata...');
          const result = await uploadDatasetMetadata(file);
          console.log('Upload result:', result);
          if (result.success && result.filePath) metadata = result.filePath;
        } else if (activeTab === 1) {
          // Unit Owner icon
          console.log('Uploading Unit Owner icon...');
          const result = await uploadUnitOwnerIcon(file);
          console.log('Upload result:', result);
          if (result.success && result.filePath) iconPath = result.filePath;
        } else if (activeTab === 2) {
          // Category icon
          console.log('Uploading Category icon...');
          const result = await uploadCategoryIcon(file);
          console.log('Upload result:', result);
          if (result.success && result.filePath) iconPath = result.filePath;
        }
      }

      console.log('IconPath after upload:', iconPath);
      console.log('HowTo after upload:', howTo);
      console.log('Metadata after upload:', metadata);

      let result;
      // Check if this is a service dialog
      if (isServiceDialog) {
        // Service - only send necessary fields
        const data: any = {
          name: formData.name,
          method: formData.method || 'GET',
          api: formData.api,
          howTo,
        };
        // Only include datasetId when creating
        if (!editingItem) {
          data.datasetId = formData.datasetId;
        }
        console.log('Saving Service:', data);
        result = editingItem
          ? await updateService(editingItem.id, data, user.id)
          : await createService(data, user.id);
      } else if (activeTab === 0) {
        // Dataset - only send necessary fields
        const data = {
          name: formData.name,
          detail: formData.detail,
          unitOwnerId: formData.unitOwnerId,
          categoryId: formData.categoryId,
          typeId: formData.typeId,
          securityLevel: formData.securityLevel,
          metadata,
        };
        console.log('Saving Dataset:', data);
        result = editingItem
          ? await updateDataset(editingItem.id, data, user.id)
          : await createDataset(data, user.id);
      } else if (activeTab === 1) {
        // Unit Owner - only send necessary fields
        const data = {
          name: formData.name,
          shortName: formData.shortName,
          icon: iconPath,
        };
        console.log('Saving Unit Owner:', data);
        result = editingItem
          ? await updateUnitOwner(editingItem.id, data, user.id)
          : await createUnitOwner(data, user.id);
      } else if (activeTab === 2) {
        // Category - only send necessary fields
        const data = {
          name: formData.name,
          shortName: formData.shortName,
          icon: iconPath,
        };
        console.log('Saving Category:', data);
        result = editingItem
          ? await updateCategory(editingItem.id, data, user.id)
          : await createCategory(data, user.id);
      }

      console.log('Save result:', result);

      if (result?.success) {
        alert(editingItem ? 'แก้ไขเรียบร้อยแล้ว' : 'เพิ่มเรียบร้อยแล้ว');
        setDialogOpen(false);
        setFiles([]);
        setIsServiceDialog(false);
        loadData();
      } else {
        throw new Error(result?.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (!confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) return;

    setLoading(true);
    try {
      let result;
      if (activeTab === 0) {
        result = await deleteDataset(id, user.id);
      } else if (activeTab === 1) {
        result = await deleteUnitOwner(id, user.id);
      } else if (activeTab === 2) {
        result = await deleteCategory(id, user.id);
      }

      if (result?.success) {
        alert('ลบเรียบร้อยแล้ว');
        loadData();
      } else {
        throw new Error(result?.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getDialogTitle = () => {
    // Check if this is a service dialog
    if (isServiceDialog) {
      return (editingItem ? 'แก้ไข' : 'เพิ่ม') + 'บริการข้อมูล';
    }
    const labels = ['ชุดข้อมูล', 'หน่วยงาน', 'นโยบายด้านความมั่นคง'];
    return (editingItem ? 'แก้ไข' : 'เพิ่ม') + labels[activeTab];
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">จัดการข้อมูล</h1>
          <p className="text-gray-600">จัดการชุดข้อมูล บริการ หน่วยงาน และนโยบาย</p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton onRefresh={loadData} />
          <Button variant="contained" onClick={() => handleOpenDialog()} startIcon={<Icon icon="mdi:plus" />}>
            เพิ่มรายการ
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} className="mb-6">
        <Tab label="ชุดข้อมูล" />
        <Tab label="หน่วยงาน" />
        <Tab label="นโยบายด้านความมั่นคง" />
      </Tabs>

      {/* Filter Panel - Only for Dataset Tab */}
      {activeTab === 0 && (
        <FilterPanel
          onFilterChange={handleFilterChange}
          unitOwners={unitOwners}
          categories={categories}
          datasetTypes={datasetTypes}
          showUnitOwner
          showCategory
          showSearch
          showDatasetType
        />
      )}

      {/* Dataset Tab */}
      {activeTab === 0 && (
        <CollapsibleTable
          columns={[
            { id: 'name', label: 'ชื่อ' },
            { id: 'unitOwner', label: 'หน่วยงาน', format: (row: any) => row.unitOwner?.name || '-' },
            { id: 'category', label: 'นโยบาย', format: (row: any) => row.category?.name || '-' },
            {
              id: 'securityLevel',
              label: 'ชั้นความลับ',
              align: 'center',
              format: (row: any) => <SecurityLevelBadge level={row.securityLevel} />
            },
            {
              id: 'metadata',
              label: 'Metadata',
              align: 'center',
              format: (row: any) => row.metadata ? (
                <Tooltip title="ดู Metadata">
                  <IconButton size="small" onClick={() => window.open(row.metadata, '_blank')}>
                    <Icon icon="mdi:file-document" className="w-5 h-5 text-blue-600" />
                  </IconButton>
                </Tooltip>
              ) : '-'
            },
            {
              id: 'updatedBy',
              label: 'อัพเดทโดย',
              format: (row: any) => row.updatedBy ? <User userId={row.updatedBy} type="avatar-name" size="small" /> : '-'
            },
            {
              id: 'updatedAt',
              label: 'อัพเดทเมื่อ',
              format: (row: any) => <Timestamp date={row.updatedAt} type="date-time" />
            },
            { id: 'actions', label: '', align: 'right' },
          ]}
          rows={filteredDatasets.map((d) => ({
            ...d,
            actions: (
              <div className="flex gap-1">
                <Tooltip title="แก้ไข">
                  <IconButton size="small" onClick={() => handleOpenDialog(d)}>
                    <Icon icon="mdi:pencil" className="w-5 h-5" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="ลบ">
                  <IconButton size="small" onClick={() => handleDelete(d.id)}>
                    <Icon icon="mdi:delete" className="w-5 h-5" />
                  </IconButton>
                </Tooltip>
              </div>
            ),
          }))}
          getRowId={(row) => row.id}
          renderCollapse={(row) => (
            <div className="bg-gray-50 p-4 rounded">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">บริการข้อมูล</h4>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Icon icon="mdi:plus" />}
                  onClick={() => {
                    setFormData({ name: '', method: 'GET', api: '', datasetId: row.id });
                    setEditingItem(null);
                    setFiles([]);
                    setIsServiceDialog(true);
                    setDialogOpen(true);
                  }}
                >
                  เพิ่มบริการ
                </Button>
              </div>
              {row.services?.length === 0 ? (
                <p className="text-sm text-gray-500">ยังไม่มีบริการข้อมูล</p>
              ) : (
                <div className="space-y-2">
                  {row.services?.map((s: any) => (
                    <div key={s.id} className="bg-white p-3 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{s.name}</p>
                            {s.howTo && (
                              <Tooltip title="ดาวน์โหลดคู่มือ">
                                <IconButton
                                  size="small"
                                  onClick={() => window.open(s.howTo, '_blank')}
                                  sx={{ p: 0.5 }}
                                >
                                  <Icon icon="mdi:file-pdf-box" className="w-5 h-5 text-red-600" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </div>
                          <p className="text-xs text-gray-600">{s.method} {s.api}</p>
                        </div>
                        <div className="flex gap-1">
                        <Tooltip title={adminToken ? "ทดสอบ API" : "กำลังโหลด Token..."}>
                          <IconButton
                            size="small"
                            disabled={!adminToken}
                            onClick={() => {
                              if (adminToken) {
                                setSelectedService(s);
                                setApiTestOpen(true);
                              }
                            }}
                          >
                            <Icon icon="mdi:api" className="w-5 h-5 text-green-600" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="แก้ไข">
                          <IconButton
                            size="small"
                            onClick={() => {
                              console.log('Edit service:', s);
                              setEditingItem(s);
                              setFormData(s);
                              setFiles([]);
                              setIsServiceDialog(true);
                              setDialogOpen(true);
                            }}
                          >
                            <Icon icon="mdi:pencil" className="w-4 h-4" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="ลบ">
                          <IconButton
                            size="small"
                            onClick={async () => {
                              if (confirm('คุณต้องการลบบริการนี้ใช่หรือไม่?')) {
                                const result = await deleteService(s.id, user!.id);
                                if (result?.success) {
                                  alert('ลบเรียบร้อยแล้ว');
                                  loadData();
                                }
                              }
                            }}
                          >
                            <Icon icon="mdi:delete" className="w-4 h-4" />
                          </IconButton>
                        </Tooltip>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-1">
                          <span>อัพเดทโดย:</span>
                          {s.updatedBy ? <User userId={s.updatedBy} type="avatar-name" size="small" /> : '-'}
                        </div>
                        <div className="flex items-center gap-1">
                          <span>อัพเดทเมื่อ:</span>
                          <Timestamp date={s.updatedAt} type="date-time" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        />
      )}

      {/* Unit Owner Tab */}
      {activeTab === 1 && (
        <DataTable
          columns={[
            { id: 'icon', label: 'ไอคอน', format: (value: any) => value ? <img src={value} alt="" className="w-8 h-8 rounded" /> : '-' },
            { id: 'name', label: 'ชื่อ' },
            { id: 'shortName', label: 'ชื่อย่อ' },
            {
              id: 'updatedBy',
              label: 'อัพเดทโดย',
              format: (value: any, row: any) => row.updatedBy ? <User userId={row.updatedBy} type="avatar-name" size="small" /> : '-'
            },
            {
              id: 'updatedAt',
              label: 'อัพเดทเมื่อ',
              format: (value: any) => <Timestamp date={value} type="date-time" />
            },
            { id: 'actions', label: '', align: 'right' },
          ]}
          rows={unitOwners.map((u) => ({
            ...u,
            actions: (
              <div className="flex gap-1">
                <Tooltip title="แก้ไข">
                  <IconButton size="small" onClick={() => handleOpenDialog(u)}>
                    <Icon icon="mdi:pencil" className="w-5 h-5" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="ลบ">
                  <IconButton size="small" onClick={() => handleDelete(u.id)}>
                    <Icon icon="mdi:delete" className="w-5 h-5" />
                  </IconButton>
                </Tooltip>
              </div>
            ),
          }))}
          totalRows={unitOwners.length}
          page={1}
          rowsPerPage={100}
          onPageChange={() => {}}
        />
      )}

      {/* Category Tab */}
      {activeTab === 2 && (
        <DataTable
          columns={[
            { id: 'icon', label: 'ไอคอน', format: (value: any) => value ? <img src={value} alt="" className="w-8 h-8 rounded" /> : '-' },
            { id: 'name', label: 'ชื่อ' },
            { id: 'shortName', label: 'ชื่อย่อ' },
            {
              id: 'updatedBy',
              label: 'อัพเดทโดย',
              format: (value: any, row: any) => row.updatedBy ? <User userId={row.updatedBy} type="avatar-name" size="small" /> : '-'
            },
            {
              id: 'updatedAt',
              label: 'อัพเดทเมื่อ',
              format: (value: any) => <Timestamp date={value} type="date-time" />
            },
            { id: 'actions', label: '', align: 'right' },
          ]}
          rows={categories.map((c) => ({
            ...c,
            actions: (
              <div className="flex gap-1">
                <Tooltip title="แก้ไข">
                  <IconButton size="small" onClick={() => handleOpenDialog(c)}>
                    <Icon icon="mdi:pencil" className="w-5 h-5" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="ลบ">
                  <IconButton size="small" onClick={() => handleDelete(c.id)}>
                    <Icon icon="mdi:delete" className="w-5 h-5" />
                  </IconButton>
                </Tooltip>
              </div>
            ),
          }))}
          totalRows={categories.length}
          page={1}
          rowsPerPage={100}
          onPageChange={() => {}}
        />
      )}

      {/* CRUD Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{getDialogTitle()}</DialogTitle>
        <DialogContent>
          {/* Service Form - shown when isServiceDialog is true */}
          {isServiceDialog ? (
            <>
              <TextField
                fullWidth
                label="ชื่อบริการ"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                sx={{ mt: 2, mb: 2 }}
              />
              <TextField
                fullWidth
                select
                label="HTTP Method"
                value={formData.method || 'GET'}
                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                sx={{ mb: 2 }}
              >
                <MenuItem value="GET">GET</MenuItem>
                <MenuItem value="POST">POST</MenuItem>
                <MenuItem value="PUT">PUT</MenuItem>
                <MenuItem value="PATCH">PATCH</MenuItem>
                <MenuItem value="DELETE">DELETE</MenuItem>
              </TextField>
              <TextField
                fullWidth
                label="API Endpoint"
                value={formData.api || ''}
                onChange={(e) => setFormData({ ...formData, api: e.target.value })}
                sx={{ mb: 2 }}
              />
              <FileUpload
                files={files}
                onChange={setFiles}
                maxFiles={1}
                accept=".pdf,.doc,.docx"
                label="แนบเอกสารวิธีใช้งาน"
                existingFileUrl={editingItem?.howTo}
                existingFileName={editingItem?.howTo ? 'เอกสารวิธีใช้งาน.pdf' : undefined}
              />
            </>
          ) : null}

          {/* Dataset Form */}
          {activeTab === 0 && !isServiceDialog && (
            <>
              <TextField
                fullWidth
                label="ชื่อชุดข้อมูล"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                sx={{ mt: 2, mb: 2 }}
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                label="รายละเอียด"
                value={formData.detail || ''}
                onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                select
                label="หน่วยงาน"
                value={formData.unitOwnerId || ''}
                onChange={(e) => setFormData({ ...formData, unitOwnerId: e.target.value })}
                sx={{ mb: 2 }}
              >
                {unitOwners.map((u) => (
                  <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                select
                label="นโยบาย"
                value={formData.categoryId || ''}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                sx={{ mb: 2 }}
              >
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                select
                label="ประเภทข้อมูล"
                value={formData.typeId || ''}
                onChange={(e) => setFormData({ ...formData, typeId: e.target.value })}
                sx={{ mb: 2 }}
              >
                {datasetTypes.map((t) => (
                  <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                select
                label="ชั้นความลับ"
                value={formData.securityLevel || ''}
                onChange={(e) => setFormData({ ...formData, securityLevel: e.target.value })}
                sx={{ mb: 2 }}
              >
                <MenuItem value="">ไม่ระบุ</MenuItem>
                <MenuItem value="ทั่วไป">ทั่วไป</MenuItem>
                <MenuItem value="ลับ">ลับ</MenuItem>
                <MenuItem value="ลับมาก">ลับมาก</MenuItem>
                <MenuItem value="ลับที่สุด">ลับที่สุด</MenuItem>
              </TextField>
              <FileUpload
                files={files}
                onChange={setFiles}
                maxFiles={1}
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                label="อัปโหลด Metadata"
                existingFileUrl={editingItem?.metadata}
                existingFileName={editingItem?.metadata ? 'Metadata' : undefined}
              />
            </>
          )}

          {/* Unit Owner Form */}
          {activeTab === 1 && !isServiceDialog && (
            <>
              <TextField
                fullWidth
                label="ชื่อหน่วยงาน"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                sx={{ mt: 2, mb: 2 }}
              />
              <TextField
                fullWidth
                label="ชื่อย่อ"
                value={formData.shortName || ''}
                onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                sx={{ mb: 2 }}
              />
              <FileUpload
                files={files}
                onChange={setFiles}
                maxFiles={1}
                accept="image/*"
                label="อัปโหลดไอคอน"
                existingFileUrl={editingItem?.icon}
                existingFileName={editingItem?.icon ? `${editingItem?.name || 'ไอคอน'}.png` : undefined}
              />
            </>
          )}

          {/* Category Form */}
          {activeTab === 2 && !isServiceDialog && (
            <>
              <TextField
                fullWidth
                label="ชื่อนโยบาย"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                sx={{ mt: 2, mb: 2 }}
              />
              <TextField
                fullWidth
                label="ชื่อย่อ"
                value={formData.shortName || ''}
                onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                sx={{ mb: 2 }}
              />
              <FileUpload
                files={files}
                onChange={setFiles}
                maxFiles={1}
                accept="image/*"
                label="อัปโหลดไอคอน"
                existingFileUrl={editingItem?.icon}
                existingFileName={editingItem?.icon ? `${editingItem?.name || 'ไอคอน'}.png` : undefined}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={loading}>
            ยกเลิก
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={loading}>
            {loading ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* API Test Modal */}
      <ApiTestModal
        open={apiTestOpen}
        onClose={() => setApiTestOpen(false)}
        service={selectedService}
        token={adminToken}
        showHowToVerify={true}
      />
    </div>
  );
}
