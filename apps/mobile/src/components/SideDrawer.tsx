import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import type { Trip } from '@travel-companion/shared';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.78;

interface SideDrawerProps {
  visible: boolean;
  onClose: () => void;
  trips: Trip[];
  currentTripId: string;
  onSelectTrip: (trip: Trip) => void;
  onCreateTrip: () => void;
}

export default function SideDrawer({
  visible,
  onClose,
  trips,
  currentTripId,
  onSelectTrip,
  onCreateTrip,
}: SideDrawerProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.drawer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerLabel}>MY TRIPS</Text>
            <Text style={styles.headerTitle}>Travel Companion</Text>
          </View>

          {/* Create Trip */}
          <TouchableOpacity onPress={onCreateTrip} style={styles.createButton}>
            <Text style={styles.createText}>+ 새 여행 만들기</Text>
          </TouchableOpacity>

          {/* Trip List */}
          <FlatList
            data={trips}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isActive = item.id === currentTripId;
              return (
                <TouchableOpacity
                  onPress={() => onSelectTrip(item)}
                  style={[styles.tripItem, isActive && styles.tripItemActive]}
                >
                  <Text style={[styles.tripItemText, isActive && styles.tripItemTextActive]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {item.is_frequent && (
                    <Text style={styles.frequentBadge} numberOfLines={1}>자주 가는 곳</Text>
                  )}
                  {isActive && <View style={styles.activeIndicator} />}
                </TouchableOpacity>
              );
            }}
            style={styles.list}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  drawer: {
    width: DRAWER_WIDTH,
    backgroundColor: '#FFF8F0',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D4',
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#C4B49A',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  createButton: {
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#F97316',
    alignItems: 'center',
  },
  createText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F97316',
  },
  list: {
    flex: 1,
  },
  tripItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E8E0D4',
  },
  tripItemActive: {
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
  },
  tripItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#4B5563',
  },
  tripItemTextActive: {
    color: '#F97316',
    fontWeight: '800',
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F97316',
    marginLeft: 8,
  },
  frequentBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F97316',
    marginLeft: 6,
    flexShrink: 1,
  },
});
