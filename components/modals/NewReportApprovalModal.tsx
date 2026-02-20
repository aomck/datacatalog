'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Chip,
  FormControl,
  FormLabel,
  InputLabel,
  Select,
  OutlinedInput,
  Box,
  Tab,
  Tabs,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Radio,
  RadioGroup,
  FormControlLabel,
  ListSubheader,
} from '@mui/material';
import { Icon } from '@iconify/react';
import { getReportTypes } from '@/lib/actions/report-actions';
import { getUnitOwners, getCategories } from '@/lib/actions/admin-actions';
import { getCatalogUnitOwners, getCatalogCategories, getCategoriesByUnitOwner, getUnitOwnersByCategory } from '@/lib/actions/catalog-actions';
import { uploadReportFiles, uploadApprovalFiles } from '@/lib/actions/file-actions';
import { approveNewReportRequest } from '@/lib/actions/request-actions';
import { FileUpload } from '@/components/ui/FileUpload';
import { NestedCollapsibleTable } from '@/components/ui/NestedCollapsibleTable';
import { DatasetCartModal } from '@/components/modals/DatasetCartModal';
import { getFileUrl } from '@/lib/file-url';
import type { ReportType, UnitOwner, Category, RequestReport, Dataset, CartItem } from '@/types';

interface NewReportApprovalModalProps {
  open: boolean;
  onClose: () => void;
  requestReport: RequestReport | null;
  userId: string;
}

export function NewReportApprovalModal({
  open,
  onClose,
  requestReport,
  userId,
}: NewReportApprovalModalProps) {
  const [reportTypes, setReportTypes] = useState<ReportType[]>([]);
  const [unitOwners, setUnitOwners] = useState<UnitOwner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  // Dataset shopping state
  const [datasetTab, setDatasetTab] = useState(0);
  const [catalogUnitOwners, setCatalogUnitOwners] = useState<UnitOwner[]>([]);
  const [catalogCategories, setCatalogCategories] = useState<Category[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<UnitOwner | Category | null>(null);
  const [nestedData, setNestedData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [selectedDatasetItems, setSelectedDatasetItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDatasets, setSelectedDatasets] = useState<string[]>(
    requestReport?.requestedDatasetIds || []
  );

  // Search state for dropdowns
  const [unitOwnerSearch, setUnitOwnerSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');

  const [formData, setFormData] = useState({
    name: requestReport?.title || '',
    detail: requestReport?.detail || '',
    typeId: '',
    url: '',
    unitOwnerIds: [] as string[], // m:m unit owners (involved units)
    categoryId: '',
    categoryIds: [] as string[],
    datasetIds: requestReport?.requestedDatasetIds || [],
    securityLevel: '',
  });
  const [comment, setComment] = useState('');
  const [approvalStatus, setApprovalStatus] = useState<'PENDING' | 'INPROGRESS' | 'APPROVED' | 'DISAPPROVED'>('APPROVED');
  const [reportFiles, setReportFiles] = useState<File[]>([]);
  const [approvalFiles, setApprovalFiles] = useState<File[]>([]);

  useEffect(() => {
    if (open && requestReport) {
      loadOptions();
      loadDatasetData();
      loadSelectedDatasets();
      loadExistingReport();
    }
  }, [open, requestReport]);

  const loadExistingReport = async () => {
    if (!requestReport) return;

    // If reportId exists, fetch and fill report data
    if (requestReport.reportId && requestReport.report) {
      const report = requestReport.report;
      setFormData({
        name: report.name || requestReport.title || '',
        detail: report.detail || requestReport.detail || '',
        typeId: report.typeId || requestReport.reportTypeId || '',
        url: report.url || '',
        unitOwnerIds: report.unitOwners?.map((u: any) => u.unitOwnerId) || [],
        categoryId: report.categoryId || '',
        categoryIds: report.categories?.map((c: any) => c.categoryId) || [],
        datasetIds: report.datasets?.map((d: any) => d.datasetId) || requestReport.requestedDatasetIds || [],
        securityLevel: report.securityLevel || '',
      });
      setSelectedDatasets(report.datasets?.map((d: any) => d.datasetId) || requestReport.requestedDatasetIds || []);
    } else {
      // New report - auto-fill from request
      setFormData({
        name: requestReport.title || '',
        detail: requestReport.detail || '',
        typeId: requestReport.reportTypeId || '',
        url: '',
        unitOwnerIds: [],
        categoryId: '',
        categoryIds: [],
        datasetIds: requestReport.requestedDatasetIds || [],
        securityLevel: '',
      });
      setSelectedDatasets(requestReport.requestedDatasetIds || []);
    }

    // Auto-fill comment from previous approval
    setComment(requestReport.comment || '');

    // Auto-fill approval status (default to current status or APPROVED)
    const currentStatus = requestReport.approveStatus as 'PENDING' | 'INPROGRESS' | 'APPROVED' | 'DISAPPROVED';
    if (['PENDING', 'INPROGRESS', 'APPROVED', 'DISAPPROVED'].includes(currentStatus)) {
      setApprovalStatus(currentStatus);
    } else {
      setApprovalStatus('APPROVED');
    }

    // Note: Files cannot be auto-filled (reportFiles, approvalFiles) because they are File objects
    // User needs to upload new files or keep existing ones on the server
    setReportFiles([]);
    setApprovalFiles([]);
  };

  useEffect(() => {
    if (open) {
      loadDatasetData();
    }
  }, [datasetTab]);

  const loadOptions = async () => {
    try {
      const [types, unitsResult, catsResult] = await Promise.all([
        getReportTypes(),
        getUnitOwners(1, 100),
        getCategories(1, 100),
      ]);
      setReportTypes(types);
      setUnitOwners(unitsResult.data);
      setCategories(catsResult.data);
    } catch (error) {
      console.error('Error loading options:', error);
    }
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

  const loadSelectedDatasets = async () => {
    if (!requestReport?.selectedDatasets || requestReport.selectedDatasets.length === 0) {
      return;
    }

    // Convert selected datasets to cart items
    const cartItems: CartItem[] = requestReport.selectedDatasets.map((sd: any) => ({
      id: sd.dataset?.id || sd.datasetId,
      name: sd.dataset?.name || 'ชุดข้อมูล',
      type: 'dataset' as const,
    }));

    setSelectedDatasetItems(cartItems);
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
    const inCart = selectedDatasetItems.find((i) => i.id === item.id && i.type === item.type);
    if (inCart) {
      setSelectedDatasetItems(selectedDatasetItems.filter((i) => !(i.id === item.id && i.type === item.type)));
      setSelectedDatasets(selectedDatasets.filter(id => id !== dataset.id));
      setFormData({
        ...formData,
        datasetIds: formData.datasetIds.filter(id => id !== dataset.id),
      });
    } else {
      setSelectedDatasetItems([...selectedDatasetItems, item]);
      setSelectedDatasets([...selectedDatasets, dataset.id]);
      setFormData({
        ...formData,
        datasetIds: [...formData.datasetIds, dataset.id],
      });
    }
  };

  const isDatasetInCart = (datasetId: string) => {
    return selectedDatasetItems.some((item) => item.id === datasetId && item.type === 'dataset');
  };

  const handleApprove = async () => {
    // Calculate finalCategoryId outside the if block
    const finalCategoryId =
      formData.categoryIds.length > 0 ? formData.categoryIds[0] : formData.categoryId;

    // If approving, validate required fields
    if (approvalStatus === 'APPROVED') {
      if (!formData.name || !formData.typeId || formData.unitOwnerIds.length === 0) {
        alert('กรุณากรอกข้อมูลที่จำเป็น (ชื่อ, ประเภท, หน่วยงานที่เกี่ยวข้อง)');
        return;
      }

      if (!finalCategoryId) {
        alert('กรุณาเลือกนโยบายอย่างน้อย 1 รายการ');
        return;
      }
    }

    setLoading(true);
    try {
      let uploadedReportFiles: any[] = [];
      let uploadedApprovalFiles: any[] = [];

      // Upload report files
      if (reportFiles.length > 0) {
        const formDataObj = new FormData();
        reportFiles.forEach((file) => formDataObj.append('files', file));
        const result = await uploadReportFiles(formDataObj);

        if (!result.success) {
          throw new Error(result.error);
        }
        uploadedReportFiles = result.files!.map((f) => ({
          filePath: f.filePath,
          fileName: f.fileName,
          fileType: reportFiles.find((file) => file.name === f.fileName)?.type || '',
          fileSize: f.fileSize,
        }));
      }

      // Upload approval files
      if (approvalFiles.length > 0) {
        const formDataObj = new FormData();
        approvalFiles.forEach((file) => formDataObj.append('files', file));
        const result = await uploadApprovalFiles(formDataObj);

        if (!result.success) {
          throw new Error(result.error);
        }
        uploadedApprovalFiles = result.files!;
      }

      const reportData = {
        ...formData,
        categoryId: finalCategoryId,
        files: uploadedReportFiles,
      };

      const result = await approveNewReportRequest(
        requestReport.id,
        reportData,
        approvalStatus,
        comment,
        userId,
        uploadedApprovalFiles
      );

      if (result.success) {
        const message = approvalStatus === 'APPROVED'
          ? 'อนุมัติและสร้างรายงานสำเร็จ'
          : approvalStatus === 'PENDING'
          ? 'บันทึกสถานะกำลังพิจารณาเรียบร้อย'
          : approvalStatus === 'INPROGRESS'
          ? 'บันทึกสถานะกำลังดำเนินการเรียบร้อย'
          : 'ไม่อนุมัติคำขอเรียบร้อย';
        alert(message);
        onClose();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!requestReport) {
    return null;
  }

  return (
    <>
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>อนุมัติและสร้างรายงานใหม่</DialogTitle>
      <DialogContent>
        <div className="space-y-4 pt-4">
          {/* Request Info */}
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <h3 className="font-semibold text-blue-900 mb-2">ข้อมูลจากคำขอ</h3>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">ชื่อที่ต้องการ:</span> {requestReport.title}
              </p>
              {requestReport.detail && (
                <p>
                  <span className="font-medium">รายละเอียด:</span> {requestReport.detail}
                </p>
              )}
              {requestReport.selectedDatasets && requestReport.selectedDatasets.length > 0 && (
                <p>
                  <span className="font-medium">ชุดข้อมูลที่เลือก:</span>{' '}
                  {requestReport.selectedDatasets.length} รายการ
                </p>
              )}
              {requestReport.designFiles && requestReport.designFiles.length > 0 && (
                <div>
                  <p className="font-medium">ไฟล์ Design:</p>
                  <div className="mt-1 space-y-1">
                    {requestReport.designFiles.map((file) => (
                      <a
                        key={file.id}
                        href={getFileUrl(file.filePath) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        <Icon icon="mdi:file" className="w-4 h-4" />
                        {file.fileName}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {requestReport.request?.requestFiles && requestReport.request.requestFiles.length > 0 && (
                <div>
                  <p className="font-medium">หลักฐานประกอบ:</p>
                  <div className="mt-1 space-y-1">
                    {requestReport.request.requestFiles.map((file: any) => (
                      <a
                        key={file.id}
                        href={getFileUrl(file.filePath) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        <Icon icon="mdi:file-document" className="w-4 h-4" />
                        {file.fileName}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Report Form */}
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
              onChange={(e) =>
                setFormData({ ...formData, unitOwnerIds: e.target.value as string[] })
              }
              onClose={() => setUnitOwnerSearch('')}
              input={<OutlinedInput label="หน่วยงานที่เกี่ยวข้อง" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const unit = unitOwners.find((u) => u.id === value);
                    return (
                      <Chip
                        key={value}
                        label={unit?.shortName}
                        size="small"
                        onDelete={() => {
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
              onChange={(e) =>
                setFormData({ ...formData, categoryIds: e.target.value as string[] })
              }
              onClose={() => setCategorySearch('')}
              input={<OutlinedInput label="นโยบาย" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const cat = categories.find((c) => c.id === value);
                    return (
                      <Chip
                        key={value}
                        label={cat?.shortName}
                        size="small"
                        onDelete={() => {
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

          {/* Dataset Shopping Section */}
          <div className="border border-gray-300 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">เลือกชุดข้อมูล (Optional)</h4>
              <Tooltip title="รายการที่เลือก">
                <div className="relative">
                  <IconButton onClick={() => setCartOpen(true)} color="primary" size="small">
                    <Icon icon="mdi:cart" className="w-5 h-5" />
                  </IconButton>
                  {selectedDatasetItems.length > 0 && (
                    <Chip
                      label={selectedDatasetItems.length}
                      size="small"
                      color="error"
                      sx={{ position: 'absolute', top: -4, right: -4, minWidth: 20, height: 20, fontSize: '0.7rem' }}
                    />
                  )}
                </div>
              </Tooltip>
            </div>

            <Tabs value={datasetTab} onChange={(_, v) => {
              setDatasetTab(v);
              setSelectedId(null);
              setSelectedItem(null);
              setNestedData([]);
              setFilteredData([]);
              setSearchTerm('');
            }} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tab
                label={
                  <div className="flex items-center gap-2">
                    <Icon icon="mdi:tag-multiple" className="w-4 h-4" />
                    <span className="text-sm">นโยบายและแผนความมั่นคง</span>
                  </div>
                }
              />
              <Tab
                label={
                  <div className="flex items-center gap-2">
                    <Icon icon="mdi:office-building" className="w-4 h-4" />
                    <span className="text-sm">หน่วยงาน</span>
                  </div>
                }
              />
            </Tabs>

            {!selectedId ? (
              <>
                <div className="mb-3">
                  <div className="relative">
                    <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder={`ค้นหา${datasetTab === 0 ? 'นโยบาย' : 'หน่วยงาน'}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                  {(datasetTab === 0 ? catalogCategories : catalogUnitOwners)
                    .filter((item) => {
                      if (!searchTerm) return true;
                      const search = searchTerm.toLowerCase();
                      return item.name.toLowerCase().includes(search) || item.shortName.toLowerCase().includes(search);
                    })
                    .map((item) => (
                      <Card
                        key={item.id}
                        className="cursor-pointer transition-all hover:shadow-lg h-32"
                        onClick={() => loadNestedData(item.id, item)}
                      >
                        <CardContent className="h-full flex flex-col justify-center items-center p-2">
                          {item.icon ? (
                            <img src={getFileUrl(item.icon) || ''} alt={item.name} className="w-10 h-10 rounded object-contain mb-2" />
                          ) : (
                            <Icon icon="mdi:folder" className="w-10 h-10 text-gray-400 mb-2" />
                          )}
                          <h3 className="font-semibold text-xs text-center">{item.shortName}</h3>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </>
            ) : (
              <div>
                {/* Breadcrumb */}
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
                    <Icon icon="mdi:home" className="w-3.5 h-3.5" />
                    {datasetTab === 0 ? 'นโยบาย' : 'หน่วยงาน'}
                  </button>
                  <Icon icon="mdi:chevron-right" className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-700 font-medium text-sm">{selectedItem?.shortName}</span>
                </div>

                <div className="max-h-64 overflow-y-auto">
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
                        className={`px-3 py-1 text-sm rounded ${
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

          {/* Show existing report files */}
          {requestReport.report?.files && requestReport.report.files.length > 0 && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="font-medium text-sm text-gray-700 mb-2">ไฟล์รายงานที่มีอยู่:</p>
              <div className="space-y-1">
                {requestReport.report.files.map((file: any) => (
                  <a
                    key={file.id}
                    href={getFileUrl(file.filePath) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                  >
                    <Icon icon="mdi:file" className="w-4 h-4" />
                    {file.fileName}
                  </a>
                ))}
              </div>
            </div>
          )}

          <FileUpload
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            files={reportFiles}
            onChange={setReportFiles}
            label="อัปโหลดไฟล์รายงานใหม่ (ถ้ามี)"
            maxSize={100}
            maxFiles={5}
          />

          {/* Approval Status Selection */}
          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend">สถานะการอนุมัติ</FormLabel>
            <RadioGroup
              value={approvalStatus}
              onChange={(e) => setApprovalStatus(e.target.value as 'PENDING' | 'INPROGRESS' | 'APPROVED' | 'DISAPPROVED')}
              row
            >
              <FormControlLabel value="PENDING" control={<Radio />} label="กำลังพิจารณา" />
              <FormControlLabel value="INPROGRESS" control={<Radio />} label="กำลังดำเนินการ" />
              <FormControlLabel value="APPROVED" control={<Radio />} label="อนุมัติ" />
              <FormControlLabel value="DISAPPROVED" control={<Radio />} label="ไม่อนุมัติ" />
            </RadioGroup>
          </FormControl>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="ความคิดเห็น"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="ความคิดเห็นประกอบการอนุมัติ"
          />

          {/* Show existing approval files */}
          {requestReport.approvalFiles && requestReport.approvalFiles.length > 0 && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="font-medium text-sm text-gray-700 mb-2">เอกสารประกอบการอนุมัติที่มีอยู่:</p>
              <div className="space-y-1">
                {requestReport.approvalFiles.map((file: any) => (
                  <a
                    key={file.id}
                    href={getFileUrl(file.filePath) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                  >
                    <Icon icon="mdi:file-document" className="w-4 h-4" />
                    {file.fileName}
                  </a>
                ))}
              </div>
            </div>
          )}

          <FileUpload
            multiple
            accept="image/*,.pdf"
            files={approvalFiles}
            onChange={setApprovalFiles}
            label="เอกสารประกอบการอนุมัติใหม่ (ถ้ามี)"
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          ยกเลิก
        </Button>
        <Button onClick={handleApprove} variant="contained" disabled={loading}>
          {loading
            ? 'กำลังดำเนินการ...'
            : approvalStatus === 'APPROVED'
            ? 'อนุมัติและสร้างรายงาน'
            : approvalStatus === 'PENDING'
            ? 'บันทึกเป็นกำลังพิจารณา'
            : approvalStatus === 'INPROGRESS'
            ? 'บันทึกเป็นกำลังดำเนินการ'
            : 'ไม่อนุมัติ'}
        </Button>
      </DialogActions>
    </Dialog>

    <DatasetCartModal
      open={cartOpen}
      onClose={() => setCartOpen(false)}
      items={selectedDatasetItems}
      onRemoveItem={(id) => {
        setSelectedDatasetItems(selectedDatasetItems.filter(i => i.id !== id));
        setSelectedDatasets(selectedDatasets.filter(dsId => dsId !== id));
        setFormData({
          ...formData,
          datasetIds: formData.datasetIds.filter(dsId => dsId !== id),
        });
      }}
      onClearCart={() => {
        setSelectedDatasetItems([]);
        setSelectedDatasets([]);
        setFormData({
          ...formData,
          datasetIds: [],
        });
      }}
    />
  </>
  );
}
