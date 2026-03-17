'use client';

import { createClient } from '@/lib/supabase/client';

export default function LogoutButton() {
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        fontSize: 12,
        fontWeight: 700,
        color: 'var(--tc-warm-mid)',
        background: 'none',
        border: '1px solid var(--tc-warm-mid)',
        borderRadius: 8,
        padding: '4px 10px',
        cursor: 'pointer',
      }}
    >
      로그아웃
    </button>
  );
}
