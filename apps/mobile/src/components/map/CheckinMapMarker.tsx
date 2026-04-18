import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Checkin } from '@travel-companion/shared';

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  restaurant: 'restaurant-outline',
  cafe: 'cafe-outline',
  accommodation: 'bed-outline',
  attraction: 'camera-outline',
  shopping: 'bag-outline',
  nature: 'leaf-outline',
  activity: 'bicycle-outline',
  transportation: 'train-outline',
  performance: 'musical-notes-outline',
  movie: 'film-outline',
  exhibition: 'color-palette-outline',
  other: 'location-outline',
};

const CATEGORY_COLORS: Record<string, string> = {
  restaurant: '#EF4444',
  cafe: '#92400E',
  accommodation: '#8B5CF6',
  attraction: '#3B82F6',
  shopping: '#EC4899',
  nature: '#10B981',
  activity: '#F59E0B',
  transportation: '#6B7280',
  performance: '#F97316',
  movie: '#14B8A6',
  exhibition: '#A78BFA',
  other: '#F97316',
};

interface CheckinMapMarkerProps {
  checkin: Checkin;
  selected: boolean;
  onImageLoad?: () => void;
}

export default function CheckinMapMarker({ checkin, selected, onImageLoad }: CheckinMapMarkerProps) {
  const category = checkin.category ?? 'other';
  const iconName = CATEGORY_ICONS[category] ?? 'location-outline';
  const bgColor = CATEGORY_COLORS[category] ?? '#F97316';
  const borderColor = selected ? '#3B82F6' : '#FFFFFF';

  return (
    <View style={styles.container}>
      <View
        testID="marker-circle"
        style={[styles.circle, { borderColor }]}
      >
        {checkin.photo_url ? (
          <Image
            testID="marker-photo"
            source={{ uri: checkin.photo_url }}
            style={styles.photo}
            onLoad={onImageLoad}
          />
        ) : (
          <View testID="marker-icon" style={[styles.iconBg, { backgroundColor: bgColor }]}>
            <Ionicons name={iconName} size={22} color="#FFFFFF" />
          </View>
        )}
      </View>
      <View testID="marker-tail" style={[styles.tail, { borderTopColor: borderColor }]} />
    </View>
  );
}

const MARKER_SIZE = 52;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  circle: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  iconBg: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
});
