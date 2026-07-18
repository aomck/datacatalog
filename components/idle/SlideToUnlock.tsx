'use client';

import { useState, useRef, useCallback } from 'react';
import { Icon } from '@iconify/react';

interface SlideToUnlockProps {
  onUnlock: () => void;
}

export function SlideToUnlock({ onUnlock }: SlideToUnlockProps) {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const trackWidthRef = useRef(0);

  const THUMB_SIZE = 48;
  const UNLOCK_THRESHOLD = 0.85;

  const handleStart = useCallback((clientX: number) => {
    if (!trackRef.current) return;
    setIsDragging(true);
    startXRef.current = clientX - dragX;
    trackWidthRef.current = trackRef.current.offsetWidth - THUMB_SIZE;
  }, [dragX]);

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging) return;
    const newX = Math.min(
      Math.max(0, clientX - startXRef.current),
      trackWidthRef.current
    );
    setDragX(newX);
  }, [isDragging]);

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const progress = dragX / trackWidthRef.current;
    if (progress >= UNLOCK_THRESHOLD) {
      setDragX(trackWidthRef.current);
      onUnlock();
    } else {
      setDragX(0);
    }
  }, [isDragging, dragX, onUnlock]);

  // Mouse events
  const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientX);
  const onMouseMove = (e: React.MouseEvent) => handleMove(e.clientX);
  const onMouseUp = () => handleEnd();

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX);
  const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX);
  const onTouchEnd = () => handleEnd();

  const progress = trackWidthRef.current > 0 ? dragX / trackWidthRef.current : 0;
  const textOpacity = Math.max(0, 1 - progress * 2);

  return (
    <div
      ref={trackRef}
      className="relative h-14 bg-gray-200 rounded-full overflow-hidden select-none cursor-pointer"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={handleEnd}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Background fill */}
      <div
        className="absolute inset-y-0 left-0 bg-blue-100 rounded-full transition-none"
        style={{ width: dragX + THUMB_SIZE }}
      />

      {/* Text */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ opacity: textOpacity }}
      >
        <span className="text-sm font-medium text-gray-500 ml-8">
          เลื่อนเพื่อใช้งานต่อ &raquo;
        </span>
      </div>

      {/* Thumb */}
      <div
        className="absolute top-1 h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing"
        style={{
          left: dragX + 4,
          transition: isDragging ? 'none' : 'left 0.3s ease',
        }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        <Icon icon="mdi:chevron-double-right" className="w-6 h-6 text-white" />
      </div>
    </div>
  );
}
