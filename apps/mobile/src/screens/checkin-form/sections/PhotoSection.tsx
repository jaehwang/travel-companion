import React from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PhotoSectionProps {
  photoPreview: string;
  isProcessingPhoto: boolean;
  onClearPhoto: () => void;
}

export default function PhotoSection({ photoPreview, isProcessingPhoto, onClearPhoto }: PhotoSectionProps) {
  if (isProcessingPhoto) {
    return (
      <View style={styles.processingBox}>
        <ActivityIndicator size="small" color="#F97316" />
        <Text style={styles.processingText}>사진 처리 중...</Text>
      </View>
    );
  }

  if (!photoPreview) return null;

  return (
    <View style={styles.photoContainer}>
      <TouchableOpacity onPress={onClearPhoto} style={styles.clearChip}>
        <View style={styles.clearChipContent}>
          <Ionicons name="camera-outline" size={14} color="#FF6B47" />
          <Text style={styles.clearChipText}>사진 삭제</Text>
          <Ionicons name="close" size={12} color="#FF6B47" />
        </View>
      </TouchableOpacity>
      <Image source={{ uri: photoPreview }} style={styles.photoPreview} resizeMode="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  processingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    padding: 14,
    backgroundColor: '#F3F0EB',
    borderRadius: 12,
  },
  processingText: {
    fontSize: 13,
    color: '#6B7280',
  },
  photoContainer: {
    marginTop: 14,
  },
  clearChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,107,71,0.1)',
    marginBottom: 8,
  },
  clearChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  clearChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B47',
  },
  photoPreview: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 14,
  },
});
