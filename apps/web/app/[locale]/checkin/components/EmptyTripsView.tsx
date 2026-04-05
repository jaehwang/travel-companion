'use client';

import { Map as MapIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface EmptyTripsViewProps {
  onCreateTrip: () => void;
}

export default function EmptyTripsView({ onCreateTrip }: EmptyTripsViewProps) {
  const tTrip = useTranslations('trip');

  return (
    <div className="mt-10 text-center px-6 py-12 bg-[var(--tc-card-bg)] rounded-[20px] shadow-[0_4px_20px_rgba(45,36,22,0.08)]">
      <div className="flex justify-center mb-4"><MapIcon size={52} color="#C4B49A" /></div>
      <p className="text-[17px] font-extrabold text-[var(--tc-warm-dark)] mb-2">{tTrip('noTrips')}</p>
      <p className="text-sm text-[var(--tc-warm-mid)] mb-6">{tTrip('noTripsDesc')}</p>
      <button
        onClick={onCreateTrip}
        className="text-[15px] font-bold text-white bg-[#FF6B47] border-0 rounded-full py-3 px-7 cursor-pointer shadow-[0_4px_14px_rgba(255,107,71,0.45)]"
      >
        {tTrip('createFirst')}
      </button>
    </div>
  );
}
