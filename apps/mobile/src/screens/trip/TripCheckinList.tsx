import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CheckinCard from '../../components/CheckinCard';
import type { ListItem } from './hooks/useTripDetail';
import type { Checkin } from '@travel-companion/shared';

interface TripCheckinListProps {
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  groupedData: ListItem[];
  filteredCheckins: Checkin[];
  sortOrder: 'newest' | 'oldest';
  onSortToggle: () => void;
  onRefresh: () => void;
  onEditCheckin: (checkin: Checkin) => void;
  onDeleteCheckin: (id: string) => void;
  ListHeaderComponent: React.ReactElement | null;
}

export default function TripCheckinList({
  loading,
  refreshing,
  error,
  groupedData,
  filteredCheckins,
  sortOrder,
  onSortToggle,
  onRefresh,
  onEditCheckin,
  onDeleteCheckin,
  ListHeaderComponent,
}: TripCheckinListProps) {
  const renderItem = useCallback(({ item }: { item: ListItem }) => {
    if (item.type === 'date') {
      return (
        <View style={styles.dateSeparator}>
          <View style={styles.dateDot} />
          <Text style={styles.dateLabel}>{item.label}</Text>
          <View style={styles.dateLine} />
        </View>
      );
    }
    return (
      <CheckinCard
        checkin={item.checkin}
        onEdit={onEditCheckin}
        onDelete={onDeleteCheckin}
      />
    );
  }, [onEditCheckin, onDeleteCheckin]);

  const checkinHeader = (
    <View style={styles.checkinHeader}>
      <Text style={styles.checkinCount}>기록 {filteredCheckins.length}곳</Text>
      <TouchableOpacity onPress={onSortToggle} style={styles.sortButton}>
        <Text style={styles.sortLabel}>
          {sortOrder === 'newest' ? '최신순 ↓' : '오래된순 ↑'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const headerWithSort = ListHeaderComponent ? (
    <View>
      {ListHeaderComponent}
      {checkinHeader}
    </View>
  ) : checkinHeader;

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      testID="list-checkins"
      data={groupedData}
      keyExtractor={(item: ListItem) =>
        item.type === 'date' ? `date-${item.date}` : item.checkin.id
      }
      renderItem={renderItem}
      ListHeaderComponent={headerWithSort}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons name="location-outline" size={48} color="#C4B49A" />
          <Text style={styles.emptyText}>아직 체크인이 없습니다</Text>
          <Text style={styles.emptySubtext}>+ 버튼을 눌러 첫 체크인을 해보세요</Text>
        </View>
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />
      }
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  checkinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  checkinCount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#F5EEE6',
  },
  sortLabel: {
    fontSize: 12,
    color: '#8B7355',
    fontWeight: '600',
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
  },
  dateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F97316',
    flexShrink: 0,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8E0D4',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 40,
    gap: 0,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4B5563',
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9CA3AF',
  },
});
