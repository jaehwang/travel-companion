import React, { useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { Checkin } from '@travel-companion/shared';
import { CATEGORY_META } from '../../utils/categoryIcons';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const CARD_SIZE = (Dimensions.get('window').width - 16 * 2 - 8) / 2;

interface CheckinMapBottomSheetProps {
  allCheckins: Checkin[];
  selectedCheckins: Checkin[] | null;
  headerTitle: string | null;
  onCheckinPress: (checkin: Checkin) => void;
  onCollapse: () => void;
}

function CheckinGridCard({
  checkin,
  onPress,
}: {
  checkin: Checkin;
  onPress: () => void;
}) {
  const meta = CATEGORY_META[checkin.category ?? 'other'] ?? CATEGORY_META.other;

  return (
    <TouchableOpacity
      testID="checkin-card"
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {checkin.photo_url ? (
        <Image source={{ uri: checkin.photo_url }} style={styles.cardPhoto} />
      ) : (
        <View style={[styles.cardIconBg, { backgroundColor: meta.color + '22' }]}>
          <Ionicons name={meta.icon} size={28} color={meta.color} />
        </View>
      )}
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {checkin.title ?? checkin.place ?? '체크인'}
        </Text>
        {checkin.place && checkin.title && (
          <Text style={styles.cardPlace} numberOfLines={1}>
            {checkin.place}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function CheckinMapBottomSheet({
  allCheckins,
  selectedCheckins,
  headerTitle,
  onCheckinPress,
  onCollapse,
}: CheckinMapBottomSheetProps) {
  const { bottom } = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheet>(null);

  const snapPoints = useMemo(
    () => [80, Math.round(SCREEN_HEIGHT * 0.45), Math.round(SCREEN_HEIGHT * 0.85)],
    [],
  );

  const displayedCheckins = selectedCheckins ?? allCheckins;
  const showHeader = selectedCheckins !== null && headerTitle !== null;
  const isEmpty = displayedCheckins.length === 0;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={1}
      snapPoints={snapPoints}
      handleIndicatorStyle={styles.handle}
      onChange={(index) => { if (index === 0) onCollapse(); }}
    >
      {showHeader && (
        <View testID="sheet-header" style={styles.header}>
          <Text style={styles.headerTitle}>{headerTitle}</Text>
        </View>
      )}

      {isEmpty ? (
        <View testID="sheet-empty" style={styles.empty}>
          <Ionicons name="location-outline" size={40} color="#D1D5DB" />
          <Text style={styles.emptyText}>아직 체크인이 없습니다</Text>
        </View>
      ) : (
        <BottomSheetScrollView contentContainerStyle={[styles.grid, { paddingBottom: bottom + 16 }]}>
          {/* FlatList를 BottomSheetScrollView 안에서 쓰면 스크롤 충돌이 발생하므로
              2열 그리드를 직접 렌더링 */}
          <View style={styles.gridInner}>
            {displayedCheckins.map((checkin) => (
              <View key={checkin.id} style={styles.gridItem}>
                <CheckinGridCard checkin={checkin} onPress={() => onCheckinPress(checkin)} />
              </View>
            ))}
          </View>
        </BottomSheetScrollView>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  handle: {
    backgroundColor: '#D1D5DB',
    width: 36,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F0EB',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  grid: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  gridInner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridItem: {
    width: CARD_SIZE,
  },
  card: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardPhoto: {
    width: '100%',
    height: CARD_SIZE * 0.75,
  },
  cardIconBg: {
    width: '100%',
    height: CARD_SIZE * 0.75,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    padding: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  cardPlace: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
