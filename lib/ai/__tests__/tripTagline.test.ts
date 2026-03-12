import { buildTripTaglinePrompt, normalizeTripTagline } from '../tripTagline';

describe('tripTagline prompt', () => {
  it('대표 체크인 정보를 프롬프트에 포함한다', () => {
    const prompt = buildTripTaglinePrompt({
      title: '도쿄 밤산책',
      description: '골목과 야식을 즐긴 여행',
      place: '도쿄',
      startDate: '2025-05-01T00:00:00.000Z',
      endDate: '2025-05-03T00:00:00.000Z',
      checkinCount: 2,
      checkins: [
        {
          checkedInAt: '2025-05-01T10:00:00.000Z',
          place: '신주쿠',
          title: '첫 끼는 라멘',
          message: '국물까지 싹 비웠다',
          category: 'restaurant',
        },
        {
          checkedInAt: '2025-05-02T10:00:00.000Z',
          place: '시부야',
          title: '골목 산책',
          message: '예상보다 오래 걷고 더 오래 구경했다',
          category: 'attraction',
        },
      ],
    });

    expect(prompt).toContain('대표 체크인:');
    expect(prompt).toContain('신주쿠');
    expect(prompt).toContain('국물까지 싹 비웠다');
    expect(prompt).toContain('시부야');
  });

  it('응답 정규화 시 첫 줄만 남기고 양끝 따옴표를 제거한다', () => {
    expect(normalizeTripTagline('"계획보다 야식이 더 성실했던 일정"\n다음 줄')).toBe(
      '계획보다 야식이 더 성실했던 일정'
    );
  });
});
