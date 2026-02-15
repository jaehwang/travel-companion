'use client';

import { useState } from 'react';
import PhotoUpload from '@/components/PhotoUpload';
import type { PhotoMetadata } from '@/lib/exif';

export default function TestUploadPage() {
  const [uploadedPhotos, setUploadedPhotos] = useState<Array<{
    url: string;
    metadata: PhotoMetadata;
    uploadedAt: Date;
  }>>([]);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleUploadComplete = (photoUrl: string, metadata: PhotoMetadata) => {
    setUploadedPhotos(prev => [
      {
        url: photoUrl,
        metadata,
        uploadedAt: new Date(),
      },
      ...prev
    ]);
    setSuccess(`✅ 업로드 완료! URL: ${photoUrl}`);
    setError('');

    // 3초 후 성공 메시지 제거
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleUploadError = (errorMessage: string) => {
    setError(`❌ 업로드 실패: ${errorMessage}`);
    setSuccess('');
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-2">
            📸 사진 업로드 테스트
          </h1>
          <p className="text-center text-gray-600 mb-8">
            사진을 업로드하고 GPS 정보를 확인하세요
          </p>

          {/* 에러/성공 메시지 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
              {success}
            </div>
          )}

          {/* 업로드 컴포넌트 */}
          <PhotoUpload
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
          />

          {/* 업로드된 사진 목록 */}
          {uploadedPhotos.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">📂 업로드된 사진 ({uploadedPhotos.length})</h2>
              <div className="space-y-4">
                {uploadedPhotos.map((photo, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg shadow-md p-6 flex gap-4"
                  >
                    {/* 썸네일 */}
                    <div className="flex-shrink-0">
                      <img
                        src={photo.url}
                        alt={`Uploaded ${index + 1}`}
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    </div>

                    {/* 메타데이터 */}
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 mb-2">
                        업로드: {photo.uploadedAt.toLocaleString('ko-KR')}
                      </p>

                      {/* GPS 정보 */}
                      {photo.metadata.gps ? (
                        <div className="mb-2 p-2 bg-green-50 rounded text-sm">
                          <p className="font-semibold text-green-800">✅ GPS 정보</p>
                          <p>📍 {photo.metadata.gps.latitude.toFixed(6)}, {photo.metadata.gps.longitude.toFixed(6)}</p>
                          {photo.metadata.gps.altitude && (
                            <p>⛰️ 고도: {photo.metadata.gps.altitude.toFixed(1)}m</p>
                          )}
                        </div>
                      ) : (
                        <div className="mb-2 p-2 bg-gray-50 rounded text-sm">
                          <p className="text-gray-600">GPS 정보 없음</p>
                        </div>
                      )}

                      {/* 기타 정보 */}
                      <div className="text-sm text-gray-700 space-y-1">
                        {photo.metadata.width && photo.metadata.height && (
                          <p>📐 {photo.metadata.width} x {photo.metadata.height}px</p>
                        )}
                        {photo.metadata.fileSize && (
                          <p>💾 {(photo.metadata.fileSize / 1024 / 1024).toFixed(2)}MB</p>
                        )}
                        {photo.metadata.cameraMake && (
                          <p>📷 {photo.metadata.cameraMake} {photo.metadata.cameraModel}</p>
                        )}
                      </div>

                      {/* URL */}
                      <div className="mt-2">
                        <a
                          href={photo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline break-all"
                        >
                          {photo.url}
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
