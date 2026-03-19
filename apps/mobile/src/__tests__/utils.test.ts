// TripCard의 formatTripDate 및 TripFormModal의 formatDate / parseDate 로직 테스트

// TripCard에서 사용하는 날짜 포맷팅 로직 (YYYY-MM-DD 문자열 → 한국어 표시)
const formatTripDate = (dateStr?: string | null): string | null => {
  if (!dateStr) return null;
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  const date = isDateOnly
    ? (() => { const [y, m, d] = dateStr.split('-').map(Number); return new Date(y, m - 1, d); })()
    : new Date(dateStr);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  }).format(date);
};

// TripFormModal에서 사용하는 Date → YYYY-MM-DD 변환 로직
const formatDate = (date: Date | null): string => {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// TripFormModal에서 사용하는 YYYY-MM-DD 문자열 → Date 파싱 로직
const parseDate = (dateStr?: string): Date | null => {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

describe('formatTripDate', () => {
  it('YYYY-MM-DD 형식의 날짜 문자열을 한국어로 포맷한다', () => {
    const result = formatTripDate('2024-03-15');
    expect(result).toBe('2024년 3월 15일');
  });

  it('undefined를 전달하면 null을 반환한다', () => {
    expect(formatTripDate(undefined)).toBeNull();
  });

  it('null을 전달하면 null을 반환한다', () => {
    expect(formatTripDate(null)).toBeNull();
  });

  it('빈 문자열을 전달하면 null을 반환한다', () => {
    expect(formatTripDate('')).toBeNull();
  });

  it('1월과 12월의 날짜를 올바르게 포맷한다', () => {
    expect(formatTripDate('2024-01-01')).toBe('2024년 1월 1일');
    expect(formatTripDate('2024-12-31')).toBe('2024년 12월 31일');
  });
});

describe('formatDate (Date → YYYY-MM-DD)', () => {
  it('Date 객체를 YYYY-MM-DD 형식 문자열로 변환한다', () => {
    const date = new Date(2024, 2, 15); // 2024-03-15
    expect(formatDate(date)).toBe('2024-03-15');
  });

  it('null을 전달하면 빈 문자열을 반환한다', () => {
    expect(formatDate(null)).toBe('');
  });

  it('월과 일을 두 자리로 패딩한다', () => {
    const date = new Date(2024, 0, 5); // 2024-01-05
    expect(formatDate(date)).toBe('2024-01-05');
  });

  it('12월 31일을 올바르게 변환한다', () => {
    const date = new Date(2024, 11, 31); // 2024-12-31
    expect(formatDate(date)).toBe('2024-12-31');
  });
});

describe('parseDate (YYYY-MM-DD → Date)', () => {
  it('YYYY-MM-DD 문자열을 Date 객체로 파싱한다', () => {
    const result = parseDate('2024-03-15');
    expect(result).not.toBeNull();
    expect(result!.getFullYear()).toBe(2024);
    expect(result!.getMonth()).toBe(2); // 0-indexed
    expect(result!.getDate()).toBe(15);
  });

  it('undefined를 전달하면 null을 반환한다', () => {
    expect(parseDate(undefined)).toBeNull();
  });

  it('빈 문자열을 전달하면 null을 반환한다', () => {
    expect(parseDate('')).toBeNull();
  });

  it('파싱된 날짜를 다시 포맷하면 원래 문자열과 동일하다', () => {
    const original = '2024-07-20';
    const parsed = parseDate(original);
    expect(formatDate(parsed)).toBe(original);
  });
});
