import type { SecurityLevel } from '@/types';

interface SecurityLevelBadgeProps {
  level?: SecurityLevel | null;
  size?: 'sm' | 'md' | 'lg';
}

export function SecurityLevelBadge({ level, size = 'md' }: SecurityLevelBadgeProps) {
  if (!level) return <span className="text-gray-400 text-xs">-</span>;

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  const colorClasses = {
    'ทั่วไป': 'bg-green-100 text-green-800 border border-green-200',
    'ลับ': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    'ลับมาก': 'bg-orange-100 text-orange-800 border border-orange-200',
    'ลับที่สุด': 'bg-red-100 text-red-800 border border-red-200',
  };

  return (
    <span className={`inline-flex items-center rounded font-semibold ${sizeClasses[size]} ${colorClasses[level]}`}>
      {level}
    </span>
  );
}
