'use client';

import { Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import { Icon } from '@iconify/react';
import { Timestamp } from '@/components/ui/Timestamp';
import { getFileUrl } from '@/lib/file-url';

interface RequestDetailModalProps {
  open: boolean;
  onClose: () => void;
  request: any;
}

export function RequestDetailModal({ open, onClose, request }: RequestDetailModalProps) {
  if (!request) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <div className="flex items-center justify-between">
          <span>รายละเอียดคำขอ</span>
          <IconButton onClick={onClose} size="small">
            <Icon icon="mdi:close" />
          </IconButton>
        </div>
      </DialogTitle>
      <DialogContent>
        <div className="space-y-4 pt-2">
          {/* Basic Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-gray-600">วันที่ส่งคำขอ</p>
                <p className="font-medium"><Timestamp date={request.createdAt} type="date-time" /></p>
              </div>
              <div>
                <p className="text-sm text-gray-600">ชื่อผู้ขอ</p>
                <p className="font-medium">{request.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">หน่วยงาน</p>
                <p className="font-medium">{request.unit}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">อีเมล</p>
                <p className="font-medium">{request.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">เบอร์โทรศัพท์</p>
                <p className="font-medium">{request.tel}</p>
              </div>
            </div>
            {request.detail && (
              <div className="mt-3">
                <p className="text-sm text-gray-600">รายละเอียดเพิ่มเติม</p>
                <p className="font-medium">{request.detail}</p>
              </div>
            )}
          </div>

          {/* Uploaded Files */}
          {request.requestFiles && request.requestFiles.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">ไฟล์แนบ</h4>
              <div className="space-y-2">
                {request.requestFiles.map((file: any) => (
                  <div key={file.id} className="bg-gray-50 p-3 rounded flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon icon="mdi:file-document" className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium">{file.fileName}</p>
                        <p className="text-xs text-gray-500">
                          {file.fileType} • {(file.fileSize / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <IconButton size="small" onClick={() => window.open(getFileUrl(file.filePath) || file.filePath, '_blank')}>
                      <Icon icon="mdi:download" className="w-5 h-5" />
                    </IconButton>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Datasets and Services Hierarchy */}
          <div>
            <h4 className="font-semibold mb-3">รายการที่ขอใช้งาน</h4>
            <div className="space-y-3">
              {request.requestDatasets?.map((rd: any) => {
                const relatedServices = request.requestServices?.filter((rs: any) =>
                  rs.service?.datasetId === rd.dataset?.id
                ) || [];

                return (
                  <div key={rd.id} className="bg-blue-50 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-3 bg-blue-100">
                      <div className="flex items-center gap-2">
                        <Icon icon="mdi:database" className="w-5 h-5 text-blue-700" />
                        <span className="font-semibold text-blue-900">{rd.dataset?.name}</span>
                      </div>
                      <div>
                        {rd.approveStatus === 'APPROVED' ? (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">อนุมัติแล้ว</span>
                        ) : rd.approveStatus === 'DISAPPROVED' ? (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">ไม่อนุมัติ</span>
                        ) : (
                          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">รออนุมัติ</span>
                        )}
                      </div>
                    </div>

                    {relatedServices.length > 0 && (
                      <div className="p-2 space-y-1">
                        {relatedServices.map((rs: any) => (
                          <div key={rs.id} className="flex items-center justify-between bg-white p-2 rounded">
                            <div className="flex items-center gap-2">
                              <Icon icon="mdi:api" className="w-4 h-4 text-green-600" />
                              <div>
                                <p className="text-sm font-medium">{rs.service?.name}</p>
                                <p className="text-xs text-gray-600">{rs.service?.method} {rs.service?.api}</p>
                              </div>
                            </div>
                            <div>
                              {rs.approveStatus === 'APPROVED' ? (
                                <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">อนุมัติแล้ว</span>
                              ) : rs.approveStatus === 'DISAPPROVED' ? (
                                <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">ไม่อนุมัติ</span>
                              ) : (
                                <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">รออนุมัติ</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
