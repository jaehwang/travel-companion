'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import PhotoUpload from '@/components/PhotoUpload';
import Map, { type MapPhoto } from '@/components/Map';
import type { PhotoMetadata } from '@/lib/exif';

type UploadedPhoto = { url: string; metadata: PhotoMetadata; uploadedAt: Date };

function useTestUploadState() {
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([]);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  useEffect(() => {
    if (!isMapExpanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isMapExpanded]);

  const handleUploadComplete = (photoUrl: string, metadata: PhotoMetadata) => {
    setUploadedPhotos(prev => [{ url: photoUrl, metadata, uploadedAt: new Date() }, ...prev]);
    setSuccess(`✅ 업로드 완료! URL: ${photoUrl}`);
    setError('');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleUploadError = (errorMessage: string) => {
    setError(`❌ 업로드 실패: ${errorMessage}`);
    setSuccess('');
  };

  const mapPhotos: MapPhoto[] = uploadedPhotos
    .filter(photo => photo.metadata.gps)
    .map((photo, index) => ({
      id: `photo-${index}`,
      url: photo.url,
      latitude: photo.metadata.gps!.latitude,
      longitude: photo.metadata.gps!.longitude,
      title: `사진 ${uploadedPhotos.length - index}`,
      takenAt: photo.uploadedAt.toLocaleString('ko-KR'),
    }));

  return { uploadedPhotos, error, success, isMapExpanded, setIsMapExpanded, mapPhotos, handleUploadComplete, handleUploadError };
}

function UploadedPhotoCard({ photo, index }: { photo: UploadedPhoto; index: number }) {
  return (
    <article className="flex flex-col gap-4 rounded-xl border border-gray-100 p-4 shadow-sm transition hover:shadow-md sm:flex-row">
      <div className="relative w-full overflow-hidden rounded-lg bg-gray-50 sm:w-32 sm:flex-shrink-0 h-40 sm:h-32">
        <Image src={photo.url} alt={`Uploaded ${index + 1}`} fill unoptimized className="object-cover" />
      </div>
      <div className="flex flex-1 flex-col gap-3 text-sm text-gray-700">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
          <p>업로드: {photo.uploadedAt.toLocaleString('ko-KR')}</p>
          {photo.metadata.takenAt && <p>촬영: {photo.metadata.takenAt.toLocaleString('ko-KR')}</p>}
        </div>
        {photo.metadata.gps ? (
          <div className="rounded-lg bg-green-50 p-3 text-sm">
            <p className="font-semibold text-green-800">✅ GPS 정보</p>
            <p className="text-gray-700">📍 {photo.metadata.gps.latitude.toFixed(6)}, {photo.metadata.gps.longitude.toFixed(6)}</p>
            {photo.metadata.gps.altitude && <p className="text-gray-700">⛰️ {photo.metadata.gps.altitude.toFixed(1)}m</p>}
          </div>
        ) : (
          <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">GPS 정보 없음</div>
        )}
      </div>
    </article>
  );
}

export default function TestUploadPage() {
  const { uploadedPhotos, error, success, isMapExpanded, setIsMapExpanded, mapPhotos, handleUploadComplete, handleUploadError } = useTestUploadState();
  const hasUploads = uploadedPhotos.length > 0;
  const hasGpsPhotos = mapPhotos.length > 0;

  return (
    <div className="min-h-screen bg-gray-100 py-6 sm:py-10">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <header className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">📸 사진 업로드 테스트</h1>
          <p className="mt-2 text-base text-gray-600">
            사진을 업로드하면 GPS 정보와 지도가 자동으로 연동됩니다.
          </p>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            {/* 에러/성공 메시지 */}
            {error && (
              <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </div>
            )}

            <PhotoUpload
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
            />
          </section>

          {hasUploads && (
            <section className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">📂 업로드된 사진</h2>
                  <p className="text-sm text-gray-500">총 {uploadedPhotos.length}장</p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600">
                  최신순
                </span>
              </div>

              <div className="mt-4 space-y-4">
                {uploadedPhotos.map((photo, index) => (
                  <UploadedPhotoCard key={index} photo={photo} index={index} />
                ))}
              </div>
            </section>
          )}
        </div>

        {hasUploads && (
          <section className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">🗺️ 사진 위치 지도</h2>
              {hasGpsPhotos && (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-700 transition hover:border-gray-300 md:hidden"
                  onClick={() => setIsMapExpanded(true)}
                >
                  전체 화면으로 보기 ↗
                </button>
              )}
            </div>
            <div className="mt-3 rounded-2xl bg-white p-4 shadow-sm">
              <div className="hidden md:block">
                <Map photos={mapPhotos} height="420px" />
              </div>

              <div className="md:hidden">
                <div className="relative overflow-hidden rounded-2xl">
                  <Map photos={mapPhotos} height="320px" />
                  {hasGpsPhotos && (
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                  )}
                  {hasGpsPhotos && (
                    <button
                      type="button"
                      className="absolute bottom-4 right-4 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-gray-900 shadow-lg backdrop-blur"
                      onClick={() => setIsMapExpanded(true)}
                    >
                      전체 지도 보기
                    </button>
                  )}
                </div>
              </div>

              {!hasGpsPhotos && (
                <p className="mt-4 text-center text-sm text-gray-500">
                  GPS 정보가 있는 사진이 없습니다. 위치 정보가 포함된 사진을 업로드해 보세요.
                </p>
              )}
              {hasGpsPhotos && (
                <p className="mt-4 text-center text-sm text-gray-600">📍 {mapPhotos.length}개 위치 표시 중</p>
              )}
            </div>
          </section>
        )}
      </div>

      {isMapExpanded && hasGpsPhotos && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <div>
              <p className="text-sm uppercase tracking-wide text-white/70">전체 지도</p>
              <p className="text-lg font-semibold">{mapPhotos.length}개 위치</p>
            </div>
            <button
              type="button"
              className="rounded-full border border-white/40 px-4 py-2 text-sm font-medium text-white"
              onClick={() => setIsMapExpanded(false)}
            >
              닫기
            </button>
          </div>
          <div className="flex-1 bg-white">
            <Map photos={mapPhotos} height="100%" />
          </div>
        </div>
      )}
    </div>
  );
}
