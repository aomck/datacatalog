import type { SecurityLevel } from '@/types';

interface SecurityLevelBadgeProps {
  level?: SecurityLevel | null;
  size?: 'sm' | 'md' | 'lg';
}

export function SecurityLevelBadge({ level, size = 'md' }: SecurityLevelBadgeProps) {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  // Convert level to string for comparison
  const levelStr = level?.toString() || '0';

  const levelConfig: Record<string, { label: string; color: string }> = {
    '0': { label: 'ทั่วไป', color: 'bg-gray-100 text-gray-800 border border-gray-200' },
    '1': { label: 'ข้อมูลภายในองค์กร', color: 'bg-green-100 text-green-800 border border-green-200' },
    '2': { label: 'ลับ', color: 'bg-yellow-100 text-yellow-800 border border-yellow-200' },
    '3': { label: 'ลับมาก', color: 'bg-orange-100 text-orange-800 border border-orange-200' },
    '4': { label: 'ลับที่สุด', color: 'bg-red-100 text-red-800 border border-red-200' },
  };

  const config = levelConfig[levelStr] || levelConfig['0'];

  return (
    <span className={`inline-flex items-center rounded font-semibold ${sizeClasses[size]} ${config.color}`}>
      {config.label}
    </span>
  );
}
