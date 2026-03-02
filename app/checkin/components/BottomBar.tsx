'use client';

import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

interface BottomBarProps {
  onCheckin: () => void;
}

export default function BottomBar({ onCheckin }: BottomBarProps) {
  const router = useRouter();

  return createPortal(
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: 'white',
        borderTop: '1px solid #e5e7eb',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="relative flex items-center h-16 px-4">
        <button
          onClick={() => router.push('/')}
          className="flex flex-col items-center justify-center text-gray-500 px-4 py-2 bg-transparent border-0 cursor-pointer"
        >
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
            <polyline points="9 21 9 12 15 12 15 21" />
          </svg>
          <span className="text-xs mt-0.5">홈</span>
        </button>
        <button
          onClick={onCheckin}
          className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center justify-center text-gray-500 px-6 py-2 bg-transparent border-0 cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="currentColor" strokeWidth={1.8} />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8M8 12h8" />
          </svg>
          <span className="text-xs mt-0.5">체크인</span>
        </button>
      </div>
    </div>,
    document.body
  );
}
