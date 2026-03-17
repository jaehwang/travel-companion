'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TripFormModal from '@/components/TripFormModal';
import type { TripFormData, Trip } from '@/types/database';

export default function TripCreateButton() {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const handleCreate = async (data: TripFormData): Promise<Trip> => {
    const response = await fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to create trip');
    return result.trip as Trip;
  };

  const handleSuccess = (trip: Trip) => {
    setShowModal(false);
    router.push(`/checkin?trip_id=${trip.id}`);
  };

  const handleUpdate = async (): Promise<Trip> => {
    throw new Error('Not supported');
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#FF6B47] text-white text-[22px] md:text-2xl font-normal border-none cursor-pointer flex items-center justify-center leading-none hover:scale-105 transition-transform"
        style={{ boxShadow: '0 3px 10px rgba(255,107,71,0.4)' }}
        aria-label="새 여행 만들기"
      >
        +
      </button>
      {showModal && (
        <TripFormModal
          mode="create"
          onSuccess={handleSuccess}
          onCancel={() => setShowModal(false)}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
        />
      )}
    </>
  );
}
