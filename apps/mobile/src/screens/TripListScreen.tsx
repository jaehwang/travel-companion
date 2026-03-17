import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fetchTrips, createTrip } from '../lib/api';
import { signOut } from '../lib/auth';
import type { Trip } from '../../../../packages/shared/src/types';
import type { AppStackParamList } from '../../App';

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList, 'TripList'>;
};

export default function TripListScreen({ navigation }: Props) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTripTitle, setNewTripTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const loadTrips = useCallback(async () => {
    try {
      const data = await fetchTrips();
      setTrips(data);
    } catch (error) {
      console.error('Failed to load trips:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTrips();
    }, [loadTrips])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadTrips();
  };

  const handleCreateTrip = async () => {
    if (!newTripTitle.trim()) return;
    setCreating(true);
    try {
      await createTrip({ title: newTripTitle.trim() });
      setNewTripTitle('');
      setModalVisible(false);
      loadTrips();
    } catch (error) {
      Alert.alert('오류', '여행을 생성할 수 없습니다.');
    } finally {
      setCreating(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('로그아웃', '정말 로그아웃하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  const renderTrip = ({ item }: { item: Trip }) => (
    <TouchableOpacity
      style={styles.tripCard}
      onPress={() => navigation.navigate('CheckinList', { tripId: item.id, tripTitle: item.title })}
      activeOpacity={0.7}
    >
      {item.cover_photo_url ? (
        <Image source={{ uri: item.cover_photo_url }} style={styles.coverImage} />
      ) : (
        <View style={styles.coverPlaceholder}>
          <Text style={styles.coverPlaceholderText}>🗺️</Text>
        </View>
      )}
      <View style={styles.tripInfo}>
        <Text style={styles.tripTitle} numberOfLines={1}>{item.title}</Text>
        {item.description ? (
          <Text style={styles.tripDescription} numberOfLines={2}>{item.description}</Text>
        ) : null}
        <Text style={styles.tripDate}>
          {formatDate(item.start_date || item.first_checkin_date || item.created_at)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#4285F4" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>내 여행</Text>
        <TouchableOpacity onPress={handleSignOut} style={styles.logoutButton}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </View>

      {trips.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>✈️</Text>
          <Text style={styles.emptyTitle}>여행을 시작해보세요</Text>
          <Text style={styles.emptySubtitle}>
            아래 버튼을 눌러 첫 번째 여행을 만들어보세요
          </Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item.id}
          renderItem={renderTrip}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>새 여행 만들기</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="여행 제목"
              placeholderTextColor="#9CA3AF"
              value={newTripTitle}
              onChangeText={setNewTripTitle}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setNewTripTitle('');
                  setModalVisible(false);
                }}
              >
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalCreateButton, (!newTripTitle.trim() || creating) && styles.modalCreateButtonDisabled]}
                onPress={handleCreateTrip}
                disabled={!newTripTitle.trim() || creating}
              >
                {creating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalCreateText}>만들기</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  logoutButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  logoutText: {
    fontSize: 14,
    color: '#6B7280',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 12,
  },
  coverImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#F3F4F6',
  },
  coverPlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverPlaceholderText: {
    fontSize: 40,
  },
  tripInfo: {
    padding: 16,
  },
  tripTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  tripDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  tripDate: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '300',
    marginTop: -2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  modalCancelText: {
    fontSize: 15,
    color: '#6B7280',
  },
  modalCreateButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalCreateButtonDisabled: {
    opacity: 0.5,
  },
  modalCreateText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
