'use client';

import { useState, useEffect, useCallback } from 'react';
import { IconButton, Tooltip, Button } from '@mui/material';
import { Icon } from '@iconify/react';
import { usePermission } from '@/components/providers/permission-provider';
import { getUserApprovedItems } from '@/lib/actions/catalog-actions';
import { CollapsibleTable } from '@/components/ui/CollapsibleTable';
import { RefreshButton } from '@/components/ui/RefreshButton';
import { RequestDetailModal } from '@/components/modals/RequestDetailModal';
import { ApprovalDetailModal } from '@/components/modals/ApprovalDetailModal';
import { SecurityLevelBadge } from '@/components/ui/SecurityLevelBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { getFileUrl } from '@/lib/file-url';

export default function MyReportsPage() {
  const { user } = usePermission();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [approvalDetailOpen, setApprovalDetailOpen] = useState(false);
  const [selectedApprovalItem, setSelectedApprovalItem] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await getUserApprovedItems(user.id);
      setReports(result.reports || []);
    } finally {
      setLoading(false);
    }
  };

  const handleViewApprovalDetail = useCallback((item: any) => {
    setSelectedApprovalItem(item);
    setApprovalDetailOpen(true);
  }, []);

  const handleViewRequest = (requestId: string) => {
    const requestReports = reports.filter((rr) => rr.request?.id === requestId);
    const request = requestReports[0]?.request;

    if (request) {
      setSelectedRequest({
        ...request,
        requestReports: requestReports,
      });
      setRequestDialogOpen(true);
    }
  };

  const viewReport = (report: any) => {
    if (report.url) {
      window.open(report.url, '_blank');
    } else if (report.files && report.files.length > 0) {
      const firstFile = report.files[0];
      const fileUrl = getFileUrl(firstFile.filePath);
      if (fileUrl) {
        window.open(fileUrl, '_blank');
      }
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">รายงานของฉัน</h1>
          <p className="text-gray-600">ดูรายการรายงานที่คุณได้ร้องขอและสถานะการอนุมัติ</p>
        </div>
        <RefreshButton onRefresh={loadData} />
      </div>

      {reports.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center py-12">
            <Icon icon="mdi:file-chart-outline" className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีรายงาน</h3>
            <p className="text-gray-500">คุณยังไม่มีรายงานที่ร้องขอ</p>
          </div>
        </div>
      ) : (
        <CollapsibleTable
          columns={[
            { id: 'name', label: 'ชื่อรายงาน' },
            { id: 'type', label: 'ประเภท', align: 'center' },
            {
              id: 'securityLevel',
              label: 'ชั้นความลับ',
              align: 'center',
              format: (row: any) => <SecurityLevelBadge level={row.report?.securityLevel} size="sm" />
            },
            { id: 'status', label: 'สถานะ', align: 'center' },
            { id: 'actions', label: '', align: 'right' },
          ]}
          rows={reports.map((rr) => ({
            ...rr,
            name: rr.report?.name || rr.title || 'รายงานใหม่',
            type: rr.report?.type?.shortName || '-',
            status: (
              <StatusBadge
                status={rr.approveStatus}
                onClick={() => handleViewApprovalDetail(rr)}
                clickable={rr.approveStatus !== 'REQUESTED'}
              />
            ),
            actions: (
              <div className="flex items-center justify-end gap-2">
                {rr.approveStatus === 'APPROVED' && rr.report && (
                  <Tooltip title="ดูรายงาน">
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<Icon icon="mdi:eye" />}
                      onClick={() => viewReport(rr.report)}
                    >
                      ดูรายงาน
                    </Button>
                  </Tooltip>
                )}
                <Tooltip title="ดูรายละเอียดคำขอ">
                  <IconButton
                    size="small"
                    onClick={() => handleViewRequest(rr.request?.id)}
                  >
                    <Icon icon="mdi:text-box-search" className="w-5 h-5 text-blue-600" />
                  </IconButton>
                </Tooltip>
              </div>
            ),
          }))}
          getRowId={(row) => row.id}
          renderCollapse={(row) => (
            <div className="bg-gray-50 p-4 rounded space-y-4">
              {/* Report Details */}
              {row.report ? (
                <div>
                  <h4 className="font-semibold mb-2">รายละเอียดรายงาน</h4>
                  {row.report.detail && (
                    <p className="text-sm text-gray-700 mb-2">{row.report.detail}</p>
                  )}

                  {/* Unit Owners */}
                  {row.report.unitOwners && row.report.unitOwners.length > 0 && (
                    <div className="mb-2">
                      <p className="text-sm font-medium text-gray-700">หน่วยงาน:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {row.report.unitOwners.map((uo: any) => (
                          <span key={uo.id} className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {uo.unitOwner?.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Categories */}
                  {row.report.categories && row.report.categories.length > 0 && (
                    <div className="mb-2">
                      <p className="text-sm font-medium text-gray-700">นโยบาย:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {row.report.categories.map((cat: any) => (
                          <span key={cat.id} className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                            {cat.category?.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Files - Show only if approved */}
                  {row.approveStatus === 'APPROVED' && row.report.files && row.report.files.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        ไฟล์แนบ ({row.report.files.length}):
                      </p>
                      <div className="space-y-1">
                        {row.report.files.map((file: any) => (
                          <a
                            key={file.id}
                            href={getFileUrl(file.filePath) || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-blue-600 hover:underline cursor-pointer"
                          >
                            <Icon icon="mdi:file" />
                            {file.fileName}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* URL - Show only if approved */}
                  {row.approveStatus === 'APPROVED' && row.report.url && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">URL:</p>
                      <a
                        href={row.report.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline cursor-pointer"
                      >
                        {row.report.url}
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <h4 className="font-semibold mb-2">รายงานใหม่ (รอสร้าง)</h4>
                  <p className="text-sm text-gray-600">
                    {row.title || 'ไม่มีชื่อ'}
                  </p>
                  {row.detail && (
                    <p className="text-sm text-gray-500 mt-1">{row.detail}</p>
                  )}

                  {/* Selected Datasets */}
                  {row.selectedDatasets && row.selectedDatasets.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-700">ชุดข้อมูลที่เลือก:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {row.selectedDatasets.map((ds: any) => (
                          <span key={ds.id} className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {ds.dataset?.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Design Files */}
                  {row.designFiles && row.designFiles.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        ไฟล์ Design ({row.designFiles.length}):
                      </p>
                      <div className="space-y-1">
                        {row.designFiles.map((file: any) => (
                          <a
                            key={file.id}
                            href={getFileUrl(file.filePath) || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-blue-600 hover:underline cursor-pointer"
                          >
                            <Icon icon="mdi:file-design" />
                            {file.fileName}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Evidence Files from Request */}
              {!row.report && row.request?.requestFiles && row.request.requestFiles.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    หลักฐานประกอบ ({row.request.requestFiles.length}):
                  </p>
                  <div className="space-y-1">
                    {row.request.requestFiles.map((file: any) => (
                      <a
                        key={file.id}
                        href={getFileUrl(file.filePath) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline cursor-pointer"
                      >
                        <Icon icon="mdi:file-document" />
                        {file.fileName}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Approval Info */}
              {row.comment && (
                <div>
                  <p className="text-sm font-medium text-gray-700">ความคิดเห็น:</p>
                  <p className="text-sm text-gray-600">{row.comment}</p>
                </div>
              )}

              {row.approvalFiles && row.approvalFiles.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    ไฟล์อนุมัติ:
                  </p>
                  <div className="space-y-1">
                    {row.approvalFiles.map((file: any) => (
                      <a
                        key={file.id}
                        href={getFileUrl(file.filePath) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                      >
                        <Icon icon="mdi:file-check" />
                        {file.fileName}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        />
      )}

      {/* Request Detail Modal */}
      <RequestDetailModal
        open={requestDialogOpen}
        onClose={() => setRequestDialogOpen(false)}
        request={selectedRequest}
      />

      {/* Approval Detail Modal */}
      <ApprovalDetailModal
        open={approvalDetailOpen}
        onClose={() => setApprovalDetailOpen(false)}
        item={selectedApprovalItem}
        type="report"
      />
    </div>
  );
}
