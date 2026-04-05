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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CheckinCard from '../../components/CheckinCard';
import TripTaglineBanner from '../../components/TripTaglineBanner';
import TodayCalendarSection from '../../components/TodayCalendarSection';
import SideDrawer from '../../components/SideDrawer';
import TripFormModal from '../../components/TripFormModal';
import TripHeader from './TripHeader';
import TripMap from './TripMap';
import { useTripDetail, formatTripDate } from './hooks/useTripDetail';
import type { ListItem } from './hooks/useTripDetail';

export default function TripScreen() {
  const {
    navigation,
    trip,
    checkins,
    loading,
    error,
    trips,
    refreshing,
    onRefresh,
    filteredCheckins,
    groupedData,
    sortOrder,
    setSortOrder,
    avatarUrl,
    showDrawer,
    setShowDrawer,
    showCreateTripModal,
    setShowCreateTripModal,
    showEditTripModal,
    setShowEditTripModal,
    handleSelectTrip,
    handleCreateTrip,
    handleEditTrip,
    handleCheckinDelete,
    handleTripOptions,
  } = useTripDetail();

  const renderHeader = useCallback(() => {
    const earliest = checkins.length > 0
      ? [...checkins].sort((a, b) => new Date(a.checked_in_at).getTime() - new Date(b.checked_in_at).getTime())[0]
      : null;
    const startSrc = trip.start_date || earliest?.checked_in_at || null;
    const endSrc = trip.end_date || null;
    const hasPlace = !!trip.place;
    const hasTripInfo = !!(trip.description || startSrc || hasPlace);

    return (
      <View>
        {hasTripInfo && (
          <View style={styles.tripInfoCard}>
            {trip.description && (
              <Text style={styles.tripDescription}>{trip.description}</Text>
            )}
            {startSrc && (
              <View style={styles.tripMetaRow}>
                <Ionicons name="calendar-outline" size={12} color="#F97316" />
                <Text style={styles.tripMeta}>
                  {' '}{formatTripDate(startSrc)}
                  {endSrc && endSrc !== trip.start_date ? ` ~ ${formatTripDate(endSrc)}` : ''}
                </Text>
              </View>
            )}
            {hasPlace && (
              <View style={styles.tripMetaRow}>
                <Ionicons name="location-outline" size={12} color="#6B7280" />
                <Text style={styles.tripMeta}> {trip.place}</Text>
              </View>
            )}
          </View>
        )}

        <TripTaglineBanner tripId={trip.id} />

        <TripMap checkins={filteredCheckins} trip={trip} />

        <TodayCalendarSection tripEndDate={trip.end_date ?? undefined} />

        <View style={styles.checkinHeader}>
          <Text style={styles.checkinCount}>기록 {filteredCheckins.length}곳</Text>
          <TouchableOpacity
            onPress={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
            style={styles.sortButton}
          >
            <Text style={styles.sortLabel}>{sortOrder === 'newest' ? '최신순 ↓' : '오래된순 ↑'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [trip, checkins, filteredCheckins, sortOrder]);

  return (
    <SafeAreaView style={styles.container} edges={['top']} testID="screen-trip">
      <TripHeader
        title={trip.title}
        avatarUrl={avatarUrl}
        onOpenDrawer={() => setShowDrawer(true)}
        onTripOptions={handleTripOptions}
        onNavigateSettings={() => navigation.navigate('Settings')}
      />

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          testID="list-checkins"
          data={groupedData}
          keyExtractor={(item: ListItem) => item.type === 'date' ? `date-${item.date}` : item.checkin.id}
          renderItem={({ item }: { item: ListItem }) => {
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
                onEdit={(checkin) => navigation.navigate('CheckinForm', {
                  tripId: trip.id,
                  tripTitle: trip.title,
                  checkin,
                })}
                onDelete={handleCheckinDelete}
              />
            );
          }}
          ListHeaderComponent={renderHeader}
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
      )}

      <SideDrawer
        visible={showDrawer}
        onClose={() => setShowDrawer(false)}
        trips={trips}
        currentTripId={trip.id}
        onSelectTrip={handleSelectTrip}
        onCreateTrip={() => {
          setShowDrawer(false);
          setShowCreateTripModal(true);
        }}
      />

      <TripFormModal
        visible={showCreateTripModal}
        onClose={() => setShowCreateTripModal(false)}
        onSubmit={handleCreateTrip}
      />

      <TripFormModal
        visible={showEditTripModal}
        onClose={() => setShowEditTripModal(false)}
        onSubmit={handleEditTrip}
        mode="edit"
        initialTrip={trip}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  tripInfoCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B47',
    shadowColor: '#2D2416',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  tripDescription: {
    fontSize: 14,
    color: '#3D2B1F',
    marginBottom: 4,
  },
  tripMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  tripMeta: {
    fontSize: 12,
    color: '#8B7355',
  },
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
