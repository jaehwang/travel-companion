import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Trip } from '@travel-companion/shared';

export function HomeQuickCheckinCard({
  statusText,
  isActive,
  onPress,
}: {
  statusText: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.quickCheckinBtn} onPress={onPress}>
      <Ionicons name="flash-outline" size={22} color="#F97316" />
      <View style={styles.quickCheckinContent}>
        <Text style={styles.quickCheckinLabel}>자주 가는 곳에 체크인하기</Text>
        <Text style={[styles.quickCheckinStatus, isActive && styles.quickCheckinStatusActive]} numberOfLines={1}>
          {statusText}
        </Text>
      </View>
      <Text style={styles.quickCheckinArrow}>›</Text>
    </TouchableOpacity>
  );
}

export function HomeTripList(props: {
  trips: Trip[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
  reload: () => Promise<unknown>;
  renderTrip: ({ item }: { item: Trip }) => React.ReactElement;
}) {
  const { trips, loading, refreshing, error, onRefresh, reload, renderTrip } = props;

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
        <TouchableOpacity onPress={reload} style={styles.retryButton}>
          <Text style={styles.retryText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      testID="list-trips"
      data={trips}
      keyExtractor={(item) => item.id}
      renderItem={renderTrip}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons name="airplane-outline" size={64} color="#C4B49A" />
          <Text style={styles.emptyTitle}>아직 여행이 없습니다</Text>
          <Text style={styles.emptySubtitle}>아래 + 버튼을 눌러 첫 여행을 시작하세요</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  quickCheckinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  quickCheckinContent: {
    flex: 1,
  },
  quickCheckinLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 2,
  },
  quickCheckinStatus: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  quickCheckinStatusActive: {
    color: '#F97316',
  },
  quickCheckinArrow: {
    fontSize: 20,
    color: '#D1D5DB',
    fontWeight: '300',
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#F97316',
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 0,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4B5563',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
