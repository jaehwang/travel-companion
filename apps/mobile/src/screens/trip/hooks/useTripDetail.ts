import { useState, useCallback, useMemo, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActionSheetIOS, Alert, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import { supabase } from '../../../lib/supabase';
import { API_URL } from '../../../lib/api';
import { useCheckins } from '../../../hooks/useCheckins';
import { useTrips } from '../../../hooks/useTrips';
import { useTripsStore } from '../../../store/tripsStore';
import { setTripCheckinContext } from '../../../navigation/AppNavigator';
import type { TripsStackParamList, RootStackParamList } from '../../../navigation/AppNavigator';
import type { Trip, TripFormData } from '@travel-companion/shared';
import { formatTripDate } from '@travel-companion/shared';

export type ListItem =
  | { type: 'date'; date: string; label: string }
  | { type: 'checkin'; checkin: import('@travel-companion/shared').Checkin };

type NavigationProp = CompositeNavigationProp<
  StackNavigationProp<TripsStackParamList, 'Trip'>,
  StackNavigationProp<RootStackParamList>
>;
type TripRouteProp = RouteProp<TripsStackParamList, 'Trip'>;

export { formatTripDate };

export function useTripDetail() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<TripRouteProp>();
  const [selectedTripId, setSelectedTripId] = useState<string>(route.params.trip.id);
  const scrollToCheckinId = route.params.scrollToCheckinId;

  useEffect(() => {
    setSelectedTripId(route.params.trip.id);
  }, [route.params.trip.id]);

  const trip = useTripsStore((s) => s.trips.find((t) => t.id === selectedTripId)) ?? route.params.trip;
  const { checkins, loading, error, reload, remove } = useCheckins(trip.id);
  const { trips, create: createTrip, update: updateTrip } = useTrips();
  const [refreshing, setRefreshing] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showCreateTripModal, setShowCreateTripModal] = useState(false);
  const [showEditTripModal, setShowEditTripModal] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.avatar_url) {
        setAvatarUrl(user.user_metadata.avatar_url);
      }
    });
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  const filteredCheckins = useMemo(() => {
    return [...checkins].sort((a, b) => {
      const diff = new Date(b.checked_in_at).getTime() - new Date(a.checked_in_at).getTime();
      return sortOrder === 'newest' ? diff : -diff;
    });
  }, [checkins, sortOrder]);

  const groupedData = useMemo((): ListItem[] => {
    const result: ListItem[] = [];
    let lastDate = '';
    filteredCheckins.forEach(checkin => {
      const d = new Date(checkin.checked_in_at);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (dateKey !== lastDate) {
        lastDate = dateKey;
        const label = new Intl.DateTimeFormat('ko-KR', {
          year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
        }).format(d);
        result.push({ type: 'date', date: dateKey, label });
      }
      result.push({ type: 'checkin', checkin });
    });
    return result;
  }, [filteredCheckins]);

  useFocusEffect(
    useCallback(() => {
      setTripCheckinContext({
        tripId: trip.id,
        tripTitle: trip.title,
        initialLatitude: trip.latitude ?? undefined,
        initialLongitude: trip.longitude ?? undefined,
        initialPlace: trip.place ?? undefined,
        initialPlaceId: trip.place_id ?? undefined,
      });
      return () => setTripCheckinContext(null);
    }, [trip])
  );

  const handleSelectTrip = (t: Trip) => {
    setSelectedTripId(t.id);
    setShowDrawer(false);
  };

  const handleCreateTrip = async (data: TripFormData) => {
    const newTrip = await createTrip(data);
    setSelectedTripId(newTrip.id);
    setShowDrawer(false);
    setShowCreateTripModal(false);
  };

  const handleEditTrip = async (data: TripFormData) => {
    await updateTrip(trip.id, data);
    setShowEditTripModal(false);
  };

  const handleCheckinDelete = async (id: string) => {
    try {
      await remove(id);
    } catch {
      // error handled in useCheckins
    }
  };

  const handleTripOptions = useCallback(() => {
    const publicLabel = trip.is_public ? '비공개로 전환' : '공개로 전환';
    const frequentLabel = trip.is_frequent ? '자주 가는 곳에서 제거' : '자주 가는 곳 추가';

    const handleCopyLink = async () => {
      const url = `${API_URL}/story/${trip.id}`;
      await Clipboard.setStringAsync(url);
      Alert.alert('링크 복사됨', '클립보드에 복사되었습니다.');
    };

    if (trip.is_public) {
      const options = ['여행 수정', publicLabel, '공개 여행 링크 복사', frequentLabel, '취소'];
      const cancelIndex = options.length - 1;
      const handleSelect = async (index: number) => {
        if (index === cancelIndex) return;
        if (index === 0) setShowEditTripModal(true);
        else if (index === 1) await updateTrip(trip.id, { is_public: !trip.is_public });
        else if (index === 2) handleCopyLink();
        else if (index === 3) await updateTrip(trip.id, { is_frequent: !trip.is_frequent });
      };
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions({ options, cancelButtonIndex: cancelIndex }, handleSelect);
      } else {
        Alert.alert('여행 설정', undefined, [
          { text: '여행 수정', onPress: () => handleSelect(0) },
          { text: publicLabel, onPress: () => handleSelect(1) },
          { text: '공개 여행 링크 복사', onPress: () => handleSelect(2) },
          { text: frequentLabel, onPress: () => handleSelect(3) },
          { text: '취소', style: 'cancel' },
        ]);
      }
    } else {
      const options = ['여행 수정', publicLabel, frequentLabel, '취소'];
      const cancelIndex = options.length - 1;
      const handleSelect = async (index: number) => {
        if (index === cancelIndex) return;
        if (index === 0) setShowEditTripModal(true);
        else if (index === 1) await updateTrip(trip.id, { is_public: !trip.is_public });
        else if (index === 2) await updateTrip(trip.id, { is_frequent: !trip.is_frequent });
      };
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions({ options, cancelButtonIndex: cancelIndex }, handleSelect);
      } else {
        Alert.alert('여행 설정', undefined, [
          { text: '여행 수정', onPress: () => handleSelect(0) },
          { text: publicLabel, onPress: () => handleSelect(1) },
          { text: frequentLabel, onPress: () => handleSelect(2) },
          { text: '취소', style: 'cancel' },
        ]);
      }
    }
  }, [trip, updateTrip]);

  return {
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
    createTrip,
    updateTrip,
    scrollToCheckinId,
  };
}
