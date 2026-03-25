import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
  ActivityIndicator,
  Dimensions,
  ActionSheetIOS,
  Alert,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { supabase } from '../lib/supabase';
import { useCheckins } from '../hooks/useCheckins';
import { useTrips } from '../hooks/useTrips';
import { useTripsStore } from '../store/tripsStore';
import CheckinCard from '../components/CheckinCard';
import TripTaglineBanner from '../components/TripTaglineBanner';
import TodayCalendarSection from '../components/TodayCalendarSection';
import SideDrawer from '../components/SideDrawer';
import TripFormModal from '../components/TripFormModal';
import type { TripsStackParamList, RootStackParamList } from '../navigation/AppNavigator';
import type { Trip, Checkin, TripFormData } from '../../../../packages/shared/src/types';


type ListItem =
  | { type: 'date'; date: string; label: string }
  | { type: 'checkin'; checkin: Checkin };

type NavigationProp = CompositeNavigationProp<
  StackNavigationProp<TripsStackParamList, 'Trip'>,
  StackNavigationProp<RootStackParamList>
>;
type TripRouteProp = RouteProp<TripsStackParamList, 'Trip'>;

const MARKER_COLOR = '#3B82F6';
const MAP_SIZE = Dimensions.get('window').width - 32; // mapSection marginHorizontal 16 * 2

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short', day: 'numeric',
  }).format(date);
};

const formatTripDate = (dateStr: string | null | undefined): string | null => {
  if (!dateStr) return null;
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  const date = isDateOnly
    ? (() => { const [y, m, d] = dateStr.split('-').map(Number); return new Date(y, m - 1, d); })()
    : new Date(dateStr);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  }).format(date);
};

const formatCheckinTime = (dateStr: string): string => {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(dateStr));
};

export default function TripScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<TripRouteProp>();
  const insets = useSafeAreaInsets();
  const [selectedTripId, setSelectedTripId] = useState<string>(route.params.trip.id);
  useEffect(() => {
    setSelectedTripId(route.params.trip.id);
  }, [route.params.trip.id]);
  const trip = useTripsStore((s) => s.trips.find((t) => t.id === selectedTripId)) ?? route.params.trip;
  const { checkins, loading, error, reload, remove } = useCheckins(trip.id);
  const { trips, reload: reloadTrips, create: createTrip, update: updateTrip } = useTrips();
  const [refreshing, setRefreshing] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showCreateTripModal, setShowCreateTripModal] = useState(false);
  const [showEditTripModal, setShowEditTripModal] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [selectedCheckinId, setSelectedCheckinId] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);
  const mapReadyRef = useRef(false);


  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.avatar_url) {
        setAvatarUrl(user.user_metadata.avatar_url);
      }
    });
  }, []);



  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  // Sort checkins by sort order
  const filteredCheckins = useMemo(() => {
    return [...checkins].sort((a, b) => {
      const diff = new Date(b.checked_in_at).getTime() - new Date(a.checked_in_at).getTime();
      return sortOrder === 'newest' ? diff : -diff;
    });
  }, [checkins, sortOrder]);

  // Group checkins by date for date separators
  const groupedData = useMemo((): ListItem[] => {
    const result: ListItem[] = [];
    let lastDate = '';
    filteredCheckins.forEach(checkin => {
      const d = new Date(checkin.checked_in_at);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (dateKey !== lastDate) {
        lastDate = dateKey;
        const label = new Intl.DateTimeFormat('ko-KR', {
          year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
        }).format(d);
        result.push({ type: 'date', date: dateKey, label });
      }
      result.push({ type: 'checkin', checkin });
    });
    return result;
  }, [filteredCheckins]);

  // Map region
  const mapRegion = useMemo(() => {
    if (filteredCheckins.length === 0) {
      return {
        latitude: trip.latitude ?? 37.5665,
        longitude: trip.longitude ?? 126.9780,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
    }
    const lats = filteredCheckins.map(c => c.latitude);
    const lngs = filteredCheckins.map(c => c.longitude);
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
  }, [filteredCheckins, trip]);

  const sortedCheckins = useMemo(() => {
    return [...checkins].sort(
      (a, b) => new Date(a.checked_in_at).getTime() - new Date(b.checked_in_at).getTime()
    );
  }, [checkins]);

  const selectedCheckin = useMemo(
    () => sortedCheckins.find(c => c.id === selectedCheckinId) ?? null,
    [sortedCheckins, selectedCheckinId]
  );

  // checkins 로드 시 지도 영역 맞춤 (팝업이 열려 있지 않을 때만)
  useEffect(() => {
    if (mapReadyRef.current && !selectedCheckinId) {
      mapRef.current?.animateToRegion(mapRegion, 500);
    }
  }, [mapRegion]);

  // 마커 선택 시 지도 애니메이션
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

  // 시간순(오래된 것 = 1번)으로 번호를 매기고, 같은 좌표에 여러 마커가 겹치면 가장 큰 번호만 표시
  const dedupedMarkers = useMemo(() => {
    const sorted = [...filteredCheckins].sort(
      (a, b) => new Date(a.checked_in_at).getTime() - new Date(b.checked_in_at).getTime()
    );
    const map = new Map<string, { checkin: typeof filteredCheckins[0]; index: number }>();
    sorted.forEach((checkin, index) => {
      const key = `${checkin.latitude.toFixed(5)},${checkin.longitude.toFixed(5)}`;
      const existing = map.get(key);
      if (!existing || index > existing.index) {
        map.set(key, { checkin, index });
      }
    });
    return Array.from(map.values());
  }, [filteredCheckins]);

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

  const handleSelectTrip = (t: Trip) => {
    setSelectedTripId(t.id);
    setShowDrawer(false);
  };

  const handleCreateTrip = async (data: TripFormData) => {
    const newTrip = await createTrip(data);
    setSelectedTripId(newTrip.id);
    setShowDrawer(false);
    setShowCreateTripModal(false);
  };

  const handleTripOptions = useCallback(() => {
    const publicLabel = trip.is_public ? '비공개로 전환' : '공개로 전환';
    const frequentLabel = trip.is_frequent ? '자주 가는 곳에서 제거' : '자주 가는 곳 추가';
    const options = ['여행 수정', publicLabel, frequentLabel, '취소'];
    const cancelIndex = options.length - 1;

    const handleSelect = async (index: number) => {
      if (index === cancelIndex) return;
      if (index === 0) {
        setShowEditTripModal(true);
      } else if (index === 1) {
        await updateTrip(trip.id, { is_public: !trip.is_public });
      } else if (index === 2) {
        await updateTrip(trip.id, { is_frequent: !trip.is_frequent });
      }
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: cancelIndex },
        (index) => { handleSelect(index); },
      );
    } else {
      Alert.alert('여행 설정', undefined, [
        { text: '여행 수정', onPress: () => handleSelect(0) },
        { text: publicLabel, onPress: () => handleSelect(1) },
        { text: frequentLabel, onPress: () => handleSelect(2) },
        { text: '취소', style: 'cancel' },
      ]);
    }
  }, [trip, updateTrip]);

  const handleEditTrip = async (data: TripFormData) => {
    await updateTrip(trip.id, data);
    setShowEditTripModal(false);
  };

  const handleCheckinDelete = async (id: string) => {
    try {
      await remove(id);
    } catch {
      // error handled in useCheckins
    }
  };

  const renderHeader = () => {
    const earliest = checkins.length > 0
      ? [...checkins].sort((a, b) => new Date(a.checked_in_at).getTime() - new Date(b.checked_in_at).getTime())[0]
      : null;
    const startSrc = trip.start_date || earliest?.checked_in_at || null;
    const endSrc = trip.end_date || null;
    const hasPlace = !!trip.place;
    const hasTripInfo = !!(trip.description || startSrc || hasPlace);

    return (
    <View>
      {/* Trip Info */}
      {hasTripInfo && (
        <View style={styles.tripInfoCard}>
          {trip.description && (
            <Text style={styles.tripDescription}>{trip.description}</Text>
          )}
          {startSrc && (
            <View style={styles.tripMetaRow}>
              <Ionicons name="calendar-outline" size={12} color="#F97316" />
              <Text style={styles.tripMeta}>
                {' '}{formatTripDate(startSrc)}
                {endSrc && endSrc !== trip.start_date ? ` ~ ${formatTripDate(endSrc)}` : ''}
              </Text>
            </View>
          )}
          {hasPlace && (
            <View style={styles.tripMetaRow}>
              <Ionicons name="location-outline" size={12} color="#6B7280" />
              <Text style={styles.tripMeta}> {trip.place}</Text>
            </View>
          )}
        </View>
      )}

      {/* Tagline */}
      <TripTaglineBanner tripId={trip.id} />

      {/* Map */}
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
                coordinate={{
                  latitude: checkin.latitude,
                  longitude: checkin.longitude,
                }}
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
          {(() => {
            if (!selectedCheckin) return null;
            const selectedIndex = sortedCheckins.findIndex(c => c.id === selectedCheckinId);
            const hasPrev = selectedIndex > 0;
            const hasNext = selectedIndex < sortedCheckins.length - 1;
            return (
              <View style={styles.markerInfoCard}>
                <TouchableOpacity style={styles.markerInfoClose} onPress={() => setSelectedCheckinId(null)}>
                  <Ionicons name="close" size={14} color="#FFFFFF" />
                </TouchableOpacity>
                {selectedCheckin.photo_url && (
                  <Image
                    source={{ uri: selectedCheckin.photo_url }}
                    style={styles.markerInfoPhoto}
                    resizeMode="cover"
                  />
                )}
                {selectedCheckin.title && (
                  <Text style={styles.markerInfoTitle}>{selectedCheckin.title}</Text>
                )}
                <Text style={styles.markerInfoTime}>{formatCheckinTime(selectedCheckin.checked_in_at)}</Text>
                {selectedCheckin.place && (
                  <View style={styles.markerInfoPlaceRow}>
                    <Ionicons name="location-outline" size={11} color="#4285F4" />
                    <Text style={styles.markerInfoPlace}> {selectedCheckin.place}</Text>
                  </View>
                )}
                <View style={styles.markerInfoNav}>
                  <TouchableOpacity
                    style={[styles.markerInfoNavBtn, !hasPrev && styles.markerInfoNavBtnDisabled]}
                    onPress={() => hasPrev && setSelectedCheckinId(sortedCheckins[selectedIndex - 1].id)}
                    disabled={!hasPrev}
                  >
                    <View style={styles.markerInfoNavBtnInner}>
                      <Ionicons name="chevron-back" size={12} color={hasPrev ? '#FFFFFF' : '#9CA3AF'} />
                      <Text style={[styles.markerInfoNavBtnText, !hasPrev && styles.markerInfoNavBtnTextDisabled]}>이전</Text>
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.markerInfoNavCount}>{selectedIndex + 1} / {sortedCheckins.length}</Text>
                  <TouchableOpacity
                    style={[styles.markerInfoNavBtn, !hasNext && styles.markerInfoNavBtnDisabled]}
                    onPress={() => hasNext && setSelectedCheckinId(sortedCheckins[selectedIndex + 1].id)}
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
          })()}
        </View>
      </View>

      {/* Today Calendar */}
      <TodayCalendarSection tripEndDate={trip.end_date ?? undefined} />

      {/* Checkin Count Header */}
      <View style={styles.checkinHeader}>
        <Text style={styles.checkinCount}>기록 {filteredCheckins.length}곳</Text>
        <TouchableOpacity
          onPress={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
          style={styles.sortButton}
        >
          <Text style={styles.sortLabel}>{sortOrder === 'newest' ? '최신순 ↓' : '오래된순 ↑'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => setShowDrawer(true)}
          style={styles.hamburger}
        >
          <Text style={styles.hamburgerText}>≡</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{trip.title}</Text>
        <TouchableOpacity onPress={handleTripOptions} style={styles.optionsButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#6B7280" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          style={styles.avatarButton}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person-outline" size={16} color="#9CA3AF" />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={groupedData}
          keyExtractor={(item) => item.type === 'date' ? `date-${item.date}` : item.checkin.id}
          renderItem={({ item }) => {
            if (item.type === 'date') {
              return (
                <View style={styles.dateSeparator}>
                  <View style={styles.dateDot} />
                  <Text style={styles.dateLabel}>{item.label}</Text>
                  <View style={styles.dateLine} />
                </View>
              );
            }
            return (
              <CheckinCard
                checkin={item.checkin}
                onEdit={(checkin) => navigation.navigate('CheckinForm', {
                  tripId: trip.id,
                  tripTitle: trip.title,
                  checkin,
                })}
                onDelete={handleCheckinDelete}
              />
            );
          }}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="location-outline" size={48} color="#C4B49A" />
              <Text style={styles.emptyText}>아직 체크인이 없습니다</Text>
              <Text style={styles.emptySubtext}>+ 버튼을 눌러 첫 체크인을 해보세요</Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        onPress={() => navigation.navigate('CheckinForm', {
          tripId: trip.id,
          tripTitle: trip.title,
          initialLatitude: trip.latitude ?? undefined,
          initialLongitude: trip.longitude ?? undefined,
          initialPlace: trip.place ?? undefined,
          initialPlaceId: trip.place_id ?? undefined,
        })}
        style={[styles.fab, { bottom: insets.bottom + 16 }]}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Side Drawer */}
      <SideDrawer
        visible={showDrawer}
        onClose={() => setShowDrawer(false)}
        trips={trips}
        currentTripId={trip.id}
        onSelectTrip={handleSelectTrip}
        onCreateTrip={() => {
          setShowDrawer(false);
          setShowCreateTripModal(true);
        }}
      />

      {/* Create Trip Modal */}
      <TripFormModal
        visible={showCreateTripModal}
        onClose={() => setShowCreateTripModal(false)}
        onSubmit={handleCreateTrip}
      />

      {/* Edit Trip Modal */}
      <TripFormModal
        visible={showEditTripModal}
        onClose={() => setShowEditTripModal(false)}
        onSubmit={handleEditTrip}
        mode="edit"
        initialTrip={trip}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  hamburger: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hamburgerText: {
    fontSize: 24,
    color: '#1F2937',
    fontWeight: '700',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  optionsButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F0EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripInfoCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B47',
    shadowColor: '#2D2416',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  tripDescription: {
    fontSize: 14,
    color: '#3D2B1F',
    marginBottom: 4,
  },
  tripMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  tripMeta: {
    fontSize: 12,
    color: '#8B7355',
  },
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
  markerInfoPlaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
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
  map: {
    flex: 1,
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
  checkinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  checkinCount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#F5EEE6',
  },
  sortLabel: {
    fontSize: 12,
    color: '#8B7355',
    fontWeight: '600',
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
  },
  dateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F97316',
    flexShrink: 0,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8E0D4',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 40,
    gap: 0,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4B5563',
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 30,
  },
});
