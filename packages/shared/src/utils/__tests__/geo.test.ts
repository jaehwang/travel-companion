import { haversineDistance } from '../geo';

describe('haversineDistance', () => {
  it('두 좌표 간 거리를 미터로 반환한다', () => {
    // 서울 시청 → 경복궁 (약 1.7km)
    const dist = haversineDistance(37.5665, 126.978, 37.5796, 126.977);
    expect(dist).toBeGreaterThan(1000);
    expect(dist).toBeLessThan(2000);
  });

  it('동일 좌표는 0을 반환한다', () => {
    expect(haversineDistance(37.5665, 126.978, 37.5665, 126.978)).toBe(0);
  });

  it('서울-뉴욕 거리가 약 11000km 이상이다', () => {
    const dist = haversineDistance(37.5665, 126.978, 40.7128, -74.006);
    expect(dist).toBeGreaterThan(10_000_000);
  });
});
