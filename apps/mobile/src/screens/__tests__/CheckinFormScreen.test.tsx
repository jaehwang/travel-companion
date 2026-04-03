import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CheckinFormScreen from '../CheckinFormScreen';

// ── Navigation mocks ──────────────────────────────────────────────────────────

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();
const mockRouteParams: Record<string, unknown> = {};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack, navigate: mockNavigate }),
  useRoute: () => ({ params: mockRouteParams }),
  useFocusEffect: (cb: () => void) => { cb(); },
}));

// ── Store / hooks mocks ───────────────────────────────────────────────────────

const mockAddCheckin = jest.fn();
const mockUpdateCheckin = jest.fn();

jest.mock('../../store/checkinsStore', () => ({
  useCheckinsStore: (selector: (s: unknown) => unknown) =>
    selector({ addCheckin: mockAddCheckin, updateCheckin: mockUpdateCheckin }),
}));

const mockTrips = [
  { id: 'trip-1', title: '제주도 여행', is_public: false, is_frequent: false, is_default: false, created_at: '', updated_at: '' },
  { id: 'trip-2', title: '도쿄 여행', is_public: false, is_frequent: false, is_default: false, created_at: '', updated_at: '' },
];

jest.mock('../../hooks/useTrips', () => ({
  useTrips: () => ({ trips: mockTrips, loading: false }),
}));

// ── Native / lib mocks ────────────────────────────────────────────────────────

jest.mock('../../lib/supabase', () => ({
  supabase: { auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) } },
}));

jest.mock('../../lib/locationPickerStore', () => ({
  consumeLocationPickerResult: () => null,
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'denied' }),
}));

jest.mock('../../components/PhotoPickerButton', () => ({
  usePhotoPicker: () => ({ showPicker: jest.fn() }),
}));

jest.mock('../../components/CheckinFormToolbar', () => {
  const { View } = require('react-native');
  return () => <View testID="checkin-form-toolbar" />;
});

jest.mock('../../components/CategorySelector', () => {
  const { View } = require('react-native');
  return () => <View />;
});

jest.mock('@react-native-community/datetimepicker', () => {
  const { View } = require('react-native');
  return () => <View />;
});

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function setRouteParams(params: Record<string, unknown>) {
  Object.keys(mockRouteParams).forEach((k) => delete mockRouteParams[k]);
  Object.assign(mockRouteParams, params);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CheckinFormScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAddCheckin.mockResolvedValue({});
  });

  describe('tripId 있을 때 (기존 동작)', () => {
    beforeEach(() => {
      setRouteParams({ tripId: 'trip-1', tripTitle: '제주도 여행', initialLatitude: 37.5, initialLongitude: 127.0 });
    });

    it('헤더에 여행 이름이 표시된다', () => {
      const { getByText } = render(<CheckinFormScreen />);
      expect(getByText('제주도 여행')).toBeTruthy();
    });

    it('여행 선택 드롭다운이 표시되지 않는다', () => {
      const { queryByTestId } = render(<CheckinFormScreen />);
      expect(queryByTestId('trip-selector')).toBeNull();
    });

    it('저장 시 addCheckin에 trip_id가 전달된다', async () => {
      const { getByPlaceholderText, getByText } = render(<CheckinFormScreen />);
      fireEvent.changeText(getByPlaceholderText('어디에 다녀왔나요?'), '경복궁');
      fireEvent.press(getByText('체크인'));
      await waitFor(() => {
        expect(mockAddCheckin).toHaveBeenCalledWith(
          expect.objectContaining({ trip_id: 'trip-1' })
        );
      });
    });
  });

  describe('tripId 없을 때 (미할당 체크인)', () => {
    beforeEach(() => {
      setRouteParams({ initialLatitude: 37.5, initialLongitude: 127.0 });
    });

    it('여행 선택 드롭다운이 표시된다', () => {
      const { getByTestId } = render(<CheckinFormScreen />);
      expect(getByTestId('trip-selector')).toBeTruthy();
    });

    it('드롭다운에 여행 목록이 표시된다', () => {
      const { getByText } = render(<CheckinFormScreen />);
      expect(getByText('제주도 여행')).toBeTruthy();
      expect(getByText('도쿄 여행')).toBeTruthy();
    });

    it('여행 미선택 상태로 저장하면 trip_id 없이 addCheckin이 호출된다', async () => {
      const { getByPlaceholderText, getByText } = render(<CheckinFormScreen />);
      fireEvent.changeText(getByPlaceholderText('어디에 다녀왔나요?'), '명동');
      fireEvent.press(getByText('체크인'));
      await waitFor(() => {
        expect(mockAddCheckin).toHaveBeenCalledWith(
          expect.not.objectContaining({ trip_id: expect.anything() })
        );
      });
    });

    it('여행을 선택하면 해당 trip_id로 addCheckin이 호출된다', async () => {
      const { getByPlaceholderText, getByText } = render(<CheckinFormScreen />);
      fireEvent.press(getByText('제주도 여행'));
      fireEvent.changeText(getByPlaceholderText('어디에 다녀왔나요?'), '한라산');
      fireEvent.press(getByText('체크인'));
      await waitFor(() => {
        expect(mockAddCheckin).toHaveBeenCalledWith(
          expect.objectContaining({ trip_id: 'trip-1' })
        );
      });
    });
  });
});
