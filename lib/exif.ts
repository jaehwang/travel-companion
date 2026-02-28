import exifr from 'exifr';

export interface PhotoLocation {
  latitude: number;
  longitude: number;
  timestamp?: Date;
  altitude?: number;
}

export interface PhotoMetadata {
  gps?: PhotoLocation;
  takenAt?: Date;
  width?: number;
  height?: number;
  fileSize?: number;
  cameraMake?: string;
  cameraModel?: string;
  exif?: Record<string, any>;
}

/**
 * 사진 파일에서 GPS 정보 추출
 */
export async function extractGPSFromPhoto(file: File): Promise<PhotoLocation | null> {
  try {
    // 전체 EXIF 데이터 읽기
    const exifData = await exifr.parse(file);

    // GPS 데이터 확인
    if (!exifData) return null;

    // latitude와 longitude 확인
    const latitude = exifData.latitude || exifData.GPSLatitude;
    const longitude = exifData.longitude || exifData.GPSLongitude;

    if (!latitude || !longitude) return null;

    return {
      latitude: typeof latitude === 'number' ? latitude : parseFloat(latitude),
      longitude: typeof longitude === 'number' ? longitude : parseFloat(longitude),
      timestamp: exifData.DateTimeOriginal ? new Date(exifData.DateTimeOriginal) : undefined,
      altitude: exifData.GPSAltitude || exifData.altitude
    };
  } catch {
    return null;
  }
}

/**
 * 여러 사진에서 GPS 정보 일괄 추출
 */
export async function extractGPSFromPhotos(files: File[]): Promise<Array<{
  file: File;
  location: PhotoLocation | null;
}>> {
  const results = await Promise.all(
    files.map(async (file) => ({
      file,
      location: await extractGPSFromPhoto(file)
    }))
  );

  return results;
}

/**
 * 사진 파일에서 전체 메타데이터 추출
 */
export async function extractPhotoMetadata(file: File): Promise<PhotoMetadata> {
  try {
    // EXIF 데이터 파싱
    const exif = await exifr.parse(file);

    // GPS 좌표 추출
    const gps = await extractGPSFromPhoto(file);

    // 이미지 크기 정보 추출
    const img = new Image();
    const imageUrl = URL.createObjectURL(file);

    const dimensions = await new Promise<{ width: number; height: number }>((resolve) => {
      img.onload = () => {
        URL.revokeObjectURL(imageUrl);
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        URL.revokeObjectURL(imageUrl);
        resolve({ width: 0, height: 0 });
      };
      img.src = imageUrl;
    });

    // 촬영 시간 추출
    let takenAt: Date | undefined;
    if (exif?.DateTimeOriginal) {
      takenAt = new Date(exif.DateTimeOriginal);
    } else if (exif?.DateTime) {
      takenAt = new Date(exif.DateTime);
    }

    return {
      gps: gps || undefined,
      takenAt,
      width: dimensions.width || undefined,
      height: dimensions.height || undefined,
      fileSize: file.size,
      cameraMake: exif?.Make,
      cameraModel: exif?.Model,
      exif: exif ? simplifyExif(exif) : undefined,
    };
  } catch {
    return { fileSize: file.size };
  }
}

/**
 * EXIF 데이터를 JSON 저장 가능한 형태로 단순화
 */
function simplifyExif(exif: any): Record<string, any> {
  const simplified: Record<string, any> = {};

  for (const [key, value] of Object.entries(exif)) {
    // Date, ArrayBuffer 등 복잡한 타입은 문자열로 변환
    if (value instanceof Date) {
      simplified[key] = value.toISOString();
    } else if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
      // 바이너리 데이터는 제외
      continue;
    } else if (typeof value === 'object' && value !== null) {
      // 중첩 객체는 제외 (단순화)
      continue;
    } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      simplified[key] = value;
    }
  }

  return simplified;
}

/**
 * GPS 좌표가 유효한지 확인
 */
export function isValidGPS(location?: PhotoLocation): boolean {
  if (!location) return false;

  const { latitude, longitude } = location;

  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/**
 * 두 GPS 좌표 간의 거리 계산 (Haversine formula, km 단위)
 */
export function calculateDistance(
  loc1: PhotoLocation,
  loc2: PhotoLocation
): number {
  const R = 6371; // 지구 반지름 (km)
  const dLat = toRad(loc2.latitude - loc1.latitude);
  const dLon = toRad(loc2.longitude - loc1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(loc1.latitude)) *
    Math.cos(toRad(loc2.latitude)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
