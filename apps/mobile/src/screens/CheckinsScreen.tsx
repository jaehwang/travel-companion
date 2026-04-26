import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAllCheckins } from '../hooks/useAllCheckins';
import { useTrips } from '../hooks/useTrips';
import { useCheckinsStore } from '../store/checkinsStore';
import type { CheckinsStackParamList, MainTabParamList, RootStackParamList } from '../navigation/AppNavigator';
import type { Checkin, Trip } from '@travel-companion/shared';
import { CheckinGridCard, CARD_WIDTH } from './checkins/CheckinGridCard';
import { MoveCheckinModal } from './checkins/MoveCheckinModal';

type NavigationProp = CompositeNavigationProp<
  StackNavigationProp<CheckinsStackParamList, 'Checkins'>,
  CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList>,
    StackNavigationProp<RootStackParamList>
  >
>;

type CheckinPair = [Checkin, Checkin | null];

interface Section {
  title: string;
  data: CheckinPair[];
}

type Filter = 'normal' | 'frequent';

interface CheckinsDataProps {
  filter: Filter;
  selectedTag: string | null;
  checkins: ReturnType<typeof import('../hooks/useAllCheckins').useAllCheckins>['checkins'];
  trips: Trip[];
  setRefreshing: (v: boolean) => void;
  navigation: NavigationProp;
  updateCheckin: (id: string, data: Partial<any>) => Promise<void>;
  removeCheckin: (id: string) => Promise<void>;
  reload: () => Promise<void>;
  moveModalCheckin: Checkin | null;
  setMoveModalCheckin: (c: Checkin | null) => void;
}

function useCheckinsData({
  filter, selectedTag, checkins, trips, setRefreshing,
  navigation, updateCheckin, removeCheckin, reload, moveModalCheckin, setMoveModalCheckin,
}: CheckinsDataProps) {
  const tripMap = useMemo(() => {
    const map = new Map<string, Trip>();
    trips.forEach(t => map.set(t.id, t));
    return map;
  }, [trips]);

  const popularTags = useMemo(() => {
    const counts = new Map<string, number>();
    checkins.forEach(c => {
      c.tags?.forEach(tag => counts.set(tag, (counts.get(tag) ?? 0) + 1));
    });
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);
  }, [checkins]);

  const filteredCheckins = useMemo(() => {
    if (filter === 'frequent') {
      const frequentTripIds = new Set(trips.filter(t => t.is_frequent).map(t => t.id));
      return checkins
        .filter(c => frequentTripIds.has(c.trip_id))
        .filter(c => !selectedTag || c.tags?.includes(selectedTag))
        .sort((a, b) => new Date(b.checked_in_at).getTime() - new Date(a.checked_in_at).getTime());
    }
    const normalTripIds = new Set(trips.filter(t => !t.is_frequent).map(t => t.id));
    return checkins
      .filter(c => normalTripIds.has(c.trip_id) || !tripMap.has(c.trip_id))
      .filter(c => !selectedTag || c.tags?.includes(selectedTag))
      .sort((a, b) => new Date(b.checked_in_at).getTime() - new Date(a.checked_in_at).getTime());
  }, [checkins, trips, tripMap, filter, selectedTag]);

  const sections = useMemo((): Section[] => {
    const monthMap = new Map<string, import('@travel-companion/shared').Checkin[]>();
    filteredCheckins.forEach(c => {
      const key = getMonthKey(c.checked_in_at);
      const arr = monthMap.get(key) ?? [];
      arr.push(c);
      monthMap.set(key, arr);
    });
    return Array.from(monthMap.entries()).map(([, items]) => ({
      title: formatMonthSection(items[0].checked_in_at),
      data: items.reduce<CheckinPair[]>((acc, item, i) => {
        if (i % 2 === 0) acc.push([item, items[i + 1] ?? null]);
        return acc;
      }, []),
    }));
  }, [filteredCheckins]);

  const assignableTrips = useMemo(() => trips.filter((t) => !(t as any).is_default), [trips]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload, setRefreshing]);

  const handleCheckinPress = useCallback((checkin: import('@travel-companion/shared').Checkin, trip: Trip | undefined) => {
    if (!trip) return;
    navigation.navigate('TripsTab', { screen: 'Trip', params: { trip, scrollToCheckinId: checkin.id } });
  }, [navigation]);

  const handleCheckinEdit = useCallback((checkin: import('@travel-companion/shared').Checkin) => {
    const trip = tripMap.get(checkin.trip_id);
    navigation.navigate('CheckinForm', { tripId: checkin.trip_id, tripTitle: trip?.title, checkin });
  }, [navigation, tripMap]);

  const handleCheckinDelete = useCallback(async (checkinId: string) => {
    try {
      await removeCheckin(checkinId);
    } catch {
      Alert.alert('오류', '체크인 삭제에 실패했습니다.');
    }
  }, [removeCheckin]);

  const handleMoveToTrip = useCallback(async (tripId: string) => {
    if (!moveModalCheckin) return;
    setMoveModalCheckin(null);
    await updateCheckin(moveModalCheckin.id, { trip_id: tripId });
    reload();
  }, [moveModalCheckin, updateCheckin, reload, setMoveModalCheckin]);

  const renderSectionHeader = useCallback(({ section }: { section: Section }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
    </View>
  ), []);

  const renderItem = useCallback(({ item }: { item: CheckinPair }) => {
    const [left, right] = item;
    return (
      <View style={styles.row}>
        <CheckinGridCard checkin={left} tripMap={tripMap} onPress={handleCheckinPress} onLongPress={setMoveModalCheckin} onEdit={handleCheckinEdit} onDelete={handleCheckinDelete} />
        {right ? (
          <CheckinGridCard checkin={right} tripMap={tripMap} onPress={handleCheckinPress} onLongPress={setMoveModalCheckin} onEdit={handleCheckinEdit} onDelete={handleCheckinDelete} />
        ) : (
          <View style={styles.cardPlaceholder} />
        )}
      </View>
    );
  }, [tripMap, handleCheckinPress, setMoveModalCheckin, handleCheckinEdit, handleCheckinDelete]);

  return {
    popularTags, sections, assignableTrips,
    onRefresh, handleMoveToTrip, renderSectionHeader, renderItem,
  };
}

function formatMonthSection(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function CheckinsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [filter, setFilter] = useState<Filter>('normal');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [moveModalCheckin, setMoveModalCheckin] = useState<Checkin | null>(null);

  const { checkins, loading, error, reload } = useAllCheckins();
  const { trips } = useTrips();
  const updateCheckin = useCheckinsStore((s: any) => s.updateCheckin);
  const removeCheckin = useCheckinsStore((s: any) => s.removeCheckin);

  const {
    popularTags, sections, assignableTrips,
    onRefresh, handleMoveToTrip, renderSectionHeader, renderItem,
  } = useCheckinsData({
    filter, selectedTag, checkins, trips, setRefreshing,
    navigation, updateCheckin, removeCheckin, reload, moveModalCheckin, setMoveModalCheckin,
  });

  return (
    <SafeAreaView testID="screen-checkins" style={styles.container} edges={['top']}>
      <MoveCheckinModal
        visible={moveModalCheckin !== null}
        assignableTrips={assignableTrips}
        onClose={() => setMoveModalCheckin(null)}
        onMoveToTrip={handleMoveToTrip}
      />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>체크인</Text>
      </View>

      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentTab, filter === 'normal' && styles.segmentTabActive]}
          onPress={() => setFilter('normal')}
        >
          <Text style={[styles.segmentText, filter === 'normal' && styles.segmentTextActive]}>일반</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentTab, filter === 'frequent' && styles.segmentTabActive]}
          onPress={() => setFilter('frequent')}
        >
          <Text style={[styles.segmentText, filter === 'frequent' && styles.segmentTextActive]}>자주 가는 곳</Text>
        </TouchableOpacity>
      </View>

      {popularTags.length > 0 && (
        <View style={styles.tagFilterWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagFilterContent}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity
              style={[styles.tagFilterChip, !selectedTag && styles.tagFilterChipActive]}
              onPress={() => setSelectedTag(null)}
              testID="tag-filter-all"
            >
              <Text style={[styles.tagFilterChipText, !selectedTag && styles.tagFilterChipTextActive]}>전체</Text>
            </TouchableOpacity>
            {popularTags.map(tag => (
              <TouchableOpacity
                key={tag}
                style={[styles.tagFilterChip, selectedTag === tag && styles.tagFilterChipActive]}
                onPress={() => setSelectedTag(prev => prev === tag ? null : tag)}
                testID={`tag-filter-${tag}`}
              >
                <Text style={[styles.tagFilterChipText, selectedTag === tag && styles.tagFilterChipTextActive]}>#{tag}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={reload} style={styles.retryButton}>
            <Text style={styles.retryText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => `${item[0].id}-${item[1]?.id ?? 'empty'}`}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="location-outline" size={48} color="#C4B49A" />
              <Text style={styles.emptyText}>체크인 기록이 없습니다</Text>
              <Text style={styles.emptySubtext}>여행에서 체크인해보세요</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  tagFilterWrapper: {
    height: 34,
    marginBottom: 8,
  },
  tagFilterContent: {
    paddingHorizontal: 16,
    gap: 6,
  },
  tagFilterChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F3F0EB',
  },
  tagFilterChipActive: {
    backgroundColor: '#F97316',
  },
  tagFilterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B7355',
  },
  tagFilterChipTextActive: {
    color: '#FFFFFF',
  },
  segmentContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: '#F3F0EB',
    borderRadius: 10,
    padding: 3,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  segmentTextActive: {
    color: '#1F2937',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.2,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  cardPlaceholder: {
    width: CARD_WIDTH,
  },
  listContent: {
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#F97316',
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
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
});
