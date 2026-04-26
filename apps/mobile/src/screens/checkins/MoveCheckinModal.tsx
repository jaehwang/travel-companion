import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Trip } from '@travel-companion/shared';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface MoveCheckinModalProps {
  visible: boolean;
  assignableTrips: Trip[];
  onClose: () => void;
  onMoveToTrip: (tripId: string) => void;
}

export function MoveCheckinModal({ visible, assignableTrips, onClose, onMoveToTrip }: MoveCheckinModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={() => {}}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>여행으로 이동</Text>
            <TouchableOpacity
              testID="move-modal-close"
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalList} bounces={false}>
            {assignableTrips.map((t) => (
              <TouchableOpacity
                key={t.id}
                testID={`move-modal-trip-${t.id}`}
                style={styles.modalItem}
                onPress={() => onMoveToTrip(t.id)}
              >
                <Text style={styles.modalItemText} numberOfLines={1}>{t.title}</Text>
                {t.is_frequent && (
                  <Text style={styles.modalItemFrequentBadge} numberOfLines={1}>자주 가는 곳</Text>
                )}
                <Ionicons name="chevron-forward" size={16} color="#C4B49A" />
              </TouchableOpacity>
            ))}
            {assignableTrips.length === 0 && (
              <Text style={styles.modalEmptyText}>이동할 수 있는 여행이 없습니다</Text>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSheet: {
    width: SCREEN_WIDTH - 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  modalList: { flexGrow: 0 },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  modalItemText: { fontSize: 15, color: '#1F2937', flex: 1, marginRight: 8 },
  modalItemFrequentBadge: { fontSize: 11, fontWeight: '600', color: '#F97316', marginRight: 6, flexShrink: 1 },
  modalEmptyText: { padding: 24, textAlign: 'center', fontSize: 14, color: '#9CA3AF' },
});
