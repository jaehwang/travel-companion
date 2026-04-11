import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
  Linking,
  Modal,
  ScrollView,
  Pressable,
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
import { CATEGORY_META } from '../utils/categoryIcons';
import type { CheckinsStackParamList, MainTabParamList, RootStackParamList } from '../navigation/AppNavigator';
import type { Checkin, Trip } from '@travel-companion/shared';

type NavigationProp = CompositeNavigationProp<
  StackNavigationProp<CheckinsStackParamList, 'Checkins'>,
  CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList>,
    StackNavigationProp<RootStackParamList>
  >
>;

// 카드 너비: 좌우 패딩 16씩 + 카드 사이 간격 8
const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - 16 * 2 - 8) / 2;

type CheckinPair = [Checkin, Checkin | null];

interface Section {
  title: string;
  data: CheckinPair[];
}

type Filter = 'normal' | 'frequent';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const dow = DAY_LABELS[d.getDay()];
  const time = new Intl.DateTimeFormat('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
  return `${month}/${day}(${dow}) ${time}`;
}

function formatMonthSection(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

interface CheckinGridCardProps {
  checkin: Checkin;
  tripMap: Map<string, Trip>;
  onPress: (checkin: Checkin, trip: Trip | undefined) => void;
  onLongPress: (checkin: Checkin) => void;
  onEdit: (checkin: Checkin) => void;
  onDelete: (checkinId: string) => void;
}

function CheckinGridCard({ checkin, tripMap, onPress, onLongPress, onEdit, onDelete }: CheckinGridCardProps) {
  const trip = tripMap.get(checkin.trip_id);
  const isUnassigned = trip === undefined;
  const meta = CATEGORY_META[checkin.category ?? 'other'] ?? CATEGORY_META.other;

  const handleMenuPress = () => {
    Alert.alert('', '', [
      { text: '수정', onPress: () => onEdit(checkin) },
      {
        text: '삭제', style: 'destructive', onPress: () => {
          Alert.alert('삭제 확인', '이 체크인을 삭제하시겠습니까?', [
            { text: '취소', style: 'cancel' },
            { text: '삭제', style: 'destructive', onPress: () => onDelete(checkin.id) },
          ]);
        },
      },
      { text: '취소', style: 'cancel' },
    ]);
  };

  return (
    <TouchableOpacity
      testID={isUnassigned ? 'checkin-card-unassigned' : `checkin-card-${checkin.id}`}
      style={styles.card}
      onPress={() => onPress(checkin, trip)}
      onLongPress={() => onLongPress(checkin)}
      activeOpacity={0.75}
    >
      {isUnassigned && (
        <View testID="badge-unassigned" style={styles.unassignedBadge}>
          <Text style={styles.unassignedBadgeText}>미할당</Text>
        </View>
      )}
      <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
        <Text style={styles.menuButtonText}>⋮</Text>
      </TouchableOpacity>
      {checkin.photo_url ? (
        <Image source={{ uri: checkin.photo_url }} style={styles.cardPhoto} resizeMode="cover" />
      ) : (
        <View style={[styles.cardPhotoPlaceholder, { backgroundColor: `${meta.color}15` }]}>
          <Ionicons name={meta.icon} size={28} color={meta.color} />
        </View>
      )}

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {checkin.title || '이름 없는 장소'}
        </Text>
        {trip && (
          <Text style={styles.cardTrip} numberOfLines={1}>{trip.title}</Text>
        )}
        <TouchableOpacity
          onPress={() => {
            const url = checkin.place_id
              ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(checkin.place || '')}&query_place_id=${checkin.place_id}`
              : `https://www.google.com/maps?q=${checkin.latitude},${checkin.longitude}`;
            Linking.openURL(url);
          }}
          activeOpacity={0.6}
        >
          <Text style={styles.cardPlace} numberOfLines={1}>
            <Ionicons name="location-outline" size={10} color="#C4B49A" />
            {' '}{checkin.place || '지도에서 보기'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.cardDate} numberOfLines={1}>{formatDateTime(checkin.checked_in_at)}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function CheckinsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [filter, setFilter] = useState<Filter>('normal');
  const [refreshing, setRefreshing] = useState(false);
  const [moveModalCheckin, setMoveModalCheckin] = useState<Checkin | null>(null);

  const { checkins, loading, error, reload } = useAllCheckins();
  const { trips } = useTrips();
  const updateCheckin = useCheckinsStore((s: any) => s.updateCheckin);
  const removeCheckin = useCheckinsStore((s: any) => s.removeCheckin);

  const tripMap = useMemo(() => {
    const map = new Map<string, Trip>();
    trips.forEach(t => map.set(t.id, t));
    return map;
  }, [trips]);

  const filteredCheckins = useMemo(() => {
    if (filter === 'frequent') {
      const frequentTripIds = new Set(trips.filter(t => t.is_frequent).map(t => t.id));
      return checkins
        .filter(c => frequentTripIds.has(c.trip_id))
        .sort((a, b) => new Date(b.checked_in_at).getTime() - new Date(a.checked_in_at).getTime());
    }
    // 일반: non-frequent 여행 + tripMap에 없는 미할당 체크인
    const normalTripIds = new Set(trips.filter(t => !t.is_frequent).map(t => t.id));
    return checkins
      .filter(c => normalTripIds.has(c.trip_id) || !tripMap.has(c.trip_id))
      .sort((a, b) => new Date(b.checked_in_at).getTime() - new Date(a.checked_in_at).getTime());
  }, [checkins, trips, tripMap, filter]);

  const sections = useMemo((): Section[] => {
    const monthMap = new Map<string, Checkin[]>();
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  const handleCheckinPress = useCallback((checkin: Checkin, trip: Trip | undefined) => {
    if (!trip) return;
    navigation.navigate('TripsTab', {
      screen: 'Trip',
      params: { trip },
    });
  }, [navigation]);

  const assignableTrips = useMemo(
    () => trips.filter((t) => !(t as any).is_default),
    [trips]
  );

  const handleCheckinEdit = useCallback((checkin: Checkin) => {
    const trip = tripMap.get(checkin.trip_id);
    navigation.navigate('CheckinForm', {
      tripId: checkin.trip_id,
      tripTitle: trip?.title,
      checkin,
    });
  }, [navigation, tripMap]);

  const handleCheckinDelete = useCallback(async (checkinId: string) => {
    try {
      await removeCheckin(checkinId);
    } catch {
      Alert.alert('오류', '체크인 삭제에 실패했습니다.');
    }
  }, [removeCheckin]);

  const handleCheckinLongPress = useCallback((checkin: Checkin) => {
    setMoveModalCheckin(checkin);
  }, []);

  const handleMoveToTrip = useCallback(async (tripId: string) => {
    if (!moveModalCheckin) return;
    setMoveModalCheckin(null);
    await updateCheckin(moveModalCheckin.id, { trip_id: tripId });
    reload();
  }, [moveModalCheckin, updateCheckin, reload]);

  const renderSectionHeader = useCallback(({ section }: { section: Section }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
    </View>
  ), []);

  const renderItem = useCallback(({ item }: { item: CheckinPair }) => {
    const [left, right] = item;
    return (
      <View style={styles.row}>
        <CheckinGridCard checkin={left} tripMap={tripMap} onPress={handleCheckinPress} onLongPress={handleCheckinLongPress} onEdit={handleCheckinEdit} onDelete={handleCheckinDelete} />
        {right ? (
          <CheckinGridCard checkin={right} tripMap={tripMap} onPress={handleCheckinPress} onLongPress={handleCheckinLongPress} onEdit={handleCheckinEdit} onDelete={handleCheckinDelete} />
        ) : (
          <View style={styles.cardPlaceholder} />
        )}
      </View>
    );
  }, [tripMap, handleCheckinPress, handleCheckinLongPress, handleCheckinEdit, handleCheckinDelete]);

  return (
    <SafeAreaView testID="screen-checkins" style={styles.container} edges={['top']}>
      <Modal
        visible={moveModalCheckin !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setMoveModalCheckin(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setMoveModalCheckin(null)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>여행으로 이동</Text>
              <TouchableOpacity
                testID="move-modal-close"
                onPress={() => setMoveModalCheckin(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList} bounces={false}>
              {assignableTrips.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  testID={`move-modal-trip-${t.id}`}
                  style={styles.modalItem}
                  onPress={() => handleMoveToTrip(t.id)}
                >
                  <Text style={styles.modalItemText}>{t.title}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#C4B49A" />
                </TouchableOpacity>
              ))}
              {assignableTrips.length === 0 && (
                <Text style={styles.modalEmptyText}>이동할 수 있는 여행이 없습니다</Text>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardPlaceholder: {
    width: CARD_WIDTH,
  },
  cardPhoto: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
  },
  cardPhotoPlaceholder: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: 10,
    gap: 2,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    lineHeight: 18,
  },
  cardTrip: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F97316',
    marginTop: 2,
  },
  cardPlace: {
    fontSize: 11,
    color: '#C4B49A',
    marginTop: 2,
  },
  cardDate: {
    fontSize: 10,
    color: '#C4B49A',
    marginTop: 2,
  },
  listContent: {
    paddingBottom: 24,
  },
  unassignedBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    zIndex: 2,
    backgroundColor: '#F97316',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  unassignedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  menuButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.30)',
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  menuButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 15,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSheet: {
    width: SCREEN_WIDTH - 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalList: {
    flexGrow: 0,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  modalItemText: {
    fontSize: 15,
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  modalEmptyText: {
    padding: 24,
    textAlign: 'center',
    fontSize: 14,
    color: '#9CA3AF',
  },
});
