import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatDateDisplay } from './hooks/useTripForm';

export const PUBLIC_SWITCH_TRACK_COLOR = { false: '#E8E0D4', true: '#FF6B47' };
export const FREQUENT_SWITCH_TRACK_COLOR = { false: '#E8E0D4', true: '#F59E0B' };

export interface TripPlaceSectionProps {
  place: string;
  onClear: () => void;
  onAdd: () => void;
}

export function TripPlaceSection({ place, onClear, onAdd }: TripPlaceSectionProps) {
  return (
    <View style={styles.placeSection}>
      <Text style={styles.sectionLabel}>대표 장소</Text>
      {place ? (
        <View style={styles.placeCard}>
          <Ionicons name="location-outline" size={18} color="#FF6B47" />
          <Text style={styles.placeText}>{place}</Text>
          <TouchableOpacity onPress={onClear} style={styles.placeClearButton}>
            <Ionicons name="close" size={12} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity onPress={onAdd} style={styles.placeAddButton}>
          <Ionicons name="location-outline" size={18} color="#FF6B47" />
          <Text style={styles.placeAddText}>장소 추가</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export interface TripToggleSectionProps {
  isPublic: boolean;
  setIsPublic: (v: boolean) => void;
  isFrequent: boolean;
  setIsFrequent: (v: boolean) => void;
}

export function TripToggleSection({ isPublic, setIsPublic, isFrequent, setIsFrequent }: TripToggleSectionProps) {
  return (
    <>
      <View style={styles.publicRow}>
        <View style={styles.toggleInfo}>
          <Text style={styles.publicLabel}>공개 여행</Text>
          <Text style={styles.publicDesc}>링크로 공유할 수 있어요</Text>
        </View>
        <Switch value={isPublic} onValueChange={setIsPublic} trackColor={PUBLIC_SWITCH_TRACK_COLOR} thumbColor="#FFFFFF" />
      </View>
      <View style={styles.publicRow}>
        <View style={styles.toggleInfo}>
          <View style={styles.publicLabelRow}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.publicLabel}>자주 가는 곳</Text>
          </View>
          <Text style={styles.publicDesc}>빠른 체크인 목록에 표시됩니다</Text>
        </View>
        <Switch value={isFrequent} onValueChange={setIsFrequent} trackColor={FREQUENT_SWITCH_TRACK_COLOR} thumbColor="#FFFFFF" />
      </View>
    </>
  );
}

export interface TripDateSectionProps {
  label: string;
  iconName: string;
  iconColor: string;
  labelStyle: object;
  date: Date | null;
  showPicker: boolean;
  onToggle: () => void;
  onDateChange: (date: Date | undefined) => void;
  onDone: () => void;
}

export function TripDateSection({ label, iconName, iconColor, labelStyle, date, showPicker, onToggle, onDateChange, onDone }: TripDateSectionProps) {
  return (
    <View style={styles.dateSection}>
      <TouchableOpacity onPress={onToggle} style={styles.dateCard}>
        <View style={styles.dateLabelRow}>
          <Ionicons name={iconName as any} size={11} color={iconColor} />
          <Text style={labelStyle}>{label}</Text>
        </View>
        <Text style={[styles.dateValue, !date && styles.datePlaceholder]}>
          {formatDateDisplay(date)}
        </Text>
      </TouchableOpacity>
      {showPicker && (
        <View style={styles.pickerContainer}>
          <DateTimePicker
            value={date || new Date()}
            mode="date"
            display="spinner"
            onChange={(_, d) => {
              if (Platform.OS === 'android') onDone();
              if (d) onDateChange(d);
            }}
          />
          <TouchableOpacity onPress={onDone} style={styles.pickerDoneButton}>
            <Text style={styles.pickerDoneText}>완료</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dateSection: { marginBottom: 12 },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginTop: 4,
    overflow: 'hidden',
    shadowColor: '#2D2416',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  pickerDoneButton: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E8E0D4',
  },
  pickerDoneText: { fontSize: 15, fontWeight: '700', color: '#FF6B47' },
  dateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#2D2416',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  dateLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  dateValue: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  datePlaceholder: { color: '#C4B49A' },
  placeSection: { marginTop: 8, marginBottom: 12 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  placeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#2D2416',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  placeText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1F2937' },
  placeClearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F0EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E8E0D4',
    borderStyle: 'dashed',
  },
  placeAddText: { fontSize: 14, color: '#C4B49A' },
  publicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#2D2416',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  toggleInfo: { flex: 1 },
  publicLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  publicLabel: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  publicDesc: { fontSize: 12, color: '#C4B49A' },
});
