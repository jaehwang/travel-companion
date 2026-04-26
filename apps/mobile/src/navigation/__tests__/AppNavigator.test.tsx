import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

const mockNavigate = jest.fn();
const mockAddTrip = jest.fn();

jest.mock('../../lib/supabase', () => ({ supabase: { auth: { getSession: jest.fn(), getUser: jest.fn() } } }));
jest.mock('../../screens/HomeScreen', () => () => null);
jest.mock('../../screens/trip/TripScreen', () => () => null);
jest.mock('../../screens/checkin-form/CheckinFormScreen', () => () => null);
jest.mock('../../screens/LocationPickerScreen', () => () => null);
jest.mock('../../screens/SettingsScreen', () => () => null);
jest.mock('../../screens/CheckinsScreen', () => () => null);
jest.mock('../../screens/ScheduleScreen', () => () => null);
jest.mock('../../screens/SearchScreen', () => () => null);
jest.mock('../../screens/MapBrowseScreen', () => () => null);
jest.mock('../../screens/CheckinDetailScreen', () => () => null);
jest.mock('../../store/checkinsStore', () => ({ useCheckinsStore: () => jest.fn() }));
jest.mock('../../store/tripsStore', () => ({
  useTripsStore: (selector: (state: { addTrip: typeof mockAddTrip }) => unknown) =>
    selector({ addTrip: mockAddTrip }),
}));
jest.mock('../../components/TripFormModal', () => ({
  __esModule: true,
  default: ({ visible }: { visible: boolean }) => {
    const { Text } = require('react-native');
    return visible ? <Text testID="trip-form-modal">trip-form-modal</Text> : null;
  },
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useRoute: () => ({ params: {} }),
  useFocusEffect: jest.fn(),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }: { children: React.ReactNode }) => children,
    Screen: ({
      name,
      options,
    }: {
      name: string;
      options?: { tabBarButton?: (props: { style?: object }) => React.ReactNode };
    }) => {
      if (name === 'MakeTab' && options?.tabBarButton) {
        return options.tabBarButton({ style: { width: 64 } });
      }

      return null;
    },
  }),
}));

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Navigator: ({ children }: { children: React.ReactNode }) => children,
    Screen: ({
      name,
      component: Component,
    }: {
      name: string;
      component?: React.ComponentType;
    }) => {
      if (name === 'MainTabs' && Component) {
        return <Component />;
      }

      return null;
    },
  }),
}));

describe('AppNavigator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();

    const { setTripCheckinContext } = require('../AppNavigator');
    setTripCheckinContext(null);
  });

  it('setTripCheckinContext가 export된다', () => {
    const { setTripCheckinContext } = require('../AppNavigator');
    expect(typeof setTripCheckinContext).toBe('function');
  });

  it('여행 만들기를 누르면 TripFormModal이 열린다', async () => {
    const { default: AppNavigator } = require('../AppNavigator');

    render(<AppNavigator />);

    fireEvent.press(screen.getByTestId('btn-tab-make'));
    fireEvent.press(screen.getByTestId('btn-make-trip'));

    act(() => {
      jest.advanceTimersByTime(50);
    });

    await waitFor(() => {
      expect(screen.getByTestId('trip-form-modal')).toBeTruthy();
    });
  });

  it('체크인 만들기는 trip context 없이 빈 params로 이동한다', () => {
    const { default: AppNavigator, setTripCheckinContext } = require('../AppNavigator');

    setTripCheckinContext(null);
    render(<AppNavigator />);

    fireEvent.press(screen.getByTestId('btn-tab-make'));
    fireEvent.press(screen.getByTestId('btn-make-checkin'));

    act(() => {
      jest.advanceTimersByTime(50);
    });

    expect(mockNavigate).toHaveBeenCalledWith('CheckinForm', {});
  });

  it('체크인 만들기는 현재 trip context를 route params에 유지한다', () => {
    const { default: AppNavigator, setTripCheckinContext } = require('../AppNavigator');

    setTripCheckinContext({
      tripId: 'trip-1',
      tripTitle: '서울 산책',
      initialLatitude: 37.5665,
      initialLongitude: 126.978,
      initialPlace: '광화문',
      initialPlaceId: 'place-1',
    });

    render(<AppNavigator />);

    fireEvent.press(screen.getByTestId('btn-tab-make'));
    expect(screen.getByText('서울 산책')).toBeTruthy();

    fireEvent.press(screen.getByTestId('btn-make-checkin'));

    act(() => {
      jest.advanceTimersByTime(50);
    });

    expect(mockNavigate).toHaveBeenCalledWith('CheckinForm', {
      tripId: 'trip-1',
      tripTitle: '서울 산책',
      initialLatitude: 37.5665,
      initialLongitude: 126.978,
      initialPlace: '광화문',
      initialPlaceId: 'place-1',
    });
  });
});
