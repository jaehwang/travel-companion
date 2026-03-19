import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { CHECKIN_CATEGORY_LABELS } from '../../../../packages/shared/src/types';

const CATEGORY_EMOJI: Record<string, string> = {
  restaurant: '🍽️',
  attraction: '🏛️',
  accommodation: '🏨',
  cafe: '☕',
  shopping: '🛍️',
  nature: '🌿',
  activity: '🎯',
  transportation: '🚌',
  other: '📌',
};

const CATEGORY_COLORS: Record<string, string> = {
  restaurant: '#FF6B47',
  cafe: '#F59E0B',
  attraction: '#3B82F6',
  accommodation: '#8B5CF6',
  shopping: '#EC4899',
  nature: '#10B981',
  activity: '#EF4444',
  transportation: '#6B7280',
  other: '#C4A882',
};

interface CategorySelectorProps {
  visible: boolean;
  selected: string;
  onSelect: (category: string) => void;
  onClose: () => void;
}

export default function CategorySelector({
  visible,
  selected,
  onSelect,
  onClose,
}: CategorySelectorProps) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>어떤 곳인가요?</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>닫기</Text>
          </TouchableOpacity>
        </View>

        {/* Grid */}
        <View style={styles.grid}>
          {Object.entries(CHECKIN_CATEGORY_LABELS).map(([value, label]) => {
            const isSelected = selected === value;
            const color = CATEGORY_COLORS[value] ?? '#C4A882';
            return (
              <TouchableOpacity
                key={value}
                onPress={() => { onSelect(value); onClose(); }}
                style={[
                  styles.item,
                  {
                    borderColor: isSelected ? color : '#E8E0D4',
                    backgroundColor: isSelected ? `${color}14` : '#FFFFFF',
                  },
                ]}
              >
                <Text style={styles.emoji}>{CATEGORY_EMOJI[value] || '📌'}</Text>
                <Text style={[
                  styles.label,
                  {
                    color: isSelected ? color : '#6B7280',
                    fontWeight: isSelected ? '800' : '500',
                  },
                ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: '#E8E0D4',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.1,
  },
  closeButton: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#F3F0EB',
  },
  closeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 10,
  },
  item: {
    width: '30%',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    gap: 8,
  },
  emoji: {
    fontSize: 28,
  },
  label: {
    fontSize: 12,
    letterSpacing: -0.1,
  },
});
