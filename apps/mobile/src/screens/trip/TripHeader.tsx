import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

interface TripHeaderProps {
  title: string;
  avatarUrl?: string;
  onOpenDrawer: () => void;
  onTripOptions: () => void;
  onNavigateSettings: () => void;
}

export default function TripHeader({ title, avatarUrl, onOpenDrawer, onTripOptions, onNavigateSettings }: TripHeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onOpenDrawer} style={styles.hamburger}>
        <Text style={styles.hamburgerText}>≡</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
      <TouchableOpacity onPress={onTripOptions} style={styles.optionsButton} testID="trip-options-button">
        <Ionicons name="ellipsis-horizontal" size={20} color="#6B7280" />
      </TouchableOpacity>
      <TouchableOpacity onPress={onNavigateSettings} style={styles.avatarButton}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person-outline" size={16} color="#9CA3AF" />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  hamburger: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hamburgerText: {
    fontSize: 24,
    color: '#1F2937',
    fontWeight: '700',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  optionsButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F0EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
