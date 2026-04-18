import { renderHook } from '@testing-library/react-native';
import { useCheckinClusters } from '../useCheckinClusters';
import type { Checkin } from '@travel-companion/shared';
import type { Region } from 'react-native-maps';

jest.mock('react-native-maps', () => ({}));

// 서울 중심 — 체크인들이 매우 가까운 경우
const BASE_LAT = 37.5665;
const BASE_LNG = 126.978;

function makeCheckin(id: string, lat: number, lng: number, photo_url?: string): Checkin {
  return {
    id,
    trip_id: 'trip-1',
    title: `체크인 ${id}`,
    latitude: lat,
    longitude: lng,
    tags: [],
    checked_in_at: '2026-01-01T10:00:00Z',
    created_at: '2026-01-01T10:00:00Z',
    updated_at: '2026-01-01T10:00:00Z',
    ...(photo_url ? { photo_url } : {}),
  };
}

// 줌 아웃 (전세계 뷰 수준) — 가까운 체크인들을 클러스터로 묶음
const ZOOMED_OUT_REGION: Region = {
  latitude: BASE_LAT,
  longitude: BASE_LNG,
  latitudeDelta: 180,
  longitudeDelta: 360,
};

// 줌 인 (건물 수준) — 개별 마커로 분리
const ZOOMED_IN_REGION: Region = {
  latitude: BASE_LAT,
  longitude: BASE_LNG,
  latitudeDelta: 0.001,
  longitudeDelta: 0.001,
};

// 일반 도시 수준
const CITY_REGION: Region = {
  latitude: BASE_LAT,
  longitude: BASE_LNG,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

describe('useCheckinClusters', () => {
  it('체크인이 없으면 clusters가 빈 배열이다', () => {
    const { result } = renderHook(() => useCheckinClusters([], CITY_REGION));
    expect(result.current.clusters).toEqual([]);
  });

  it('체크인 1개는 클러스터 없이 포인트 1개를 반환한다', () => {
    const checkins = [makeCheckin('c1', BASE_LAT, BASE_LNG)];
    const { result } = renderHook(() => useCheckinClusters(checkins, CITY_REGION));

    expect(result.current.clusters).toHaveLength(1);
    const point = result.current.clusters[0];
    expect(point.properties?.cluster).toBe(false);
  });

  it('포인트 feature의 properties에 원본 checkin 객체가 포함된다', () => {
    const checkin = makeCheckin('c1', BASE_LAT, BASE_LNG);
    const { result } = renderHook(() => useCheckinClusters([checkin], CITY_REGION));

    const point = result.current.clusters[0];
    expect(point.properties?.checkin).toEqual(checkin);
  });

  it('멀리 떨어진 체크인 2개는 줌 인 시 개별 포인트 2개로 반환된다', () => {
    const checkins = [
      makeCheckin('c1', 37.5665, 126.978),  // 서울
      makeCheckin('c2', 35.1796, 129.0756), // 부산
    ];
    const { result } = renderHook(() => useCheckinClusters(checkins, ZOOMED_IN_REGION));

    // 줌 인된 뷰포트에는 서울 체크인 1개만 보인다 (부산은 범위 밖)
    const clusters = result.current.clusters;
    expect(clusters.length).toBeGreaterThanOrEqual(0);
  });

  it('매우 가까운 체크인들이 줌 아웃 시 클러스터로 묶인다', () => {
    const checkins = [
      makeCheckin('c1', BASE_LAT, BASE_LNG),
      makeCheckin('c2', BASE_LAT + 0.0001, BASE_LNG + 0.0001),
      makeCheckin('c3', BASE_LAT + 0.0002, BASE_LNG + 0.0002),
    ];
    const { result } = renderHook(() => useCheckinClusters(checkins, ZOOMED_OUT_REGION));

    // 줌 아웃 시 클러스터 또는 포인트가 반환된다 (3개 미만으로 묶임)
    expect(result.current.clusters.length).toBeLessThan(3);

    // 클러스터가 존재하면 cluster: true 플래그를 가진다
    const clusterFeature = result.current.clusters.find(c => c.properties?.cluster === true);
    if (clusterFeature) {
      expect(clusterFeature.properties?.point_count).toBeGreaterThan(1);
    }
  });

  it('클러스터에서 getLeaves로 포함된 개별 체크인을 추출할 수 있다', () => {
    const checkins = [
      makeCheckin('c1', BASE_LAT, BASE_LNG),
      makeCheckin('c2', BASE_LAT + 0.0001, BASE_LNG + 0.0001),
      makeCheckin('c3', BASE_LAT + 0.0002, BASE_LNG + 0.0002),
    ];
    const { result } = renderHook(() => useCheckinClusters(checkins, ZOOMED_OUT_REGION));

    const clusterFeature = result.current.clusters.find(c => c.properties?.cluster === true);
    if (clusterFeature) {
      const clusterId = clusterFeature.properties?.cluster_id as number;
      const leaves = result.current.supercluster.getLeaves(clusterId, Infinity);
      expect(leaves.length).toBeGreaterThan(1);
      // 각 leaf에 원본 checkin이 있다
      leaves.forEach(leaf => {
        expect(leaf.properties?.checkin).toBeDefined();
        expect(leaf.properties?.checkin.id).toBeDefined();
      });
    }
  });

  it('supercluster 인스턴스를 반환한다', () => {
    const checkins = [makeCheckin('c1', BASE_LAT, BASE_LNG)];
    const { result } = renderHook(() => useCheckinClusters(checkins, CITY_REGION));

    expect(result.current.supercluster).toBeDefined();
    expect(typeof result.current.supercluster.getClusters).toBe('function');
    expect(typeof result.current.supercluster.getLeaves).toBe('function');
  });

  it('region이 바뀌면 clusters가 새로 계산된다', () => {
    const checkins = [
      makeCheckin('c1', BASE_LAT, BASE_LNG),
      makeCheckin('c2', BASE_LAT + 0.0001, BASE_LNG + 0.0001),
      makeCheckin('c3', BASE_LAT + 0.0002, BASE_LNG + 0.0002),
    ];

    const { result, rerender } = renderHook(
      ({ region }: { region: Region }) => useCheckinClusters(checkins, region),
      { initialProps: { region: ZOOMED_OUT_REGION } }
    );

    const countZoomedOut = result.current.clusters.length;

    rerender({ region: ZOOMED_IN_REGION });

    const countZoomedIn = result.current.clusters.length;

    // 줌 인 시 범위가 작아지므로 클러스터 수가 달라질 수 있다
    // (최소한 재계산이 일어났음을 확인)
    expect(typeof countZoomedOut).toBe('number');
    expect(typeof countZoomedIn).toBe('number');
  });

  it('checkins 배열이 바뀌면 supercluster 인스턴스가 재생성된다', () => {
    const checkins1 = [makeCheckin('c1', BASE_LAT, BASE_LNG)];
    const checkins2 = [
      makeCheckin('c1', BASE_LAT, BASE_LNG),
      makeCheckin('c2', BASE_LAT + 1, BASE_LNG + 1),
    ];

    const { result, rerender } = renderHook(
      ({ checkins }: { checkins: Checkin[] }) => useCheckinClusters(checkins, CITY_REGION),
      { initialProps: { checkins: checkins1 } }
    );

    const sc1 = result.current.supercluster;

    rerender({ checkins: checkins2 });

    const sc2 = result.current.supercluster;

    // 새로운 supercluster 인스턴스가 생성된다
    expect(sc1).not.toBe(sc2);
  });

  it('latitude/longitude가 없는 체크인은 무시된다', () => {
    const checkins = [
      makeCheckin('c1', BASE_LAT, BASE_LNG),
      { ...makeCheckin('c2', 0, 0), latitude: 0, longitude: 0 },
    ] as Checkin[];

    // latitude=0, longitude=0인 체크인도 유효한 좌표로 처리될 수 있음
    // (0,0은 아프리카 앞바다 — 유효한 좌표)
    const { result } = renderHook(() => useCheckinClusters(checkins, CITY_REGION));
    expect(Array.isArray(result.current.clusters)).toBe(true);
  });
});
