import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Trip, TripFormData } from '@travel-companion/shared';
import LocationPickerContent from './LocationPickerContent';
import { useTripForm } from './hooks/useTripForm';
import { TripPlaceSection, TripToggleSection, TripDateSection } from './TripFormSections';

interface TripFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: TripFormData) => Promise<void>;
  mode?: 'create' | 'edit';
  initialTrip?: Trip;
}


export default function TripFormModal({ visible, onClose, onSubmit, mode = 'create', initialTrip }: TripFormModalProps) {
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const {
    title, setTitle, description, setDescription,
    startDate, setStartDate, endDate, setEndDate,
    isPublic, setIsPublic, isFrequent, setIsFrequent,
    place, setPlace, setPlaceId,
    placeLat, setPlaceLat, placeLng, setPlaceLng,
    submitting, error, canSubmit,
    handleClose, handleClearPlace, handleSubmit,
  } = useTripForm(visible, initialTrip, onSubmit, onClose);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      {/* 위치 선택 Modal (장소 검색 + 지도) - TripForm Modal 위에 표시 */}
      <Modal visible={showLocationPicker} animationType="slide" presentationStyle="pageSheet">
        <LocationPickerContent
          initialLatitude={placeLat}
          initialLongitude={placeLng}
          onConfirm={(lat, lng, placeName, selectedPlaceId) => {
            setPlaceLat(lat);
            setPlaceLng(lng);
            setPlace(placeName || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
            setPlaceId(selectedPlaceId || '');
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
              <TripDateSection
                label="시작일"
                iconName="calendar-outline"
                iconColor="#FF6B47"
                labelStyle={styles.dateLabel}
                date={startDate}
                showPicker={showStartPicker}
                onToggle={() => { setShowStartPicker(!showStartPicker); setShowEndPicker(false); }}
                onDateChange={(d) => { if (d) setStartDate(d); }}
                onDone={() => setShowStartPicker(false)}
              />
              <TripDateSection
                label="종료일"
                iconName="flag-outline"
                iconColor="#F59E0B"
                labelStyle={styles.endDateLabel}
                date={endDate}
                showPicker={showEndPicker}
                onToggle={() => { setShowEndPicker(!showEndPicker); setShowStartPicker(false); }}
                onDateChange={(d) => { if (d) setEndDate(d); }}
                onDone={() => setShowEndPicker(false)}
              />

              {/* 장소 섹션 */}
              <TripPlaceSection
                place={place}
                onClear={handleClearPlace}
                onAdd={() => setShowLocationPicker(true)}
              />

              {/* 공개/자주 가는 곳 토글 */}
              <TripToggleSection
                isPublic={isPublic}
                setIsPublic={setIsPublic}
                isFrequent={isFrequent}
                setIsFrequent={setIsFrequent}
              />

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
  dateLabel: { fontSize: 11, fontWeight: '700', color: '#FF6B47', letterSpacing: 0.6 },
  endDateLabel: { fontSize: 11, fontWeight: '700', color: '#F59E0B', letterSpacing: 0.6 },
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
