import { useMemo } from 'react';
import Supercluster from 'supercluster';
import type { Checkin } from '@travel-companion/shared';
import type { Region } from 'react-native-maps';

export type CheckinPointProperties = {
  cluster: false;
  checkin: Checkin;
};

export type ClusterProperties = {
  cluster: true;
  cluster_id: number;
  point_count: number;
  point_count_abbreviated: string | number;
};

export type CheckinFeature = GeoJSON.Feature<GeoJSON.Point, CheckinPointProperties>;
export type ClusterFeature = GeoJSON.Feature<GeoJSON.Point, ClusterProperties>;
export type ClusterOrPoint = CheckinFeature | ClusterFeature;

function regionToBBox(region: Region): [number, number, number, number] {
  const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
  return [
    longitude - longitudeDelta / 2, // west
    latitude - latitudeDelta / 2,   // south
    longitude + longitudeDelta / 2, // east
    latitude + latitudeDelta / 2,   // north
  ];
}

function regionToZoom(region: Region): number {
  const zoom = Math.round(Math.log(360 / region.longitudeDelta) / Math.LN2);
  return Math.max(0, Math.min(zoom, 20));
}

export function useCheckinClusters(checkins: Checkin[], region: Region) {
  const supercluster = useMemo(() => {
    const instance = new Supercluster<CheckinPointProperties, ClusterProperties>({
      radius: 60,
      maxZoom: 16,
      minPoints: 2,
    });

    const points: CheckinFeature[] = checkins.map((checkin) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [checkin.longitude, checkin.latitude],
      },
      properties: {
        cluster: false,
        checkin,
      },
    }));

    instance.load(points);
    return instance;
  }, [checkins]);

  const clusters = useMemo<ClusterOrPoint[]>(() => {
    if (checkins.length === 0) return [];
    const bbox = regionToBBox(region);
    const zoom = regionToZoom(region);
    return supercluster.getClusters(bbox, zoom) as ClusterOrPoint[];
  }, [supercluster, region, checkins.length]);

  return { clusters, supercluster };
}
