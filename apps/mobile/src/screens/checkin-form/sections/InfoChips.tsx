import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CHECKIN_CATEGORY_LABELS } from '@travel-companion/shared';

interface InfoChipsProps {
  latitude: number | undefined;
  longitude: number | undefined;
  place: string;
  category: string;
  checkedInAt: Date | null;
  catColor: string;
  catIconName: string;
  onClearLocation: () => void;
  onClearCategory: () => void;
  onClearTime: () => void;
}

export default function InfoChips({
  latitude,
  longitude,
  place,
  category,
  checkedInAt,
  catColor,
  catIconName,
  onClearLocation,
  onClearCategory,
  onClearTime,
}: InfoChipsProps) {
  return (
    <View style={styles.chipContainer}>
      {latitude != null && longitude != null && (
        <TouchableOpacity onPress={onClearLocation} style={styles.chip}>
          <Ionicons name="location-outline" size={13} color="#FF6B47" />
          <Text style={styles.chipText}>
            {place || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`}
          </Text>
          <Ionicons name="close" size={11} color="#FF6B47" style={{ opacity: 0.7 }} />
        </TouchableOpacity>
      )}
      {category ? (
        <TouchableOpacity onPress={onClearCategory} style={[styles.chip, { backgroundColor: `${catColor}18` }]}>
          <Ionicons name={catIconName as any} size={13} color={catColor} />
          <Text style={[styles.chipText, { color: catColor }]}>
            {CHECKIN_CATEGORY_LABELS[category as keyof typeof CHECKIN_CATEGORY_LABELS] || category}
          </Text>
          <Ionicons name="close" size={11} color={catColor} style={{ opacity: 0.7 }} />
        </TouchableOpacity>
      ) : null}
      {checkedInAt && (
        <TouchableOpacity onPress={onClearTime} style={[styles.chip, { backgroundColor: 'rgba(139,92,246,0.1)' }]}>
          <Ionicons name="time-outline" size={13} color="#8B5CF6" />
          <Text style={[styles.chipText, { color: '#8B5CF6' }]}>
            {new Intl.DateTimeFormat('ko-KR', {
              month: 'long', day: 'numeric', weekday: 'short',
              hour: '2-digit', minute: '2-digit',
            }).format(checkedInAt)}
          </Text>
          <Ionicons name="close" size={11} color="#8B5CF6" style={{ opacity: 0.7 }} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,107,71,0.1)',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF6B47',
  },
});
