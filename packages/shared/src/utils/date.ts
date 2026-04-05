/**
 * YYYY-MM-DD 또는 ISO 문자열 → 로컬 Date 객체 (타임존 안전 파싱)
 * YYYY-MM-DD는 로컬 자정으로 처리 (new Date("YYYY-MM-DD")는 UTC 자정이므로 직접 파싱)
 */
export function parseLocalDate(dateStr: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(dateStr);
}

/**
 * 여행 날짜 표시용: "2026년 4월 5일 (토)" / "April 5, 2026 (Sat)"
 * weekday 기본값: true
 * locale 기본값: 'ko'
 */
export function formatTripDate(
  dateStr: string | null | undefined,
  options?: { weekday?: boolean; locale?: string },
): string | null {
  if (!dateStr) return null;
  const date = parseLocalDate(dateStr);
  const weekday = options?.weekday !== false;
  const locale = options?.locale ?? 'ko';
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(weekday && { weekday: 'short' }),
  }).format(date);
}

/**
 * Date 객체 → "YYYY-MM-DD" 문자열 (폼 제출용)
 */
export function toISODateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Date 객체 → 날짜 선택 버튼 표시용
 * null 또는 유효하지 않은 날짜이면 fallback 반환 (기본값: '날짜 선택')
 * locale 기본값: 'ko'
 */
export function formatDateDisplay(
  date: Date | null,
  options?: { locale?: string; fallback?: string },
): string {
  const locale = options?.locale ?? 'ko';
  const fallback = options?.fallback ?? '날짜 선택';
  if (!date || isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}
