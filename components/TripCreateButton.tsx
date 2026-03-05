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
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: '#FF6B47',
          color: 'white',
          fontSize: 22,
          fontWeight: 400,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 3px 10px rgba(255,107,71,0.4)',
          lineHeight: 1,
        }}
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
