'use client';

import { useState } from 'react';
import { Dialog, IconButton, Box } from '@mui/material';
import { Icon } from '@iconify/react';
import { getFileUrl } from '@/lib/file-url';
import type { ReportFile } from '@/types';

interface FilesViewerProps {
  files: ReportFile[];
  open: boolean;
  onClose: () => void;
  initialIndex?: number;
}

const isImageFile = (filename?: string) => {
  if (!filename) return false;
  const ext = filename.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext || '');
};

export function FilesViewer({ files, open, onClose, initialIndex = 0 }: FilesViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (files.length === 0 || !open) return null;

  const currentFile = files[currentIndex];
  if (!currentFile) return null;

  const fileUrl = getFileUrl(currentFile.filePath) || currentFile.filePath;
  const isImage = isImageFile(currentFile.fileName);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % files.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + files.length) % files.length);
  };

  const handleDownload = () => {
    window.open(fileUrl, '_blank');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '80vh', bgcolor: 'grey.900' }
      }}
    >
      <Box sx={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: 'grey.800' }}>
          <div className="text-white text-sm">
            {currentFile.fileName} ({currentIndex + 1}/{files.length})
          </div>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <Icon icon="mdi:close" className="w-6 h-6" />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
          {isImage ? (
            <img
              src={fileUrl}
              alt={currentFile.fileName}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
            />
          ) : (
            <Box sx={{ textAlign: 'center', color: 'white' }}>
              <Icon icon="mdi:file" className="w-24 h-24 mb-4 mx-auto text-gray-400" />
              <div className="text-lg mb-2">{currentFile.fileName}</div>
              <button
                onClick={handleDownload}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 mx-auto"
              >
                <Icon icon="mdi:download" className="w-5 h-5" />
                <span>ดาวน์โหลด</span>
              </button>
            </Box>
          )}

          {/* Navigation Buttons */}
          {files.length > 1 && (
            <>
              <IconButton
                onClick={handlePrev}
                sx={{
                  position: 'absolute',
                  left: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                }}
              >
                <Icon icon="mdi:chevron-left" className="w-8 h-8" />
              </IconButton>
              <IconButton
                onClick={handleNext}
                sx={{
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                }}
              >
                <Icon icon="mdi:chevron-right" className="w-8 h-8" />
              </IconButton>
            </>
          )}
        </Box>

        {/* Download button for images */}
        {isImage && (
          <Box sx={{ p: 2, bgcolor: 'grey.800', display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={handleDownload}
              className="px-4 py-2 text-white hover:bg-gray-700 rounded-lg flex items-center gap-2"
            >
              <Icon icon="mdi:download" className="w-5 h-5" />
              <span>ดาวน์โหลด</span>
            </button>
          </Box>
        )}
      </Box>
    </Dialog>
  );
}
