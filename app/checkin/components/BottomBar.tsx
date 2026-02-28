'use client';

import { createPortal } from 'react-dom';

interface BottomBarProps {
  onCheckin: () => void;
}

export default function BottomBar({ onCheckin }: BottomBarProps) {
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
      <div className="flex justify-center items-center h-16">
        <button
          onClick={onCheckin}
          className="flex flex-col items-center justify-center text-gray-500 px-6 py-2 bg-transparent border-0 cursor-pointer"
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
