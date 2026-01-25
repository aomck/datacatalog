'use client';

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton } from '@mui/material';
import { Icon } from '@iconify/react';
import { User } from '@/components/ui/User';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Timestamp } from '@/components/ui/Timestamp';

interface ApprovalDetailModalProps {
  open: boolean;
  onClose: () => void;
  item: any;
  type: 'dataset' | 'service';
}

export function ApprovalDetailModal({ open, onClose, item, type }: ApprovalDetailModalProps) {
  if (!item) return null;


  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon
              icon={type === 'dataset' ? 'mdi:database' : 'mdi:api'}
              className={`w-6 h-6 ${type === 'dataset' ? 'text-blue-600' : 'text-green-600'}`}
            />
            <span>รายละเอียดการอนุมัติ</span>
          </div>
          <StatusBadge status={item.approveStatus} />
        </div>
      </DialogTitle>

      <DialogContent>
        <div className="space-y-4">
          {/* Item Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {type === 'dataset' ? 'ชื่อชุดข้อมูล' : 'ชื่อบริการ'}
            </label>
            <p className="text-gray-900">
              {type === 'dataset' ? item.dataset?.name : item.service?.name}
            </p>
          </div>

          {/* Service API Details */}
          {type === 'service' && item.service && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Endpoint</label>
              <div className="bg-gray-50 p-2 rounded">
                <code className="text-sm">
                  <span className="font-semibold text-blue-600">{item.service.method}</span>{' '}
                  {item.service.api}
                </code>
              </div>
            </div>
          )}

          {/* Approval Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ผู้อนุมัติ</label>
              {item.approvedBy ? (
                <User userId={item.approvedBy} type="full" size="small" />
              ) : (
                <p className="text-gray-500">-</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วันที่อนุมัติ</label>
              <p className="text-gray-900">
                {item.approvedAt ? <Timestamp date={item.approvedAt} type="date-time" /> : '-'}
              </p>
            </div>
          </div>

          {/* Comment */}
          {item.comment && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ความคิดเห็น</label>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-gray-900 whitespace-pre-wrap">{item.comment}</p>
              </div>
            </div>
          )}

          {/* Approval Files */}
          {item.approvalFiles && item.approvalFiles.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ไฟล์แนบการอนุมัติ</label>
              <div className="space-y-2">
                {item.approvalFiles.map((file: any) => (
                  <div key={file.id} className="flex items-center justify-between bg-gray-50 p-3 rounded hover:bg-gray-100">
                    <div className="flex items-center gap-3 flex-1">
                      <Icon icon="mdi:file-document" className="w-5 h-5 text-blue-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.fileName}</p>
                        <p className="text-xs text-gray-500">
                          {(file.fileSize / 1024).toFixed(2)} KB • <Timestamp date={file.createdAt} type="date-time" />
                        </p>
                      </div>
                    </div>
                    <IconButton
                      size="small"
                      onClick={() => window.open(file.filePath, '_blank')}
                      className="text-blue-600"
                    >
                      <Icon icon="mdi:download" className="w-5 h-5" />
                    </IconButton>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dataset/Service Details */}
          {type === 'dataset' && item.dataset && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียดชุดข้อมูล</label>
              <div className="bg-gray-50 p-3 rounded space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-500">หน่วยงานเจ้าของข้อมูล</p>
                    <p className="text-sm font-medium">{item.dataset.unitOwner?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">หมวดหมู่</p>
                    <p className="text-sm font-medium">{item.dataset.category?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">ประเภทข้อมูล</p>
                    <p className="text-sm font-medium">{item.dataset.type?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">ชั้นความลับ</p>
                    <p className="text-sm font-medium">{item.dataset.securityLevel || 'ทั่วไป'}</p>
                  </div>
                </div>
                {item.dataset.detail && (
                  <div>
                    <p className="text-xs text-gray-500">รายละเอียด</p>
                    <p className="text-sm text-gray-700 mt-1">{item.dataset.detail}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {type === 'service' && item.service && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียดบริการ</label>
              <div className="bg-gray-50 p-3 rounded">
                {item.service.detail && (
                  <p className="text-sm text-gray-700">{item.service.detail}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>ปิด</Button>
      </DialogActions>
    </Dialog>
  );
}
