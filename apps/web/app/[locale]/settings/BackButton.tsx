'use client';

import { useRouter } from 'next/navigation';

export default function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push('/')}
      style={{
        display: 'flex',
        alignItems: 'center',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--tc-warm-mid)',
        fontSize: 13,
        fontWeight: 600,
        padding: 0,
      }}
    >
      ← 돌아가기
    </button>
  );
}
