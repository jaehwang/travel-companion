import { useState, useEffect } from 'react';
import type { Trip, TripFormData } from '@travel-companion/shared';
import { toISODateString, formatDateDisplay } from '@travel-companion/shared';

export { formatDateDisplay };

export const formatDate = (date: Date | null): string => {
  if (!date) return '';
  return toISODateString(date);
};

export const parseDate = (dateStr?: string | null): Date | null => {
  if (!dateStr) return null;
  const parts = dateStr.substring(0, 10).split('-').map(Number);
  if (parts.length < 3 || parts.some(isNaN)) return null;
  const [y, m, d] = parts;
  const date = new Date(y, m - 1, d);
  return isNaN(date.getTime()) ? null : date;
};

export function useTripForm(
  visible: boolean,
  initialTrip: Trip | undefined,
  onSubmit: (data: TripFormData) => Promise<void>,
  onClose: () => void,
) {
  const [title, setTitle] = useState(initialTrip?.title ?? '');
  const [description, setDescription] = useState(initialTrip?.description ?? '');
  const [startDate, setStartDate] = useState<Date | null>(parseDate(initialTrip?.start_date));
  const [endDate, setEndDate] = useState<Date | null>(parseDate(initialTrip?.end_date));
  const [isPublic, setIsPublic] = useState(initialTrip?.is_public ?? false);
  const [isFrequent, setIsFrequent] = useState(initialTrip?.is_frequent ?? false);
  const [place, setPlace] = useState(initialTrip?.place ?? '');
  const [placeId, setPlaceId] = useState(initialTrip?.place_id ?? '');
  const [placeLat, setPlaceLat] = useState<number | undefined>(initialTrip?.latitude ?? undefined);
  const [placeLng, setPlaceLng] = useState<number | undefined>(initialTrip?.longitude ?? undefined);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setTitle(initialTrip?.title ?? '');
      setDescription(initialTrip?.description ?? '');
      setStartDate(parseDate(initialTrip?.start_date));
      setEndDate(parseDate(initialTrip?.end_date));
      setIsPublic(initialTrip?.is_public ?? false);
      setIsFrequent(initialTrip?.is_frequent ?? false);
      setPlace(initialTrip?.place ?? '');
      setPlaceId(initialTrip?.place_id ?? '');
      setPlaceLat(initialTrip?.latitude ?? undefined);
      setPlaceLng(initialTrip?.longitude ?? undefined);
      setError(null);
    }
  }, [visible, initialTrip]);

  const reset = () => {
    setTitle(''); setDescription('');
    setStartDate(null); setEndDate(null);
    setIsPublic(false); setIsFrequent(false);
    setPlace(''); setPlaceId(''); setPlaceLat(undefined); setPlaceLng(undefined);
    setError(null);
  };

  const handleClose = () => { reset(); onClose(); };
  const handleClearPlace = () => { setPlace(''); setPlaceId(''); setPlaceLat(undefined); setPlaceLng(undefined); };

  const handleSubmit = async () => {
    if (!title.trim()) { setError('여행 이름을 입력해주세요.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        start_date: formatDate(startDate) || undefined,
        end_date: formatDate(endDate) || undefined,
        is_public: isPublic,
        is_frequent: isFrequent,
        place: place.trim() || null,
        place_id: placeId || null,
        latitude: placeLat ?? null,
        longitude: placeLng ?? null,
      });
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return {
    title, setTitle, description, setDescription,
    startDate, setStartDate, endDate, setEndDate,
    isPublic, setIsPublic, isFrequent, setIsFrequent,
    place, setPlace: (v: string) => setPlace(v), setPlaceId,
    placeLat, setPlaceLat, placeLng, setPlaceLng,
    submitting, error,
    canSubmit: !!title.trim() && !submitting,
    handleClose, handleClearPlace, handleSubmit,
  };
}
