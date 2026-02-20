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
              {/* Datasets */}
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

                    {/* Approver & Comment */}
                    {(rd.approver || rd.comment) && (
                      <div className="p-3 bg-white border-b border-blue-100">
                        {rd.approver && (
                          <p className="text-sm text-gray-700 mb-1">
                            <span className="font-medium">ผู้ดำเนินการ:</span> {rd.approver.id}
                          </p>
                        )}
                        {rd.comment && (
                          <div className="text-sm text-gray-700">
                            <span className="font-medium">หมายเหตุ:</span>
                            <p className="mt-1 text-gray-600">{rd.comment}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Approval Files */}
                    {rd.approvalFiles && rd.approvalFiles.length > 0 && (
                      <div className="p-3 bg-white border-b border-blue-100">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          เอกสารประกอบการอนุมัติ ({rd.approvalFiles.length}):
                        </p>
                        <div className="space-y-2">
                          {rd.approvalFiles.map((file: any) => (
                            <div key={file.id} className="bg-gray-50 p-2 rounded flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Icon icon="mdi:file-document" className="w-4 h-4 text-blue-600" />
                                <div>
                                  <p className="text-sm font-medium">{file.fileName}</p>
                                  <p className="text-xs text-gray-500">
                                    {(file.fileSize / 1024).toFixed(2)} KB
                                  </p>
                                </div>
                              </div>
                              <IconButton
                                size="small"
                                onClick={() => window.open(getFileUrl(file.filePath) || file.filePath, '_blank')}
                              >
                                <Icon icon="mdi:download" className="w-4 h-4" />
                              </IconButton>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {relatedServices.length > 0 && (
                      <div className="p-2 space-y-1">
                        {relatedServices.map((rs: any) => (
                          <div key={rs.id} className="bg-white rounded-lg overflow-hidden border border-gray-200">
                            <div className="flex items-center justify-between p-2">
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

                            {/* Service Approver & Comment */}
                            {(rs.approver || rs.comment) && (
                              <div className="px-2 pb-2 bg-gray-50">
                                {rs.approver && (
                                  <p className="text-xs text-gray-700 mb-1">
                                    <span className="font-medium">ผู้ดำเนินการ:</span> {rs.approver.id}
                                  </p>
                                )}
                                {rs.comment && (
                                  <div className="text-xs text-gray-700">
                                    <span className="font-medium">หมายเหตุ:</span>
                                    <p className="mt-1 text-gray-600">{rs.comment}</p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Service Approval Files */}
                            {rs.approvalFiles && rs.approvalFiles.length > 0 && (
                              <div className="px-2 pb-2 bg-gray-50">
                                <p className="text-xs font-medium text-gray-700 mb-1">
                                  เอกสารประกอบการอนุมัติ ({rs.approvalFiles.length}):
                                </p>
                                <div className="space-y-1">
                                  {rs.approvalFiles.map((file: any) => (
                                    <div key={file.id} className="bg-white p-1.5 rounded flex items-center justify-between">
                                      <div className="flex items-center gap-1">
                                        <Icon icon="mdi:file-document" className="w-3 h-3 text-blue-600" />
                                        <div>
                                          <p className="text-xs font-medium">{file.fileName}</p>
                                          <p className="text-xs text-gray-500">
                                            {(file.fileSize / 1024).toFixed(2)} KB
                                          </p>
                                        </div>
                                      </div>
                                      <IconButton
                                        size="small"
                                        onClick={() => window.open(getFileUrl(file.filePath) || file.filePath, '_blank')}
                                      >
                                        <Icon icon="mdi:download" className="w-3 h-3" />
                                      </IconButton>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Reports */}
              {request.requestReports?.map((rr: any) => {
                const isNewReport = rr.isNewReport;

                return (
                  <div key={rr.id} className="bg-purple-50 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-3 bg-purple-100">
                      <div className="flex items-center gap-2">
                        <Icon icon="mdi:file-chart" className="w-5 h-5 text-purple-700" />
                        <span className="font-semibold text-purple-900">
                          {rr.report?.name || rr.title || 'รายงานใหม่'}
                        </span>
                        {isNewReport && (
                          <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-800 rounded">
                            รายงานใหม่
                          </span>
                        )}
                      </div>
                      <div>
                        {rr.approveStatus === 'APPROVED' ? (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">อนุมัติแล้ว</span>
                        ) : rr.approveStatus === 'DISAPPROVED' ? (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">ไม่อนุมัติ</span>
                        ) : (
                          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">รออนุมัติ</span>
                        )}
                      </div>
                    </div>

                    {/* Detail */}
                    {rr.detail && (
                      <div className="p-3 bg-white text-sm text-gray-600 border-b border-purple-100">
                        {rr.detail}
                      </div>
                    )}

                    {/* Approver & Comment */}
                    {(rr.approver || rr.comment) && (
                      <div className="p-3 bg-white border-b border-purple-100">
                        {rr.approver && (
                          <p className="text-sm text-gray-700 mb-1">
                            <span className="font-medium">ผู้ดำเนินการ:</span> {rr.approver.id}
                          </p>
                        )}
                        {rr.comment && (
                          <div className="text-sm text-gray-700">
                            <span className="font-medium">หมายเหตุ:</span>
                            <p className="mt-1 text-gray-600">{rr.comment}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Approval Files */}
                    {rr.approvalFiles && rr.approvalFiles.length > 0 && (
                      <div className="p-3 bg-white border-b border-purple-100">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          เอกสารประกอบการอนุมัติ ({rr.approvalFiles.length}):
                        </p>
                        <div className="space-y-2">
                          {rr.approvalFiles.map((file: any) => (
                            <div key={file.id} className="bg-gray-50 p-2 rounded flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Icon icon="mdi:file-document" className="w-4 h-4 text-blue-600" />
                                <div>
                                  <p className="text-sm font-medium">{file.fileName}</p>
                                  <p className="text-xs text-gray-500">
                                    {(file.fileSize / 1024).toFixed(2)} KB
                                  </p>
                                </div>
                              </div>
                              <IconButton
                                size="small"
                                onClick={() => window.open(getFileUrl(file.filePath) || file.filePath, '_blank')}
                              >
                                <Icon icon="mdi:download" className="w-4 h-4" />
                              </IconButton>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Selected Datasets (for new report requests) */}
                    {isNewReport && rr.selectedDatasets && rr.selectedDatasets.length > 0 && (
                      <div className="p-3 bg-white border-b border-purple-100">
                        <p className="text-sm font-medium text-gray-700 mb-2">ชุดข้อมูลที่เลือก:</p>
                        <div className="flex flex-wrap gap-2">
                          {rr.selectedDatasets.map((ds: any) => (
                            <span key={ds.id} className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {ds.dataset?.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Design Files (for new report requests) */}
                    {isNewReport && rr.designFiles && rr.designFiles.length > 0 && (
                      <div className="p-3 bg-white border-b border-purple-100">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          ไฟล์ Design ({rr.designFiles.length}):
                        </p>
                        <div className="space-y-2">
                          {rr.designFiles.map((file: any) => (
                            <div key={file.id} className="bg-gray-50 p-2 rounded flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Icon icon="mdi:file-design" className="w-4 h-4 text-blue-600" />
                                <div>
                                  <p className="text-sm font-medium">{file.fileName}</p>
                                  <p className="text-xs text-gray-500">
                                    {(file.fileSize / 1024).toFixed(2)} KB
                                  </p>
                                </div>
                              </div>
                              <IconButton
                                size="small"
                                onClick={() => window.open(getFileUrl(file.filePath) || file.filePath, '_blank')}
                              >
                                <Icon icon="mdi:download" className="w-4 h-4" />
                              </IconButton>
                            </div>
                          ))}
                        </div>
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
