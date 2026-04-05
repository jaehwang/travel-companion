import React from 'react';
import { TextInput, StyleSheet } from 'react-native';

interface NoteSectionProps {
  value: string;
  onChangeText: (text: string) => void;
}

export default function NoteSection({ value, onChangeText }: NoteSectionProps) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder="이 순간을 기록해보세요..."
      placeholderTextColor="#C4B49A"
      style={styles.messageInput}
      multiline
      textAlignVertical="top"
    />
  );
}

const styles = StyleSheet.create({
  messageInput: {
    fontSize: 17,
    color: '#6B7280',
    lineHeight: 28,
    minHeight: 100,
  },
});
