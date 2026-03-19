import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import { createCheckin, updateCheckin } from '../lib/api';
import { usePhotoPicker } from '../components/PhotoPickerButton';
import CheckinFormToolbar from '../components/CheckinFormToolbar';
import CategorySelector from '../components/CategorySelector';
import PlaceSearchPanel from '../components/PlaceSearchPanel';
import type { AppStackParamList } from '../navigation/AppNavigator';
import { CHECKIN_CATEGORY_LABELS } from '../../../../packages/shared/src/types';

type NavigationProp = StackNavigationProp<AppStackParamList, 'CheckinForm'>;
type FormRouteProp = RouteProp<AppStackParamList, 'CheckinForm'>;

const CATEGORY_EMOJI: Record<string, string> = {
  restaurant: '🍽️', attraction: '🏛️', accommodation: '🏨',
  cafe: '☕', shopping: '🛍️', nature: '🌿',
  activity: '🎯', transportation: '🚌', other: '📌',
};

const CATEGORY_COLORS: Record<string, string> = {
  restaurant: '#FF6B47', cafe: '#F59E0B', attraction: '#3B82F6',
  accommodation: '#8B5CF6', shopping: '#EC4899', nature: '#10B981',
  activity: '#EF4444', transportation: '#6B7280', other: '#C4A882',
};

export default function CheckinFormScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<FormRouteProp>();
  const { tripId, tripTitle, initialLatitude, initialLongitude, initialPlace, initialPlaceId, locationResult, checkin: editingCheckin } = route.params;
  const isEditMode = !!editingCheckin;

  const [title, setTitle] = useState(editingCheckin?.title ?? '');
  const [message, setMessage] = useState(editingCheckin?.message ?? '');
  const [category, setCategory] = useState(editingCheckin?.category ?? '');
  const [latitude, setLatitude] = useState<number | undefined>(editingCheckin?.latitude ?? initialLatitude);
  const [longitude, setLongitude] = useState<number | undefined>(editingCheckin?.longitude ?? initialLongitude);
  const [place, setPlace] = useState(editingCheckin?.place ?? initialPlace ?? '');
  const [placeId, setPlaceId] = useState(editingCheckin?.place_id ?? initialPlaceId ?? '');
  const [photoUrl, setPhotoUrl] = useState(editingCheckin?.photo_url ?? '');
  const [photoPreview, setPhotoPreview] = useState(editingCheckin?.photo_url ?? '');
  const [photoMetadata, setPhotoMetadata] = useState<Record<string, unknown> | null>(null);
  const [checkedInAt, setCheckedInAt] = useState<Date | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [showPlaceSearch, setShowPlaceSearch] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();

  // Receive location result from LocationPickerScreen
  useEffect(() => {
    if (locationResult) {
      setLatitude(locationResult.latitude);
      setLongitude(locationResult.longitude);
      if (locationResult.placeName) setPlace(locationResult.placeName);
      if (locationResult.placeId) setPlaceId(locationResult.placeId);
    }
  }, [locationResult]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.avatar_url) {
        setAvatarUrl(user.user_metadata.avatar_url);
      }
    });
  }, []);

  // Try to get current location if no initial location
  useEffect(() => {
    if (latitude != null && longitude != null) return;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLatitude(loc.coords.latitude);
        setLongitude(loc.coords.longitude);
      } catch {
        // ignore
      }
    })();
  }, []);

  const { showPicker: showPhotoPicker } = usePhotoPicker({
    onPhotoPicked: (result) => {
      setPhotoUrl(result.publicUrl);
      setPhotoPreview(result.uri);
      setPhotoMetadata({
        width: result.width,
        height: result.height,
        gps: !!(result.latitude && result.longitude),
      });
      if (result.latitude && result.longitude && latitude == null) {
        setLatitude(result.latitude);
        setLongitude(result.longitude);
      }
    },
    onProcessing: setIsProcessingPhoto,
    onError: (msg) => setError(msg),
  });

  const canSubmit = !!title.trim() && latitude != null && longitude != null && !isSubmitting && !isProcessingPhoto;

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }
    if (latitude == null || longitude == null) {
      setError('위치를 선택해주세요.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        title: title.trim(),
        message: message.trim() || undefined,
        category: category || undefined,
        latitude,
        longitude,
        place: place.trim() || undefined,
        place_id: placeId || undefined,
        photo_url: photoUrl || undefined,
        photo_metadata: photoMetadata ? {
          width: photoMetadata.width as number | undefined,
          height: photoMetadata.height as number | undefined,
        } : undefined,
        checked_in_at: checkedInAt ? checkedInAt.toISOString() : undefined,
      };
      if (isEditMode && editingCheckin) {
        await updateCheckin(editingCheckin.id, payload);
      } else {
        await createCheckin({ trip_id: tripId, ...payload });
      }
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : '체크인 저장에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLocationPicker = () => {
    navigation.navigate('LocationPicker', {
      initialLatitude: latitude,
      initialLongitude: longitude,
    });
  };

  const handlePlaceSelected = (lat: number, lng: number, name: string, pid: string) => {
    setLatitude(lat);
    setLongitude(lng);
    setPlace(name);
    setPlaceId(pid);
    setShowPlaceSearch(false);
  };

  const catColor = CATEGORY_COLORS[category] ?? '#C4A882';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.headerAvatar} />
            ) : (
              <View style={styles.headerAvatarPlaceholder}>
                <Text style={{ fontSize: 14 }}>👤</Text>
              </View>
            )}
            <Text style={styles.headerTripName} numberOfLines={1}>{tripTitle}</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelButton}>
              <Text style={styles.cancelText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!canSubmit}
              style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={[styles.submitText, !canSubmit && styles.submitTextDisabled]}>
                  {isEditMode ? '저장' : '체크인'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Body */}
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="어디에 다녀왔나요?"
            placeholderTextColor="#C4B49A"
            style={styles.titleInput}
            autoFocus
          />

          <View style={styles.divider} />

          {/* Message */}
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="이 순간을 기록해보세요..."
            placeholderTextColor="#C4B49A"
            style={styles.messageInput}
            multiline
            textAlignVertical="top"
          />

          {/* Processing Photo */}
          {isProcessingPhoto && (
            <View style={styles.processingBox}>
              <ActivityIndicator size="small" color="#F97316" />
              <Text style={styles.processingText}>사진 처리 중...</Text>
            </View>
          )}

          {/* Photo Preview */}
          {photoPreview && !isProcessingPhoto ? (
            <View style={styles.photoContainer}>
              <TouchableOpacity
                onPress={() => {
                  setPhotoUrl('');
                  setPhotoPreview('');
                  setPhotoMetadata(null);
                }}
                style={styles.clearChip}
              >
                <Text style={styles.clearChipText}>📷 사진 삭제 ✕</Text>
              </TouchableOpacity>
              <Image source={{ uri: photoPreview }} style={styles.photoPreview} resizeMode="cover" />
            </View>
          ) : null}

          {/* Info Chips */}
          <View style={styles.chipContainer}>
            {latitude != null && longitude != null && (
              <TouchableOpacity
                onPress={() => {
                  setLatitude(undefined);
                  setLongitude(undefined);
                  setPlace('');
                  setPlaceId('');
                }}
                style={styles.chip}
              >
                <Text style={styles.chipText}>
                  📍 {place || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`}
                </Text>
                <Text style={styles.chipClose}>✕</Text>
              </TouchableOpacity>
            )}
            {category ? (
              <TouchableOpacity onPress={() => setCategory('')} style={[styles.chip, { backgroundColor: `${catColor}18` }]}>
                <Text style={[styles.chipText, { color: catColor }]}>
                  {CATEGORY_EMOJI[category] || '🏷️'} {CHECKIN_CATEGORY_LABELS[category as keyof typeof CHECKIN_CATEGORY_LABELS] || category}
                </Text>
                <Text style={[styles.chipClose, { color: catColor }]}>✕</Text>
              </TouchableOpacity>
            ) : null}
            {checkedInAt && (
              <TouchableOpacity
                onPress={() => setCheckedInAt(null)}
                style={[styles.chip, { backgroundColor: 'rgba(139,92,246,0.1)' }]}
              >
                <Text style={[styles.chipText, { color: '#8B5CF6' }]}>
                  ⏰ {new Intl.DateTimeFormat('ko-KR', {
                    month: 'long', day: 'numeric', weekday: 'short',
                    hour: '2-digit', minute: '2-digit',
                  }).format(checkedInAt)}
                </Text>
                <Text style={[styles.chipClose, { color: '#8B5CF6' }]}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Error */}
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </ScrollView>

        {/* Toolbar */}
        <CheckinFormToolbar
          hasPhoto={!!photoPreview}
          hasLocation={latitude != null && longitude != null}
          hasCategory={!!category}
          hasTime={!!checkedInAt}
          onPhoto={showPhotoPicker}
          onPlace={() => setShowPlaceSearch(true)}
          onCategory={() => setShowCategorySelector(true)}
          onTime={() => setShowTimePicker(true)}
        />

        {/* Time Picker */}
        {showTimePicker && (
          <View style={styles.timePickerContainer}>
            <View style={styles.timePickerHeader}>
              <Text style={styles.timePickerTitle}>언제 방문했나요?</Text>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <Text style={styles.timePickerClose}>닫기</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={checkedInAt || new Date()}
              mode="datetime"
              display="spinner"
              onChange={(_, date) => {
                if (date) setCheckedInAt(date);
              }}
            />
            {checkedInAt && (
              <TouchableOpacity
                onPress={() => { setCheckedInAt(null); setShowTimePicker(false); }}
                style={styles.clearTimeButton}
              >
                <Text style={styles.clearTimeText}>시각 지정 삭제</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Category Selector */}
      <CategorySelector
        visible={showCategorySelector}
        selected={category}
        onSelect={setCategory}
        onClose={() => setShowCategorySelector(false)}
      />

      {/* Place Search */}
      <PlaceSearchPanel
        visible={showPlaceSearch}
        onClose={() => setShowPlaceSearch(false)}
        onPlaceSelected={handlePlaceSelected}
        currentLat={latitude}
        currentLng={longitude}
      />
    </SafeAreaView>
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
    marginRight: 12,
  },
  headerAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  headerAvatarPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3F0EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTripName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    flex: 1,
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
  messageInput: {
    fontSize: 17,
    color: '#6B7280',
    lineHeight: 28,
    minHeight: 100,
  },
  processingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    padding: 14,
    backgroundColor: '#F3F0EB',
    borderRadius: 12,
  },
  processingText: {
    fontSize: 13,
    color: '#6B7280',
  },
  photoContainer: {
    marginTop: 14,
  },
  clearChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,107,71,0.1)',
    marginBottom: 8,
  },
  clearChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B47',
  },
  photoPreview: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 14,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,107,71,0.1)',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF6B47',
  },
  chipClose: {
    fontSize: 11,
    opacity: 0.7,
    color: '#FF6B47',
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
  timePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1.5,
    borderTopColor: '#E8E0D4',
    paddingBottom: 20,
  },
  timePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  timePickerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  timePickerClose: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    backgroundColor: '#F3F0EB',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: 'hidden',
  },
  clearTimeButton: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  clearTimeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C4B49A',
  },
});
