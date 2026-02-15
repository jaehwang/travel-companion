'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    // 클라이언트에서만 시간 설정
    setCurrentTime(new Date());

    // 1초마다 시간 업데이트
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          🗺️ Travel Companion
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          여행 기록 공유 앱
        </p>
        <p className="mt-4 text-sm text-gray-500">
          사진의 위치 정보로 여행 경로를 시각화합니다
        </p>

        {currentTime && (
          <div className="mt-8 p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              현지 시각
            </p>
            <p className="text-2xl font-semibold mb-1">
              {formatTime(currentTime)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {formatDate(currentTime)}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
