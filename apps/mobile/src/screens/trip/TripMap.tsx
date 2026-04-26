import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import type { Trip, Checkin } from '@travel-companion/shared';

const MARKER_COLOR = '#3B82F6';

const MAP_SIZE = Dimensions.get('window').width - 32;

function formatCheckinTime(dateStr: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(dateStr));
}

interface MapCheckinInfoCardProps {
  checkin: Checkin;
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

function MapCheckinInfoCard({ checkin, index, total, onClose, onPrev, onNext }: MapCheckinInfoCardProps) {
  const hasPrev = index > 0;
  const hasNext = index < total - 1;
  return (
    <View style={styles.markerInfoCard}>
      <TouchableOpacity style={styles.markerInfoClose} onPress={onClose}>
        <Ionicons name="close" size={14} color="#FFFFFF" />
      </TouchableOpacity>
      {checkin.photo_url && (
        <Image source={{ uri: checkin.photo_url }} style={styles.markerInfoPhoto} contentFit="cover" />
      )}
      {checkin.title && <Text style={styles.markerInfoTitle}>{checkin.title}</Text>}
      <Text style={styles.markerInfoTime}>{formatCheckinTime(checkin.checked_in_at)}</Text>
      {checkin.place && (
        <View style={styles.markerInfoPlaceRow}>
          <Ionicons name="location-outline" size={11} color="#4285F4" />
          <Text style={styles.markerInfoPlace}> {checkin.place}</Text>
        </View>
      )}
      <View style={styles.markerInfoNav}>
        <TouchableOpacity
          style={[styles.markerInfoNavBtn, !hasPrev && styles.markerInfoNavBtnDisabled]}
          onPress={onPrev}
          disabled={!hasPrev}
        >
          <View style={styles.markerInfoNavBtnInner}>
            <Ionicons name="chevron-back" size={12} color={hasPrev ? '#FFFFFF' : '#9CA3AF'} />
            <Text style={[styles.markerInfoNavBtnText, !hasPrev && styles.markerInfoNavBtnTextDisabled]}>이전</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.markerInfoNavCount}>{index + 1} / {total}</Text>
        <TouchableOpacity
          style={[styles.markerInfoNavBtn, !hasNext && styles.markerInfoNavBtnDisabled]}
          onPress={onNext}
          disabled={!hasNext}
        >
          <View style={styles.markerInfoNavBtnInner}>
            <Text style={[styles.markerInfoNavBtnText, !hasNext && styles.markerInfoNavBtnTextDisabled]}>다음</Text>
            <Ionicons name="chevron-forward" size={12} color={hasNext ? '#FFFFFF' : '#9CA3AF'} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface TripMapProps {
  checkins: Checkin[];
  trip: Trip;
}

export default function TripMap({ checkins, trip }: TripMapProps) {
  const [selectedCheckinId, setSelectedCheckinId] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);
  const mapReadyRef = useRef(false);

  const mapRegion = useMemo(() => {
    if (checkins.length === 0) {
      return {
        latitude: trip.latitude ?? 37.5665,
        longitude: trip.longitude ?? 126.9780,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
    }
    const lats = checkins.map(c => c.latitude);
    const lngs = checkins.map(c => c.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const latDelta = Math.max((maxLat - minLat) * 1.5, 0.01);
    const lngDelta = Math.max((maxLng - minLng) * 1.5, 0.01);
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
  }, [checkins, trip]);

  const sortedCheckins = useMemo(() => {
    return [...checkins].sort(
      (a, b) => new Date(a.checked_in_at).getTime() - new Date(b.checked_in_at).getTime()
    );
  }, [checkins]);

  const selectedCheckin = useMemo(
    () => sortedCheckins.find(c => c.id === selectedCheckinId) ?? null,
    [sortedCheckins, selectedCheckinId]
  );

  const dedupedMarkers = useMemo(() => {
    const map = new Map<string, { checkin: Checkin; index: number }>();
    sortedCheckins.forEach((checkin, index) => {
      const key = `${checkin.latitude.toFixed(5)},${checkin.longitude.toFixed(5)}`;
      const existing = map.get(key);
      if (!existing || index > existing.index) {
        map.set(key, { checkin, index });
      }
    });
    return Array.from(map.values());
  }, [sortedCheckins]);

  useEffect(() => {
    if (mapReadyRef.current && !selectedCheckinId) {
      mapRef.current?.animateToRegion(mapRegion, 500);
    }
  }, [mapRegion, selectedCheckinId]);

  useEffect(() => {
    if (!selectedCheckin) return;
    const timer = setTimeout(() => {
      mapRef.current?.animateToRegion({
        latitude: selectedCheckin.latitude + 0.003,
        longitude: selectedCheckin.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 400);
    }, 100);
    return () => clearTimeout(timer);
  }, [selectedCheckin]);

  const handleMarkerPress = useCallback((checkin: Checkin) => {
    setSelectedCheckinId(checkin.id);
  }, []);

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

  return (
    <View style={styles.mapSection}>
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={mapRegion}
          onMapReady={() => { mapReadyRef.current = true; }}
        >
          {dedupedMarkers.map(({ checkin, index }) => (
            <Marker
              key={checkin.id}
              coordinate={{ latitude: checkin.latitude, longitude: checkin.longitude }}
              onPress={() => handleMarkerPress(checkin)}
            >
              <View style={[styles.markerContainer, { backgroundColor: MARKER_COLOR }]}>
                <Text style={styles.markerText}>{index + 1}</Text>
              </View>
            </Marker>
          ))}
        </MapView>
        <TouchableOpacity style={styles.myLocationButton} onPress={handleMyLocation}>
          <Ionicons name="navigate" size={18} color="#3B82F6" />
        </TouchableOpacity>
        {selectedCheckin && (() => {
          const selectedIndex = sortedCheckins.findIndex(c => c.id === selectedCheckinId);
          return (
            <MapCheckinInfoCard
              checkin={selectedCheckin}
              index={selectedIndex}
              total={sortedCheckins.length}
              onClose={() => setSelectedCheckinId(null)}
              onPrev={() => setSelectedCheckinId(sortedCheckins[selectedIndex - 1].id)}
              onNext={() => setSelectedCheckinId(sortedCheckins[selectedIndex + 1].id)}
            />
          );
        })()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapSection: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  mapContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    height: MAP_SIZE,
    backgroundColor: '#E5E7EB',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  markerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  myLocationButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  markerInfoCard: {
    position: 'absolute',
    left: Math.round(MAP_SIZE * 0.14),
    right: Math.round(MAP_SIZE * 0.14),
    top: 12,
    height: Math.round(MAP_SIZE * 0.65),
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  markerInfoClose: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  markerInfoPhoto: {
    width: '100%',
    height: Math.round(MAP_SIZE * 0.65 * 0.50),
    borderRadius: 6,
    marginBottom: 5,
  },
  markerInfoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 1,
    paddingRight: 20,
  },
  markerInfoTime: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 1,
  },
  markerInfoPlaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  markerInfoPlace: {
    fontSize: 11,
    color: '#4285F4',
  },
  markerInfoNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 5,
    marginTop: 2,
  },
  markerInfoNavBtn: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#4285F4',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerInfoNavBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  markerInfoNavBtnDisabled: {
    backgroundColor: '#E5E7EB',
  },
  markerInfoNavBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  markerInfoNavBtnTextDisabled: {
    color: '#9CA3AF',
  },
  markerInfoNavCount: {
    fontSize: 12,
    color: '#6B7280',
    marginHorizontal: 8,
  },
});
