import { renderHook, act } from '@testing-library/react';
import { useGeolocation } from '../useGeolocation';

const mockSuccessPosition = {
  coords: {
    latitude: 37.5665,
    longitude: 126.978,
    accuracy: 10,
  },
};

// GeolocationPositionError 형태의 mock (code + 상수 속성)
function makeGeoError(code: number) {
  return {
    code,
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
    message: 'error',
  };
}

describe('useGeolocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('초기 상태: position null, error null, loading false', () => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: { getCurrentPosition: jest.fn() },
      configurable: true,
    });

    const { result } = renderHook(() => useGeolocation());

    expect(result.current.position).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('위치 조회 성공 시 position이 설정된다', async () => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: {
        getCurrentPosition: jest.fn((success) => success(mockSuccessPosition)),
      },
      configurable: true,
    });

    const { result } = renderHook(() => useGeolocation());

    await act(async () => {
      await result.current.getCurrentPosition();
    });

    expect(result.current.position).toEqual({
      latitude: 37.5665,
      longitude: 126.978,
      accuracy: 10,
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('geolocation 미지원 브라우저에서 code 0 에러를 반환한다', async () => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: undefined,
      configurable: true,
    });

    const { result } = renderHook(() => useGeolocation());

    await act(async () => {
      await expect(result.current.getCurrentPosition()).rejects.toMatchObject({
        code: 0,
      });
    });

    expect(result.current.error?.code).toBe(0);
  });

  it('PERMISSION_DENIED(1) 시 권한 거부 메시지를 반환한다', async () => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: {
        getCurrentPosition: jest.fn((_, error) => error(makeGeoError(1))),
      },
      configurable: true,
    });

    const { result } = renderHook(() => useGeolocation());

    await act(async () => {
      await expect(result.current.getCurrentPosition()).rejects.toMatchObject({
        code: 1,
        message: '위치 접근 권한이 거부되었습니다.',
      });
    });

    expect(result.current.error?.message).toBe('위치 접근 권한이 거부되었습니다.');
    expect(result.current.loading).toBe(false);
  });

  it('POSITION_UNAVAILABLE(2) 시 사용 불가 메시지를 반환한다', async () => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: {
        getCurrentPosition: jest.fn((_, error) => error(makeGeoError(2))),
      },
      configurable: true,
    });

    const { result } = renderHook(() => useGeolocation());

    await act(async () => {
      await expect(result.current.getCurrentPosition()).rejects.toMatchObject({
        code: 2,
        message: '위치 정보를 사용할 수 없습니다.',
      });
    });
  });

  it('TIMEOUT(3) 시 시간 초과 메시지를 반환한다', async () => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: {
        getCurrentPosition: jest.fn((_, error) => error(makeGeoError(3))),
      },
      configurable: true,
    });

    const { result } = renderHook(() => useGeolocation());

    await act(async () => {
      await expect(result.current.getCurrentPosition()).rejects.toMatchObject({
        code: 3,
        message: '위치 요청 시간이 초과되었습니다.',
      });
    });
  });
});
