'use client';

import { useState, useEffect } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Chip, IconButton, FormControl, InputLabel, Select, OutlinedInput, Box, Tooltip, Tab, Tabs, Card, CardContent, ListSubheader } from '@mui/material';
import { Icon } from '@iconify/react';
import { getReports, getReportTypes, createReport, updateReport, deleteReport, deleteReportFile } from '@/lib/actions/report-actions';
import { getUnitOwners, getCategories } from '@/lib/actions/admin-actions';
import { getCatalogUnitOwners, getCatalogCategories, getCategoriesByUnitOwner, getUnitOwnersByCategory } from '@/lib/actions/catalog-actions';
import { uploadReportFiles } from '@/lib/actions/file-actions';
import { DataTable } from '@/components/ui/DataTable';
import { FileUpload } from '@/components/ui/FileUpload';
import { RefreshButton } from '@/components/ui/RefreshButton';
import { FilterPanel, type FilterState } from '@/components/ui/FilterPanel';
import { FilesViewer } from '@/components/ui/FilesViewer';
import { NestedCollapsibleTable } from '@/components/ui/NestedCollapsibleTable';
import { DatasetCartModal } from '@/components/modals/DatasetCartModal';
import { getFileUrl } from '@/lib/file-url';
import type { Report, ReportType, UnitOwner, Category, Dataset, CartItem } from '@/types';

interface ReportAdminTabProps {
  userId: string;
  onReady?: (openDialog: () => void, refresh: () => void) => void; // ส่ง handlers กลับไปให้ parent
}

export function ReportAdminTab({ userId, onReady }: ReportAdminTabProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [reportTypes, setReportTypes] = useState<ReportType[]>([]);
  const [unitOwners, setUnitOwners] = useState<UnitOwner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    detail: '',
    typeId: '',
    url: '',
    unitOwnerIds: [] as string[], // m:m unit owners (involved units)
    categoryId: '',
    categoryIds: [] as string[],
    datasetIds: [] as string[],
    securityLevel: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [filesViewerOpen, setFilesViewerOpen] = useState(false);
  const [selectedReportFiles, setSelectedReportFiles] = useState<Report | null>(null);

  // Dataset selection state
  const [datasetTab, setDatasetTab] = useState(0);
  const [catalogUnitOwners, setCatalogUnitOwners] = useState<UnitOwner[]>([]);
  const [catalogCategories, setCatalogCategories] = useState<Category[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<UnitOwner | Category | null>(null);
  const [nestedData, setNestedData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [selectedDatasets, setSelectedDatasets] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Search state for dropdowns
  const [unitOwnerSearch, setUnitOwnerSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');

  useEffect(() => {
    loadData();
    loadReportTypes();
    loadUnitOwners();
    loadCategories();
  }, [page]);

  useEffect(() => {
    if (dialogOpen) {
      loadDatasetData();
    }
  }, [datasetTab, dialogOpen]);

  // ส่ง handlers กลับไปให้ parent component
  useEffect(() => {
    if (onReady) {
      onReady(() => handleOpenDialog(), loadData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getReports(page, 10);
      setReports(result.data);
      setTotalRows(result.pagination.total);
    } finally {
      setLoading(false);
    }
  };

  const loadReportTypes = async () => {
    const types = await getReportTypes();
    setReportTypes(types);
  };

  const loadUnitOwners = async () => {
    const result = await getUnitOwners(1, 100);
    setUnitOwners(result.data);
  };

  const loadCategories = async () => {
    const result = await getCategories(1, 100);
    setCategories(result.data);
  };

  const loadDatasetData = async () => {
    setLoading(true);
    try {
      if (datasetTab === 0) {
        const result = await getCatalogCategories(1, 100);
        setCatalogCategories(result.data);
      } else {
        const result = await getCatalogUnitOwners(1, 100);
        setCatalogUnitOwners(result.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadNestedData = async (id: string, item: UnitOwner | Category) => {
    setSelectedId(id);
    setSelectedItem(item);
    setLoading(true);
    try {
      const result = datasetTab === 0
        ? await getUnitOwnersByCategory(id, 1, 100)
        : await getCategoriesByUnitOwner(id, 1, 100);
      setNestedData(result.data);
      setFilteredData(result.data);
    } finally {
      setLoading(false);
    }
  };

  const toggleDataset = (dataset: Dataset) => {
    const item: CartItem = {
      id: dataset.id,
      name: dataset.name,
      type: 'dataset',
    };
    const inCart = selectedDatasets.find((i) => i.id === item.id && i.type === item.type);
    if (inCart) {
      setSelectedDatasets(selectedDatasets.filter((i) => !(i.id === item.id && i.type === item.type)));
    } else {
      setSelectedDatasets([...selectedDatasets, item]);
    }
  };

  const isDatasetInCart = (datasetId: string) => {
    return selectedDatasets.some((item) => item.id === datasetId && item.type === 'dataset');
  };

  const handleOpenDialog = (report?: Report) => {
    if (report) {
      setEditingReport(report);
      setFormData({
        name: report.name,
        detail: report.detail || '',
        typeId: report.typeId,
        url: report.url || '',
        unitOwnerIds: report.unitOwners?.map(uo => uo.unitOwnerId) || [],
        categoryId: report.categoryId,
        categoryIds: report.categories?.map(c => c.categoryId) || [],
        datasetIds: report.datasets?.map(d => d.datasetId) || [],
        securityLevel: report.securityLevel || '',
      });
      // Load datasets into cart
      const datasetItems: CartItem[] = report.datasets?.map(d => ({
        id: d.dataset?.id || d.datasetId,
        name: d.dataset?.name || 'ชุดข้อมูล',
        type: 'dataset' as const,
      })) || [];
      setSelectedDatasets(datasetItems);
    } else {
      setEditingReport(null);
      setFormData({
        name: '',
        detail: '',
        typeId: '',
        url: '',
        unitOwnerIds: [],
        categoryId: '',
        categoryIds: [],
        datasetIds: [],
        securityLevel: '',
      });
      setSelectedDatasets([]);
    }
    setFiles([]);
    setSelectedId(null);
    setSelectedItem(null);
    setNestedData([]);
    setFilteredData([]);
    setSearchTerm('');
    setDatasetTab(0);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingReport(null);
    setFiles([]);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.typeId || formData.unitOwnerIds.length === 0) {
      alert('กรุณากรอกข้อมูลที่จำเป็น (ชื่อ, ประเภท, หน่วยงานที่เกี่ยวข้อง)');
      return;
    }

    // Use first category if categoryIds is empty
    const finalCategoryId = formData.categoryIds.length > 0
      ? formData.categoryIds[0]
      : formData.categoryId;

    if (!finalCategoryId) {
      alert('กรุณาเลือกนโยบายอย่างน้อย 1 รายการ');
      return;
    }

    setLoading(true);
    try {
      let uploadedFiles: any[] = [];

      // Upload files if any
      if (files.length > 0) {
        const formDataObj = new FormData();
        files.forEach(file => formDataObj.append('files', file));
        const uploadResult = await uploadReportFiles(formDataObj);

        if (!uploadResult.success) {
          throw new Error(uploadResult.error);
        }
        uploadedFiles = uploadResult.files!.map(f => ({
          filePath: f.filePath,
          fileName: f.fileName,
          fileType: files.find(file => file.name === f.fileName)?.type || '',
          fileSize: f.fileSize,
        }));
      }

      const reportData = {
        ...formData,
        categoryId: finalCategoryId,
        datasetIds: selectedDatasets.map(d => d.id), // Use datasets from cart
        files: uploadedFiles,
      };

      if (editingReport) {
        await updateReport(editingReport.id, reportData, userId);
      } else {
        await createReport(reportData, userId);
      }

      await loadData();
      handleCloseDialog();
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('คุณต้องการลบรายงานนี้ใช่หรือไม่?')) return;

    setLoading(true);
    try {
      await deleteReport(id, userId);
      await loadData();
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('คุณต้องการลบไฟล์นี้ใช่หรือไม่?')) return;

    try {
      await deleteReportFile(fileId);

      // Update editingReport to remove the deleted file
      if (editingReport) {
        setEditingReport({
          ...editingReport,
          files: editingReport.files?.filter(f => f.id !== fileId) || []
        });
      }

      await loadData();
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  const columns = [
    {
      id: 'name',
      label: 'ชื่อรายงาน',
      format: (value: any, row: Report) => (
        <div>
          <p className="font-semibold">{row.name}</p>
          {row.detail && (
            <p className="text-sm text-gray-600 line-clamp-1">{row.detail}</p>
          )}
        </div>
      ),
    },
    {
      id: 'type',
      label: 'ประเภท',
      align: 'center' as const,
      format: (value: any, row: Report) => (
        <Chip label={row.type?.shortName} size="small" color="primary" />
      ),
    },
    {
      id: 'unitOwners',
      label: 'หน่วยงานที่เกี่ยวข้อง',
      format: (value: any, row: Report) => (
        <div className="flex flex-wrap gap-1">
          {row.unitOwners?.map(uo => (
            <Chip key={uo.id} label={uo.unitOwner?.shortName} size="small" />
          )) || '-'}
        </div>
      ),
    },
    {
      id: 'categories',
      label: 'นโยบาย',
      format: (value: any, row: Report) => (
        <div className="flex flex-wrap gap-1">
          {row.categories?.map(c => (
            <Chip key={c.id} label={c.category?.shortName} size="small" />
          )) || '-'}
        </div>
      ),
    },
    {
      id: 'url',
      label: 'URL',
      align: 'center' as const,
      format: (value: any, row: Report) => (
        row.url ? (
          <IconButton
            size="small"
            onClick={() => window.open(row.url, '_blank')}
            title={row.url}
          >
            <Icon icon="mdi:link" className="w-5 h-5 text-blue-600" />
          </IconButton>
        ) : '-'
      ),
    },
    {
      id: 'files',
      label: 'ไฟล์',
      align: 'center' as const,
      format: (value: any, row: Report) => (
        row.files && row.files.length > 0 ? (
          <IconButton
            size="small"
            onClick={() => {
              setSelectedReportFiles(row);
              setFilesViewerOpen(true);
            }}
          >
            <div className="flex items-center gap-1">
              <Icon icon="mdi:file-multiple" className="w-5 h-5 text-blue-600" />
              <span className="text-sm">{row.files.length}</span>
            </div>
          </IconButton>
        ) : '-'
      ),
    },
    {
      id: 'actions',
      label: 'การจัดการ',
      format: (value: any, row: Report) => (
        <div className="flex gap-2">
          <IconButton size="small" onClick={() => handleOpenDialog(row)}>
            <Icon icon="mdi:pencil" className="w-5 h-5" />
          </IconButton>
          <IconButton size="small" onClick={() => handleDelete(row.id)}>
            <Icon icon="mdi:delete" className="w-5 h-5" />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        rows={reports}
        page={page}
        rowsPerPage={10}
        totalRows={totalRows}
        onPageChange={setPage}
        loading={loading}
      />

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingReport ? 'แก้ไขรายงาน' : 'เพิ่มรายงาน'}
        </DialogTitle>
        <DialogContent>
          <div className="space-y-4 pt-4">
            <TextField
              fullWidth
              label="ชื่อรายงาน"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="รายละเอียด"
              value={formData.detail}
              onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
            />

            <TextField
              fullWidth
              select
              label="ประเภทรายงาน"
              value={formData.typeId}
              onChange={(e) => setFormData({ ...formData, typeId: e.target.value })}
              required
            >
              {reportTypes.map((type) => (
                <MenuItem key={type.id} value={type.id}>
                  {type.shortName}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="URL (ถ้ามี)"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://..."
            />

            <FormControl fullWidth required>
              <InputLabel>หน่วยงานที่เกี่ยวข้อง</InputLabel>
              <Select
                multiple
                value={formData.unitOwnerIds}
                onChange={(e) => setFormData({ ...formData, unitOwnerIds: e.target.value as string[] })}
                onClose={() => setUnitOwnerSearch('')}
                input={<OutlinedInput label="หน่วยงานที่เกี่ยวข้อง" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const unit = unitOwners.find(u => u.id === value);
                      return (
                        <Chip
                          key={value}
                          label={unit?.shortName}
                          size="small"
                          onDelete={(e) => {
                            e.stopPropagation();
                            setFormData({
                              ...formData,
                              unitOwnerIds: formData.unitOwnerIds.filter(id => id !== value)
                            });
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                        />
                      );
                    })}
                  </Box>
                )}
              >
                <ListSubheader>
                  <TextField
                    size="small"
                    placeholder="ค้นหาหน่วยงาน..."
                    fullWidth
                    value={unitOwnerSearch}
                    onChange={(e) => setUnitOwnerSearch(e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    InputProps={{
                      startAdornment: <Icon icon="mdi:magnify" className="w-5 h-5 text-gray-400 mr-2" />
                    }}
                  />
                </ListSubheader>
                {unitOwners
                  .filter((unit) => {
                    if (!unitOwnerSearch) return true;
                    const search = unitOwnerSearch.toLowerCase();
                    return unit.name.toLowerCase().includes(search) || unit.shortName.toLowerCase().includes(search);
                  })
                  .map((unit) => (
                    <MenuItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>นโยบาย</InputLabel>
              <Select
                multiple
                value={formData.categoryIds}
                onChange={(e) => setFormData({ ...formData, categoryIds: e.target.value as string[] })}
                onClose={() => setCategorySearch('')}
                input={<OutlinedInput label="นโยบาย" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const cat = categories.find(c => c.id === value);
                      return (
                        <Chip
                          key={value}
                          label={cat?.shortName}
                          size="small"
                          onDelete={(e) => {
                            e.stopPropagation();
                            setFormData({
                              ...formData,
                              categoryIds: formData.categoryIds.filter(id => id !== value)
                            });
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                        />
                      );
                    })}
                  </Box>
                )}
              >
                <ListSubheader>
                  <TextField
                    size="small"
                    placeholder="ค้นหานโยบาย..."
                    fullWidth
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    InputProps={{
                      startAdornment: <Icon icon="mdi:magnify" className="w-5 h-5 text-gray-400 mr-2" />
                    }}
                  />
                </ListSubheader>
                {categories
                  .filter((cat) => {
                    if (!categorySearch) return true;
                    const search = categorySearch.toLowerCase();
                    return cat.name.toLowerCase().includes(search) || cat.shortName.toLowerCase().includes(search);
                  })
                  .map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            {/* Dataset Selection */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">
                  ชุดข้อมูลที่เกี่ยวข้อง
                </label>
                <Tooltip title="รายการที่เลือก">
                  <div className="relative">
                    <IconButton onClick={() => setCartOpen(true)} color="primary" size="small">
                      <Icon icon="mdi:cart" className="w-5 h-5" />
                    </IconButton>
                    {selectedDatasets.length > 0 && (
                      <Chip
                        label={selectedDatasets.length}
                        size="small"
                        color="error"
                        sx={{ position: 'absolute', top: -4, right: -4, minWidth: 20, height: 20 }}
                      />
                    )}
                  </div>
                </Tooltip>
              </div>

              {selectedDatasets.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedDatasets.map((item) => (
                    <Chip
                      key={item.id}
                      label={item.name}
                      size="small"
                      onDelete={() => setSelectedDatasets(selectedDatasets.filter(i => i.id !== item.id))}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </div>
              )}

              {/* Dataset Browsing UI */}
              {!selectedId ? (
                <div className="mt-3">
                  <Tabs value={datasetTab} onChange={(_, v) => {
                    setDatasetTab(v);
                    setSelectedId(null);
                    setSelectedItem(null);
                    setNestedData([]);
                    setFilteredData([]);
                    setSearchTerm('');
                  }}>
                    <Tab label="นโยบาย" />
                    <Tab label="หน่วยงาน" />
                  </Tabs>

                  <div className="mt-3 mb-3">
                    <div className="relative">
                      <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder={`ค้นหา${datasetTab === 0 ? 'นโยบาย' : 'หน่วยงาน'}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>

                  {datasetTab === 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                      {catalogCategories
                        .filter((cat) => {
                          if (!searchTerm) return true;
                          const search = searchTerm.toLowerCase();
                          return cat.name.toLowerCase().includes(search) || cat.shortName.toLowerCase().includes(search);
                        })
                        .map((cat) => (
                          <Card
                            key={cat.id}
                            className="cursor-pointer transition-all hover:shadow-md h-32"
                            onClick={() => loadNestedData(cat.id, cat)}
                          >
                            <CardContent className="h-full flex flex-col justify-between p-3">
                              <div className="flex items-center justify-center h-12">
                                {cat.icon ? (
                                  <img src={getFileUrl(cat.icon) || ''} alt={cat.name} className="w-10 h-10 rounded object-contain opacity-60" />
                                ) : (
                                  <Icon icon="mdi:folder" className="w-10 h-10 text-gray-400" />
                                )}
                              </div>
                              <div className="flex flex-col items-center justify-center">
                                <h3 className="font-semibold text-center text-xs">{cat.shortName}</h3>
                                <p className="text-xs text-gray-500">
                                  {(cat as any)._count?.datasetCategories || 0} ชุดข้อมูล
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                      {catalogUnitOwners
                        .filter((unit) => {
                          if (!searchTerm) return true;
                          const search = searchTerm.toLowerCase();
                          return unit.name.toLowerCase().includes(search) || unit.shortName.toLowerCase().includes(search);
                        })
                        .map((unit) => (
                          <Card
                            key={unit.id}
                            className="cursor-pointer transition-all hover:shadow-md h-32"
                            onClick={() => loadNestedData(unit.id, unit)}
                          >
                            <CardContent className="h-full flex flex-col justify-between p-3">
                              <div className="flex items-center justify-center h-12">
                                {unit.icon ? (
                                  <img src={getFileUrl(unit.icon) || ''} alt={unit.name} className="w-10 h-10 rounded object-contain" />
                                ) : (
                                  <Icon icon="mdi:folder" className="w-10 h-10 text-gray-400" />
                                )}
                              </div>
                              <div className="flex flex-col items-center justify-center">
                                <h3 className="font-semibold text-center text-xs">{unit.shortName}</h3>
                                <p className="text-xs text-gray-500">
                                  {(unit as any)._count?.datasets || 0} ชุดข้อมูล
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-3">
                  <div className="mb-3 flex items-center gap-2 text-sm">
                    <button
                      onClick={() => {
                        setSelectedId(null);
                        setSelectedItem(null);
                        setNestedData([]);
                        setFilteredData([]);
                      }}
                      className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                    >
                      <Icon icon="mdi:arrow-left" className="w-4 h-4" />
                      กลับ
                    </button>
                    <Icon icon="mdi:chevron-right" className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700 font-medium">{selectedItem?.name}</span>
                  </div>

                  <div className="max-h-60 overflow-y-auto">
                    <NestedCollapsibleTable
                      rows={filteredData}
                      getRowId={(row) => row.id}
                      level1Header={datasetTab === 0 ? 'หน่วยงาน' : 'นโยบาย'}
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
                      level2Collapsible={false}
                      level2Actions={(dataset) => (
                        <button
                          onClick={() => toggleDataset(dataset)}
                          className={`px-3 py-1 text-xs rounded ${
                            isDatasetInCart(dataset.id)
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {isDatasetInCart(dataset.id) ? 'ลบออก' : 'เลือก'}
                        </button>
                      )}
                      level3NameField="name"
                      level3DetailField="detail"
                      level3MethodField="method"
                      level3ApiField="api"
                    />
                  </div>
                </div>
              )}
            </div>

            <TextField
              fullWidth
              select
              label="ชั้นความลับ"
              value={formData.securityLevel}
              onChange={(e) => setFormData({ ...formData, securityLevel: e.target.value })}
            >
              <MenuItem value="">ไม่มี</MenuItem>
              <MenuItem value="1">เปิด</MenuItem>
              <MenuItem value="2">ลับ</MenuItem>
              <MenuItem value="3">ลับมาก</MenuItem>
              <MenuItem value="4">ลับที่สุด</MenuItem>
            </TextField>

            {/* Existing Files */}
            {editingReport?.files && editingReport.files.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  ไฟล์ปัจจุบัน:
                </p>
                <div className="space-y-2">
                  {editingReport.files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <a
                        href={getFileUrl(file.filePath) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                      >
                        <Icon icon="mdi:file" />
                        {file.fileName}
                      </a>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteFile(file.id)}
                      >
                        <Icon icon="mdi:delete" className="w-4 h-4 text-red-600" />
                      </IconButton>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* File Upload */}
            <FileUpload
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              files={files}
              onChange={setFiles}
              label="อัปโหลดไฟล์ใหม่ (สูงสุด 5 ไฟล์, รวม 100MB)"
              maxSize={100}
              maxFiles={5}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            ยกเลิก
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Files Viewer */}
      <FilesViewer
        files={selectedReportFiles?.files || []}
        open={filesViewerOpen}
        onClose={() => setFilesViewerOpen(false)}
      />

      {/* Dataset Cart Modal */}
      <DatasetCartModal
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={selectedDatasets}
        onRemoveItem={(id) => setSelectedDatasets(selectedDatasets.filter(i => i.id !== id))}
        onClearCart={() => setSelectedDatasets([])}
      />
    </div>
  );
}
