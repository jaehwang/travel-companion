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
import * as Location from 'expo-location';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { fetchCheckins, createCheckin } from '../lib/api';
import type { Checkin } from '../../../../packages/shared/src/types';
import { CHECKIN_CATEGORY_LABELS } from '../../../../packages/shared/src/types';
import type { AppStackParamList } from '../../App';

type Props = NativeStackScreenProps<AppStackParamList, 'CheckinList'>;

export default function CheckinListScreen({ route }: Props) {
  const { tripId } = route.params;
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newCheckinTitle, setNewCheckinTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const loadCheckins = useCallback(async () => {
    try {
      const data = await fetchCheckins(tripId);
      setCheckins(data);
    } catch (error) {
      console.error('Failed to load checkins:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tripId]);

  useFocusEffect(
    useCallback(() => {
      loadCheckins();
    }, [loadCheckins])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadCheckins();
  };

  const handleCreateCheckin = async () => {
    if (!newCheckinTitle.trim()) return;
    setCreating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('위치 권한 필요', '체크인을 위해 위치 접근을 허용해주세요.');
        setCreating(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      await createCheckin({
        trip_id: tripId,
        title: newCheckinTitle.trim(),
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        category: 'other',
        checked_in_at: new Date().toISOString(),
      });

      setNewCheckinTitle('');
      setModalVisible(false);
      loadCheckins();
    } catch (error) {
      Alert.alert('오류', '체크인을 생성할 수 없습니다.');
    } finally {
      setCreating(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
  };

  const getCategoryLabel = (category?: string): string => {
    if (!category) return '';
    return (CHECKIN_CATEGORY_LABELS as Record<string, string>)[category] ?? category;
  };

  const renderCheckin = ({ item }: { item: Checkin }) => (
    <View style={styles.checkinCard}>
      <View style={styles.checkinRow}>
        {item.photo_url ? (
          <Image source={{ uri: item.photo_url }} style={styles.thumbnail} />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Text style={styles.thumbnailPlaceholderText}>📍</Text>
          </View>
        )}
        <View style={styles.checkinInfo}>
          <Text style={styles.checkinTitle} numberOfLines={1}>
            {item.title || '체크인'}
          </Text>
          {item.place ? (
            <Text style={styles.checkinPlace} numberOfLines={1}>{item.place}</Text>
          ) : null}
          <View style={styles.checkinMeta}>
            {item.category ? (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{getCategoryLabel(item.category)}</Text>
              </View>
            ) : null}
            <Text style={styles.checkinTime}>{formatTime(item.checked_in_at)}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <ActivityIndicator size="large" color="#4285F4" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {checkins.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📍</Text>
          <Text style={styles.emptyTitle}>아직 체크인이 없습니다</Text>
          <Text style={styles.emptySubtitle}>
            아래 버튼을 눌러 현재 위치에서 체크인하세요
          </Text>
        </View>
      ) : (
        <FlatList
          data={checkins}
          keyExtractor={(item) => item.id}
          renderItem={renderCheckin}
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
            <Text style={styles.modalTitle}>새 체크인</Text>
            <Text style={styles.modalDescription}>
              현재 위치에서 체크인합니다
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="체크인 제목 (예: 맛있는 라멘집)"
              placeholderTextColor="#9CA3AF"
              value={newCheckinTitle}
              onChangeText={setNewCheckinTitle}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setNewCheckinTitle('');
                  setModalVisible(false);
                }}
              >
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalCreateButton, (!newCheckinTitle.trim() || creating) && styles.modalCreateButtonDisabled]}
                onPress={handleCreateCheckin}
                disabled={!newCheckinTitle.trim() || creating}
              >
                {creating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalCreateText}>체크인</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  list: {
    padding: 16,
  },
  checkinCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  checkinRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  thumbnailPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailPlaceholderText: {
    fontSize: 24,
  },
  checkinInfo: {
    flex: 1,
    marginLeft: 12,
  },
  checkinTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  checkinPlace: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  checkinMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 11,
    color: '#4F46E5',
    fontWeight: '500',
  },
  checkinTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
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
    marginBottom: 4,
  },
  modalDescription: {
    fontSize: 14,
    color: '#6B7280',
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
