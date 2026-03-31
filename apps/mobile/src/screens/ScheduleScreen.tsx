import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fetchScheduleWithWeather, CalendarEventWithWeather } from '../lib/api';

// ── 날짜 포맷 헬퍼 ─────────────────────────────────────────────────────

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

function eventDateStr(event: CalendarEventWithWeather): string {
  return event.start.date ?? event.start.dateTime?.slice(0, 10) ?? '';
}

function formatDateHeader(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  const label = diff === 0 ? '오늘' : diff === 1 ? '내일' : diff === 2 ? '모레' : '';
  const dateLabel = `${d.getMonth() + 1}월 ${d.getDate()}일(${DAYS[d.getDay()]})`;
  return label ? `${dateLabel} · ${label}` : dateLabel;
}

function formatEventTime(event: CalendarEventWithWeather): string {
  if (!event.start.dateTime) return '종일';
  const d = new Date(event.start.dateTime);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ── 날씨 카드 ──────────────────────────────────────────────────────────

function WeatherBadge({ weather }: { weather: NonNullable<CalendarEventWithWeather['weather']> }) {
  const hasPrecip = weather.precipitation > 0;
  const isWindy = weather.windspeedMax >= 30;

  return (
    <View style={styles.weatherBadge}>
      <Text style={styles.weatherEmoji}>{weather.emoji}</Text>
      <View style={styles.weatherInfo}>
        <Text style={styles.weatherDesc}>{weather.description}</Text>
        <Text style={styles.weatherTemp}>
          {weather.tempMin}°~{weather.tempMax}°
          {hasPrecip ? ` 💧${weather.precipitation}mm` : ''}
          {isWindy ? ` 🌬️${weather.windspeedMax}km/h` : ''}
        </Text>
      </View>
    </View>
  );
}

// ── 이벤트 카드 ────────────────────────────────────────────────────────

function EventCard({ event }: { event: CalendarEventWithWeather }) {
  const time = formatEventTime(event);

  const openMaps = () => {
    if (!event.location) return;
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`
    );
  };

  return (
    <View style={styles.eventCard}>
      <View style={styles.eventTimeCol}>
        <Text style={styles.eventTime}>{time}</Text>
      </View>
      <View style={styles.eventBody}>
        <Text style={styles.eventTitle} numberOfLines={2}>
          {event.summary ?? '(제목 없음)'}
        </Text>
        {event.location && (
          <TouchableOpacity onPress={openMaps} style={styles.locationRow} activeOpacity={0.7}>
            <Ionicons name="location-outline" size={12} color="#4285F4" />
            <Text style={styles.locationText} numberOfLines={1}>
              {event.location}
            </Text>
          </TouchableOpacity>
        )}
        {event.weather && <WeatherBadge weather={event.weather} />}
      </View>
    </View>
  );
}

// ── 날짜 그룹 헤더 ─────────────────────────────────────────────────────

function DateHeader({ dateStr }: { dateStr: string }) {
  const today = new Date().toISOString().slice(0, 10);
  const isToday = dateStr === today;
  return (
    <View style={[styles.dateHeader, isToday && styles.dateHeaderToday]}>
      <Text style={[styles.dateHeaderText, isToday && styles.dateHeaderTextToday]}>
        {formatDateHeader(dateStr)}
      </Text>
    </View>
  );
}

// ── 데이터 그룹핑 ──────────────────────────────────────────────────────

type ListItem =
  | { type: 'header'; dateStr: string; key: string }
  | { type: 'event'; event: CalendarEventWithWeather; key: string };

function groupByDate(events: CalendarEventWithWeather[]): ListItem[] {
  const result: ListItem[] = [];
  let lastDate = '';
  for (const event of events) {
    const dateStr = eventDateStr(event);
    if (dateStr !== lastDate) {
      result.push({ type: 'header', dateStr, key: `header-${dateStr}` });
      lastDate = dateStr;
    }
    result.push({ type: 'event', event, key: event.id });
  }
  return result;
}

// ── 메인 화면 ──────────────────────────────────────────────────────────

export default function ScheduleScreen() {
  const [items, setItems] = useState<CalendarEventWithWeather[]>([]);
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tokenExpired, setTokenExpired] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setTokenExpired(false);
    try {
      const result = await fetchScheduleWithWeather();
      setItems(result.items);
      setAdvice(result.advice);
    } catch (err: any) {
      if (err.message === 'TOKEN_EXPIRED') setTokenExpired(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  const listData = groupByDate(items);

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === 'header') return <DateHeader dateStr={item.dateStr} />;
    return <EventCard event={item.event} />;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>일정</Text>
        <Text style={styles.headerSub}>오늘부터 2주</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      ) : tokenExpired ? (
        <View style={styles.center}>
          <Ionicons name="calendar-outline" size={48} color="#D1C4B0" />
          <Text style={styles.emptyTitle}>캘린더 연동 필요</Text>
          <Text style={styles.emptyDesc}>설정에서 구글 캘린더를 연동해주세요.</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="calendar-outline" size={48} color="#D1C4B0" />
          <Text style={styles.emptyTitle}>2주 내 일정이 없습니다</Text>
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />
          }
          ListHeaderComponent={
            advice ? (
              <View style={styles.adviceCard}>
                <View style={styles.adviceHeader}>
                  <Ionicons name="sparkles" size={14} color="#F97316" />
                  <Text style={styles.adviceLabel}>AI 조언</Text>
                </View>
                <Text style={styles.adviceText}>{advice}</Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

// ── 스타일 ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSub: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 8,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#B8A99A',
  },
  listContent: {
    paddingBottom: 32,
  },
  // AI 조언 카드
  adviceCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    backgroundColor: '#FFFBF5',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#F97316',
    shadowColor: '#2D2416',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  adviceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F97316',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  adviceText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 21,
  },
  // 날짜 헤더
  dateHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  dateHeaderToday: {},
  dateHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  dateHeaderTextToday: {
    color: '#F97316',
  },
  // 이벤트 카드
  eventCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    shadowColor: '#2D2416',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  eventTimeCol: {
    width: 42,
    alignItems: 'center',
    paddingTop: 2,
  },
  eventTime: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4285F4',
  },
  eventBody: {
    flex: 1,
    gap: 4,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locationText: {
    fontSize: 12,
    color: '#4285F4',
    flex: 1,
  },
  // 날씨 배지
  weatherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginTop: 2,
  },
  weatherEmoji: {
    fontSize: 18,
  },
  weatherInfo: {
    flex: 1,
    gap: 1,
  },
  weatherDesc: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  weatherTemp: {
    fontSize: 12,
    color: '#6B7280',
  },
});
