'use client';

interface TimestampProps {
  date: string | Date;
  type?: 'date' | 'date-time';
  className?: string;
}

/**
 * Timestamp component แสดงวันที่เป็นภาษาไทย
 * @param date - วันที่ในรูปแบบ string (ISO) หรือ Date object
 * @param type - 'date' (แสดงเฉพาะวันที่) หรือ 'date-time' (แสดงวันที่และเวลา)
 * @param className - CSS class เพิ่มเติม
 *
 * @example
 * <Timestamp date="2024-05-01T10:10:00Z" type="date" />
 * // Output: 1 พ.ค. 2568
 *
 * <Timestamp date="2024-05-01T10:10:00Z" type="date-time" />
 * // Output: 1 พ.ค. 2568 10:10
 */
export function Timestamp({ date, type = 'date-time', className = '' }: TimestampProps) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // ตรวจสอบว่า date ถูกต้องหรือไม่
  if (isNaN(dateObj.getTime())) {
    return <span className={className}>-</span>;
  }

  let formatted: string;

  if (type === 'date') {
    // แสดงเฉพาะวันที่ เช่น "1 พ.ค. 2568"
    formatted = dateObj.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } else {
    // แสดงวันที่และเวลา เช่น "1 พ.ค. 2568 10:10"
    formatted = dateObj.toLocaleString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false, // ใช้รูปแบบ 24 ชั่วโมง
    });
  }

  return (
    <span className={className} title={dateObj.toISOString()}>
      {formatted}
    </span>
  );
}
