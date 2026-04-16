import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TagInputProps {
  tags: string[];
  suggestions: string[];
  aiSuggestions?: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}

export default function TagInput({ tags, suggestions, aiSuggestions = [], onAddTag, onRemoveTag }: TagInputProps) {
  const [input, setInput] = useState('');

  const visibleAiSuggestions = aiSuggestions.filter(s => !tags.includes(s));
  const visibleSuggestions = suggestions
    .filter(s => !tags.includes(s) && !aiSuggestions.includes(s))
    .slice(0, 10);

  const commitInput = () => {
    const tag = input.trim().replace(/^#+/, '');
    if (tag && !tags.includes(tag)) {
      onAddTag(tag);
    }
    setInput('');
  };

  return (
    <View style={styles.container}>
      {/* 선택된 태그 */}
      {tags.length > 0 && (
        <View style={styles.selectedRow}>
          {tags.map(tag => (
            <TouchableOpacity
              key={tag}
              style={styles.selectedChip}
              onPress={() => onRemoveTag(tag)}
              activeOpacity={0.7}
              testID={`tag-selected-${tag}`}
            >
              <Text style={styles.selectedChipText}>#{tag}</Text>
              <Ionicons name="close" size={12} color="#F97316" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 태그 입력 */}
      <View style={styles.inputRow}>
        <Text style={styles.hash}>#</Text>
        <TextInput
          testID="input-tag"
          style={styles.input}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={commitInput}
          onBlur={commitInput}
          placeholder="태그 추가"
          placeholderTextColor="#C4B49A"
          returnKeyType="done"
          autoCorrect={false}
          autoComplete="off"
          blurOnSubmit={false}
        />
        {input.trim().length > 0 && (
          <TouchableOpacity
            onPress={commitInput}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            testID="btn-add-tag"
          >
            <Ionicons name="add-circle" size={22} color="#F97316" />
          </TouchableOpacity>
        )}
      </View>

      {/* AI 추천 태그 */}
      {visibleAiSuggestions.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.suggestionsScroll}
          contentContainerStyle={styles.suggestionsContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.aiLabel}>
            <Ionicons name="sparkles" size={11} color="#F97316" />
          </View>
          {visibleAiSuggestions.map(tag => (
            <TouchableOpacity
              key={tag}
              style={styles.aiChip}
              onPress={() => onAddTag(tag)}
              activeOpacity={0.7}
              testID={`tag-ai-${tag}`}
            >
              <Text style={styles.aiChipText}>#{tag}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* 이전 태그 제안 */}
      {visibleSuggestions.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.suggestionsScroll}
          contentContainerStyle={styles.suggestionsContent}
          keyboardShouldPersistTaps="handled"
        >
          {visibleSuggestions.map(tag => (
            <TouchableOpacity
              key={tag}
              style={styles.suggestionChip}
              onPress={() => onAddTag(tag)}
              activeOpacity={0.7}
              testID={`tag-suggestion-${tag}`}
            >
              <Text style={styles.suggestionChipText}>#{tag}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 14,
    gap: 8,
  },
  selectedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF3E8',
    borderWidth: 1,
    borderColor: '#FDBA74',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  selectedChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F97316',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F5F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  hash: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C4B49A',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    padding: 0,
  },
  suggestionsScroll: {
    marginTop: 2,
  },
  suggestionsContent: {
    gap: 6,
    paddingVertical: 2,
  },
  suggestionChip: {
    backgroundColor: '#F3F0EB',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  suggestionChipText: {
    fontSize: 12,
    color: '#8B7355',
    fontWeight: '600',
  },
  aiLabel: {
    justifyContent: 'center',
    marginRight: 2,
  },
  aiChip: {
    backgroundColor: '#FFF3E8',
    borderWidth: 1,
    borderColor: '#FDBA74',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  aiChipText: {
    fontSize: 12,
    color: '#F97316',
    fontWeight: '600',
  },
});
