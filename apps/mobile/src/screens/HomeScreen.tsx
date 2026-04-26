import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActionSheetIOS,
  Alert,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import * as Clipboard from 'expo-clipboard';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { fetchNearbyCheckins, API_URL } from '../lib/api';
import { useTrips } from '../hooks/useTrips';
import TripCard from '../components/TripCard';
import TripFormModal from '../components/TripFormModal';
import QuickCheckinSheet from '../components/QuickCheckinSheet';
import { HomeQuickCheckinCard, HomeTripList } from './home/HomeScreenSections';
import type { TripsStackParamList, RootStackParamList } from '../navigation/AppNavigator';
import type { Trip, TripFormData } from '@travel-companion/shared';
import type { NearbyCheckin } from '../lib/api';

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

type NavigationProp = CompositeNavigationProp<
  StackNavigationProp<TripsStackParamList, 'Home'>,
  StackNavigationProp<RootStackParamList>
>;

function useAvatarUrl() {
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.avatar_url) {
        setAvatarUrl(user.user_metadata.avatar_url);
      }
    });
  }, []);

  return avatarUrl;
}

function useLastNearbyCheckin() {
  const [lastCheckin, setLastCheckin] = useState<NearbyCheckin | null>(null);
  const [checkinLoading, setCheckinLoading] = useState(true);
  const locationPermissionGranted = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          if (!locationPermissionGranted.current) {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;
            locationPermissionGranted.current = true;
          }
          const loc = await Location.getCurrentPositionAsync({});
          const checkins = await fetchNearbyCheckins(loc.coords.latitude, loc.coords.longitude);
          if (!cancelled && checkins.length > 0) setLastCheckin(checkins[0]);
        } catch { /* silent */ } finally {
          if (!cancelled) setCheckinLoading(false);
        }
      })();
      return () => { cancelled = true; };
    }, [])
  );

  return { lastCheckin, setLastCheckin, checkinLoading };
}

async function copyTripLink(tripId: string) {
  const url = `${API_URL}/story/${tripId}`;
  await Clipboard.setStringAsync(url);
  Alert.alert('링크 복사됨', '클립보드에 복사되었습니다.');
}

function confirmDeleteTrip(trip: Trip, remove: ReturnType<typeof useTrips>['remove']) {
  Alert.alert(
    `"${trip.title}" 삭제`,
    '체크인도 함께 삭제할까요?',
    [
      {
        text: '예, 체크인도 삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await remove(trip.id, false);
          } catch {
            Alert.alert('오류', '삭제에 실패했습니다.');
          }
        },
      },
      {
        text: '아니오, 미할당으로 보관',
        onPress: async () => {
          try {
            await remove(trip.id, true);
          } catch {
            Alert.alert('오류', '삭제에 실패했습니다.');
          }
        },
      },
      { text: '취소', style: 'cancel' },
    ],
  );
}

function showTripMenu(params: {
  trip: Trip;
  onTogglePublic: (trip: Trip) => void;
  onEdit: (trip: Trip) => void;
  onDelete: (trip: Trip) => void;
}) {
  const { trip, onTogglePublic, onEdit, onDelete } = params;
  const toggleLabel = trip.is_public ? '비공개로 전환' : '공개로 전환';
  const baseActions = [
    { text: toggleLabel, onPress: () => onTogglePublic(trip) },
    { text: '수정', onPress: () => onEdit(trip) },
    { text: '삭제', style: 'destructive' as const, onPress: () => onDelete(trip) },
    { text: '취소', style: 'cancel' as const },
  ];

  if (trip.is_public) {
    const options = [toggleLabel, '공개 여행 링크 복사', '수정', '삭제', '취소'];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, destructiveButtonIndex: 3, cancelButtonIndex: 4 },
        (index) => {
          if (index === 0) onTogglePublic(trip);
          if (index === 1) {
            copyTripLink(trip.id);
          }
          if (index === 2) onEdit(trip);
          if (index === 3) onDelete(trip);
        },
      );
      return;
    }

    Alert.alert(trip.title, undefined, [
      baseActions[0],
      { text: '공개 여행 링크 복사', onPress: () => { copyTripLink(trip.id); } },
      baseActions[1],
      baseActions[2],
      baseActions[3],
    ]);
    return;
  }

  const options = [toggleLabel, '수정', '삭제', '취소'];
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      { options, destructiveButtonIndex: 2, cancelButtonIndex: 3 },
      (index) => {
        if (index === 0) onTogglePublic(trip);
        if (index === 1) onEdit(trip);
        if (index === 2) onDelete(trip);
      },
    );
    return;
  }

  Alert.alert(trip.title, undefined, baseActions);
}

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { trips, loading, error, reload, update, remove } = useTrips();
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showQuickCheckin, setShowQuickCheckin] = useState(false);
  const avatarUrl = useAvatarUrl();
  const { lastCheckin, setLastCheckin, checkinLoading } = useLastNearbyCheckin();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  const handleTripPress = (trip: Trip) => {
    navigation.navigate('Trip', { trip });
  };

  const handleUpdateTrip = async (data: TripFormData) => {
    if (!editingTrip) return;
    await update(editingTrip.id, data);
    setEditingTrip(null);
  };

  const handleTogglePublic = async (trip: Trip) => {
    try {
      await update(trip.id, { is_public: !trip.is_public });
    } catch {
      Alert.alert('오류', '공개 설정 변경에 실패했습니다.');
    }
  };

  const handleMenuPress = (trip: Trip) => {
    showTripMenu({
      trip,
      onTogglePublic: handleTogglePublic,
      onEdit: setEditingTrip,
      onDelete: (targetTrip) => confirmDeleteTrip(targetTrip, remove),
    });
  };

  const renderTrip = ({ item }: { item: Trip }) => (
    <TripCard
      trip={item}
      onPress={() => handleTripPress(item)}
      onMenuPress={() => handleMenuPress(item)}
    />
  );

  const quickCheckinStatusText = checkinLoading
    ? '현재 위치 확인 중...'
    : lastCheckin
      ? `${lastCheckin.trip_title}: ${lastCheckin.title || lastCheckin.place || '(이름 없음)'} · ${formatRelativeTime(lastCheckin.checked_in_at)}`
      : '자주 가는 곳을 빠르게 기록';

  return (
    <SafeAreaView style={styles.container} edges={['top']} testID="screen-home">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Travel Companion</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          style={styles.avatarButton}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person-outline" size={18} color="#9CA3AF" />
            </View>
          )}
        </TouchableOpacity>
      </View>

      <HomeQuickCheckinCard
        statusText={quickCheckinStatusText}
        isActive={!!lastCheckin}
        onPress={() => setShowQuickCheckin(true)}
      />

      <HomeTripList
        trips={trips}
        loading={loading}
        refreshing={refreshing}
        error={error}
        onRefresh={onRefresh}
        reload={reload}
        renderTrip={renderTrip}
      />

      {/* Edit Trip Modal */}
      <TripFormModal
        visible={!!editingTrip}
        onClose={() => setEditingTrip(null)}
        onSubmit={handleUpdateTrip}
        mode="edit"
        initialTrip={editingTrip ?? undefined}
      />

      <QuickCheckinSheet
        visible={showQuickCheckin}
        onClose={() => setShowQuickCheckin(false)}
        onCheckedIn={(checkin) => setLastCheckin(checkin)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F0EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
