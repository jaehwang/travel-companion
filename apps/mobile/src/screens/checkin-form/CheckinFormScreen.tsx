import React from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CheckinFormToolbar from '../../components/CheckinFormToolbar';
import TimePickerSection from './sections/TimePickerSection';
import FormHeader from './sections/FormHeader';
import FormBody from './sections/FormBody';
import CategorySelector from '../../components/CategorySelector';
import { useCheckinForm } from './hooks/useCheckinForm';

export default function CheckinFormScreen() {
  const form = useCheckinForm();

  return (
    <SafeAreaView testID="screen-checkin-form" style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FormHeader
          avatarUrl={form.avatarUrl}
          paramTripId={form.paramTripId}
          tripTitle={form.tripTitle}
          trips={form.trips}
          selectedTripId={form.selectedTripId}
          onSelectTripId={form.setSelectedTripId}
          isEditMode={form.isEditMode}
          isSubmitting={form.isSubmitting}
          canSubmit={form.canSubmit}
          onCancel={() => form.navigation.goBack()}
          onSubmit={form.handleSubmit}
        />

        <FormBody
          title={form.title}
          onChangeTitle={form.setTitle}
          message={form.message}
          onChangeMessage={form.setMessage}
          photoPreview={form.photoPreview}
          isProcessingPhoto={form.isProcessingPhoto}
          onClearPhoto={form.handleClearPhoto}
          latitude={form.latitude}
          longitude={form.longitude}
          place={form.place}
          category={form.category}
          checkedInAt={form.checkedInAt}
          catColor={form.catColor}
          catIconName={form.catIconName}
          onClearLocation={() => {
            form.setLatitude(undefined);
            form.setLongitude(undefined);
            form.setPlace('');
            form.setPlaceId('');
          }}
          onClearCategory={() => form.setCategory('')}
          onClearTime={() => form.setCheckedInAt(null)}
          tags={form.tags}
          tagSuggestions={form.tagSuggestions}
          onAddTag={form.handleAddTag}
          onRemoveTag={form.handleRemoveTag}
          error={form.error}
        />

        <CheckinFormToolbar
          hasPhoto={!!form.photoPreview}
          hasLocation={form.latitude != null && form.longitude != null}
          hasCategory={!!form.category}
          hasTime={!!form.checkedInAt}
          onPhoto={form.showPhotoPicker}
          onPlace={form.handleLocationPicker}
          onCategory={() => form.setShowCategorySelector(true)}
          onTime={() => form.setShowTimePicker(true)}
        />

        {form.showTimePicker && (
          <TimePickerSection
            checkedInAt={form.checkedInAt}
            onClose={() => form.setShowTimePicker(false)}
            onClear={() => { form.setCheckedInAt(null); form.setShowTimePicker(false); }}
            onChangeDate={form.setCheckedInAt}
          />
        )}
      </KeyboardAvoidingView>

      <CategorySelector
        visible={form.showCategorySelector}
        selected={form.category}
        onSelect={form.setCategory}
        onClose={() => form.setShowCategorySelector(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
});
