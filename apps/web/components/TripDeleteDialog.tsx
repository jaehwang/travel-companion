'use client';

import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';

interface TripDeleteDialogProps {
  tripTitle: string;
  onDeleteCheckins: () => void;
  onKeepCheckins: () => void;
  onCancel: () => void;
}

export default function TripDeleteDialog({
  tripTitle,
  onDeleteCheckins,
  onKeepCheckins,
  onCancel,
}: TripDeleteDialogProps) {
  const t = useTranslations('trip');
  const tc = useTranslations('common');

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center px-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl px-5 py-6 w-full max-w-[360px]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-bold mb-2 text-gray-900">
          &quot;{tripTitle}&quot; {tc('delete')}
        </h3>
        <p className="text-sm text-gray-500 mb-5 leading-relaxed">
          {t('deleteBody')}
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onDeleteCheckins}
            className="py-[11px] px-4 rounded-xl border-[1.5px] border-red-500 bg-red-500 text-white font-semibold text-sm cursor-pointer"
          >
            {t('deleteWithCheckins')}
          </button>
          <button
            onClick={onKeepCheckins}
            className="py-[11px] px-4 rounded-xl border-[1.5px] border-indigo-500 bg-white text-indigo-500 font-semibold text-sm cursor-pointer"
          >
            {t('keepCheckins')}
          </button>
          <button
            onClick={onCancel}
            className="py-[11px] px-4 rounded-xl border-[1.5px] border-gray-200 bg-white text-gray-500 font-medium text-sm cursor-pointer"
          >
            {tc('cancel')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
