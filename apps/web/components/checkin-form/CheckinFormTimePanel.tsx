'use client';

import { Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CheckinFormTimePanelProps {
  checkedInAt: string;
  onCheckedInAtChange: (v: string) => void;
  onClose: () => void;
}

export default function CheckinFormTimePanel({
  checkedInAt,
  onCheckedInAtChange,
  onClose,
}: CheckinFormTimePanelProps) {
  const t = useTranslations('checkin');
  const tc = useTranslations('common');

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-[var(--tc-bg)]">
      {/* 패널 헤더 */}
      <div className="flex items-center justify-between px-5 py-[14px] border-b-[1.5px] border-[var(--tc-dot)]">
        <span className="text-base font-extrabold text-[var(--tc-warm-dark)] tracking-[-0.01em]">
          {t('timePanel')}
        </span>
        <button
          onClick={onClose}
          className="text-[13px] font-semibold text-[var(--tc-warm-mid)] bg-[var(--tc-card-empty)] border-0 rounded-full py-[5px] px-[14px] cursor-pointer"
        >
          {tc('close')}
        </button>
      </div>

      {/* 시간 선택 */}
      <div className="flex-1 flex flex-col items-center justify-center p-7 gap-5">
        <Clock size={48} color="#C4B49A" />
        <input
          type="datetime-local"
          value={checkedInAt}
          onChange={(e) => onCheckedInAtChange(e.target.value)}
          autoFocus
          className="text-[17px] py-[13px] px-[18px] rounded-[14px] border-2 border-[var(--tc-dot)] w-full max-w-[340px] text-[var(--tc-warm-dark)] bg-[var(--tc-card-bg)] outline-none font-semibold"
        />
        {checkedInAt && (
          <button
            onClick={() => { onCheckedInAtChange(''); onClose(); }}
            className="text-[13px] font-semibold text-[var(--tc-warm-faint)] bg-transparent border-0 cursor-pointer"
          >
            {t('clearTime')}
          </button>
        )}
      </div>
    </div>
  );
}
