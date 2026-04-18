import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import type { Trip } from '@travel-companion/shared';

interface FormHeaderProps {
  avatarUrl: string | undefined;
  paramTripId: string | undefined;
  tripTitle: string | undefined;
  trips: Trip[];
  selectedTripId: string | undefined;
  onSelectTripId: (id: string | undefined) => void;
  isEditMode: boolean;
  isSubmitting: boolean;
  canSubmit: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

export default function FormHeader({
  avatarUrl,
  paramTripId,
  tripTitle,
  trips,
  selectedTripId,
  onSelectTripId,
  isEditMode,
  isSubmitting,
  canSubmit,
  onCancel,
  onSubmit,
}: FormHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.headerAvatar} />
        ) : (
          <View style={styles.headerAvatarPlaceholder}>
            <Ionicons name="person-outline" size={16} color="#9CA3AF" />
          </View>
        )}
        {paramTripId ? (
          <Text style={styles.headerTripName} numberOfLines={1}>{tripTitle}</Text>
        ) : (
          <FlatList
            testID="trip-selector"
            data={trips}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => onSelectTripId(item.id === selectedTripId ? undefined : item.id)}
                style={[
                  styles.tripChip,
                  item.id === selectedTripId && styles.tripChipSelected,
                ]}
              >
                <Text style={[
                  styles.tripChipText,
                  item.id === selectedTripId && styles.tripChipTextSelected,
                ]}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            )}
            style={{ flex: 1 }}
          />
        )}
      </View>
      <View style={styles.headerButtons}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelText}>취소</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="btn-save-checkin"
          onPress={onSubmit}
          disabled={!canSubmit}
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={[styles.submitText, !canSubmit && styles.submitTextDisabled]}>
              {isEditMode ? '저장' : '체크인'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: '#E8E0D4',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 12,
  },
  headerAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  headerAvatarPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3F0EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTripName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F3F0EB',
  },
  cancelText: {
    color: '#9CA3AF',
    fontWeight: '700',
    fontSize: 14,
  },
  submitButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FF6B47',
    shadowColor: '#FF6B47',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#F3F0EB',
    shadowOpacity: 0,
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  submitTextDisabled: {
    color: '#C4B49A',
  },
  tripChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#F3F0EB',
    marginRight: 6,
  },
  tripChipSelected: {
    backgroundColor: '#FF6B47',
  },
  tripChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  tripChipTextSelected: {
    color: '#FFFFFF',
  },
});
