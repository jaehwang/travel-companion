import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface TimePickerSectionProps {
  checkedInAt: Date | null;
  onClose: () => void;
  onClear: () => void;
  onChangeDate: (date: Date) => void;
}

export default function TimePickerSection({ checkedInAt, onClose, onClear, onChangeDate }: TimePickerSectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>언제 방문했나요?</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>완료</Text>
        </TouchableOpacity>
      </View>
      <DateTimePicker
        value={checkedInAt || new Date()}
        mode="datetime"
        display="spinner"
        textColor="#1F2937"
        onChange={(_, date) => {
          if (date) onChangeDate(date);
        }}
      />
      {checkedInAt && (
        <TouchableOpacity onPress={onClear} style={styles.clearButton}>
          <Text style={styles.clearText}>시각 지정 삭제</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1.5,
    borderTopColor: '#E8E0D4',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  closeButton: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    backgroundColor: '#F3F0EB',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: 'hidden',
  },
  clearButton: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  clearText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C4B49A',
  },
});
