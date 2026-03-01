import { renderHook, act } from '@testing-library/react';
import { useLocationSource } from '../useLocationSource';

describe('useLocationSource - 위치 정보 우선순위', () => {
  it('초기 상태는 위치 없음', () => {
    const { result } = renderHook(() => useLocationSource());
    expect(result.current.location).toBeNull();
  });

  describe('사진 GPS', () => {
    it('위치가 없을 때 사진 GPS를 적용한다', () => {
      const { result } = renderHook(() => useLocationSource());

      act(() => result.current.applyPhotoGps(37.5, 127.0));

      expect(result.current.location).toEqual({ latitude: 37.5, longitude: 127.0 });
    });

    it('현재 위치(photo)가 있을 때 사진 GPS로 교체한다', () => {
      const { result } = renderHook(() => useLocationSource());

      act(() => result.current.applyPhotoGps(37.5, 127.0));
      act(() => result.current.applyPhotoGps(35.1, 129.0));

      expect(result.current.location).toEqual({ latitude: 35.1, longitude: 129.0 });
    });
  });

  describe('수동 선택', () => {
    it('위치가 없을 때 수동 선택을 적용한다', () => {
      const { result } = renderHook(() => useLocationSource());

      act(() => result.current.setManualLocation(37.5, 127.0));

      expect(result.current.location).toEqual({ latitude: 37.5, longitude: 127.0 });
    });

    it('사진 GPS 위치가 있어도 수동 선택으로 교체한다', () => {
      const { result } = renderHook(() => useLocationSource());

      act(() => result.current.applyPhotoGps(37.5, 127.0));
      act(() => result.current.setManualLocation(35.1, 129.0));

      expect(result.current.location).toEqual({ latitude: 35.1, longitude: 129.0 });
    });
  });

  describe('우선순위: 수동 선택 > 사진 GPS', () => {
    it('수동 선택 후 사진 GPS → 수동 선택 유지', () => {
      const { result } = renderHook(() => useLocationSource());

      act(() => result.current.setManualLocation(37.5, 127.0));
      act(() => result.current.applyPhotoGps(35.1, 129.0)); // 무시되어야 함

      expect(result.current.location).toEqual({ latitude: 37.5, longitude: 127.0 });
    });

    it('사진 GPS 후 수동 선택 → 수동 선택으로 교체', () => {
      const { result } = renderHook(() => useLocationSource());

      act(() => result.current.applyPhotoGps(37.5, 127.0));
      act(() => result.current.setManualLocation(35.1, 129.0));

      expect(result.current.location).toEqual({ latitude: 35.1, longitude: 129.0 });
    });
  });

  describe('사진 제거 시', () => {
    it('사진 GPS로 설정된 위치는 사진 제거 시 함께 초기화된다', () => {
      const { result } = renderHook(() => useLocationSource());

      act(() => result.current.applyPhotoGps(37.5, 127.0));
      act(() => result.current.onPhotoClear());

      expect(result.current.location).toBeNull();
    });

    it('수동 선택 위치는 사진 제거해도 유지된다', () => {
      const { result } = renderHook(() => useLocationSource());

      act(() => result.current.setManualLocation(37.5, 127.0));
      act(() => result.current.onPhotoClear());

      expect(result.current.location).toEqual({ latitude: 37.5, longitude: 127.0 });
    });

    it('수동 선택 후 사진 첨부, 사진 제거 → 수동 선택 위치 유지', () => {
      const { result } = renderHook(() => useLocationSource());

      act(() => result.current.setManualLocation(37.5, 127.0));
      act(() => result.current.applyPhotoGps(35.1, 129.0)); // 수동 선택이 있으므로 무시
      act(() => result.current.onPhotoClear());

      expect(result.current.location).toEqual({ latitude: 37.5, longitude: 127.0 });
    });
  });

  describe('위치 직접 삭제', () => {
    it('수동 선택 위치를 직접 삭제하면 초기화된다', () => {
      const { result } = renderHook(() => useLocationSource());

      act(() => result.current.setManualLocation(37.5, 127.0));
      act(() => result.current.clearLocation());

      expect(result.current.location).toBeNull();
    });

    it('삭제 후 사진 GPS를 다시 적용할 수 있다', () => {
      const { result } = renderHook(() => useLocationSource());

      act(() => result.current.setManualLocation(37.5, 127.0));
      act(() => result.current.clearLocation());
      act(() => result.current.applyPhotoGps(35.1, 129.0));

      expect(result.current.location).toEqual({ latitude: 35.1, longitude: 129.0 });
    });
  });

  describe('수정 모드 초기화', () => {
    it('initLocation은 위치를 수동 선택으로 간주하여 사진 GPS를 무시한다', () => {
      const { result } = renderHook(() => useLocationSource());

      act(() => result.current.initLocation(37.5, 127.0));
      act(() => result.current.applyPhotoGps(35.1, 129.0)); // 무시되어야 함

      expect(result.current.location).toEqual({ latitude: 37.5, longitude: 127.0 });
    });
  });

  describe('리셋', () => {
    it('resetLocation은 위치와 출처를 모두 초기화한다', () => {
      const { result } = renderHook(() => useLocationSource());

      act(() => result.current.setManualLocation(37.5, 127.0));
      act(() => result.current.resetLocation());

      expect(result.current.location).toBeNull();
    });

    it('리셋 후 사진 GPS를 다시 적용할 수 있다', () => {
      const { result } = renderHook(() => useLocationSource());

      act(() => result.current.setManualLocation(37.5, 127.0));
      act(() => result.current.resetLocation());
      act(() => result.current.applyPhotoGps(35.1, 129.0));

      expect(result.current.location).toEqual({ latitude: 35.1, longitude: 129.0 });
    });
  });
});
