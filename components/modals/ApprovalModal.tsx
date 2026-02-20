'use client';

import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, RadioGroup, FormControlLabel, Radio, FormControl, FormLabel } from '@mui/material';
import { Icon } from '@iconify/react';
import { FileUpload } from '@/components/ui/FileUpload';
import { bulkUpdateRequestStatus } from '@/lib/actions/request-actions';
import { uploadApprovalFiles } from '@/lib/actions/file-actions';
import type { ApproveStatus } from '@/types';

interface ApprovalModalProps {
  open: boolean;
  onClose: () => void;
  selectedItems: { datasetIds: string[]; serviceIds: string[]; reportIds: string[] };
  requests: any[];
  onSuccess: () => void;
  userId: string;
}

export function ApprovalModal({ open, onClose, selectedItems, requests, onSuccess, userId }: ApprovalModalProps) {
  const [status, setStatus] = useState<ApproveStatus>('PENDING');
  const [comment, setComment] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const totalItems = selectedItems.datasetIds.length + selectedItems.serviceIds.length + selectedItems.reportIds.length;

  // Build hierarchy of selected items
  const selectedHierarchy = requests.flatMap((request) => {
    const selectedDatasets = request.requestDatasets?.filter((rd: any) =>
      selectedItems.datasetIds.includes(rd.id)
    ) || [];

    return selectedDatasets.map((rd: any) => {
      const relatedServices = request.requestServices?.filter((rs: any) =>
        rs.service?.datasetId === rd.dataset?.id && selectedItems.serviceIds.includes(rs.id)
      ) || [];

      return {
        dataset: rd,
        services: relatedServices,
      };
    });
  }).filter((item) => item.dataset);

  // Get selected reports
  const selectedReports = requests.flatMap((request) =>
    request.requestReports?.filter((rr: any) => selectedItems.reportIds.includes(rr.id)) || []
  );

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let uploadedFiles: { filePath: string; fileName: string; fileSize: number }[] = [];

      // Upload files if any
      if (files.length > 0) {
        const formDataObj = new FormData();
        files.forEach((file) => formDataObj.append('files', file));

        const uploadResult = await uploadApprovalFiles(formDataObj);
        if (!uploadResult.success) {
          throw new Error(uploadResult.error);
        }
        uploadedFiles = uploadResult.files!;
      }

      const result = await bulkUpdateRequestStatus(
        selectedItems.datasetIds,
        selectedItems.serviceIds,
        selectedItems.reportIds,
        status,
        comment,
        userId,
        uploadedFiles
      );

      if (result.success) {
        alert('ดำเนินการเรียบร้อยแล้ว');
        onSuccess();
        onClose();
        setComment('');
        setStatus('PENDING');
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>ดำเนินการคำขอ</DialogTitle>
      <DialogContent>
        <FormControl component="fieldset" sx={{ mt: 2, width: '100%' }}>
          <FormLabel component="legend">สถานะ</FormLabel>
          <RadioGroup value={status} onChange={(e) => setStatus(e.target.value as ApproveStatus)}>
            <FormControlLabel value="PENDING" control={<Radio />} label="กำลังพิจารณา" />
            <FormControlLabel value="APPROVED" control={<Radio />} label="อนุมัติ" />
            <FormControlLabel value="DISAPPROVED" control={<Radio />} label="ไม่อนุมัติ" />
          </RadioGroup>
        </FormControl>

        <TextField
          fullWidth
          multiline
          rows={4}
          label="ความคิดเห็น"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          sx={{ mt: 3 }}
        />

        {/* File Upload */}
        <div className="mt-4">
          <FileUpload
            multiple
            accept="image/*,.pdf"
            files={files}
            onChange={setFiles}
            label="แนบไฟล์ (ถ้ามี)"
            maxSize={10}
          />
        </div>

        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-3">รายการที่เลือก ({totalItems})</p>
          <div className="max-h-80 overflow-y-auto space-y-2">
            {selectedHierarchy.map((item, index) => (
              <div key={index} className="bg-blue-50 rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 p-2 bg-blue-100">
                  <Icon icon="mdi:database" className="w-4 h-4 text-blue-700" />
                  <span className="text-sm font-semibold text-blue-900">{item.dataset.dataset?.name}</span>
                </div>
                {item.services.length > 0 && (
                  <div className="p-2 space-y-1">
                    {item.services.map((rs: any) => (
                      <div key={rs.id} className="flex items-center gap-2 bg-white p-2 rounded">
                        <Icon icon="mdi:api" className="w-3.5 h-3.5 text-green-600" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{rs.service?.name}</p>
                          <p className="text-xs text-gray-600 truncate">{rs.service?.method} {rs.service?.api}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {selectedReports.map((rr: any) => (
              <div key={rr.id} className="bg-purple-50 rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 p-2 bg-purple-100">
                  <Icon icon="mdi:file-chart" className="w-4 h-4 text-purple-700" />
                  <span className="text-sm font-semibold text-purple-900">{rr.report?.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          ยกเลิก
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? 'กำลังดำเนินการ...' : 'ตกลง'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
