'use client';

import { useState, useRef, ChangeEvent } from 'react';
import imageCompression from 'browser-image-compression';
import { supabase } from '@/lib/supabase';
import { extractPhotoMetadata } from '@/lib/exif';
import type { PhotoMetadata } from '@/lib/exif';

interface UsePhotoUploadOptions {
  onGpsExtracted?: (lat: number, lng: number) => void;
  onError?: (message: string) => void;
}

export interface UsePhotoUploadReturn {
  photoUrl: string;
  photoPreviewUrl: string;
  photoMetadata: PhotoMetadata | null;
  isProcessingPhoto: boolean;
  isUploadingPhoto: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileSelect: (e: ChangeEvent<HTMLInputElement>) => Promise<void>;
  clearPhoto: () => void;
  reset: (initialPhotoUrl?: string) => void;
}

export function usePhotoUpload({
  onGpsExtracted,
  onError,
}: UsePhotoUploadOptions = {}): UsePhotoUploadReturn {
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('');
  const [photoMetadata, setPhotoMetadata] = useState<PhotoMetadata | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearPhoto = () => {
    setPhotoUrl('');
    setPhotoPreviewUrl('');
    setPhotoMetadata(null);
  };

  const reset = (initialPhotoUrl?: string) => {
    setPhotoUrl(initialPhotoUrl || '');
    setPhotoPreviewUrl(initialPhotoUrl || '');
    setPhotoMetadata(null);
    setIsProcessingPhoto(false);
    setIsUploadingPhoto(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onError?.('이미지 파일만 업로드 가능합니다.');
      return;
    }

    setIsProcessingPhoto(true);
    const preview = URL.createObjectURL(file);
    setPhotoPreviewUrl(preview);
    setPhotoUrl('');

    try {
      const meta = await extractPhotoMetadata(file);
      setPhotoMetadata(meta);

      if (meta.gps?.latitude && meta.gps?.longitude) {
        onGpsExtracted?.(meta.gps.latitude, meta.gps.longitude);
      }

      setIsUploadingPhoto(true);
      setIsProcessingPhoto(false);

      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        initialQuality: 0.85,
      };
      const compressed = await imageCompression(file, options);
      const filePath = `photos/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('trip-photos')
        .upload(filePath, compressed, { cacheControl: '31536000', upsert: false });
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from('trip-photos')
        .getPublicUrl(filePath);
      const photoUrl = publicData.publicUrl.replace(
        'https://xdqxccochovzcdkmdrpp.supabase.co',
        'https://travel-companion-photo.kim-jaehwang.workers.dev'
      );

      setPhotoUrl(photoUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '사진 업로드에 실패했습니다.';
      onError?.(msg);
      setPhotoPreviewUrl('');
      setPhotoMetadata(null);
    } finally {
      setIsProcessingPhoto(false);
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return {
    photoUrl,
    photoPreviewUrl,
    photoMetadata,
    isProcessingPhoto,
    isUploadingPhoto,
    fileInputRef,
    handleFileSelect,
    clearPhoto,
    reset,
  };
}
