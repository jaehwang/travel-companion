import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import TripTaglineBanner from '../../components/TripTaglineBanner';
import TodayCalendarSection from '../../components/TodayCalendarSection';
import SideDrawer from '../../components/SideDrawer';
import TripFormModal from '../../components/TripFormModal';
import TripHeader from './TripHeader';
import TripMap from './TripMap';
import TripCheckinList from './TripCheckinList';
import { useTripDetail, formatTripDate } from './hooks/useTripDetail';

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
    scrollToCheckinId,
  } = useTripDetail();

  const renderListHeader = useCallback(() => {
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
      </View>
    );
  }, [trip, checkins, filteredCheckins]);

  return (
    <SafeAreaView style={styles.container} edges={['top']} testID="screen-trip">
      <TripHeader
        title={trip.title}
        avatarUrl={avatarUrl}
        onOpenDrawer={() => setShowDrawer(true)}
        onTripOptions={handleTripOptions}
        onNavigateSettings={() => navigation.navigate('Settings')}
      />

      <TripCheckinList
        loading={loading}
        refreshing={refreshing}
        error={error}
        groupedData={groupedData}
        filteredCheckins={filteredCheckins}
        sortOrder={sortOrder}
        onSortToggle={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
        onRefresh={onRefresh}
        onEditCheckin={(checkin) => navigation.navigate('CheckinForm', {
          tripId: trip.id,
          tripTitle: trip.title,
          checkin,
        })}
        onDeleteCheckin={handleCheckinDelete}
        ListHeaderComponent={renderListHeader()}
        scrollToCheckinId={scrollToCheckinId}
      />

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
});
