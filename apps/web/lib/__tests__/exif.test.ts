import { isValidGPS, calculateDistance } from '../exif';
import type { PhotoLocation } from '../exif';

describe('isValidGPS', () => {
  it('유효한 GPS 좌표를 true로 반환한다', () => {
    const location: PhotoLocation = { latitude: 37.5665, longitude: 126.9780 };
    expect(isValidGPS(location)).toBe(true);
  });

  it('undefined이면 false를 반환한다', () => {
    expect(isValidGPS(undefined)).toBe(false);
  });

  it('위도가 범위를 벗어나면 false를 반환한다', () => {
    expect(isValidGPS({ latitude: 91, longitude: 0 })).toBe(false);
    expect(isValidGPS({ latitude: -91, longitude: 0 })).toBe(false);
  });

  it('경도가 범위를 벗어나면 false를 반환한다', () => {
    expect(isValidGPS({ latitude: 0, longitude: 181 })).toBe(false);
    expect(isValidGPS({ latitude: 0, longitude: -181 })).toBe(false);
  });

  it('경계값(±90, ±180)은 유효하다', () => {
    expect(isValidGPS({ latitude: 90, longitude: 180 })).toBe(true);
    expect(isValidGPS({ latitude: -90, longitude: -180 })).toBe(true);
  });
});

describe('calculateDistance', () => {
  const seoul: PhotoLocation = { latitude: 37.5665, longitude: 126.9780 };
  const busan: PhotoLocation = { latitude: 35.1796, longitude: 129.0756 };

  it('서울-부산 거리가 약 325km이다', () => {
    const distance = calculateDistance(seoul, busan);
    expect(distance).toBeGreaterThan(320);
    expect(distance).toBeLessThan(330);
  });

  it('같은 위치 간 거리는 0이다', () => {
    const distance = calculateDistance(seoul, seoul);
    expect(distance).toBeCloseTo(0, 5);
  });

  it('거리 계산은 대칭이다 (A→B = B→A)', () => {
    const d1 = calculateDistance(seoul, busan);
    const d2 = calculateDistance(busan, seoul);
    expect(d1).toBeCloseTo(d2, 5);
  });
});
