import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import * as Location from 'expo-location';
import { supabase } from '../../../lib/supabase';
import { useCheckinsStore } from '../../../store/checkinsStore';
import { usePhotoPicker } from '../../../components/PhotoPickerButton';
import { consumeLocationPickerResult } from '../../../lib/locationPickerStore';
import { useTrips } from '../../../hooks/useTrips';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../../../utils/categoryIcons';
import type { RootStackParamList } from '../../../navigation/AppNavigator';

async function loadTagSuggestions(): Promise<string[]> {
  const { data } = await supabase
    .from('checkins')
    .select('tags')
    .not('tags', 'eq', '{}');
  if (!data) return [];
  return [...new Set(data.flatMap((c: { tags: string[] }) => c.tags ?? []))];
}

type NavigationProp = StackNavigationProp<RootStackParamList, 'CheckinForm'>;
type FormRouteProp = RouteProp<RootStackParamList, 'CheckinForm'>;

export function useCheckinForm() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<FormRouteProp>();
  const addCheckin = useCheckinsStore((s) => s.addCheckin);
  const updateCheckinAction = useCheckinsStore((s) => s.updateCheckin);
  const {
    tripId: paramTripId,
    tripTitle,
    initialLatitude,
    initialLongitude,
    initialPlace,
    initialPlaceId,
    checkin: editingCheckin,
  } = route.params;
  const isEditMode = !!editingCheckin;
  const hasInitialLocationRef = useRef(
    (editingCheckin?.latitude != null && editingCheckin?.longitude != null) ||
    (initialLatitude != null && initialLongitude != null)
  );
  const { trips } = useTrips();
  const [selectedTripId, setSelectedTripId] = useState<string | undefined>(paramTripId);

  const [title, setTitle] = useState(editingCheckin?.title ?? '');
  const [message, setMessage] = useState(editingCheckin?.message ?? '');
  const [category, setCategory] = useState(editingCheckin?.category ?? '');
  const [tags, setTags] = useState<string[]>(editingCheckin?.tags ?? []);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();

  useFocusEffect(
    useCallback(() => {
      const result = consumeLocationPickerResult();
      if (result) {
        setLatitude(result.latitude);
        setLongitude(result.longitude);
        setPlace(result.placeName ?? '');
        setPlaceId(result.placeId ?? '');
      }
    }, [])
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.avatar_url) {
        setAvatarUrl(user.user_metadata.avatar_url);
      }
    });
  }, []);

  useEffect(() => {
    loadTagSuggestions().then(setTagSuggestions).catch(() => {});
  }, []);

  useEffect(() => {
    if (hasInitialLocationRef.current) return;
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
      if (result.latitude && result.longitude) {
        setLatitude(result.latitude);
        setLongitude(result.longitude);
      }
      if (result.takenAt) {
        setCheckedInAt(result.takenAt);
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
        tags,
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
        await updateCheckinAction(editingCheckin.id, payload);
      } else {
        const checkinPayload = selectedTripId
          ? { trip_id: selectedTripId, ...payload }
          : payload;
        await addCheckin(checkinPayload as Parameters<typeof addCheckin>[0]);
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
      tripId: selectedTripId,
      tripTitle,
      initialLatitude: latitude,
      initialLongitude: longitude,
    });
  };

  const handleClearPhoto = () => {
    setPhotoUrl('');
    setPhotoPreview('');
    setPhotoMetadata(null);
  };

  const handleAddTag = useCallback((tag: string) => {
    setTags(prev => prev.includes(tag) ? prev : [...prev, tag]);
  }, []);

  const handleRemoveTag = useCallback((tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  }, []);

  const catColor = CATEGORY_COLORS[category] ?? '#C4A882';
  const catIconName = CATEGORY_ICONS[category] ?? 'pricetag-outline';

  return {
    navigation,
    paramTripId,
    tripTitle,
    isEditMode,
    trips,
    selectedTripId,
    setSelectedTripId,
    title,
    setTitle,
    message,
    setMessage,
    category,
    setCategory,
    tags,
    tagSuggestions,
    handleAddTag,
    handleRemoveTag,
    latitude,
    setLatitude,
    longitude,
    setLongitude,
    place,
    setPlace,
    setPlaceId,
    photoPreview,
    checkedInAt,
    setCheckedInAt,
    showTimePicker,
    setShowTimePicker,
    showCategorySelector,
    setShowCategorySelector,
    isSubmitting,
    isProcessingPhoto,
    error,
    avatarUrl,
    showPhotoPicker,
    canSubmit,
    handleSubmit,
    handleLocationPicker,
    handleClearPhoto,
    catColor,
    catIconName,
  };
}
