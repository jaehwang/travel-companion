import exifr from 'exifr';

export interface PhotoLocation {
  latitude: number;
  longitude: number;
  timestamp?: Date;
  altitude?: number;
}

/**
 * 사진 파일에서 GPS 정보 추출
 */
export async function extractGPSFromPhoto(file: File): Promise<PhotoLocation | null> {
  try {
    const exifData = await exifr.parse(file, {
      gps: true,
      pick: ['latitude', 'longitude', 'DateTimeOriginal', 'GPSAltitude']
    });

    if (!exifData || !exifData.latitude || !exifData.longitude) {
      return null;
    }

    return {
      latitude: exifData.latitude,
      longitude: exifData.longitude,
      timestamp: exifData.DateTimeOriginal ? new Date(exifData.DateTimeOriginal) : undefined,
      altitude: exifData.GPSAltitude
    };
  } catch (error) {
    console.error('EXIF 데이터 추출 실패:', error);
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
