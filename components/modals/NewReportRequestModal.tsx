'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stepper,
  Step,
  StepLabel,
  Tab,
  Tabs,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Icon } from '@iconify/react';
import { FileUpload } from '@/components/ui/FileUpload';
import { NestedCollapsibleTable } from '@/components/ui/NestedCollapsibleTable';
import { DatasetCartModal } from '@/components/modals/DatasetCartModal';
import { getCatalogUnitOwners, getCatalogCategories, getCategoriesByUnitOwner, getUnitOwnersByCategory } from '@/lib/actions/catalog-actions';
import { getReportTypes } from '@/lib/actions/report-actions';
import { createNewReportRequest } from '@/lib/actions/request-actions';
import { uploadRequestFiles } from '@/lib/actions/file-actions';
import { getFileUrl } from '@/lib/file-url';
import type { UnitOwner, Category, Dataset, CartItem, ReportType } from '@/types';

interface NewReportRequestModalProps {
  open: boolean;
  onClose: () => void;
  user: any;
}

export function NewReportRequestModal({ open, onClose, user }: NewReportRequestModalProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [datasetTab, setDatasetTab] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    detail: '',
    reportTypeId: '',
    name: user?.firstname + ' ' + user?.lastname || '',
    unit: user?.activeUnit?.nameTh || '',
    email: user?.email || '',
    tel: user?.tel || '',
  });
  const [designFiles, setDesignFiles] = useState<File[]>([]);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  // Report types
  const [reportTypes, setReportTypes] = useState<ReportType[]>([]);

  // Dataset selection state
  const [unitOwners, setUnitOwners] = useState<UnitOwner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<UnitOwner | Category | null>(null);
  const [nestedData, setNestedData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [selectedDatasets, setSelectedDatasets] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const steps = ['ข้อมูลรายงาน', 'เลือก Dataset (Optional)', 'ข้อมูลผู้ขอ', 'แนบเอกสาร'];

  useEffect(() => {
    if (open) {
      loadReportTypes();
      if (activeStep === 1) {
        loadDatasetData();
      }
    }
  }, [datasetTab, open, activeStep]);

  const loadReportTypes = async () => {
    try {
      const result = await getReportTypes();
      setReportTypes(result);
    } catch (error) {
      console.error('Error loading report types:', error);
    }
  };

  const loadDatasetData = async () => {
    setLoading(true);
    try {
      if (datasetTab === 0) {
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

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleSubmit = async () => {
    if (!formData.title || !formData.detail || !formData.reportTypeId) {
      alert('กรุณากรอกชื่อรายงาน ประเภทรายงาน และรายละเอียด');
      return;
    }

    if (evidenceFiles.length === 0) {
      alert('กรุณาแนบไฟล์หลักฐานอย่างน้อย 1 ไฟล์');
      return;
    }

    setLoading(true);
    try {
      // Upload files
      const formDataObj = new FormData();
      [...designFiles, ...evidenceFiles].forEach((file) => formDataObj.append('files', file));

      const uploadResult = await uploadRequestFiles(formDataObj);
      if (!uploadResult.success) {
        throw new Error(uploadResult.error);
      }

      // Separate design and evidence files
      const uploadedDesignFiles = uploadResult.files!.slice(0, designFiles.length);
      const uploadedEvidenceFiles = uploadResult.files!.slice(designFiles.length);

      // Create new report request
      const result = await createNewReportRequest({
        userId: user.id,
        title: formData.title,
        detail: formData.detail,
        reportTypeId: formData.reportTypeId,
        name: formData.name,
        unit: formData.unit,
        email: formData.email,
        tel: formData.tel,
        datasetIds: selectedDatasets.map((d) => d.id),
        designFiles: uploadedDesignFiles.map((f, index) => ({
          filePath: f.filePath,
          fileName: f.fileName,
          fileType: designFiles[index]?.type || '',
          fileSize: f.fileSize,
        })),
        evidenceFiles: uploadedEvidenceFiles.map((f, index) => ({
          filePath: f.filePath,
          fileName: f.fileName,
          fileType: evidenceFiles[index]?.type || '',
          fileSize: f.fileSize,
        })),
      });

      if (result.success) {
        alert('ส่งคำขอรายงานใหม่เรียบร้อยแล้ว');
        onClose();
        resetForm();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setActiveStep(0);
    setFormData({
      title: '',
      detail: '',
      reportTypeId: '',
      name: user?.firstname + ' ' + user?.lastname || '',
      unit: user?.activeUnit?.nameTh || '',
      email: user?.email || '',
      tel: user?.tel || '',
    });
    setDesignFiles([]);
    setEvidenceFiles([]);
    setSelectedDatasets([]);
    setSelectedId(null);
    setSelectedItem(null);
    setNestedData([]);
    setFilteredData([]);
    setSearchTerm('');
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>ร้องขอรายงานใหม่</DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} sx={{ pt: 3, pb: 5 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Step 0: Report Info */}
          {activeStep === 0 && (
            <div className="space-y-4">
              <TextField
                fullWidth
                label="ชื่อรายงาน"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <FormControl fullWidth required>
                <InputLabel>ประเภทรายงาน</InputLabel>
                <Select
                  value={formData.reportTypeId}
                  onChange={(e) => setFormData({ ...formData, reportTypeId: e.target.value })}
                  label="ประเภทรายงาน"
                >
                  {reportTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      {type.shortName} ({type.name})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="รายละเอียด"
                required
                multiline
                rows={4}
                value={formData.detail}
                onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
              />
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Design Upload (ถ้ามี)
                </p>
                <FileUpload
                  files={designFiles}
                  onChange={setDesignFiles}
                  multiple
                />
              </div>
            </div>
          )}

          {/* Step 1: Dataset Selection */}
          {activeStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">
                  เลือก Dataset ที่ต้องการใช้ในรายงาน (Optional)
                </p>
                <Tooltip title="รายการที่เลือก">
                  <div className="relative">
                    <IconButton onClick={() => setCartOpen(true)} color="primary">
                      <Icon icon="mdi:cart" className="w-6 h-6" />
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

              <Tabs value={datasetTab} onChange={(_, v) => {
                setDatasetTab(v);
                setSelectedId(null);
                setSelectedItem(null);
                setNestedData([]);
                setFilteredData([]);
                setSearchTerm('');
              }}>
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

              {!selectedId ? (
                <>
                  <div className="mt-4 mb-4">
                    <div className="relative">
                      <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder={`ค้นหา${datasetTab === 0 ? 'นโยบายและแผนความมั่นคง' : 'หน่วยงาน'}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {datasetTab === 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {categories
                        .filter((cat) => {
                          if (!searchTerm) return true;
                          const search = searchTerm.toLowerCase();
                          return cat.name.toLowerCase().includes(search) || cat.shortName.toLowerCase().includes(search);
                        })
                        .map((cat) => (
                          <Card
                            key={cat.id}
                            className="cursor-pointer transition-all hover:shadow-lg h-48"
                            onClick={() => loadNestedData(cat.id, cat)}
                          >
                            <CardContent className="h-full flex flex-col justify-between p-4">
                              <div className="flex items-center justify-center" style={{ height: '40%' }}>
                                {cat.icon ? (
                                  <img src={getFileUrl(cat.icon) || ''} alt={cat.name} className="w-16 h-16 rounded object-contain opacity-60" />
                                ) : (
                                  <Icon icon="mdi:folder" className="w-16 h-16 text-gray-400" />
                                )}
                              </div>
                              <div className="flex flex-col items-center justify-center gap-1" style={{ height: '50%' }}>
                                <p className="text-sm text-gray-600">นยม.{cat.order || 0}</p>
                                <h3 className="font-semibold text-center text-sm">{cat.name}</h3>
                                <p className="text-xs text-gray-600 text-center">{cat.shortName}</p>
                              </div>
                              <div className="flex flex-col items-center justify-center" style={{ height: '10%' }}>
                                <p className="text-xs text-gray-500">
                                  {(cat as any)._count?.datasetCategories || 0} ชุดข้อมูล
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {unitOwners
                        .filter((unit) => {
                          if (!searchTerm) return true;
                          const search = searchTerm.toLowerCase();
                          return unit.name.toLowerCase().includes(search) || unit.shortName.toLowerCase().includes(search);
                        })
                        .map((unit) => (
                          <Card
                            key={unit.id}
                            className="cursor-pointer transition-all hover:shadow-lg h-48"
                            onClick={() => loadNestedData(unit.id, unit)}
                          >
                            <CardContent className="h-full flex flex-col justify-between p-4">
                              <div className="flex items-center justify-center" style={{ height: '40%' }}>
                                {unit.icon ? (
                                  <img src={getFileUrl(unit.icon) || ''} alt={unit.name} className="w-16 h-16 rounded object-contain" />
                                ) : (
                                  <Icon icon="mdi:folder" className="w-16 h-16 text-gray-400" />
                                )}
                              </div>
                              <div className="flex flex-col items-center justify-center gap-1" style={{ height: '50%' }}>
                                <h3 className="font-semibold text-center">{unit.name}</h3>
                                <p className="text-sm text-gray-600 text-center">{unit.shortName}</p>
                              </div>
                              <div className="flex flex-col items-center justify-center" style={{ height: '10%' }}>
                                <p className="text-xs text-gray-500">
                                  {(unit as any)._count?.datasets || 0} ชุดข้อมูล
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="mt-4">
                  {/* Breadcrumb */}
                  <div className="mb-6 flex items-center gap-2 text-sm">
                    <button
                      onClick={() => {
                        setSelectedId(null);
                        setSelectedItem(null);
                        setNestedData([]);
                        setFilteredData([]);
                      }}
                      className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                    >
                      <Icon icon="mdi:home" className="w-4 h-4" />
                      {datasetTab === 0 ? 'นโยบายและแผนความมั่นคง' : 'หน่วยงาน'}
                    </button>
                    <Icon icon="mdi:chevron-right" className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700 font-medium">{selectedItem?.name}</span>
                  </div>

                  <NestedCollapsibleTable
                    rows={filteredData}
                    getRowId={(row) => row.id}
                    level1Header={datasetTab === 0 ? 'หน่วยงาน' : 'นโยบายและแผนความมั่นคง'}
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
              )}
            </div>
          )}

          {/* Step 2: User Info */}
          {activeStep === 2 && (
            <div className="space-y-4">
              <TextField
                fullWidth
                label="ชื่อ-นามสกุล"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <TextField
                fullWidth
                label="หน่วยงาน"
                required
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              />
              <TextField
                fullWidth
                label="อีเมล"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <TextField
                fullWidth
                label="เบอร์โทรศัพท์"
                required
                value={formData.tel}
                onChange={(e) => setFormData({ ...formData, tel: e.target.value })}
              />
            </div>
          )}

          {/* Step 3: Evidence Files */}
          {activeStep === 3 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-700">
                แนบไฟล์หลักฐาน (อย่างน้อย 1 ไฟล์) *
              </p>
              <FileUpload
                files={evidenceFiles}
                onChange={setEvidenceFiles}
                multiple
              />
            </div>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            ยกเลิก
          </Button>
          {activeStep > 0 && (
            <Button onClick={handleBack} disabled={loading}>
              ย้อนกลับ
            </Button>
          )}
          {activeStep < steps.length - 1 ? (
            <Button onClick={handleNext} variant="contained" disabled={loading}>
              ถัดไป
            </Button>
          ) : (
            <Button onClick={handleSubmit} variant="contained" disabled={loading}>
              {loading ? 'กำลังส่งคำขอ...' : 'ส่งคำขอ'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dataset Cart Modal */}
      <DatasetCartModal
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={selectedDatasets}
        onRemoveItem={(id) => setSelectedDatasets(selectedDatasets.filter(i => i.id !== id))}
        onClearCart={() => setSelectedDatasets([])}
      />
    </>
  );
}
