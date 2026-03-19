import React, { useState } from 'react';
import {
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { uploadPhoto } from '../lib/api';

interface PhotoPickerResult {
  uri: string;
  publicUrl: string;
  latitude?: number;
  longitude?: number;
  width?: number;
  height?: number;
  fileSize?: number;
}

interface UsePhotoPickerOptions {
  onPhotoPicked: (result: PhotoPickerResult) => void;
  onProcessing?: (processing: boolean) => void;
  onError?: (error: string) => void;
}

export function usePhotoPicker({ onPhotoPicked, onProcessing, onError }: UsePhotoPickerOptions) {
  const [processing, setProcessing] = useState(false);

  const processAndUpload = async (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setProcessing(true);
    onProcessing?.(true);

    try {
      // Extract EXIF GPS
      let latitude: number | undefined;
      let longitude: number | undefined;
      if (asset.exif) {
        const gpsLat = asset.exif.GPSLatitude;
        const gpsLng = asset.exif.GPSLongitude;
        if (typeof gpsLat === 'number' && typeof gpsLng === 'number') {
          latitude = gpsLat;
          longitude = gpsLng;
        }
      }

      // Compress image
      const MAX_SIZE = 1920;
      const needsResize = (asset.width && asset.width > MAX_SIZE) || (asset.height && asset.height > MAX_SIZE);
      const actions: ImageManipulator.Action[] = [];
      if (needsResize) {
        if ((asset.width || 0) > (asset.height || 0)) {
          actions.push({ resize: { width: MAX_SIZE } });
        } else {
          actions.push({ resize: { height: MAX_SIZE } });
        }
      }

      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        actions,
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Upload to Supabase Storage
      const fileName = `photo_${Date.now()}.jpg`;
      const publicUrl = await uploadPhoto(manipulated.uri, fileName);

      onPhotoPicked({
        uri: manipulated.uri,
        publicUrl,
        latitude,
        longitude,
        width: manipulated.width,
        height: manipulated.height,
      });
    } catch (err) {
      onError?.(err instanceof Error ? err.message : '사진 처리에 실패했습니다.');
    } finally {
      setProcessing(false);
      onProcessing?.(false);
    }
  };

  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 라이브러리 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      exif: true,
    });

    await processAndUpload(result);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '카메라 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 1,
      exif: true,
    });

    await processAndUpload(result);
  };

  const showPicker = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['취소', '사진 촬영', '앨범에서 선택'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) takePhoto();
          if (buttonIndex === 2) pickFromLibrary();
        },
      );
    } else {
      // Android: show Alert as action sheet
      Alert.alert('사진', '', [
        { text: '취소', style: 'cancel' },
        { text: '사진 촬영', onPress: takePhoto },
        { text: '앨범에서 선택', onPress: pickFromLibrary },
      ]);
    }
  };

  return { showPicker, processing };
}
