import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Trip } from '@travel-companion/shared';
import { formatTripDate as _formatTripDate } from '@travel-companion/shared';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = 16;
const CARD_WIDTH = SCREEN_WIDTH - CARD_MARGIN * 2;

interface TripCardProps {
  trip: Trip;
  onPress: () => void;
  onMenuPress?: () => void;
}

const formatTripDate = (dateStr?: string | null) => _formatTripDate(dateStr, { weekday: false });

export default function TripCard({ trip, onPress, onMenuPress }: TripCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={styles.card}
      testID="trip-card"
    >
      {/* Cover Photo */}
      <View style={styles.coverContainer}>
        {trip.cover_photo_url ? (
          <Image
            source={{ uri: trip.cover_photo_url }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Ionicons name="map-outline" size={48} color="#C4A882" />
          </View>
        )}

        {/* 자주 가는 곳 뱃지 */}
        {trip.is_frequent && (
          <View style={styles.frequentBadgeContainer}>
            <View style={styles.frequentBadge}>
              <View style={styles.badgeInner}>
                <Ionicons name="star" size={10} color="#FFF" />
                <Text style={styles.badgeText}>자주 가는 곳</Text>
              </View>
            </View>
          </View>
        )}

        {/* Public/Private Badge */}
        <View style={styles.badgeContainer}>
          <View style={[styles.badge, trip.is_public ? styles.badgePublic : styles.badgePrivate]}>
            <View style={styles.badgeInner}>
              {trip.is_public ? (
                <Ionicons name="earth-outline" size={10} color="#FFF" />
              ) : (
                <Ionicons name="lock-closed-outline" size={10} color="#FFF" />
              )}
              <Text style={styles.badgeText}>
                {trip.is_public ? '공개' : '비공개'}
              </Text>
            </View>
          </View>
        </View>

        {/* Kebab Menu */}
        {onMenuPress && (
          <TouchableOpacity
            onPress={onMenuPress}
            style={styles.menuButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.menuText}>⋮</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Text Area */}
      <View style={styles.textArea}>
        <Text style={styles.dateText}>
          {formatTripDate(trip.start_date ?? trip.first_checkin_date) ?? '날짜 미정'}
        </Text>
        <Text style={styles.titleText} numberOfLines={1}>
          {trip.title}
        </Text>
        {trip.description ? (
          <Text style={styles.descText} numberOfLines={2}>
            {trip.description}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    marginHorizontal: CARD_MARGIN,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  coverContainer: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 0.6,
    backgroundColor: '#F3F0EB',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frequentBadgeContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  frequentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(245, 158, 11, 0.92)',
  },
  badgeContainer: {
    position: 'absolute',
    bottom: 8,
    left: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgePublic: {
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
  },
  badgePrivate: {
    backgroundColor: 'rgba(55, 65, 81, 0.92)',
  },
  badgeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  menuButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  textArea: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dateText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: '#F97316',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  descText: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 17,
    marginTop: 4,
  },
});
