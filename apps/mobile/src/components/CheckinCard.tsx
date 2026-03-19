import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import type { Checkin } from '../../../../packages/shared/src/types';

const CATEGORY_META: Record<string, { icon: string; label: string; color: string }> = {
  restaurant:     { icon: '🍽️', label: '음식점',   color: '#FF6B47' },
  cafe:           { icon: '☕',  label: '카페',     color: '#F59E0B' },
  attraction:     { icon: '🏛️', label: '명소',     color: '#3B82F6' },
  accommodation:  { icon: '🏨', label: '숙소',     color: '#8B5CF6' },
  shopping:       { icon: '🛍️', label: '쇼핑',     color: '#EC4899' },
  nature:         { icon: '🌿', label: '자연',     color: '#10B981' },
  activity:       { icon: '🎯', label: '액티비티', color: '#EF4444' },
  transportation: { icon: '🚌', label: '교통',     color: '#6B7280' },
  other:          { icon: '📍', label: '기타',     color: '#C4A882' },
};

interface CheckinCardProps {
  checkin: Checkin;
  onEdit?: (checkin: Checkin) => void;
  onDelete?: (checkinId: string) => void;
}

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export default function CheckinCard({ checkin, onEdit, onDelete }: CheckinCardProps) {
  const meta = CATEGORY_META[checkin.category ?? 'other'] ?? CATEGORY_META.other;

  const handleMapPress = () => {
    const url = checkin.place_id
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(checkin.place || '')}&query_place_id=${checkin.place_id}`
      : `https://www.google.com/maps?q=${checkin.latitude},${checkin.longitude}`;
    Linking.openURL(url);
  };

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {/* Category Accent Strip */}
        <View style={[styles.strip, { backgroundColor: meta.color }]} />

        {/* Body */}
        <View style={styles.body}>
          {/* Meta: Category + Time + Menu */}
          <View style={styles.metaRow}>
            <Text style={[styles.categoryText, { color: meta.color }]}>
              {meta.icon} {meta.label}
            </Text>
            <View style={styles.metaRight}>
              <Text style={styles.timeText}>
                {formatTime(checkin.checked_in_at)}
              </Text>
              {(onEdit || onDelete) && (
                <TouchableOpacity
                  onPress={() => {
                    // Simple menu via Alert
                    const { Alert } = require('react-native');
                    const buttons: Array<{ text: string; onPress?: () => void; style?: string }> = [];
                    if (onEdit) buttons.push({ text: '수정', onPress: () => onEdit(checkin) });
                    if (onDelete) buttons.push({
                      text: '삭제',
                      onPress: () => {
                        Alert.alert('삭제 확인', '이 체크인을 삭제하시겠습니까?', [
                          { text: '취소', style: 'cancel' },
                          { text: '삭제', style: 'destructive', onPress: () => onDelete(checkin.id) },
                        ]);
                      },
                      style: 'destructive',
                    });
                    buttons.push({ text: '취소', style: 'cancel' });
                    Alert.alert('', '', buttons);
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.menuDots}>⋮</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{checkin.title || '이름 없는 장소'}</Text>

          {/* Photo */}
          {checkin.photo_url && (
            <Image
              source={{ uri: checkin.photo_url }}
              style={styles.photo}
              resizeMode="cover"
            />
          )}

          {/* Message */}
          {checkin.message ? (
            <Text style={styles.message}>{checkin.message}</Text>
          ) : null}

          {/* Place Link */}
          <TouchableOpacity onPress={handleMapPress} style={styles.placeLink}>
            <Text style={styles.placeLinkText}>
              📍 {checkin.place || '지도에서 보기'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
  },
  strip: {
    width: 5,
  },
  body: {
    flex: 1,
    padding: 14,
    paddingBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 11,
    color: '#C4B49A',
  },
  menuDots: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '700',
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1F2937',
    marginBottom: 10,
    lineHeight: 21,
    letterSpacing: -0.1,
  },
  photo: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 10,
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 23,
    marginBottom: 12,
  },
  placeLink: {
    marginTop: 2,
  },
  placeLinkText: {
    fontSize: 12,
    color: '#C4B49A',
  },
});
