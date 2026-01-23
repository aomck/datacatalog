import type { ApproveStatus } from '@/types';

interface StatusBadgeProps {
  status: ApproveStatus;
}

const statusConfig: Record<
  ApproveStatus,
  { label: string; bg: string; text: string }
> = {
  REQUESTED: {
    label: 'คำขอใหม่',
    bg: 'bg-blue-100',
    text: 'text-blue-800',
  },
  PENDING: {
    label: 'กำลังพิจารณา',
    bg: 'bg-orange-100',
    text: 'text-orange-800',
  },
  APPROVED: {
    label: 'อนุมัติแล้ว',
    bg: 'bg-green-100',
    text: 'text-green-800',
  },
  DISAPPROVED: {
    label: 'ไม่อนุมัติ',
    bg: 'bg-red-100',
    text: 'text-red-800',
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}
