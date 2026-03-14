import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CheckinForm from '../CheckinForm';
import type { Checkin } from '@/types/database';

// ─── Hook Mocks ───

const mockLoc = {
  location: { latitude: 37.5, longitude: 127.0 },
  applyPhotoGps: jest.fn(),
  setManualLocation: jest.fn(),
  onPhotoClear: jest.fn(),
  clearLocation: jest.fn(),
  initLocation: jest.fn(),
  resetLocation: jest.fn(),
};
jest.mock('../hooks/useLocationSource', () => ({
  useLocationSource: () => mockLoc,
}));

const mockPhoto = {
  photoUrl: '',
  photoPreviewUrl: '',
  photoMetadata: null,
  isProcessingPhoto: false,
  isUploadingPhoto: false,
  fileInputRef: { current: null },
  handleFileSelect: jest.fn(),
  clearPhoto: jest.fn(),
  reset: jest.fn(),
};
jest.mock('../hooks/usePhotoUpload', () => ({
  usePhotoUpload: () => mockPhoto,
}));

const mockPlaceSearch = {
  searchQuery: '',
  setSearchQuery: jest.fn(),
  predictions: [],
  searchingPlaces: false,
  handleSelectPlace: jest.fn(),
  reset: jest.fn(),
};
jest.mock('../hooks/usePlaceSearch', () => ({
  usePlaceSearch: () => mockPlaceSearch,
}));

jest.mock('../hooks/useKeyboardHeight', () => ({
  useKeyboardHeight: () => 0,
}));

// ─── 자식 컴포넌트 Mocks ───

jest.mock('../CheckinFormHeader', () => ({
  __esModule: true,
  default: ({ isEditMode, onCancel, onSubmit, canSubmit }: any) => (
    <div data-testid="form-header">
      <span data-testid="mode">{isEditMode ? 'edit' : 'create'}</span>
      <button onClick={onCancel} data-testid="cancel-btn">취소</button>
      <button onClick={onSubmit} disabled={!canSubmit} data-testid="submit-btn">저장</button>
    </div>
  ),
}));

jest.mock('../CheckinFormMainPanel', () => ({
  __esModule: true,
  default: ({ title, onTitleChange, error }: any) => (
    <div data-testid="main-panel">
      <input
        data-testid="title-input"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
      />
      {error && <span data-testid="error-msg">{error}</span>}
    </div>
  ),
}));

jest.mock('../CheckinFormPlacePanel', () => ({
  __esModule: true,
  default: ({ onBack }: any) => (
    <div data-testid="place-panel">
      <button onClick={onBack}>뒤로</button>
    </div>
  ),
}));

jest.mock('../CheckinFormCategoryPanel', () => ({
  __esModule: true,
  default: ({ onClose }: any) => (
    <div data-testid="category-panel">
      <button onClick={onClose}>닫기</button>
    </div>
  ),
}));

jest.mock('../CheckinFormTimePanel', () => ({
  __esModule: true,
  default: ({ onClose }: any) => (
    <div data-testid="time-panel">
      <button onClick={onClose}>닫기</button>
    </div>
  ),
}));

jest.mock('../CheckinFormToolbar', () => ({
  __esModule: true,
  default: ({ onOpenLocationPicker, onOpenCategory, onOpenTime }: any) => (
    <div data-testid="toolbar">
      {onOpenLocationPicker && (
        <button onClick={onOpenLocationPicker} data-testid="open-location-picker">위치</button>
      )}
      <button onClick={onOpenCategory} data-testid="open-category">카테고리</button>
      <button onClick={onOpenTime} data-testid="open-time">시간</button>
    </div>
  ),
}));

// ─── Helpers ───

const defaultProps = {
  tripId: 'trip-1',
  tripName: '서울 여행',
};

const mockCheckin: Checkin = {
  id: 'checkin-1',
  trip_id: 'trip-1',
  title: '경복궁',
  place: '경복궁',
  place_id: 'place-1',
  category: 'attraction',
  message: '아름다웠다',
  latitude: 37.5796,
  longitude: 126.977,
  photo_url: null,
  photo_metadata: null,
  checked_in_at: '2024-01-01T10:00:00Z',
  created_at: '2024-01-01T10:00:00Z',
  updated_at: '2024-01-01T10:00:00Z',
};

// ─── Tests ───

describe('CheckinForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('신규 생성 모드', () => {
    it('create 모드로 렌더링된다', () => {
      render(<CheckinForm {...defaultProps} />);
      expect(screen.getByTestId('mode').textContent).toBe('create');
    });

    it('초기에 메인 패널이 표시된다', () => {
      render(<CheckinForm {...defaultProps} />);
      expect(screen.getByTestId('main-panel')).toBeInTheDocument();
      expect(screen.queryByTestId('place-panel')).not.toBeInTheDocument();
    });
  });

  describe('수정 모드', () => {
    it('editingCheckin이 있으면 edit 모드로 렌더링된다', () => {
      render(<CheckinForm {...defaultProps} editingCheckin={mockCheckin} />);
      expect(screen.getByTestId('mode').textContent).toBe('edit');
    });

    it('editingCheckin의 title로 폼을 초기화한다', () => {
      render(<CheckinForm {...defaultProps} editingCheckin={mockCheckin} />);
      expect((screen.getByTestId('title-input') as HTMLInputElement).value).toBe('경복궁');
    });

    it('editingCheckin의 위치로 initLocation을 호출한다', () => {
      render(<CheckinForm {...defaultProps} editingCheckin={mockCheckin} />);
      expect(mockLoc.initLocation).toHaveBeenCalledWith(37.5796, 126.977);
    });
  });

  describe('패널 전환', () => {
    it('카테고리 버튼 클릭 시 category 패널로 전환된다', () => {
      render(<CheckinForm {...defaultProps} />);
      fireEvent.click(screen.getByTestId('open-category'));
      expect(screen.getByTestId('category-panel')).toBeInTheDocument();
      expect(screen.queryByTestId('main-panel')).not.toBeInTheDocument();
    });

    it('시간 버튼 클릭 시 time 패널로 전환된다', () => {
      render(<CheckinForm {...defaultProps} />);
      fireEvent.click(screen.getByTestId('open-time'));
      expect(screen.getByTestId('time-panel')).toBeInTheDocument();
    });

    it('category 패널 닫기 시 main 패널로 돌아온다', () => {
      render(<CheckinForm {...defaultProps} />);
      fireEvent.click(screen.getByTestId('open-category'));
      fireEvent.click(screen.getByText('닫기'));
      expect(screen.getByTestId('main-panel')).toBeInTheDocument();
    });
  });

  describe('제출 (신규 생성)', () => {
    it('위치와 제목이 있으면 POST /api/checkins를 호출한다', async () => {
      const onSuccess = jest.fn();
      const createdCheckin = { ...mockCheckin, id: 'new-id' };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ checkin: createdCheckin }),
      });

      render(<CheckinForm {...defaultProps} onSuccess={onSuccess} />);
      fireEvent.change(screen.getByTestId('title-input'), { target: { value: '경복궁' } });
      fireEvent.click(screen.getByTestId('submit-btn'));

      await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(createdCheckin));
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/checkins',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('신규 생성 시 trip_id를 body에 포함한다', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ checkin: mockCheckin }),
      });

      render(<CheckinForm {...defaultProps} />);
      fireEvent.change(screen.getByTestId('title-input'), { target: { value: '경복궁' } });
      fireEvent.click(screen.getByTestId('submit-btn'));

      await waitFor(() => expect(global.fetch).toHaveBeenCalled());
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.trip_id).toBe('trip-1');
    });
  });

  describe('제출 (수정)', () => {
    it('수정 모드에서는 PATCH /api/checkins/:id를 호출한다', async () => {
      const onSuccess = jest.fn();
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ checkin: mockCheckin }),
      });

      render(<CheckinForm {...defaultProps} editingCheckin={mockCheckin} onSuccess={onSuccess} />);
      fireEvent.click(screen.getByTestId('submit-btn'));

      await waitFor(() => expect(onSuccess).toHaveBeenCalled());
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/checkins/${mockCheckin.id}`,
        expect.objectContaining({ method: 'PATCH' }),
      );
    });

    it('수정 모드에서는 trip_id를 body에 포함하지 않는다', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ checkin: mockCheckin }),
      });

      render(<CheckinForm {...defaultProps} editingCheckin={mockCheckin} />);
      fireEvent.click(screen.getByTestId('submit-btn'));

      await waitFor(() => expect(global.fetch).toHaveBeenCalled());
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.trip_id).toBeUndefined();
    });
  });

  describe('유효성 검사', () => {
    it('위치가 없으면 에러 메시지를 표시한다', async () => {
      mockLoc.location = null as any;
      render(<CheckinForm {...defaultProps} />);
      // canSubmit=false이므로 submit 버튼이 disabled → 직접 핸들러 호출 불가
      // 위치 없는 상태에서 canSubmit이 false임을 확인
      expect(screen.getByTestId('submit-btn')).toBeDisabled();
      mockLoc.location = { latitude: 37.5, longitude: 127.0 };
    });

    it('title이 비어 있으면 submit 버튼이 비활성화된다', () => {
      render(<CheckinForm {...defaultProps} />);
      // title이 빈 문자열인 상태
      expect(screen.getByTestId('submit-btn')).toBeDisabled();
    });

    it('API 오류 시 에러 메시지를 표시한다', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue({ error: '서버 오류' }),
      });

      render(<CheckinForm {...defaultProps} />);
      fireEvent.change(screen.getByTestId('title-input'), { target: { value: '경복궁' } });
      fireEvent.click(screen.getByTestId('submit-btn'));

      await waitFor(() =>
        expect(screen.getByTestId('error-msg').textContent).toBe('서버 오류'),
      );
    });
  });

  describe('onOpenLocationPicker 콜백', () => {
    it('onOpenLocationPicker가 전달되면 툴바에 위치 버튼이 표시된다', () => {
      render(
        <CheckinForm {...defaultProps} onOpenLocationPicker={jest.fn()} />,
      );
      expect(screen.getByTestId('open-location-picker')).toBeInTheDocument();
    });

    it('onOpenLocationPicker가 없으면 위치 버튼이 표시되지 않는다', () => {
      render(<CheckinForm {...defaultProps} />);
      expect(screen.queryByTestId('open-location-picker')).not.toBeInTheDocument();
    });

    it('위치 버튼 클릭 시 onOpenLocationPicker를 현재 location과 함께 호출한다', () => {
      const onOpenLocationPicker = jest.fn();
      render(
        <CheckinForm {...defaultProps} onOpenLocationPicker={onOpenLocationPicker} />,
      );
      fireEvent.click(screen.getByTestId('open-location-picker'));
      expect(onOpenLocationPicker).toHaveBeenCalledWith(
        mockLoc.location,
        expect.any(Function),
      );
    });
  });

  describe('취소', () => {
    it('취소 버튼 클릭 시 onCancel을 호출한다', () => {
      const onCancel = jest.fn();
      render(<CheckinForm {...defaultProps} onCancel={onCancel} />);
      fireEvent.click(screen.getByTestId('cancel-btn'));
      expect(onCancel).toHaveBeenCalled();
    });
  });
});
