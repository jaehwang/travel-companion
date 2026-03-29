import { renderHook, act } from '@testing-library/react';
import { usePhotoUpload } from '../usePhotoUpload';

// ─── Mocks ───

const mockUpload = jest.fn();
const mockGetPublicUrl = jest.fn();
const mockStorageFrom = jest.fn(() => ({
  upload: mockUpload,
  getPublicUrl: mockGetPublicUrl,
}));

jest.mock('@/lib/supabase', () => ({
  supabase: { storage: { from: (arg: unknown) => (mockStorageFrom as jest.Mock)(arg) } },
}));

const mockExtractPhotoMetadata = jest.fn();
jest.mock('@/lib/exif', () => ({
  extractPhotoMetadata: (...args: any[]) => mockExtractPhotoMetadata(...args),
}));

const mockImageCompression = jest.fn();
jest.mock('browser-image-compression', () => ({
  __esModule: true,
  default: (...args: any[]) => mockImageCompression(...args),
}));

// jsdom은 URL.createObjectURL을 지원하지 않으므로 mock 처리
const MOCK_PREVIEW_URL = 'blob:mock-preview';
global.URL.createObjectURL = jest.fn(() => MOCK_PREVIEW_URL);
global.URL.revokeObjectURL = jest.fn();

// ─── Helpers ───

function makeImageFile(name = 'photo.jpg') {
  return new File(['data'], name, { type: 'image/jpeg' });
}

function makeFileEvent(file: File) {
  return { target: { files: [file] } } as any;
}

// ─── Tests ───

describe('usePhotoUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('초기 상태', () => {
    it('모든 상태가 비어 있다', () => {
      const { result } = renderHook(() => usePhotoUpload());
      expect(result.current.photoUrl).toBe('');
      expect(result.current.photoPreviewUrl).toBe('');
      expect(result.current.photoMetadata).toBeNull();
      expect(result.current.isProcessingPhoto).toBe(false);
      expect(result.current.isUploadingPhoto).toBe(false);
    });
  });

  describe('handleFileSelect', () => {
    it('이미지가 아닌 파일을 선택하면 onError를 호출하고 상태를 바꾸지 않는다', async () => {
      const onError = jest.fn();
      const { result } = renderHook(() => usePhotoUpload({ onError }));
      const nonImageFile = new File(['data'], 'doc.pdf', { type: 'application/pdf' });

      await act(async () => {
        await result.current.handleFileSelect(makeFileEvent(nonImageFile));
      });

      expect(onError).toHaveBeenCalledWith('이미지 파일만 업로드 가능합니다.');
      expect(result.current.photoPreviewUrl).toBe('');
    });

    it('파일이 없으면 아무것도 하지 않는다', async () => {
      const { result } = renderHook(() => usePhotoUpload());
      await act(async () => {
        await result.current.handleFileSelect({ target: { files: [] } } as any);
      });
      expect(result.current.photoPreviewUrl).toBe('');
    });

    it('이미지 선택 시 미리보기 URL을 즉시 설정한다', async () => {
      mockExtractPhotoMetadata.mockResolvedValue({ gps: null });
      mockImageCompression.mockResolvedValue(makeImageFile());
      mockUpload.mockResolvedValue({ error: null });
      mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://example.com/photo.jpg' } });

      const { result } = renderHook(() => usePhotoUpload());
      await act(async () => {
        await result.current.handleFileSelect(makeFileEvent(makeImageFile()));
      });

      expect(URL.createObjectURL).toHaveBeenCalled();
    });

    it('GPS가 있으면 onGpsExtracted 콜백을 호출한다', async () => {
      const onGpsExtracted = jest.fn();
      mockExtractPhotoMetadata.mockResolvedValue({
        gps: { latitude: 37.5, longitude: 127.0 },
      });
      mockImageCompression.mockResolvedValue(makeImageFile());
      mockUpload.mockResolvedValue({ error: null });
      mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://example.com/photo.jpg' } });

      const { result } = renderHook(() => usePhotoUpload({ onGpsExtracted }));
      await act(async () => {
        await result.current.handleFileSelect(makeFileEvent(makeImageFile()));
      });

      expect(onGpsExtracted).toHaveBeenCalledWith(37.5, 127.0);
    });

    it('GPS가 없으면 onGpsExtracted를 호출하지 않는다', async () => {
      const onGpsExtracted = jest.fn();
      mockExtractPhotoMetadata.mockResolvedValue({ gps: null });
      mockImageCompression.mockResolvedValue(makeImageFile());
      mockUpload.mockResolvedValue({ error: null });
      mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://example.com/photo.jpg' } });

      const { result } = renderHook(() => usePhotoUpload({ onGpsExtracted }));
      await act(async () => {
        await result.current.handleFileSelect(makeFileEvent(makeImageFile()));
      });

      expect(onGpsExtracted).not.toHaveBeenCalled();
    });

    it('업로드 성공 시 photoUrl이 public URL로 설정된다', async () => {
      mockExtractPhotoMetadata.mockResolvedValue({ gps: null });
      mockImageCompression.mockResolvedValue(makeImageFile());
      mockUpload.mockResolvedValue({ error: null });
      mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://example.com/public.jpg' } });

      const { result } = renderHook(() => usePhotoUpload());
      await act(async () => {
        await result.current.handleFileSelect(makeFileEvent(makeImageFile()));
      });

      expect(result.current.photoUrl).toBe('https://example.com/public.jpg');
      expect(result.current.isUploadingPhoto).toBe(false);
    });

    it('Supabase 업로드 실패 시 onError를 호출하고 미리보기를 초기화한다', async () => {
      const onError = jest.fn();
      mockExtractPhotoMetadata.mockResolvedValue({ gps: null });
      mockImageCompression.mockResolvedValue(makeImageFile());
      mockUpload.mockResolvedValue({ error: new Error('Storage error') });

      const { result } = renderHook(() => usePhotoUpload({ onError }));
      await act(async () => {
        await result.current.handleFileSelect(makeFileEvent(makeImageFile()));
      });

      expect(onError).toHaveBeenCalledWith('Storage error');
      expect(result.current.photoPreviewUrl).toBe('');
      expect(result.current.photoMetadata).toBeNull();
      expect(result.current.isUploadingPhoto).toBe(false);
    });

  });

  describe('clearPhoto', () => {
    it('photoUrl, photoPreviewUrl, photoMetadata를 초기화한다', async () => {
      mockExtractPhotoMetadata.mockResolvedValue({ gps: { latitude: 37.5, longitude: 127.0 } });
      mockImageCompression.mockResolvedValue(makeImageFile());
      mockUpload.mockResolvedValue({ error: null });
      mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://example.com/photo.jpg' } });

      const { result } = renderHook(() => usePhotoUpload());
      await act(async () => {
        await result.current.handleFileSelect(makeFileEvent(makeImageFile()));
      });
      act(() => result.current.clearPhoto());

      expect(result.current.photoUrl).toBe('');
      expect(result.current.photoPreviewUrl).toBe('');
      expect(result.current.photoMetadata).toBeNull();
    });
  });

  describe('reset', () => {
    it('인자 없이 호출하면 모든 상태를 초기화한다', () => {
      const { result } = renderHook(() => usePhotoUpload());
      act(() => result.current.reset());

      expect(result.current.photoUrl).toBe('');
      expect(result.current.photoPreviewUrl).toBe('');
      expect(result.current.photoMetadata).toBeNull();
    });

    it('initialPhotoUrl을 전달하면 photoUrl과 photoPreviewUrl이 해당 값으로 설정된다', () => {
      const { result } = renderHook(() => usePhotoUpload());
      act(() => result.current.reset('https://example.com/existing.jpg'));

      expect(result.current.photoUrl).toBe('https://example.com/existing.jpg');
      expect(result.current.photoPreviewUrl).toBe('https://example.com/existing.jpg');
    });
  });
});
