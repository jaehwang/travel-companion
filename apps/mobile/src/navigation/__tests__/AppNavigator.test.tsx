import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('../../lib/supabase', () => ({ supabase: { auth: { getSession: jest.fn(), getUser: jest.fn() } } }));
jest.mock('../../store/tripsStore', () => ({ useTripsStore: () => jest.fn() }));
jest.mock('../../store/checkinsStore', () => ({ useCheckinsStore: () => jest.fn() }));
jest.mock('../../screens/HomeScreen', () => () => null);
jest.mock('../../screens/TripScreen', () => () => null);
jest.mock('../../screens/CheckinFormScreen', () => () => null);
jest.mock('../../screens/LocationPickerScreen', () => () => null);
jest.mock('../../screens/SettingsScreen', () => () => null);
jest.mock('../../screens/CheckinsScreen', () => () => null);
jest.mock('../../screens/ScheduleScreen', () => () => null);
jest.mock('../../components/TripFormModal', () => () => null);
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useRoute: () => ({ params: {} }),
  useFocusEffect: jest.fn(),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }: any) => children,
    Screen: () => null,
  }),
}));

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Navigator: ({ children }: any) => children,
    Screen: () => null,
  }),
}));

import { AddCheckinTabButton } from '../AppNavigator';

describe('AddCheckinTabButton', () => {
  beforeEach(() => jest.clearAllMocks());

  const buttonProps = { style: undefined, accessibilityState: {}, children: null } as any;

  it('btn-tab-add-checkin testID로 렌더링된다', () => {
    const { getByTestId } = render(<AddCheckinTabButton {...buttonProps} />);
    expect(getByTestId('btn-tab-add-checkin')).toBeTruthy();
  });

  it('탭 시 CheckinForm으로 tripId 없이 이동한다', () => {
    const { getByTestId } = render(<AddCheckinTabButton {...buttonProps} />);
    fireEvent.press(getByTestId('btn-tab-add-checkin'));
    expect(mockNavigate).toHaveBeenCalledWith('CheckinForm', {});
  });
});
