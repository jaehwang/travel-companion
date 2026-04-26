import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORY_META } from '../../../utils/categoryIcons';

interface CategorySuggestionBannerProps {
  category: string;
  onAccept: () => void;
  onDismiss: () => void;
}

export default function CategorySuggestionBanner({
  category,
  onAccept,
  onDismiss,
}: CategorySuggestionBannerProps) {
  const meta = CATEGORY_META[category] ?? CATEGORY_META.other;

  return (
    <View style={styles.container}>
      <Ionicons name="sparkles" size={13} color="#F97316" style={styles.sparkle} />
      <View style={styles.labelRow}>
        <Ionicons name={meta.icon} size={13} color={meta.color} />
        <Text style={[styles.label, { color: meta.color }]}>{meta.label}</Text>
        <Text style={styles.hint}>은(는) 어때요?</Text>
      </View>
      <TouchableOpacity
        testID="btn-accept-suggestion"
        onPress={onAccept}
        style={styles.acceptButton}
      >
        <Text style={styles.acceptText}>적용</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID="btn-dismiss-suggestion"
        onPress={onDismiss}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="close" size={14} color="#C4B49A" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFF8F0',
    borderTopWidth: 1,
    borderTopColor: '#F3EDE3',
    gap: 6,
  },
  sparkle: {
    flexShrink: 0,
  },
  labelRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  hint: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  acceptButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FF6B47',
  },
  acceptText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
