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
import DateTimePicker from '@react-native-community/datetimepicker';
import type { TripFormData } from '../../../../packages/shared/src/types';

interface TripFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: TripFormData) => Promise<void>;
}

const formatDate = (date: Date | null): string => {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatDateDisplay = (date: Date | null): string => {
  if (!date) return '날짜 선택';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  }).format(date);
};

export default function TripFormModal({ visible, onClose, onSubmit }: TripFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setTitle('');
    setDescription('');
    setStartDate(null);
    setEndDate(null);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('여행 이름을 입력해주세요.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        start_date: formatDate(startDate) || undefined,
        end_date: formatDate(endDate) || undefined,
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
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Text style={{ fontSize: 15 }}>✈️</Text>
            </View>
            <Text style={styles.headerTitle}>새 여행 만들기</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={handleClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!canSubmit}
              style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={[styles.submitText, !canSubmit && styles.submitTextDisabled]}>
                  만들기
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Body */}
        <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
          <TextInput
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

          {/* Start Date */}
          <View style={styles.dateSection}>
            <TouchableOpacity
              onPress={() => setShowStartPicker(!showStartPicker)}
              style={styles.dateCard}
            >
              <Text style={styles.dateLabel}>📅 시작일</Text>
              <Text style={[styles.dateValue, !startDate && styles.datePlaceholder]}>
                {formatDateDisplay(startDate)}
              </Text>
            </TouchableOpacity>
            {showStartPicker && (
              <DateTimePicker
                value={startDate || new Date()}
                mode="date"
                display="spinner"
                onChange={(_, date) => {
                  if (Platform.OS === 'android') setShowStartPicker(false);
                  if (date) setStartDate(date);
                }}
              />
            )}
          </View>

          {/* End Date */}
          <View style={styles.dateSection}>
            <TouchableOpacity
              onPress={() => setShowEndPicker(!showEndPicker)}
              style={styles.dateCard}
            >
              <Text style={[styles.dateLabel, { color: '#F59E0B' }]}>🏁 종료일</Text>
              <Text style={[styles.dateValue, !endDate && styles.datePlaceholder]}>
                {formatDateDisplay(endDate)}
              </Text>
            </TouchableOpacity>
            {showEndPicker && (
              <DateTimePicker
                value={endDate || new Date()}
                mode="date"
                display="spinner"
                onChange={(_, date) => {
                  if (Platform.OS === 'android') setShowEndPicker(false);
                  if (date) setEndDate(date);
                }}
              />
            )}
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </ScrollView>
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
  dateLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF6B47',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  datePlaceholder: {
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
