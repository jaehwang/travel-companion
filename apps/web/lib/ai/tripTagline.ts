export interface TripTaglineContext {
  title: string;
  description?: string | null;
  place?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  checkinCount: number;
  checkins?: TripTaglineCheckinContext[];
}

export interface TripTaglineCheckinContext {
  title?: string | null;
  message?: string | null;
  place?: string | null;
  category?: string | null;
  checkedInAt?: string | null;
}

const MAX_TAGLINE_LENGTH = 32;
const MAX_CHECKIN_SUMMARY_LENGTH = 72;
const MAX_PROMPT_CHECKINS = 6;

function formatDateForPrompt(date: string | null | undefined): string {
  if (!date) return '미정';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toISOString().slice(0, 10);
}

function compactText(value: string | null | undefined, maxLength: number): string {
  return (value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
    .trim();
}

function buildCheckinSummary(checkin: TripTaglineCheckinContext): string | null {
  const parts = [
    formatDateForPrompt(checkin.checkedInAt),
    compactText(checkin.place, 18),
    compactText(checkin.title, 24),
    compactText(checkin.message, 28),
    compactText(checkin.category, 12),
  ].filter(Boolean);

  if (parts.length === 0) return null;

  return parts.join(' | ').slice(0, MAX_CHECKIN_SUMMARY_LENGTH).trim();
}

function buildCheckinPromptSection(checkins: TripTaglineCheckinContext[] | undefined): string[] {
  const summaries = (checkins ?? [])
    .map(buildCheckinSummary)
    .filter((summary): summary is string => Boolean(summary));

  if (summaries.length === 0) {
    return ['대표 체크인: 없음'];
  }

  const uniqueSummaries = [...new Set(summaries)].slice(0, MAX_PROMPT_CHECKINS);
  return ['대표 체크인:', ...uniqueSummaries.map((summary) => `- ${summary}`)];
}

export function buildTripTaglinePrompt(context: TripTaglineContext): string {
  const description = context.description?.trim() || '없음';
  const place = context.place?.trim() || '미정';
  const endDate = context.endDate || context.startDate;

  return [
    '너는 여행 기록 앱의 카피라이터다.',
    '사용자가 저장한 여행 제목과 여행 정보를 보고, 친구가 센스 있게 툭 던진 것 같은 한국어 한 줄 문구를 만들어라.',
    '목표 톤은 "피식 웃기고, 여행 분위기가 느껴지고, 너무 오버하지 않음"이다.',
    '조건:',
    '- 출력은 한 줄 문구만',
    '- 32자 이내',
    '- 제목을 그대로 반복하지 말 것',
    '- 이모지, 따옴표, 해시태그, 줄바꿈 금지',
    '- 과장된 광고 문구처럼 쓰지 말 것',
    '- 말장난, 반전, 상황 묘사를 가볍게 섞어도 됨',
    '- 너무 시적이거나 감성 문구만으로 끝내지 말 것',
    '- 여행자의 행동이나 분위기가 떠오르게 만들 것',
    '- 가능하면 장소/일정/체크인 수를 재치 있게 반영할 것',
    '',
    '좋은 예시:',
    '- 계획보다 군것질이 더 성실했던 일정',
    '- 걷는 척했지만 결국 맛집 순례',
    '- 풍경 감상과 사진 욕심의 공동 우승',
    '- 하루 종일 돌아다녔는데 또 아쉬운 여행',
    '',
    `여행 제목: ${context.title}`,
    `설명: ${description}`,
    `대표 장소: ${place}`,
    `여행 시작일: ${formatDateForPrompt(context.startDate)}`,
    `여행 종료일: ${formatDateForPrompt(endDate)}`,
    `체크인 개수: ${context.checkinCount}`,
    ...buildCheckinPromptSection(context.checkins),
  ].join('\n');
}

export function normalizeTripTagline(rawText: string): string {
  return rawText
    .trim()
    .split(/\r?\n/, 1)[0]
    .replace(/^["'“”‘’\s]+|["'“”‘’\s]+$/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, MAX_TAGLINE_LENGTH)
    .trim();
}
