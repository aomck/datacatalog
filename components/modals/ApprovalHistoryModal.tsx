'use client';

import { Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import { Icon } from '@iconify/react';
import { User } from '@/components/ui/User';

interface ApprovalHistoryModalProps {
  open: boolean;
  onClose: () => void;
  item: any;
}

export function ApprovalHistoryModal({ open, onClose, item }: ApprovalHistoryModalProps) {
  if (!item) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'text-green-700 bg-green-100';
      case 'DISAPPROVED': return 'text-red-700 bg-red-100';
      case 'PENDING': return 'text-yellow-700 bg-yellow-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'อนุมัติ';
      case 'DISAPPROVED': return 'ไม่อนุมัติ';
      case 'PENDING': return 'รอพิจารณา';
      default: return status;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <div className="flex items-center justify-between">
          <span>ประวัติการอนุมัติ</span>
          <IconButton onClick={onClose} size="small">
            <Icon icon="mdi:close" />
          </IconButton>
        </div>
      </DialogTitle>
      <DialogContent>
        <div className="space-y-4 pt-2">
          {/* Current Status */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">สถานะปัจจุบัน</span>
              <span className={`px-3 py-1 text-sm rounded ${getStatusColor(item.approveStatus)}`}>
                {getStatusText(item.approveStatus)}
              </span>
            </div>

            {item.approveStatus !== 'REQUESTED' && (
              <>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">ผู้ดำเนินการ</p>
                    {item.approvedBy && (
                      <User
                        userId={item.approvedBy}
                        displayName={item.approvedByName || item.approvedBy.substring(0, 8)}
                        type="avatar-name"
                        size="small"
                      />
                    )}
                  </div>

                  {item.approveDate && (
                    <div>
                      <p className="text-xs text-gray-600">วันที่ดำเนินการ</p>
                      <p className="text-sm font-medium">
                        {new Date(item.approveDate).toLocaleString('th-TH')}
                      </p>
                    </div>
                  )}

                  {item.comment && (
                    <div>
                      <p className="text-xs text-gray-600">หมายเหตุ</p>
                      <p className="text-sm">{item.comment}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Timeline */}
          <div>
            <h4 className="font-semibold mb-3">ลำดับเวลา</h4>
            <div className="space-y-3">
              {/* Requested */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Icon icon="mdi:file-document" className="w-4 h-4 text-blue-600" />
                  </div>
                  {item.approveStatus !== 'REQUESTED' && <div className="w-0.5 h-full bg-gray-300 mt-1" />}
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-medium text-sm">ส่งคำขอ</p>
                  <p className="text-xs text-gray-600">
                    {new Date(item.createdAt).toLocaleString('th-TH')}
                  </p>
                </div>
              </div>

              {/* Approved/Disapproved */}
              {item.approveStatus !== 'REQUESTED' && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      item.approveStatus === 'APPROVED' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <Icon
                        icon={item.approveStatus === 'APPROVED' ? 'mdi:check-circle' : 'mdi:close-circle'}
                        className={`w-4 h-4 ${
                          item.approveStatus === 'APPROVED' ? 'text-green-600' : 'text-red-600'
                        }`}
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{getStatusText(item.approveStatus)}</p>
                    {item.approveDate && (
                      <p className="text-xs text-gray-600">
                        {new Date(item.approveDate).toLocaleString('th-TH')}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
