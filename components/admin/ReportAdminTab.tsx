'use client';

import { useState, useEffect } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Chip, IconButton, FormControl, InputLabel, Select, OutlinedInput, Box } from '@mui/material';
import { Icon } from '@iconify/react';
import { getReports, getReportTypes, createReport, updateReport, deleteReport, deleteReportFile } from '@/lib/actions/report-actions';
import { getUnitOwners, getCategories } from '@/lib/actions/admin-actions';
import { getCatalogUnitOwners } from '@/lib/actions/catalog-actions';
import { uploadReportFiles } from '@/lib/actions/file-actions';
import { DataTable } from '@/components/ui/DataTable';
import { FileUpload } from '@/components/ui/FileUpload';
import { RefreshButton } from '@/components/ui/RefreshButton';
import { FilterPanel, type FilterState } from '@/components/ui/FilterPanel';
import { FilesViewer } from '@/components/ui/FilesViewer';
import { getFileUrl } from '@/lib/file-url';
import type { Report, ReportType, UnitOwner, Category, Dataset } from '@/types';

interface ReportAdminTabProps {
  userId: string;
  onReady?: (openDialog: () => void, refresh: () => void) => void; // ส่ง handlers กลับไปให้ parent
}

export function ReportAdminTab({ userId, onReady }: ReportAdminTabProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [reportTypes, setReportTypes] = useState<ReportType[]>([]);
  const [unitOwners, setUnitOwners] = useState<UnitOwner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
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

  useEffect(() => {
    loadData();
    loadReportTypes();
    loadUnitOwners();
    loadCategories();
  }, [page]);

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
    }
    setFiles([]);
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
      align: 'center',
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
      align: 'center',
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
      align: 'center',
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
                {unitOwners.map((unit) => (
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
                {categories.map((cat) => (
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
    </div>
  );
}
