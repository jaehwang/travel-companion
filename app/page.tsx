'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Trip } from '@/types/database';
import TripFormModal from '@/app/checkin/components/TripFormModal';
import type { TripFormData } from '@/app/checkin/hooks/useTrips';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [showTripForm, setShowTripForm] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchTrips = useCallback(async () => {
    setLoadingTrips(true);
    try {
      const res = await fetch('/api/trips');
      if (res.ok) {
        const data = await res.json();
        setTrips(data.trips ?? []);
      }
    } finally {
      setLoadingTrips(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchTrips();
    else setTrips([]);
  }, [user, fetchTrips]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
  };

  const createTrip = async (data: TripFormData): Promise<Trip> => {
    const res = await fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to create trip');
    return result.trip as Trip;
  };

  const formatTripDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
    const date = isDateOnly
      ? (() => { const [y, m, d] = dateStr.split('-').map(Number); return new Date(y, m - 1, d); })()
      : new Date(dateStr);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric',
    }).format(date);
  };

  const displayName = user?.user_metadata?.full_name || user?.email || '';

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-xl mx-auto px-4 py-8">
        {/* 사용자 영역 */}
        {user ? (
          <div className="flex items-center justify-between mb-8">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {displayName}님, 환영합니다 👋
            </p>
            <button
              onClick={handleLogout}
              className="text-[15px] text-gray-500 hover:text-gray-700 px-4 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <div className="flex justify-end mb-8">
            <Link
              href="/login"
              className="inline-block px-5 py-2 rounded-full bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 transition-colors"
            >
              로그인
            </Link>
          </div>
        )}

        {/* 앱 타이틀 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">🗺️ Travel Companion</h1>
          <p className="text-gray-600 dark:text-gray-400">여행 기록 공유 앱</p>
        </div>

        {/* 여행 목록 */}
        {user && (
          <section>
            <div className="flex items-center mb-3">
              <h2 className="text-base font-bold text-gray-800 dark:text-gray-200">내 여행</h2>
              <button
                onClick={() => setShowTripForm(true)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 ml-2 leading-none font-bold"
                style={{ fontSize: '0.8rem' }}
              >
                +
              </button>
            </div>
            {loadingTrips ? (
              <p className="text-center text-gray-400 py-10">불러오는 중...</p>
            ) : trips.length === 0 ? (
              <p className="text-center text-gray-400 py-10">여행이 없습니다.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {trips.map((trip) => (
                  <button
                    key={trip.id}
                    onClick={() => router.push(`/checkin?trip_id=${trip.id}`)}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden text-left flex flex-col"
                  >
                    <div className="w-full aspect-square flex-shrink-0 overflow-hidden bg-gray-100 dark:bg-gray-700">
                      {trip.cover_photo_url ? (
                        <img
                          src={trip.cover_photo_url}
                          alt={trip.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          🗺️
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex flex-col flex-1 overflow-hidden">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-0.5 truncate">
                        {trip.title}
                      </h3>
                      {trip.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 line-clamp-2 flex-1">
                          {trip.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-auto">
                        {formatTripDate(trip.start_date ?? trip.first_checkin_date) ?? '날짜 미정'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {mounted && showTripForm && (
        <TripFormModal
          mode="create"
          onSuccess={(trip) => {
            setTrips((prev) => [trip, ...prev]);
            setShowTripForm(false);
            router.push(`/checkin?trip_id=${trip.id}`);
          }}
          onCancel={() => setShowTripForm(false)}
          onCreate={createTrip}
          onUpdate={async () => { throw new Error('not used'); }}
        />
      )}
    </main>
  );
}
