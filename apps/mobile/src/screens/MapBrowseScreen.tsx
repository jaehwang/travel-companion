import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import * as SecureStore from 'expo-secure-store';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { Region } from 'react-native-maps';
import type { Checkin } from '@travel-companion/shared';
import { useAllCheckins } from '../hooks/useAllCheckins';
import { useTripsStore } from '../store/tripsStore';
import { useCheckinClusters, type ClusterFeature, type CheckinFeature } from '../hooks/useCheckinClusters';
import CheckinMapMarker from '../components/map/CheckinMapMarker';
import ClusterMarker from '../components/map/ClusterMarker';
import CheckinMapBottomSheet from '../components/map/CheckinMapBottomSheet';

const CACHE_CLEAR_KEY = 'mapImageCacheLastCleared';
const CACHE_CLEAR_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7일

async function clearImageCacheIfNeeded() {
  try {
    const last = await SecureStore.getItemAsync(CACHE_CLEAR_KEY);
    if (!last || Date.now() - Number(last) > CACHE_CLEAR_INTERVAL_MS) {
      await Image.clearDiskCache();
      await SecureStore.setItemAsync(CACHE_CLEAR_KEY, String(Date.now()));
    }
  } catch {
    // 캐시 정리 실패는 무시
  }
}

const SEOUL: Region = {
  latitude: 37.5665,
  longitude: 126.978,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

function buildInitialRegion(checkins: Checkin[]): Region {
  if (checkins.length === 0) return SEOUL;
  if (checkins.length === 1) {
    return {
      latitude: checkins[0].latitude,
      longitude: checkins[0].longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }
  const lats = checkins.map(c => c.latitude);
  const lngs = checkins.map(c => c.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.02),
    longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.02),
  };
}

export default function MapBrowseScreen() {
  const navigation = useNavigation<any>();
  const { checkins, loading } = useAllCheckins();
  const trips = useTripsStore((s) => s.trips);
  const mapRef = useRef<MapView>(null);
  const mapReadyRef = useRef(false);

  const [region, setRegion] = useState<Region>(SEOUL);
  const [selectedCheckins, setSelectedCheckins] = useState<Checkin[] | null>(null);
  const [headerTitle, setHeaderTitle] = useState<string | null>(null);
  const [loadedMarkerKeys, setLoadedMarkerKeys] = useState<Set<string>>(new Set());

  const handleMarkerImageLoad = useCallback((key: string) => {
    setLoadedMarkerKeys((prev) => new Set(prev).add(key));
  }, []);

  useEffect(() => { clearImageCacheIfNeeded(); }, []);

  // 체크인 로드 완료 직후 region을 체크인 bounds로 동기화 (onRegionChangeComplete 전에 클러스터 계산이 가능하도록)
  const regionInitialized = useRef(false);
  React.useEffect(() => {
    if (!loading && !regionInitialized.current && checkins.length > 0) {
      regionInitialized.current = true;
      setRegion(buildInitialRegion(checkins));
    }
  }, [loading, checkins]);

  const { clusters, supercluster } = useCheckinClusters(checkins, region);

  useEffect(() => {
    clusters.forEach((cluster) => {
      const photoUrl = cluster.properties.cluster
        ? (supercluster.getLeaves((cluster as ClusterFeature).properties.cluster_id, Infinity) as CheckinFeature[])
            .sort((a, b) => new Date(b.properties.checkin.checked_in_at).getTime() - new Date(a.properties.checkin.checked_in_at).getTime())
            .find((f) => f.properties.checkin.photo_url)?.properties.checkin.photo_url
        : (cluster as CheckinFeature).properties.checkin.photo_url;
      if (photoUrl) Image.prefetch(photoUrl).catch(() => {});
    });
  }, [clusters, supercluster]);

  const visibleCheckins = useMemo(() => {
    const west = region.longitude - region.longitudeDelta / 2;
    const east = region.longitude + region.longitudeDelta / 2;
    const south = region.latitude - region.latitudeDelta / 2;
    const north = region.latitude + region.latitudeDelta / 2;
    return checkins
      .filter((c) => c.longitude >= west && c.longitude <= east && c.latitude >= south && c.latitude <= north)
      .sort((a, b) => new Date(b.checked_in_at).getTime() - new Date(a.checked_in_at).getTime());
  }, [checkins, region]);

  // 초기 지도 범위 설정 (현재 위치 우선, 실패 시 체크인 bounds)
  const initializeMap = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const locRegion: Region = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setRegion(locRegion);
        mapRef.current?.animateToRegion(locRegion, 500);
        return;
      }
    } catch {
      // 권한 거부 또는 타임아웃
    }
    // 현재 위치 실패 시 체크인 bounds
    if (checkins.length > 0) {
      const initialRegion = buildInitialRegion(checkins);
      setRegion(initialRegion);
      mapRef.current?.fitToCoordinates(
        checkins.map(c => ({ latitude: c.latitude, longitude: c.longitude })),
        { edgePadding: { top: 60, right: 60, bottom: 60, left: 60 }, animated: true },
      );
    }
  }, [checkins]);

  const handleMapReady = useCallback(() => {
    mapReadyRef.current = true;
    initializeMap();
  }, [initializeMap]);

  const handleMyLocation = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const loc = await Location.getCurrentPositionAsync({});
    mapRef.current?.animateToRegion({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 500);
  }, []);

  const buildHeaderTitle = useCallback((checkin: Checkin) => {
    const date = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long' })
      .format(new Date(checkin.checked_in_at));
    const tripName = trips.find((t) => t.id === checkin.trip_id)?.title;
    return tripName ? `${date} · ${tripName}` : date;
  }, [trips]);

  const handleMarkerPress = useCallback((checkin: Checkin) => {
    setSelectedCheckins([checkin]);
    setHeaderTitle(buildHeaderTitle(checkin));
    mapRef.current?.animateToRegion({
      latitude: checkin.latitude,
      longitude: checkin.longitude,
      latitudeDelta: region.latitudeDelta,
      longitudeDelta: region.longitudeDelta,
    }, 400);
  }, [region, buildHeaderTitle]);

  const handleClusterPress = useCallback((cluster: ClusterFeature) => {
    const clusterId = cluster.properties.cluster_id;
    const leaves = supercluster.getLeaves(clusterId, Infinity) as CheckinFeature[];
    const clusterCheckins = leaves.map(l => l.properties.checkin);

    setSelectedCheckins(clusterCheckins);

    const latest = [...clusterCheckins].sort(
      (a, b) => new Date(b.checked_in_at).getTime() - new Date(a.checked_in_at).getTime(),
    )[0];
    setHeaderTitle(buildHeaderTitle(latest));

    mapRef.current?.fitToCoordinates(
      clusterCheckins.map(c => ({ latitude: c.latitude, longitude: c.longitude })),
      { edgePadding: { top: 80, right: 80, bottom: 80, left: 80 }, animated: true },
    );
  }, [supercluster, buildHeaderTitle]);

  const handleMapPress = useCallback(() => {
    setSelectedCheckins(null);
    setHeaderTitle(null);
  }, []);

  const handleSheetCollapse = useCallback(() => {
    setSelectedCheckins(null);
    setHeaderTitle(null);
  }, []);

  const handleCheckinPress = useCallback((checkin: Checkin) => {
    navigation.navigate('CheckinDetail', { checkin });
  }, [navigation]);

  // 클러스터 대표 사진 (가장 최근 체크인의 photo_url)
  const getClusterPhoto = useCallback((cluster: ClusterFeature): string | undefined => {
    const clusterId = cluster.properties.cluster_id;
    const leaves = supercluster.getLeaves(clusterId, Infinity) as CheckinFeature[];
    const sorted = [...leaves].sort(
      (a, b) =>
        new Date(b.properties.checkin.checked_in_at).getTime() -
        new Date(a.properties.checkin.checked_in_at).getTime(),
    );
    return sorted.find((f) => f.properties.checkin.photo_url)?.properties.checkin.photo_url;
  }, [supercluster]);

  if (loading && checkins.length === 0) {
    return (
      <View testID="map-loading" style={styles.loading}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        testID="map-view"
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={checkins.length > 0 ? buildInitialRegion(checkins) : SEOUL}
        onMapReady={handleMapReady}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
      >
        {clusters.map((cluster) => {
          const [lng, lat] = cluster.geometry.coordinates;
          const key = cluster.properties.cluster
            ? `cluster-${cluster.properties.cluster_id}`
            : `point-${(cluster as CheckinFeature).properties.checkin.id}`;

          if (cluster.properties.cluster) {
            const c = cluster as ClusterFeature;
            const clusterPhoto = getClusterPhoto(c);
            return (
              <Marker
                key={key}
                coordinate={{ latitude: lat, longitude: lng }}
                onPress={() => handleClusterPress(c)}
                tracksViewChanges={!loadedMarkerKeys.has(key) && !!clusterPhoto}
              >
                <ClusterMarker
                  count={c.properties.point_count}
                  photoUrl={clusterPhoto}
                  onImageLoad={() => handleMarkerImageLoad(key)}
                />
              </Marker>
            );
          }

          const point = cluster as CheckinFeature;
          const checkin = point.properties.checkin;
          const isSelected = selectedCheckins?.some(s => s.id === checkin.id) ?? false;
          return (
            <Marker
              key={key}
              coordinate={{ latitude: lat, longitude: lng }}
              onPress={() => handleMarkerPress(checkin)}
              tracksViewChanges={!loadedMarkerKeys.has(key) && !!checkin.photo_url}
            >
              <CheckinMapMarker
                checkin={checkin}
                selected={isSelected}
                onImageLoad={() => handleMarkerImageLoad(key)}
              />
            </Marker>
          );
        })}
      </MapView>

      <TouchableOpacity style={styles.locationBtn} onPress={handleMyLocation}>
        <Ionicons name="locate-outline" size={22} color="#1F2937" />
      </TouchableOpacity>

      <CheckinMapBottomSheet
        allCheckins={visibleCheckins}
        selectedCheckins={selectedCheckins}
        headerTitle={headerTitle}
        onCheckinPress={handleCheckinPress}
        onCollapse={handleSheetCollapse}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8F0',
  },
  locationBtn: {
    position: 'absolute',
    bottom: Dimensions.get('window').height * 0.45 + 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
});
