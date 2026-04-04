import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Modal, FlatList,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { fetchNearbyCheckins, updateCheckin } from '../lib/api';
import type { NearbyCheckin } from '../lib/api';

interface QuickCheckinSheetProps {
  visible: boolean;
  onClose: () => void;
  onCheckedIn?: (checkin: NearbyCheckin) => void;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export default function QuickCheckinSheet({ visible, onClose, onCheckedIn }: QuickCheckinSheetProps) {
  const [checkins, setCheckins] = useState<NearbyCheckin[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('위치 권한이 필요합니다.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const result = await fetchNearbyCheckins(loc.coords.latitude, loc.coords.longitude);
      setCheckins(result);
    } catch {
      setError('근처 장소를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  const handleCheckin = async (item: NearbyCheckin) => {
    setCheckingIn(item.id);
    try {
      await updateCheckin(item.id, { checked_in_at: new Date().toISOString() });
      const updated = { ...item, checked_in_at: new Date().toISOString() };
      onCheckedIn?.(updated);
      onClose();
    } catch {
      Alert.alert('오류', '체크인에 실패했습니다.');
    } finally {
      setCheckingIn(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Ionicons name="flash-outline" size={18} color="#F97316" />
            <Text style={styles.headerTitle}> 자주 가는 곳에 체크인하기</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>닫기</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#F97316" />
            <Text style={styles.loadingText}>근처 장소 찾는 중...</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={load} style={styles.retryBtn}>
              <Text style={styles.retryText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        ) : checkins.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="location-outline" size={40} color="#C4B49A" />
            <Text style={styles.emptyText}>근처에 등록된 장소가 없습니다</Text>
            <Text style={styles.emptySubText}>자주 가는 곳으로 설정된 여행의 체크인이 표시됩니다</Text>
          </View>
        ) : (() => {
          // 여행별 그룹핑 (API 정렬: checked_in_at DESC → 그룹 내 첫 번째 = 마지막 체크인)
          const groups = checkins.reduce<{ tripId: string; tripTitle: string; items: NearbyCheckin[] }[]>(
            (acc, c) => {
              const g = acc.find(g => g.tripId === c.trip_id);
              if (g) { g.items.push(c); } else { acc.push({ tripId: c.trip_id, tripTitle: c.trip_title, items: [c] }); }
              return acc;
            }, []
          );
          return (
            <FlatList
              data={groups}
              keyExtractor={(g) => g.tripId}
              contentContainerStyle={styles.list}
              renderItem={({ item: group }) => {
                const current = group.items[0];
                return (
                  <View style={styles.group}>
                    {/* 여행 헤더 + 현재 상태 */}
                    <View style={styles.groupHeader}>
                      <Text style={styles.groupTitle}>{group.tripTitle}</Text>
                      <Text style={styles.groupCurrent}>
                        {`현재: ${current.title || current.place || '(이름 없음)'} · ${formatRelativeTime(current.checked_in_at)}`}
                      </Text>
                    </View>
                    {/* 체크인 목록 */}
                    {group.items.map(item => {
                      const isCurrent = item.id === current.id;
                      const isLoading = checkingIn === item.id;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[styles.item, isCurrent && styles.itemCurrent]}
                          onPress={() => handleCheckin(item)}
                          disabled={!!checkingIn}
                        >
                          <View style={styles.itemLeft}>
                            <Text style={styles.itemTitle}>{item.title || item.place || '(이름 없음)'}</Text>
                            <Text style={styles.itemSub}>{formatDistance(item.distance)}</Text>
                          </View>
                          {isLoading ? (
                            <ActivityIndicator size="small" color="#F97316" />
                          ) : (
                            <View style={[styles.checkBtn, isCurrent && styles.checkBtnCurrent]}>
                              <Text style={[styles.checkBtnText, isCurrent && { color: '#FFFFFF' }]}>
                                {isCurrent ? '여기!' : '체크인'}
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                );
              }}
            />
          );
        })()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 32,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F0EB',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1F2937',
  },
  closeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F3F0EB',
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9CA3AF',
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    marginBottom: 12,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F97316',
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4B5563',
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  list: {
    padding: 16,
  },
  group: {
    marginBottom: 16,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F0EB',
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6B7280',
  },
  groupCurrent: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F97316',
    flexShrink: 1,
    marginLeft: 8,
    textAlign: 'right',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 13,
    marginBottom: 8,
  },
  itemCurrent: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
    borderColor: '#FED7AA',
  },
  itemLeft: {
    flex: 1,
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  itemSub: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  checkBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  checkBtnCurrent: {
    backgroundColor: '#F97316',
  },
  checkBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
});
