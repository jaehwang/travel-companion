interface CheckinPhotoInfo {
  trip_id: string;
  checked_in_at: string;
  photo_url: string | null;
}

export interface TripMeta {
  first_checkin_date: string | null;
  cover_photo_url: string | null;
}

/**
 * 체크인 목록으로부터 여행별 메타 정보를 집계한다.
 * - first_checkin_date: 가장 이른 체크인 날짜
 * - cover_photo_url: 사진이 있는 가장 이른 체크인의 photo_url (deterministic)
 *
 * checkins 배열은 checked_in_at 오름차순 정렬을 권장한다.
 */
export function buildTripMetaMap(
  checkins: CheckinPhotoInfo[],
): Record<string, TripMeta> {
  const firstCheckinMap: Record<string, string> = {};
  const firstPhotoMap: Record<string, string> = {};

  for (const c of checkins) {
    if (!firstCheckinMap[c.trip_id]) {
      firstCheckinMap[c.trip_id] = c.checked_in_at;
    }
    if (c.photo_url && !firstPhotoMap[c.trip_id]) {
      firstPhotoMap[c.trip_id] = c.photo_url;
    }
  }

  const allTripIds = new Set([
    ...Object.keys(firstCheckinMap),
    ...Object.keys(firstPhotoMap),
  ]);

  const result: Record<string, TripMeta> = {};
  for (const tripId of allTripIds) {
    result[tripId] = {
      first_checkin_date: firstCheckinMap[tripId] ?? null,
      cover_photo_url: firstPhotoMap[tripId] ?? null,
    };
  }

  return result;
}
