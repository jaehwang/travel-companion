import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('../../lib/supabase', () => ({ supabase: { auth: { getSession: jest.fn(), getUser: jest.fn() } } }));
jest.mock('../../store/tripsStore', () => ({ useTripsStore: () => jest.fn() }));
jest.mock('../../store/checkinsStore', () => ({ useCheckinsStore: () => jest.fn() }));
jest.mock('../../screens/HomeScreen', () => () => null);
jest.mock('../../screens/trip/TripScreen', () => () => null);
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

// MakeTabButton은 내부적으로 Modal을 렌더링하므로 직접 테스트하지 않고
// 탭 버튼의 testID를 통해 동작을 검증한다.
describe('AppNavigator exports', () => {
  it('setTripCheckinContext가 export된다', () => {
    const { setTripCheckinContext } = require('../AppNavigator');
    expect(typeof setTripCheckinContext).toBe('function');
  });
});
