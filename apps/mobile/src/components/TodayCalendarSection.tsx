import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchCalendarEvents, fetchCalendarAdvice, CalendarEvent } from '../lib/api';

function formatEventWhen(event: CalendarEvent): string {
  const d = new Date(event.start.dateTime ?? event.start.date!);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const date = `${d.getMonth() + 1}/${d.getDate()}(${days[d.getDay()]})`;
  if (!event.start.dateTime) return `${date} 종일`;
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${date} ${h}:${m}`;
}

function eventStartMs(event: CalendarEvent): number {
  return new Date(event.start.dateTime ?? event.start.date!).getTime();
}

function eventEndMs(event: CalendarEvent): number {
  return new Date(event.end.dateTime ?? event.end.date!).getTime();
}

interface Props {
  tripEndDate?: string;
}

function TodayCalendarExpired() {
  return (
    <View style={styles.expiredContainer}>
      <View style={styles.expiredRow}>
        <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
        <Text style={styles.expiredText}> 캘린더 접근 권한 만료</Text>
      </View>
    </View>
  );
}

function TodayCalendarEventList({ events }: { events: CalendarEvent[] }) {
  return (
    <View style={styles.eventList}>
      {events.map((event) => (
        <View key={event.id} style={styles.eventRow}>
          <Text style={styles.eventTime}>{formatEventWhen(event)}</Text>
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle} numberOfLines={1}>
              {event.summary ?? '(제목 없음)'}
            </Text>
            {event.location && (
              <TouchableOpacity
                style={styles.eventLocationRow}
                onPress={() =>
                  Linking.openURL(
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location!)}`,
                  )
                }
              >
                <Ionicons name="location-outline" size={11} color="#4285F4" />
                <Text style={styles.eventLocation} numberOfLines={1}>
                  {event.location}
                </Text>
              </TouchableOpacity>
            )}
            {event.place && (
              <View style={styles.placeInfoRow}>
                {event.place.open_now !== null && (
                  <View
                    style={[
                      styles.placeBadge,
                      event.place.open_now ? styles.placeBadgeOpen : styles.placeBadgeClosed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.placeBadgeText,
                        event.place.open_now ? styles.placeBadgeTextOpen : styles.placeBadgeTextClosed,
                      ]}
                    >
                      {event.place.open_now ? '● 지금 영업 중' : '● 지금 영업 종료'}
                    </Text>
                  </View>
                )}
                {event.place.open_at_event !== null && (
                  <View
                    style={[
                      styles.placeBadge,
                      event.place.open_at_event ? styles.placeBadgeOpen : styles.placeBadgeClosed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.placeBadgeText,
                        event.place.open_at_event ? styles.placeBadgeTextOpen : styles.placeBadgeTextClosed,
                      ]}
                    >
                      {event.place.open_at_event ? '● 방문 시 영업 중' : '● 방문 시 영업 종료'}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

function TodayCalendarCard({
  tripEndDate,
  events,
  advice,
  adviceLoading,
  open,
  setOpen,
}: {
  tripEndDate?: string;
  events: CalendarEvent[];
  advice: string | null;
  adviceLoading: boolean;
  open: boolean;
  setOpen: (open: boolean | ((open: boolean) => boolean)) => void;
}) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setOpen((current) => !current)} style={styles.header} activeOpacity={0.7}>
        <Ionicons name="calendar-outline" size={16} color="#4285F4" />
        <View style={styles.headerText}>
          <Text style={styles.title}>
            {tripEndDate ? '여행 일정' : '오늘 일정'} {events.length}개
          </Text>
          {advice ? (
            <Text style={styles.advice} numberOfLines={1}>
              {advice}
            </Text>
          ) : adviceLoading ? (
            <ActivityIndicator size="small" color="#9CA3AF" style={styles.adviceLoading} />
          ) : null}
        </View>
        <Text style={[styles.chevron, open && styles.chevronOpen]}>⌄</Text>
      </TouchableOpacity>

      {open && <TodayCalendarEventList events={events} />}
    </View>
  );
}

export default function TodayCalendarSection({ tripEndDate }: Props) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [advice, setAdvice] = useState<string | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [tokenExpired, setTokenExpired] = useState(false);

  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = tripEndDate
      ? new Date(new Date(tripEndDate).getFullYear(), new Date(tripEndDate).getMonth(), new Date(tripEndDate).getDate() + 1)
      : new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    setEvents([]);
    setAdvice(null);
    setOpen(false);
    setLoading(true);
    setTokenExpired(false);

    fetchCalendarEvents(start.toISOString(), end.toISOString(), 10)
      .then(items => setEvents(items))
      .catch(err => {
        if (err.message === 'TOKEN_EXPIRED') setTokenExpired(true);
      })
      .finally(() => setLoading(false));
  }, [tripEndDate]);

  useEffect(() => {
    if (events.length === 0) return;
    const now = Date.now();
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const adviceEvents = events
      .filter(e => {
        if (e.start.dateTime) return eventEndMs(e) > now;
        return new Date(e.start.date!).getTime() >= tomorrow.getTime();
      })
      .sort((a, b) => eventStartMs(a) - eventStartMs(b))
      .slice(0, 5);

    if (adviceEvents.length === 0) return;

    setAdviceLoading(true);
    const payload = adviceEvents.map(e => ({
      summary: e.summary ?? '일정',
      location: e.location,
      minutesUntil: Math.round((eventStartMs(e) - now) / 60000),
      isAllDay: !e.start.dateTime,
    }));

    fetchCalendarAdvice(payload)
      .then(text => { if (text) setAdvice(text); })
      .catch(() => {})
      .finally(() => setAdviceLoading(false));
  }, [events]);

  if (loading) return null;

  if (tokenExpired) return <TodayCalendarExpired />;

  if (events.length === 0) return null;

  return (
    <TodayCalendarCard
      tripEndDate={tripEndDate}
      events={events}
      advice={advice}
      adviceLoading={adviceLoading}
      open={open}
      setOpen={setOpen}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderLeftWidth: 4,
    borderLeftColor: 'rgba(66,133,244,0.5)',
    shadowColor: '#2D2416',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  advice: {
    fontSize: 12,
    color: '#8B7355',
    marginTop: 2,
  },
  adviceLoading: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  chevron: {
    fontSize: 18,
    color: '#9CA3AF',
    lineHeight: 20,
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  eventList: {
    borderTopWidth: 1,
    borderTopColor: '#F0EBE4',
    paddingVertical: 4,
  },
  eventRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 4,
    gap: 8,
    alignItems: 'flex-start',
  },
  eventTime: {
    fontSize: 11,
    color: '#4285F4',
    fontWeight: '600',
    width: 90,
    flexShrink: 0,
    paddingTop: 1,
  },
  eventInfo: {
    flex: 1,
    minWidth: 0,
  },
  eventTitle: {
    fontSize: 13,
    color: '#1F2937',
  },
  eventLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  eventLocation: {
    fontSize: 11,
    color: '#4285F4',
    flex: 1,
  },
  placeInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 3,
  },
  placeBadge: {
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  placeBadgeOpen: {
    backgroundColor: '#ECFDF5',
  },
  placeBadgeClosed: {
    backgroundColor: '#FEF2F2',
  },
  placeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  placeBadgeTextOpen: {
    color: '#059669',
  },
  placeBadgeTextClosed: {
    color: '#DC2626',
  },
  expiredContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    shadowColor: '#2D2416',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  expiredRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expiredText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
