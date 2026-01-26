'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import { getFileUrl } from '@/lib/file-url';

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  maxFiles?: number;
  files?: File[]; // External state control
  onChange?: (files: File[]) => void; // External state control
  onFilesSelected?: (files: File[]) => void; // Legacy support
  label?: string;
  existingFileUrl?: string; // URL of existing uploaded file
  existingFileName?: string; // Name of existing file
}

export function FileUpload({
  accept = 'image/*,.pdf',
  multiple = false,
  maxSize = 10,
  maxFiles,
  files: externalFiles,
  onChange,
  onFilesSelected,
  label,
  existingFileUrl,
  existingFileName,
}: FileUploadProps) {
  const [internalFiles, setInternalFiles] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Use external state if provided, otherwise internal state
  const selectedFiles = externalFiles !== undefined ? externalFiles : internalFiles;
  const setSelectedFiles = onChange || setInternalFiles;

  const isImage = (fileUrl: string) => {
    return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(fileUrl);
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'mdi:file-pdf-box';
    if (['doc', 'docx'].includes(ext || '')) return 'mdi:file-word-box';
    if (['xls', 'xlsx'].includes(ext || '')) return 'mdi:file-excel-box';
    return 'mdi:file-document';
  };

  const isPDF = (fileUrl: string) => {
    return /\.pdf$/i.test(fileUrl);
  };

  const handlePreview = (fileUrl: string) => {
    // Add basePath prefix for proper URL
    const fullUrl = getFileUrl(fileUrl) || fileUrl;

    // If PDF, open in new tab
    if (isPDF(fileUrl)) {
      window.open(fullUrl, '_blank');
      return;
    }
    // Otherwise, show in dialog
    setPreviewUrl(fullUrl);
    setPreviewOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Filter by size
    const validFiles = files.filter((file) => {
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > maxSize) {
        alert(`ไฟล์ ${file.name} มีขนาดเกิน ${maxSize}MB`);
        return false;
      }
      return true;
    });

    // Check max files
    const finalFiles = maxFiles ? validFiles.slice(0, maxFiles) : validFiles;

    if (maxFiles && validFiles.length > maxFiles) {
      alert(`สามารถเลือกได้สูงสุด ${maxFiles} ไฟล์`);
    }

    setSelectedFiles(finalFiles);
    onFilesSelected?.(finalFiles);
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFilesSelected?.(newFiles);
  };

  return (
    <div className="space-y-3">
      {label && <p className="text-sm font-medium text-gray-700">{label}</p>}

      {/* Existing file preview */}
      {existingFileUrl && selectedFiles.length === 0 && (
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-700 mb-2">ไฟล์ปัจจุบัน:</p>
          <div
            className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
            onClick={() => handlePreview(existingFileUrl)}
          >
            <div className="flex items-center space-x-3">
              {isImage(existingFileUrl) ? (
                <img src={getFileUrl(existingFileUrl) || ''} alt="preview" className="w-12 h-12 object-cover rounded" />
              ) : (
                <Icon icon={getFileIcon(existingFileName || existingFileUrl)} className="w-8 h-8 text-blue-600" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">{existingFileName || 'ไฟล์ที่อัปโหลด'}</p>
                <p className="text-xs text-blue-600 flex items-center gap-1">
                  <Icon icon="mdi:eye" className="w-3 h-3" />
                  คลิกเพื่อดู
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors">
        <div className="text-center">
          <Icon icon="mdi:cloud-upload" className="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            {existingFileUrl && selectedFiles.length === 0
              ? 'เลือกไฟล์ใหม่เพื่อแทนที่'
              : multiple
              ? 'เลือกไฟล์หรือลากไฟล์มาวางที่นี่'
              : 'เลือกไฟล์'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            รองรับไฟล์: {accept.split(',').join(', ')} (สูงสุด {maxSize}MB)
          </p>
        </div>
        <input
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
        />
      </label>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">ไฟล์ที่เลือก:</p>
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <Icon icon="mdi:file" className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <Icon icon="mdi:close" className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle className="flex items-center justify-between">
          <span>ดูไฟล์</span>
          <IconButton onClick={() => setPreviewOpen(false)} size="small">
            <Icon icon="mdi:close" className="w-6 h-6" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {previewUrl && isImage(previewUrl) ? (
            <div className="flex items-center justify-center p-4">
              <img src={previewUrl} alt="preview" className="max-w-full h-auto" />
            </div>
          ) : previewUrl ? (
            <iframe
              src={`https://docs.google.com/viewer?url=${encodeURIComponent(previewUrl)}&embedded=true`}
              className="w-full h-[600px] border-0"
              title="File Preview"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
