'use client';

import { useState, useRef, ChangeEvent } from 'react';
import imageCompression from 'browser-image-compression';
import { supabase } from '@/lib/supabase';
import { extractPhotoMetadata, isValidGPS, type PhotoMetadata } from '@/lib/exif';

interface PhotoUploadProps {
  onUploadComplete?: (photoUrl: string, metadata: PhotoMetadata) => void;
  onUploadError?: (error: string) => void;
}

export default function PhotoUpload({ onUploadComplete, onUploadError }: PhotoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [metadata, setMetadata] = useState<PhotoMetadata | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 파일 선택 핸들러
  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('=== 파일 선택 시작 ===');
    console.log('브라우저 정보:', {
      userAgent: navigator.userAgent,
      platform: navigator.platform
    });

    // 이미지 파일 확인
    if (!file.type.startsWith('image/')) {
      onUploadError?.('이미지 파일만 업로드 가능합니다.');
      return;
    }

    setSelectedFile(file);
    setIsProcessing(true);

    // 미리보기 생성
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);

    try {
      console.log('⏳ EXIF 메타데이터 추출 시작...');
      // EXIF 메타데이터 추출
      const meta = await extractPhotoMetadata(file);
      setMetadata(meta);
      console.log('✅ 추출 완료! 메타데이터:', meta);
      console.log('=== 파일 선택 완료 ===');
    } catch (error) {
      console.error('❌ 메타데이터 추출 실패:', error);
      onUploadError?.('메타데이터 추출에 실패했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Supabase Storage에 업로드
  const handleUpload = async () => {
    if (!selectedFile || !metadata) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 이미지 압축 옵션
      const options = {
        maxSizeMB: 1, // 최대 1MB
        maxWidthOrHeight: 1920, // 최대 1920px
        useWebWorker: true,
        initialQuality: 0.85, // 품질 85%
      };

      console.log('🔄 이미지 압축 시작...', {
        원본크기: (selectedFile.size / 1024 / 1024).toFixed(2) + 'MB',
        원본이름: selectedFile.name
      });

      setUploadProgress(30);

      // 이미지 압축
      const compressedFile = await imageCompression(selectedFile, options);

      console.log('✅ 이미지 압축 완료!', {
        압축크기: (compressedFile.size / 1024 / 1024).toFixed(2) + 'MB',
        압축률: ((1 - compressedFile.size / selectedFile.size) * 100).toFixed(1) + '%'
      });

      setUploadProgress(50);

      // 파일명 생성 (타임스탬프 + 원본 파일명)
      const timestamp = Date.now();
      const fileName = `${timestamp}_${selectedFile.name}`;
      const filePath = `photos/${fileName}`;

      // Supabase Storage에 압축된 이미지 업로드
      const { data, error } = await supabase.storage
        .from('trip-photos')
        .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      setUploadProgress(100);

      // Signed URL 생성 (1년 유효)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('trip-photos')
        .createSignedUrl(filePath, 31536000); // 1년 = 365 * 24 * 60 * 60

      if (signedUrlError) {
        throw signedUrlError;
      }

      const photoUrl = signedUrlData.signedUrl;
      console.log('✅ 업로드 완료:', photoUrl);

      // 업로드 완료 콜백
      onUploadComplete?.(photoUrl, metadata);

      // 상태 초기화
      resetForm();
    } catch (error: any) {
      console.error('업로드 실패:', error);
      onUploadError?.(error.message || '업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  // 폼 초기화
  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setMetadata(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">📷 사진 업로드</h2>

      {/* 파일 선택 */}
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          사진 선택
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={isProcessing || isUploading}
          className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
        />
      </div>

      {/* 미리보기 */}
      {previewUrl && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">미리보기</h3>
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full max-h-96 object-contain rounded-lg border"
          />
        </div>
      )}

      {/* 메타데이터 정보 */}
      {metadata && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">📊 메타데이터</h3>

          {/* GPS 정보 */}
          {metadata.gps && isValidGPS(metadata.gps) ? (
            <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded">
              <p className="font-semibold text-green-800 mb-1">✅ GPS 정보 발견!</p>
              <p className="text-sm text-gray-700">
                📍 위도: {metadata.gps.latitude.toFixed(6)}
              </p>
              <p className="text-sm text-gray-700">
                📍 경도: {metadata.gps.longitude.toFixed(6)}
              </p>
              {metadata.gps.altitude && (
                <p className="text-sm text-gray-700">
                  ⛰️ 고도: {metadata.gps.altitude.toFixed(1)}m
                </p>
              )}
              {metadata.gps.timestamp && (
                <p className="text-sm text-gray-700">
                  🕐 촬영 시간: {new Date(metadata.gps.timestamp).toLocaleString('ko-KR')}
                </p>
              )}
            </div>
          ) : (
            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="font-semibold text-yellow-800">⚠️ GPS 정보 없음</p>
              <p className="text-sm text-gray-600">
                이 사진에는 위치 정보가 포함되어 있지 않습니다.
              </p>
            </div>
          )}

          {/* 기타 정보 */}
          <div className="space-y-1 text-sm text-gray-700">
            {metadata.width && metadata.height && (
              <p>📐 크기: {metadata.width} x {metadata.height}px</p>
            )}
            {metadata.fileSize && (
              <p>💾 파일 크기: {(metadata.fileSize / 1024 / 1024).toFixed(2)}MB</p>
            )}
            {metadata.cameraMake && (
              <p>📷 카메라: {metadata.cameraMake} {metadata.cameraModel}</p>
            )}
            {metadata.takenAt && (
              <p>🕐 촬영 시간: {metadata.takenAt.toLocaleString('ko-KR')}</p>
            )}
          </div>
        </div>
      )}

      {/* 업로드 진행 상태 */}
      {isUploading && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-1 text-center">
            업로드 중... {uploadProgress}%
          </p>
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="flex gap-3">
        <button
          onClick={handleUpload}
          disabled={!selectedFile || !metadata || isProcessing || isUploading}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isUploading ? '업로드 중...' : '업로드'}
        </button>

        {selectedFile && (
          <button
            onClick={resetForm}
            disabled={isProcessing || isUploading}
            className="px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
          >
            취소
          </button>
        )}
      </div>

      {/* 처리 중 상태 */}
      {isProcessing && (
        <div className="mt-4 text-center text-gray-600">
          <p>📊 메타데이터 추출 중...</p>
        </div>
      )}
    </div>
  );
}
