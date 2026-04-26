import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORY_META } from '../../utils/categoryIcons';
import type { Checkin, Trip } from '@travel-companion/shared';

const SCREEN_WIDTH = Dimensions.get('window').width;
export const CARD_WIDTH = (SCREEN_WIDTH - 16 * 2 - 8) / 2;

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export function formatDateTime(dateStr: string): string {
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

export interface CheckinGridCardProps {
  checkin: Checkin;
  tripMap: Map<string, Trip>;
  onPress: (checkin: Checkin, trip: Trip | undefined) => void;
  onLongPress: (checkin: Checkin) => void;
  onEdit: (checkin: Checkin) => void;
  onDelete: (checkinId: string) => void;
}

export function CheckinGridCard({ checkin, tripMap, onPress, onLongPress, onEdit, onDelete }: CheckinGridCardProps) {
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
        <Image source={{ uri: checkin.photo_url }} style={styles.cardPhoto} contentFit="cover" />
      ) : (
        <View style={[styles.cardPhotoPlaceholder, { backgroundColor: `${meta.color}15` }]}>
          <Ionicons name={meta.icon} size={28} color={meta.color} />
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {checkin.title || '이름 없는 장소'}
        </Text>
        {trip && <Text style={styles.cardTrip} numberOfLines={1}>{trip.title}</Text>}
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
        {checkin.tags?.length > 0 && (
          <View style={styles.cardTagsRow}>
            {checkin.tags.slice(0, 2).map(tag => (
              <View key={tag} style={styles.cardTagChip}>
                <Text style={styles.cardTagChipText}>#{tag}</Text>
              </View>
            ))}
            {checkin.tags.length > 2 && (
              <Text style={styles.cardTagMore}>+{checkin.tags.length - 2}</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
  cardPhoto: { width: CARD_WIDTH, height: CARD_WIDTH },
  cardPhotoPlaceholder: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { padding: 10, gap: 2 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#1F2937', lineHeight: 18 },
  cardTrip: { fontSize: 11, fontWeight: '600', color: '#F97316', marginTop: 2 },
  cardPlace: { fontSize: 11, color: '#C4B49A', marginTop: 2 },
  cardDate: { fontSize: 10, color: '#C4B49A', marginTop: 2 },
  cardTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 5 },
  cardTagChip: { backgroundColor: '#F3F0EB', borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 },
  cardTagChipText: { fontSize: 10, fontWeight: '600', color: '#8B7355' },
  cardTagMore: { fontSize: 10, color: '#C4B49A', alignSelf: 'center' },
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
  unassignedBadgeText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
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
  menuButtonText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', lineHeight: 15 },
});
