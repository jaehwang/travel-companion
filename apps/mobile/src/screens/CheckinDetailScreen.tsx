import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { Checkin } from '@travel-companion/shared';
import { CATEGORY_META } from '../utils/categoryIcons';
import { useTripsStore } from '../store/tripsStore';

type CheckinDetailRouteProp = RouteProp<{ CheckinDetail: { checkin: Checkin } }, 'CheckinDetail'>;

function formatDateTime(dateStr: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

export default function CheckinDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<CheckinDetailRouteProp>();
  const { top, bottom } = useSafeAreaInsets();
  const { checkin } = route.params;
  const trips = useTripsStore((s) => s.trips);
  const trip = trips.find((t) => t.id === checkin.trip_id);

  const meta = CATEGORY_META[checkin.category ?? 'other'] ?? CATEGORY_META.other;

  const handleMapPress = () => {
    let url: string;
    if (checkin.place_id) {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(checkin.place ?? '')}&query_place_id=${checkin.place_id}`;
    } else if (checkin.place) {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(checkin.place)}`;
    } else {
      url = `https://www.google.com/maps?q=${checkin.latitude},${checkin.longitude}`;
    }
    Linking.openURL(url);
  };

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          testID="btn-back"
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-down" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 사진 */}
        {checkin.photo_url ? (
          <Image
            testID="detail-photo"
            source={{ uri: checkin.photo_url }}
            style={styles.photo}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.photoPlaceholder, { backgroundColor: meta.color + '22' }]}>
            <Ionicons name={meta.icon} size={48} color={meta.color} />
          </View>
        )}

        <View style={styles.content}>
          {/* 카테고리 뱃지 */}
          <View style={[styles.badge, { backgroundColor: meta.color + '1A' }]}>
            <Ionicons name={meta.icon} size={13} color={meta.color} />
            <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
          </View>

          {/* 제목 */}
          {checkin.title ? (
            <Text style={styles.title}>{checkin.title}</Text>
          ) : null}

          {/* 메시지 */}
          {checkin.message ? (
            <Text style={styles.message}>{checkin.message}</Text>
          ) : null}

          {/* 태그 */}
          {checkin.tags && checkin.tags.length > 0 ? (
            <View style={styles.tags}>
              {checkin.tags.map(tag => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* 장소명 / 위치 링크 */}
          <TouchableOpacity style={styles.placeRow} onPress={handleMapPress}>
            <Ionicons name="location-outline" size={15} color="#6B7280" />
            <Text style={styles.placeText}>
              {checkin.place ?? '지도에서 보기'}
            </Text>
          </TouchableOpacity>

          {/* 날짜·시간 */}
          <Text style={styles.datetime}>{formatDateTime(checkin.checked_in_at)}</Text>

          {/* 여행 */}
          {trip ? (
            <TouchableOpacity
              style={styles.tripRow}
              onPress={() => navigation.navigate('MainTabs' as any, { screen: 'TripsTab', params: { screen: 'Trip', params: { trip } } })}
            >
              <Ionicons name="briefcase-outline" size={15} color="#6B7280" />
              <Text style={styles.tripText}>{trip.title}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F0EB',
  },
  backBtn: {
    padding: 4,
  },
  scroll: {
    flex: 1,
  },
  photo: {
    width,
    height: width * 0.75,
  },
  photoPlaceholder: {
    width,
    height: width * 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
    gap: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  placeText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
  },
  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tripText: {
    fontSize: 14,
    color: '#6B7280',
  },
  datetime: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  message: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 13,
    color: '#6B7280',
  },
});
