import React from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet } from 'react-native';
import PhotoSection from './PhotoSection';
import InfoChips from './InfoChips';
import NoteSection from './NoteSection';
import TagInput from './TagInput';

interface FormBodyProps {
  title: string;
  onChangeTitle: (text: string) => void;
  message: string;
  onChangeMessage: (text: string) => void;
  photoPreview: string;
  isProcessingPhoto: boolean;
  onClearPhoto: () => void;
  latitude: number | undefined;
  longitude: number | undefined;
  place: string;
  category: string;
  checkedInAt: Date | null;
  catColor: string;
  catIconName: string;
  onClearLocation: () => void;
  onClearCategory: () => void;
  onClearTime: () => void;
  tags: string[];
  tagSuggestions: string[];
  aiTagSuggestions: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  error: string | null;
}

export default function FormBody({
  title,
  onChangeTitle,
  message,
  onChangeMessage,
  photoPreview,
  isProcessingPhoto,
  onClearPhoto,
  latitude,
  longitude,
  place,
  category,
  checkedInAt,
  catColor,
  catIconName,
  onClearLocation,
  onClearCategory,
  onClearTime,
  tags,
  tagSuggestions,
  aiTagSuggestions,
  onAddTag,
  onRemoveTag,
  error,
}: FormBodyProps) {
  return (
    <ScrollView
      style={styles.body}
      contentContainerStyle={styles.bodyContent}
      keyboardShouldPersistTaps="handled"
    >
      <TextInput
        testID="input-checkin-title"
        value={title}
        onChangeText={onChangeTitle}
        placeholder="어디에 다녀왔나요?"
        placeholderTextColor="#C4B49A"
        style={styles.titleInput}
        autoFocus
      />

      <View style={styles.divider} />

      <NoteSection value={message} onChangeText={onChangeMessage} />

      <TagInput
        tags={tags}
        suggestions={tagSuggestions}
        aiSuggestions={aiTagSuggestions}
        onAddTag={onAddTag}
        onRemoveTag={onRemoveTag}
      />

      <PhotoSection
        photoPreview={photoPreview}
        isProcessingPhoto={isProcessingPhoto}
        onClearPhoto={onClearPhoto}
      />

      <InfoChips
        latitude={latitude}
        longitude={longitude}
        place={place}
        category={category}
        checkedInAt={checkedInAt}
        catColor={catColor}
        catIconName={catIconName}
        onClearLocation={onClearLocation}
        onClearCategory={onClearCategory}
        onClearTime={onClearTime}
      />

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 20,
    paddingBottom: 96,
  },
  titleInput: {
    fontSize: 24,
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
  errorBox: {
    marginTop: 14,
    padding: 14,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
  },
});
