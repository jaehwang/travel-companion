import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { searchTrips, searchCheckins } from '../lib/api';
import { useTripsStore } from '../store/tripsStore';
import { CATEGORY_META } from '../utils/categoryIcons';
import type { Trip, Checkin } from '@travel-companion/shared';
import type { MainTabParamList, RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  StackNavigationProp<RootStackParamList>
>;

type SearchItem =
  | { type: 'trip'; data: Trip }
  | { type: 'checkin'; data: Checkin; tripTitle: string };

function formatDateRange(start?: string | null, end?: string | null): string {
  if (!start) return '';
  const fmt = (s: string) => {
    const d = new Date(s);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };
  if (!end || end === start) return fmt(start);
  return `${fmt(start)} ~ ${fmt(end)}`;
}

function interleave(trips: Trip[], checkins: Checkin[], tripsStore: Trip[]): SearchItem[] {
  const result: SearchItem[] = [];
  const maxLen = Math.max(trips.length, checkins.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < trips.length) {
      result.push({ type: 'trip', data: trips[i] });
    }
    if (i < checkins.length) {
      const checkin = checkins[i];
      const tripTitle = tripsStore.find(t => t.id === checkin.trip_id)?.title ?? '';
      result.push({ type: 'checkin', data: checkin, tripTitle });
    }
  }
  return result;
}

function TripRow({ trip, onPress }: { trip: Trip; onPress: () => void }) {
  const dateRange = formatDateRange(trip.start_date, trip.end_date);
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7} testID={`search-trip-${trip.id}`}>
      <View style={styles.iconWrap}>
        <Ionicons name="airplane-outline" size={18} color="#F97316" />
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTitleRow}>
          <Text style={styles.rowTitle} numberOfLines={1}>{trip.title}</Text>
          <View style={[styles.badge, styles.tripBadge]}>
            <Text style={styles.tripBadgeText}>여행</Text>
          </View>
        </View>
        {dateRange ? (
          <Text style={styles.rowSub} numberOfLines={1}>{dateRange}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

function CheckinRow({ checkin, tripTitle, onPress }: { checkin: Checkin; tripTitle: string; onPress: () => void }) {
  const meta = CATEGORY_META[checkin.category ?? 'other'] ?? CATEGORY_META.other;
  const sub = [checkin.place, tripTitle].filter(Boolean).join(' · ');
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7} testID={`search-checkin-${checkin.id}`}>
      <View style={[styles.iconWrap, { backgroundColor: `${meta.color}18` }]}>
        <Ionicons name={meta.icon} size={18} color={meta.color} />
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTitleRow}>
          <Text style={styles.rowTitle} numberOfLines={1}>{checkin.title || '이름 없는 장소'}</Text>
          <View style={[styles.badge, styles.checkinBadge]}>
            <Text style={styles.checkinBadgeText}>체크인</Text>
          </View>
        </View>
        {sub ? (
          <Text style={styles.rowSub} numberOfLines={1}>{sub}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export default function SearchScreen() {
  const navigation = useNavigation<NavigationProp>();
  const trips = useTripsStore((s) => s.trips);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  // 탭 포커스 시 검색창 자동 포커스
  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }, [])
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const [foundTrips, foundCheckins] = await Promise.all([
          searchTrips(query.trim()),
          searchCheckins(query.trim()),
        ]);
        setResults(interleave(foundTrips, foundCheckins, trips));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, trips]);

  const handleTripPress = useCallback((trip: Trip) => {
    navigation.navigate('TripsTab', {
      screen: 'Trip',
      params: { trip },
    });
  }, [navigation]);

  const handleCheckinPress = useCallback((checkin: Checkin) => {
    const trip = trips.find(t => t.id === checkin.trip_id);
    if (!trip) return;
    navigation.navigate('TripsTab', {
      screen: 'Trip',
      params: { trip, scrollToCheckinId: checkin.id },
    });
  }, [navigation, trips]);

  const renderItem = useCallback(({ item }: { item: SearchItem }) => {
    if (item.type === 'trip') {
      return <TripRow trip={item.data} onPress={() => handleTripPress(item.data)} />;
    }
    return (
      <CheckinRow
        checkin={item.data}
        tripTitle={item.tripTitle}
        onPress={() => handleCheckinPress(item.data)}
      />
    );
  }, [handleTripPress, handleCheckinPress]);

  const isIdle = query.trim().length < 2;

  return (
    <SafeAreaView style={styles.container} edges={['top']} testID="screen-search">
      {/* 검색 헤더 */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={17} color="#9CA3AF" />
          <TextInput
            ref={inputRef}
            testID="input-search"
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="여행·체크인 검색"
            placeholderTextColor="#9CA3AF"
            returnKeyType="search"
            autoCorrect={false}
            autoComplete="off"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={17} color="#C4B49A" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 결과 영역 */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      ) : isIdle ? (
        <View style={styles.center}>
          <Ionicons name="search-outline" size={48} color="#E8DDD0" />
          <Text style={styles.hintText}>2자 이상 입력하세요</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="document-outline" size={48} color="#E8DDD0" />
          <Text style={styles.hintText}>검색 결과가 없습니다</Text>
        </View>
      ) : (
        <FlatList
          testID="list-search-results"
          data={results}
          keyExtractor={(item) =>
            item.type === 'trip' ? `trip-${item.data.id}` : `checkin-${item.data.id}`
          }
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D4',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8E0D4',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    padding: 0,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  hintText: {
    fontSize: 14,
    color: '#C4B49A',
  },
  listContent: {
    paddingBottom: 100,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F0EB',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF3E8',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowBody: {
    flex: 1,
    gap: 3,
  },
  rowTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  rowSub: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    flexShrink: 0,
  },
  tripBadge: {
    backgroundColor: '#FFF3E8',
  },
  tripBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F97316',
  },
  checkinBadge: {
    backgroundColor: '#F0FDF4',
  },
  checkinBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16A34A',
  },
});
