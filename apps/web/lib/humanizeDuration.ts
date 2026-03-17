/**
 * 분 단위 시간을 한국어 자연어로 변환합니다.
 * 예: 90 → "1시간 30분 후", 1440 → "1일 후"
 */
export function humanizeDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}분 후`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) return mins > 0 ? `${hours}시간 ${mins}분 후` : `${hours}시간 후`;
  const days = Math.floor(hours / 24);
  const remainHours = hours % 24;
  return remainHours > 0 ? `${days}일 ${remainHours}시간 후` : `${days}일 후`;
}
