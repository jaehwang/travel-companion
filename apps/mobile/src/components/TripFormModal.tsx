import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { Trip, TripFormData } from '@travel-companion/shared';
import { toISODateString, formatDateDisplay } from '@travel-companion/shared';
import LocationPickerContent from './LocationPickerContent';

interface TripFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: TripFormData) => Promise<void>;
  mode?: 'create' | 'edit';
  initialTrip?: Trip;
}

const formatDate = (date: Date | null): string => {
  if (!date) return '';
  return toISODateString(date);
};

const parseDate = (dateStr?: string | null): Date | null => {
  if (!dateStr) return null;
  // YYYY-MM-DD 형식 파싱 (타임존 영향 없이 로컬 날짜로)
  const parts = dateStr.substring(0, 10).split('-').map(Number);
  if (parts.length < 3 || parts.some(isNaN)) return null;
  const [y, m, d] = parts;
  const date = new Date(y, m - 1, d);
  return isNaN(date.getTime()) ? null : date;
};

export default function TripFormModal({ visible, onClose, onSubmit, mode = 'create', initialTrip }: TripFormModalProps) {
  const [title, setTitle] = useState(initialTrip?.title ?? '');
  const [description, setDescription] = useState(initialTrip?.description ?? '');
  const [startDate, setStartDate] = useState<Date | null>(parseDate(initialTrip?.start_date));
  const [endDate, setEndDate] = useState<Date | null>(parseDate(initialTrip?.end_date));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [isPublic, setIsPublic] = useState(initialTrip?.is_public ?? false);
  const [isFrequent, setIsFrequent] = useState(initialTrip?.is_frequent ?? false);
  const [place, setPlace] = useState(initialTrip?.place ?? '');
  const [placeId, setPlaceId] = useState(initialTrip?.place_id ?? '');
  const [placeLat, setPlaceLat] = useState<number | undefined>(initialTrip?.latitude ?? undefined);
  const [placeLng, setPlaceLng] = useState<number | undefined>(initialTrip?.longitude ?? undefined);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // initialTrip 변경 시 폼 초기화 (edit 모드에서 다른 여행 수정 시)
  useEffect(() => {
    if (visible) {
      setTitle(initialTrip?.title ?? '');
      setDescription(initialTrip?.description ?? '');
      setStartDate(parseDate(initialTrip?.start_date));
      setEndDate(parseDate(initialTrip?.end_date));
      setIsPublic(initialTrip?.is_public ?? false);
      setIsFrequent(initialTrip?.is_frequent ?? false);
      setPlace(initialTrip?.place ?? '');
      setPlaceId(initialTrip?.place_id ?? '');
      setPlaceLat(initialTrip?.latitude ?? undefined);
      setPlaceLng(initialTrip?.longitude ?? undefined);
      setError(null);
    }
  }, [visible, initialTrip]);

  const reset = () => {
    setTitle(''); setDescription('');
    setStartDate(null); setEndDate(null);
    setIsPublic(false); setIsFrequent(false);
    setPlace(''); setPlaceId(''); setPlaceLat(undefined); setPlaceLng(undefined);
    setError(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleClearPlace = () => {
    setPlace(''); setPlaceId(''); setPlaceLat(undefined); setPlaceLng(undefined);
  };

  const handleSubmit = async () => {
    if (!title.trim()) { setError('여행 이름을 입력해주세요.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        start_date: formatDate(startDate) || undefined,
        end_date: formatDate(endDate) || undefined,
        is_public: isPublic,
        is_frequent: isFrequent,
        place: place.trim() || null,
        place_id: placeId || null,
        latitude: placeLat ?? null,
        longitude: placeLng ?? null,
      });
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = !!title.trim() && !submitting;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      {/* 위치 선택 Modal (장소 검색 + 지도) - TripForm Modal 위에 표시 */}
      <Modal visible={showLocationPicker} animationType="slide" presentationStyle="pageSheet">
        <LocationPickerContent
          initialLatitude={placeLat}
          initialLongitude={placeLng}
          onConfirm={(lat, lng, placeName, placeId) => {
            setPlaceLat(lat);
            setPlaceLng(lng);
            setPlace(placeName || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
            setPlaceId(placeId || '');
            setShowLocationPicker(false);
          }}
          onClose={() => setShowLocationPicker(false)}
        />
      </Modal>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
          <>
            {/* 헤더 */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.headerIcon}>
                  <Ionicons
                    name={mode === 'create' ? 'airplane-outline' : 'pencil-outline'}
                    size={16}
                    color="#FF6B47"
                  />
                </View>
                <Text style={styles.headerTitle}>{mode === 'create' ? '새 여행 만들기' : '여행 수정'}</Text>
              </View>
              <View style={styles.headerButtons}>
                <TouchableOpacity onPress={handleClose} style={styles.cancelButton}>
                  <Text style={styles.cancelText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="btn-save-trip"
                  onPress={handleSubmit}
                  disabled={!canSubmit}
                  style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={[styles.submitText, !canSubmit && styles.submitTextDisabled]}>
                      {mode === 'create' ? '만들기' : '저장'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* 본문 */}
            <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
              <TextInput
                testID="input-trip-title"
                value={title}
                onChangeText={setTitle}
                placeholder="여행 이름을 지어주세요"
                placeholderTextColor="#C4B49A"
                style={styles.titleInput}
                autoFocus
              />

              <View style={styles.divider} />

              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="어떤 여행인지 적어보세요..."
                placeholderTextColor="#C4B49A"
                style={styles.descInput}
                multiline
                textAlignVertical="top"
              />

              {/* 날짜 섹션 */}
              <View style={styles.dateSection}>
                <TouchableOpacity
                  onPress={() => { setShowStartPicker(!showStartPicker); setShowEndPicker(false); }}
                  style={styles.dateCard}
                >
                  <View style={styles.dateLabelRow}>
                    <Ionicons name="calendar-outline" size={11} color="#FF6B47" />
                    <Text style={styles.dateLabel}>시작일</Text>
                  </View>
                  <Text style={[styles.dateValue, !startDate && styles.datePlaceholder]}>
                    {formatDateDisplay(startDate)}
                  </Text>
                </TouchableOpacity>
                {showStartPicker && (
                  <View style={styles.pickerContainer}>
                    <DateTimePicker
                      value={startDate || new Date()}
                      mode="date"
                      display="spinner"
                      onChange={(_, date) => {
                        if (Platform.OS === 'android') setShowStartPicker(false);
                        if (date) setStartDate(date);
                      }}
                    />
                    <TouchableOpacity
                      onPress={() => setShowStartPicker(false)}
                      style={styles.pickerDoneButton}
                    >
                      <Text style={styles.pickerDoneText}>완료</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.dateSection}>
                <TouchableOpacity
                  onPress={() => { setShowEndPicker(!showEndPicker); setShowStartPicker(false); }}
                  style={styles.dateCard}
                >
                  <View style={styles.dateLabelRow}>
                    <Ionicons name="flag-outline" size={11} color="#F59E0B" />
                    <Text style={[styles.dateLabel, { color: '#F59E0B' }]}>종료일</Text>
                  </View>
                  <Text style={[styles.dateValue, !endDate && styles.datePlaceholder]}>
                    {formatDateDisplay(endDate)}
                  </Text>
                </TouchableOpacity>
                {showEndPicker && (
                  <View style={styles.pickerContainer}>
                    <DateTimePicker
                      value={endDate || new Date()}
                      mode="date"
                      display="spinner"
                      onChange={(_, date) => {
                        if (Platform.OS === 'android') setShowEndPicker(false);
                        if (date) setEndDate(date);
                      }}
                    />
                    <TouchableOpacity
                      onPress={() => setShowEndPicker(false)}
                      style={styles.pickerDoneButton}
                    >
                      <Text style={styles.pickerDoneText}>완료</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* 장소 섹션 */}
              <View style={styles.placeSection}>
                <Text style={styles.sectionLabel}>대표 장소</Text>
                {place ? (
                  <View style={styles.placeCard}>
                    <Ionicons name="location-outline" size={18} color="#FF6B47" />
                    <Text style={styles.placeText}>{place}</Text>
                    <TouchableOpacity onPress={handleClearPlace} style={styles.placeClearButton}>
                      <Ionicons name="close" size={12} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => setShowLocationPicker(true)}
                    style={styles.placeAddButton}
                  >
                    <Ionicons name="location-outline" size={18} color="#FF6B47" />
                    <Text style={styles.placeAddText}>장소 추가</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* 공개 토글 */}
              <View style={styles.publicRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.publicLabel}>공개 여행</Text>
                  <Text style={styles.publicDesc}>링크로 공유할 수 있어요</Text>
                </View>
                <Switch
                  value={isPublic}
                  onValueChange={setIsPublic}
                  trackColor={{ false: '#E8E0D4', true: '#FF6B47' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* 자주 가는 곳 토글 */}
              <View style={styles.publicRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.publicLabelRow}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.publicLabel}>자주 가는 곳</Text>
                  </View>
                  <Text style={styles.publicDesc}>빠른 체크인 목록에 표시됩니다</Text>
                </View>
                <Switch
                  value={isFrequent}
                  onValueChange={setIsFrequent}
                  trackColor={{ false: '#E8E0D4', true: '#F59E0B' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
            </ScrollView>
          </>
      </KeyboardAvoidingView>
    </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: '#E8E0D4',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,107,71,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.1,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F3F0EB',
  },
  cancelText: {
    color: '#9CA3AF',
    fontWeight: '700',
    fontSize: 14,
  },
  submitButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FF6B47',
    shadowColor: '#FF6B47',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#F3F0EB',
    shadowOpacity: 0,
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  submitTextDisabled: {
    color: '#C4B49A',
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  titleInput: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  divider: {
    height: 1.5,
    backgroundColor: '#E8E0D4',
    marginBottom: 14,
  },
  descInput: {
    fontSize: 17,
    color: '#6B7280',
    lineHeight: 28,
    marginBottom: 24,
    minHeight: 80,
  },
  dateSection: {
    marginBottom: 12,
  },
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
  pickerDoneText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF6B47',
  },
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
  dateLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF6B47',
    letterSpacing: 0.6,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  datePlaceholder: {
    color: '#C4B49A',
  },
  placeSection: {
    marginTop: 8,
    marginBottom: 12,
  },
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
  placeText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
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
  placeAddText: {
    fontSize: 14,
    color: '#C4B49A',
  },
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
  publicLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  publicLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  publicDesc: {
    fontSize: 12,
    color: '#C4B49A',
  },
  errorBox: {
    padding: 14,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    marginTop: 12,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
  },
});
