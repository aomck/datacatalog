'use client';

import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stepper, Step, StepLabel } from '@mui/material';
import { Icon } from '@iconify/react';
import { FileUpload } from '@/components/ui/FileUpload';
import { createReportRequest } from '@/lib/actions/request-actions';
import { uploadRequestFiles } from '@/lib/actions/file-actions';
import type { CartItem } from '@/types';

interface ReportRequestModalProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  user: any;
}

export function ReportRequestModal({ open, onClose, items, onRemoveItem, onClearCart, user }: ReportRequestModalProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    name: user?.firstname + ' ' + user?.lastname || '',
    unit: user?.activeUnit?.nameTh || '',
    email: user?.email || '',
    tel: user?.tel || '',
    detail: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const steps = ['รายการคำขอ', 'ข้อมูลผู้ขอ', 'แนบเอกสาร'];

  const reportItems = items.filter((item) => item.type === 'report');

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleSubmit = async () => {
    if (files.length === 0) {
      alert('กรุณาแนบไฟล์หลักฐานอย่างน้อย 1 ไฟล์');
      return;
    }

    setLoading(true);
    try {
      // Upload files
      const formDataObj = new FormData();
      files.forEach((file) => formDataObj.append('files', file));

      const uploadResult = await uploadRequestFiles(formDataObj);
      if (!uploadResult.success) {
        throw new Error(uploadResult.error);
      }

      // Create request
      const result = await createReportRequest({
        userId: user.id,
        name: formData.name,
        unit: formData.unit,
        email: formData.email,
        tel: formData.tel,
        detail: formData.detail,
        reportIds: reportItems.map((item) => item.id),
        files: uploadResult.files!.map((f) => ({
          filePath: f.filePath,
          fileName: f.fileName,
          fileType: files.find((file) => file.name === f.fileName)?.type || '',
          fileSize: f.fileSize,
        })),
      });

      if (result.success) {
        alert('ส่งคำขอเรียบร้อยแล้ว');
        onClearCart();
        onClose();
        setActiveStep(0);
        setFiles([]);
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
      <DialogTitle>ส่งคำขอใช้รายงาน</DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ pt: 3, pb: 5 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 0 && (
          <div className="space-y-3">
            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Icon icon="mdi:cart-outline" className="w-16 h-16 mx-auto mb-2 opacity-50" />
                <p>ไม่มีรายการในคำขอ</p>
              </div>
            ) : (
              <>
                {reportItems.map((report) => (
                  <div key={report.id} className="bg-purple-50 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-3 bg-purple-100">
                      <div className="flex items-center gap-2">
                        <Icon icon="mdi:file-chart" className="w-5 h-5 text-purple-700" />
                        <span className="font-semibold text-purple-900">{report.name}</span>
                      </div>
                      <button
                        onClick={() => onRemoveItem(report.id)}
                        className="p-1 hover:bg-red-100 rounded-full transition-colors"
                        title="ลบรายงาน"
                      >
                        <Icon icon="mdi:close-circle" className="w-5 h-5 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {activeStep === 1 && (
          <div className="space-y-4 pt-4">
            <TextField
              fullWidth
              label="ชื่อผู้ขอ"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="หน่วยงาน"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="อีเมล"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="เบอร์โทรศัพท์"
              value={formData.tel}
              onChange={(e) => setFormData({ ...formData, tel: e.target.value })}
              required
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="รายละเอียดเพิ่มเติม"
              value={formData.detail}
              onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
            />
          </div>
        )}

        {activeStep === 2 && (
          <div className="pt-4">
            <p className="text-sm text-gray-600 mb-4">
              กรุณาแนบไฟล์หลักฐานประกอบคำขอ (รูปภาพหรือ PDF)
            </p>
            <FileUpload multiple accept="image/*,.pdf" files={files} onChange={setFiles} />
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
          <Button onClick={handleNext} variant="contained" disabled={items.length === 0}>
            ถัดไป
          </Button>
        ) : (
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? 'กำลังส่ง...' : 'ส่งคำขอ'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
