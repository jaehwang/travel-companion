import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
  ActivityIndicator,
  ActionSheetIOS,
  Alert,
  Platform,
} from 'react-native';
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
import type { TripsStackParamList, RootStackParamList } from '../navigation/AppNavigator';
import type { Trip, TripFormData } from '../../../../packages/shared/src/types';
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

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
const { trips, loading, error, reload, update, remove } = useTrips();
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
  const [showQuickCheckin, setShowQuickCheckin] = useState(false);
  const [lastCheckin, setLastCheckin] = useState<NearbyCheckin | null>(null);
  const [checkinLoading, setCheckinLoading] = useState(true);
  const locationPermissionGranted = useRef(false);

  // Load user avatar
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.avatar_url) {
        setAvatarUrl(user.user_metadata.avatar_url);
      }
    });
  }, []);

  // 홈 화면에 포커스될 때마다 최신 체크인 정보를 갱신한다.
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
    const toggleLabel = trip.is_public ? '비공개로 전환' : '공개로 전환';
    const copyLinkLabel = '공개 여행 링크 복사';

    const handleCopyLink = async () => {
      const url = `${API_URL}/story/${trip.id}`;
      await Clipboard.setStringAsync(url);
      Alert.alert('링크 복사됨', '클립보드에 복사되었습니다.');
    };

    if (trip.is_public) {
      const options = [toggleLabel, copyLinkLabel, '수정', '삭제', '취소'];
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          { options, destructiveButtonIndex: 3, cancelButtonIndex: 4 },
          (index) => {
            if (index === 0) handleTogglePublic(trip);
            if (index === 1) handleCopyLink();
            if (index === 2) setEditingTrip(trip);
            if (index === 3) confirmDelete(trip);
          },
        );
      } else {
        Alert.alert(trip.title, undefined, [
          { text: toggleLabel, onPress: () => handleTogglePublic(trip) },
          { text: copyLinkLabel, onPress: handleCopyLink },
          { text: '수정', onPress: () => setEditingTrip(trip) },
          { text: '삭제', style: 'destructive', onPress: () => confirmDelete(trip) },
          { text: '취소', style: 'cancel' },
        ]);
      }
    } else {
      const options = [toggleLabel, '수정', '삭제', '취소'];
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          { options, destructiveButtonIndex: 2, cancelButtonIndex: 3 },
          (index) => {
            if (index === 0) handleTogglePublic(trip);
            if (index === 1) setEditingTrip(trip);
            if (index === 2) confirmDelete(trip);
          },
        );
      } else {
        Alert.alert(trip.title, undefined, [
          { text: toggleLabel, onPress: () => handleTogglePublic(trip) },
          { text: '수정', onPress: () => setEditingTrip(trip) },
          { text: '삭제', style: 'destructive', onPress: () => confirmDelete(trip) },
          { text: '취소', style: 'cancel' },
        ]);
      }
    }
  };

  const confirmDelete = (trip: Trip) => {
    Alert.alert('여행 삭제', `"${trip.title}"을(를) 삭제하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await remove(trip.id);
          } catch {
            Alert.alert('오류', '삭제에 실패했습니다.');
          }
        },
      },
    ]);
  };

  const renderTrip = ({ item }: { item: Trip }) => (
    <TripCard
      trip={item}
      onPress={() => handleTripPress(item)}
      onMenuPress={() => handleMenuPress(item)}
    />
  );

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

      {/* 빠른 체크인 */}
      <TouchableOpacity
        style={styles.quickCheckinBtn}
        onPress={() => setShowQuickCheckin(true)}
      >
        <Ionicons name="flash-outline" size={22} color="#F97316" />
        <View style={{ flex: 1 }}>
          <Text style={styles.quickCheckinLabel}>자주 가는 곳에 체크인하기</Text>
          <Text
            style={[styles.quickCheckinStatus, lastCheckin ? { color: '#F97316' } : undefined]}
            numberOfLines={1}
          >
            {checkinLoading
              ? '현재 위치 확인 중...'
              : lastCheckin
                ? `${lastCheckin.trip_title}: ${lastCheckin.title || lastCheckin.place || '(이름 없음)'} · ${formatRelativeTime(lastCheckin.checked_in_at)}`
                : '자주 가는 곳을 빠르게 기록'}
          </Text>
        </View>
        <Text style={styles.quickCheckinArrow}>›</Text>
      </TouchableOpacity>

      {/* Trip List */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={reload} style={styles.retryButton}>
            <Text style={styles.retryText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      ) : (
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
      )}

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
  quickCheckinArrow: {
    fontSize: 20,
    color: '#D1D5DB',
    fontWeight: '300',
  },
});
