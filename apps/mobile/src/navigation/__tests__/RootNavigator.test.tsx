import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import RootNavigator from '../RootNavigator';
import { supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
  },
}));

jest.mock('../AppNavigator', () => ({
  __esModule: true,
  default: () => {
    const { Text } = require('react-native');
    return <Text testID="app-navigator">AppNavigator</Text>;
  },
}));

jest.mock('../../screens/LoginScreen', () => ({
  __esModule: true,
  default: () => {
    const { Text } = require('react-native');
    return <Text testID="login-screen">LoginScreen</Text>;
  },
}));

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
}));

const mockGetSession = supabase.auth.getSession as jest.MockedFunction<
  typeof supabase.auth.getSession
>;

describe('RootNavigator', () => {
  beforeEach(() => jest.clearAllMocks());

  it('세션 확인 중에는 LoginScreen과 AppNavigator 모두 표시하지 않는다', () => {
    mockGetSession.mockReturnValue(new Promise(() => {}));
    render(<RootNavigator />);
    expect(screen.queryByTestId('login-screen')).toBeNull();
    expect(screen.queryByTestId('app-navigator')).toBeNull();
  });

  it('세션이 없으면 LoginScreen을 표시한다', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null } as any);
    render(<RootNavigator />);
    await waitFor(() => {
      expect(screen.getByTestId('login-screen')).toBeTruthy();
    });
  });

  it('세션이 있으면 AppNavigator를 표시한다', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' }, access_token: 'tok' } },
      error: null,
    } as any);
    render(<RootNavigator />);
    await waitFor(() => {
      expect(screen.getByTestId('app-navigator')).toBeTruthy();
    });
  });
});
