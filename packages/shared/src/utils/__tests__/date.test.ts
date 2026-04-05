import { parseLocalDate, formatTripDate, toISODateString, formatDateDisplay } from '../date';

describe('parseLocalDate', () => {
  it('YYYY-MM-DD를 로컬 자정으로 파싱한다', () => {
    const d = parseLocalDate('2026-04-05');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(3); // 0-indexed
    expect(d.getDate()).toBe(5);
  });

  it('ISO 문자열도 파싱한다', () => {
    const d = parseLocalDate('2026-04-05T12:30:00.000Z');
    expect(d instanceof Date).toBe(true);
    expect(isNaN(d.getTime())).toBe(false);
  });
});

describe('formatTripDate', () => {
  it('null/undefined는 null을 반환한다', () => {
    expect(formatTripDate(null)).toBeNull();
    expect(formatTripDate(undefined)).toBeNull();
    expect(formatTripDate('')).toBeNull();
  });

  it('기본값은 요일 포함', () => {
    const result = formatTripDate('2026-04-05');
    expect(result).not.toBeNull();
    expect(result).toMatch(/2026/);
    expect(result).toMatch(/4|月/);
  });

  it('weekday: false이면 요일 미포함 (년월일만)', () => {
    const withWeekday = formatTripDate('2026-04-05');
    const withoutWeekday = formatTripDate('2026-04-05', { weekday: false });
    expect(withoutWeekday).not.toBeNull();
    // 요일 없는 버전이 더 짧아야 함
    expect(withoutWeekday!.length).toBeLessThan(withWeekday!.length);
  });

  it('ISO datetime 문자열도 처리한다', () => {
    const result = formatTripDate('2026-04-05T00:00:00.000Z');
    expect(result).not.toBeNull();
  });
});

describe('toISODateString', () => {
  it('Date 객체를 YYYY-MM-DD로 변환한다', () => {
    const d = new Date(2026, 3, 5); // 2026-04-05 (로컬)
    expect(toISODateString(d)).toBe('2026-04-05');
  });

  it('월/일이 한 자리면 zero-pad한다', () => {
    const d = new Date(2026, 0, 9); // 2026-01-09
    expect(toISODateString(d)).toBe('2026-01-09');
  });
});

describe('formatDateDisplay', () => {
  it('null이면 "날짜 선택" 반환', () => {
    expect(formatDateDisplay(null)).toBe('날짜 선택');
  });

  it('Invalid Date이면 "날짜 선택" 반환', () => {
    expect(formatDateDisplay(new Date('invalid'))).toBe('날짜 선택');
  });

  it('유효한 날짜는 한국어 형식으로 반환', () => {
    const result = formatDateDisplay(new Date(2026, 3, 5));
    expect(result).toMatch(/2026/);
    expect(result).not.toBe('날짜 선택');
  });
});
