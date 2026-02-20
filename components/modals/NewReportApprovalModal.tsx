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
  InputLabel,
  Select,
  OutlinedInput,
  Box,
} from '@mui/material';
import { Icon } from '@iconify/react';
import { getReportTypes } from '@/lib/actions/report-actions';
import { getUnitOwners, getCategories } from '@/lib/actions/admin-actions';
import { uploadReportFiles, uploadApprovalFiles } from '@/lib/actions/file-actions';
import { approveNewReportRequest } from '@/lib/actions/request-actions';
import { FileUpload } from '@/components/ui/FileUpload';
import { getFileUrl } from '@/lib/file-url';
import type { ReportType, UnitOwner, Category, RequestReport } from '@/types';

interface NewReportApprovalModalProps {
  open: boolean;
  onClose: () => void;
  requestReport: RequestReport;
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

  const [formData, setFormData] = useState({
    name: requestReport.title || '',
    detail: requestReport.detail || '',
    typeId: '',
    url: '',
    unitOwnerIds: [] as string[], // m:m unit owners (involved units)
    categoryId: '',
    categoryIds: [] as string[],
    datasetIds: requestReport.selectedDatasets?.map(d => d.datasetId) || [],
    securityLevel: '',
  });
  const [comment, setComment] = useState('');
  const [reportFiles, setReportFiles] = useState<File[]>([]);
  const [approvalFiles, setApprovalFiles] = useState<File[]>([]);

  useEffect(() => {
    if (open) {
      loadOptions();
    }
  }, [open]);

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

  const handleApprove = async () => {
    if (!formData.name || !formData.typeId || formData.unitOwnerIds.length === 0) {
      alert('กรุณากรอกข้อมูลที่จำเป็น (ชื่อ, ประเภท, หน่วยงานที่เกี่ยวข้อง)');
      return;
    }

    const finalCategoryId =
      formData.categoryIds.length > 0 ? formData.categoryIds[0] : formData.categoryId;

    if (!finalCategoryId) {
      alert('กรุณาเลือกนโยบายอย่างน้อย 1 รายการ');
      return;
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
        comment,
        userId,
        uploadedApprovalFiles
      );

      if (result.success) {
        alert('อนุมัติและสร้างรายงานสำเร็จ');
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
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
              input={<OutlinedInput label="หน่วยงานที่เกี่ยวข้อง" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const unit = unitOwners.find((u) => u.id === value);
                    return <Chip key={value} label={unit?.shortName} size="small" />;
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
              onChange={(e) =>
                setFormData({ ...formData, categoryIds: e.target.value as string[] })
              }
              input={<OutlinedInput label="นโยบาย" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const cat = categories.find((c) => c.id === value);
                    return <Chip key={value} label={cat?.shortName} size="small" />;
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

          <FileUpload
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            files={reportFiles}
            onChange={setReportFiles}
            label="อัปโหลดไฟล์รายงาน (สูงสุด 5 ไฟล์, รวม 100MB)"
            maxSize={100}
            maxFiles={5}
          />

          <TextField
            fullWidth
            multiline
            rows={3}
            label="ความคิดเห็น"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="ความคิดเห็นประกอบการอนุมัติ"
          />

          <FileUpload
            multiple
            accept="image/*,.pdf"
            files={approvalFiles}
            onChange={setApprovalFiles}
            label="เอกสารประกอบการอนุมัติ (ถ้ามี)"
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          ยกเลิก
        </Button>
        <Button onClick={handleApprove} variant="contained" disabled={loading}>
          {loading ? 'กำลังดำเนินการ...' : 'อนุมัติและสร้างรายงาน'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
