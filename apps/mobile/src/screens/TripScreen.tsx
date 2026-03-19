import React, { useState, useCallback, useMemo } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { supabase } from '../lib/supabase';
import { useCheckins } from '../hooks/useCheckins';
import { useTrips } from '../hooks/useTrips';
import CheckinCard from '../components/CheckinCard';
import TripTaglineBanner from '../components/TripTaglineBanner';
import SideDrawer from '../components/SideDrawer';
import TripFormModal from '../components/TripFormModal';
import type { AppStackParamList } from '../navigation/AppNavigator';
import type { Trip, Checkin, TripFormData } from '../../../../packages/shared/src/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ListItem =
  | { type: 'date'; date: string; label: string }
  | { type: 'checkin'; checkin: Checkin };

type NavigationProp = StackNavigationProp<AppStackParamList, 'Trip'>;
type TripRouteProp = RouteProp<AppStackParamList, 'Trip'>;

const MARKER_COLOR = '#3B82F6';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short', day: 'numeric',
  }).format(date);
};

export default function TripScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<TripRouteProp>();
  const [trip, setTrip] = useState<Trip>(route.params.trip);
  const { checkins, loading, error, reload, remove } = useCheckins(trip.id);
  const { trips, reload: reloadTrips, create: createTrip } = useTrips();
  const [refreshing, setRefreshing] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showCreateTripModal, setShowCreateTripModal] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.avatar_url) {
        setAvatarUrl(user.user_metadata.avatar_url);
      }
    });
  }, []);

  // Reload checkins when screen is focused (e.g., after creating a checkin)
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  // Get unique dates from checkins
  const dates = useMemo(() => {
    const dateSet = new Set<string>();
    checkins.forEach(c => {
      const d = new Date(c.checked_in_at);
      dateSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    });
    return Array.from(dateSet).sort();
  }, [checkins]);

  // Filter checkins by selected date and apply sort order
  const filteredCheckins = useMemo(() => {
    const filtered = !selectedDate ? checkins : checkins.filter(c => {
      const d = new Date(c.checked_in_at);
      const cDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return cDate === selectedDate;
    });
    return [...filtered].sort((a, b) => {
      const diff = new Date(b.checked_in_at).getTime() - new Date(a.checked_in_at).getTime();
      return sortOrder === 'newest' ? diff : -diff;
    });
  }, [checkins, selectedDate, sortOrder]);

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

  // Polyline coordinates (sorted by time)
  const polylineCoords = useMemo(() => {
    return [...filteredCheckins]
      .sort((a, b) => new Date(a.checked_in_at).getTime() - new Date(b.checked_in_at).getTime())
      .map(c => ({ latitude: c.latitude, longitude: c.longitude }));
  }, [filteredCheckins]);

  const handleSelectTrip = (t: Trip) => {
    setTrip(t);
    setShowDrawer(false);
    setSelectedDate(null);
  };

  const handleCreateTrip = async (data: TripFormData) => {
    const newTrip = await createTrip(data);
    setTrip(newTrip);
    setShowDrawer(false);
    setShowCreateTripModal(false);
  };

  const handleCheckinDelete = async (id: string) => {
    try {
      await remove(id);
    } catch {
      // error handled in useCheckins
    }
  };

  const renderHeader = () => (
    <View>
      {/* Tagline Banner */}
      <TripTaglineBanner tripId={trip.id} />

      {/* Date Filter */}
      {dates.length > 0 && (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[null, ...dates]}
          keyExtractor={(item) => item ?? 'all'}
          extraData={selectedDate}
          contentContainerStyle={styles.dateFilterContainer}
          renderItem={({ item: date }) => {
            const isActive = date === selectedDate;
            return (
              <TouchableOpacity
                onPress={() => setSelectedDate(date)}
                style={[styles.dateChip, isActive && styles.dateChipActive]}
              >
                <Text style={[styles.dateChipText, isActive && styles.dateChipTextActive]}>
                  {date ? formatDate(date) : '📅 전체'}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={mapRegion}
        >
          {dedupedMarkers.map(({ checkin, index }) => (
            <Marker
              key={checkin.id}
              coordinate={{
                latitude: checkin.latitude,
                longitude: checkin.longitude,
              }}
              title={checkin.title || '체크인'}
              description={checkin.place || undefined}
            >
              <View style={[styles.markerContainer, { backgroundColor: MARKER_COLOR }]}>
                <Text style={styles.markerText}>{index + 1}</Text>
              </View>
            </Marker>
          ))}
          {polylineCoords.length > 1 && (
            <Polyline
              coordinates={polylineCoords}
              strokeColor="#3B82F6"
              strokeWidth={2}
              lineDashPattern={[6, 4]}
            />
          )}
        </MapView>
      </View>

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
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          style={styles.avatarButton}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={{ fontSize: 14 }}>👤</Text>
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
              <Text style={styles.emptyEmoji}>📍</Text>
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

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Home')}
          style={styles.homeButton}
        >
          <Text style={styles.homeIcon}>🏠</Text>
        </TouchableOpacity>

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
          style={styles.fab}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>

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
  dateFilterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  dateChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E0D4',
  },
  dateChipActive: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  dateChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  dateChipTextActive: {
    color: '#FFFFFF',
  },
  mapContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    height: 220,
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
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E0D4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  homeButton: {
    position: 'absolute',
    left: 32,
    bottom: 26,
  },
  homeIcon: {
    fontSize: 24,
  },
  fab: {
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
