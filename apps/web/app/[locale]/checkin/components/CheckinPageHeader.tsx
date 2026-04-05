'use client';

import Link from 'next/link';
import { APP_NAME } from '@/lib/config';
import type { User } from '@supabase/supabase-js';
import type { Trip } from '@travel-companion/shared';

interface CheckinPageHeaderProps {
  user: User | null;
  selectedTrip: Trip | undefined;
  onOpenDrawer: () => void;
}

export default function CheckinPageHeader({
  user,
  selectedTrip,
  onOpenDrawer,
}: CheckinPageHeaderProps) {
  return (
    <header className="tc-header">
      <div className="max-w-full px-4 h-14 flex items-center gap-3">
        <button
          onClick={onOpenDrawer}
          className="bg-transparent border-0 cursor-pointer p-[6px] text-[var(--tc-warm-dark)] flex items-center shrink-0"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <span className="flex-1 text-base font-extrabold text-[var(--tc-warm-dark)] overflow-hidden text-ellipsis whitespace-nowrap tracking-[-0.01em]">
          {selectedTrip ? selectedTrip.title : APP_NAME}
        </span>
        {user && (
          <Link href="/settings" className="flex items-center shrink-0">
            {user.user_metadata?.avatar_url && (
              <img
                src={user.user_metadata.avatar_url}
                alt={user.user_metadata.name || ''}
                className="user-avatar"
                referrerPolicy="no-referrer"
              />
            )}
          </Link>
        )}
      </div>
    </header>
  );
}
