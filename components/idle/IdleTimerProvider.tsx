'use client';

import { useState, useCallback, useEffect } from 'react';
import { useIdleTimer } from 'react-idle-timer';
import { clearSessionAction } from '@/lib/auth-actions';
import { SlideToUnlock } from './SlideToUnlock';

const IDLE_TIMEOUT = 1000 * 60 * 10;       // 10 นาที
const PROMPT_BEFORE_IDLE = 1000 * 60 * 1;  // แสดง warning ก่อน 1 นาที

const REDIRECT_URL = 'https://isoc360.isoc.go.th';

export function IdleTimerProvider({ children }: { children: React.ReactNode }) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [remaining, setRemaining] = useState(0);

  const handleIdle = useCallback(async () => {
    setShowPrompt(false);
    await clearSessionAction();
    window.location.href = REDIRECT_URL;
  }, []);

  const handlePrompt = useCallback(() => {
    setShowPrompt(true);
  }, []);

  const handleActive = useCallback(() => {
    setShowPrompt(false);
  }, []);

  const { activate, getRemainingTime } = useIdleTimer({
    timeout: IDLE_TIMEOUT,
    promptBeforeIdle: PROMPT_BEFORE_IDLE,
    onIdle: handleIdle,
    onPrompt: handlePrompt,
    onActive: handleActive,
    crossTab: true,
    syncTimers: 200,
  });

  // Update remaining time every second when prompt is showing
  useEffect(() => {
    if (!showPrompt) return;
    const interval = setInterval(() => {
      setRemaining(Math.ceil(getRemainingTime() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [showPrompt, getRemainingTime]);

  const handleUnlock = useCallback(() => {
    activate();
    setShowPrompt(false);
  }, [activate]);

  return (
    <>
      {children}

      {/* Idle Warning Modal */}
      {showPrompt && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 mx-4 w-full max-w-md">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
              Session กำลังจะหมดอายุ
            </h2>

            {/* Description */}
            <p className="text-gray-500 text-center mb-2">
              ระบบตรวจพบว่าไม่มีการใช้งานเป็นเวลานาน
            </p>

            {/* Countdown */}
            <p className="text-center mb-6">
              <span className="text-3xl font-bold text-red-500">{remaining}</span>
              <span className="text-gray-500 ml-1">วินาที</span>
            </p>

            {/* Slide to unlock */}
            <SlideToUnlock onUnlock={handleUnlock} />

            <p className="text-xs text-gray-400 text-center mt-3">
              เลื่อนปุ่มไปทางขวาเพื่อใช้งานต่อ
            </p>
          </div>
        </div>
      )}
    </>
  );
}
