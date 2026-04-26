import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import SettingsScreen from '../SettingsScreen';
import { fetchSettings } from '../../lib/api';
import { signOut } from '../../lib/auth';

const mockGoBack = jest.fn();

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: {
          user: {
            email: 'user@example.com',
            user_metadata: {
              full_name: '테스트 사용자',
              avatar_url: 'https://example.com/avatar.jpg',
            },
          },
        },
      }),
    },
  },
}));

jest.mock('../../lib/api', () => ({
  fetchSettings: jest.fn(),
  connectCalendar: jest.fn(),
  completeCalendarConnect: jest.fn(),
  disconnectCalendar: jest.fn(),
}));

jest.mock('../../lib/auth', () => ({
  signOut: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
}));

jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('expo-image', () => ({
  Image: ({ testID, source, style }: { testID?: string; source?: unknown; style?: unknown }) => {
    const { View } = require('react-native');
    return <View testID={testID ?? 'profile-avatar'} source={source} style={style} />;
  },
}));

const mockFetchSettings = fetchSettings as jest.MockedFunction<typeof fetchSettings>;
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert');
    mockFetchSettings.mockResolvedValue({ calendar_sync_enabled: true });
  });

  it('사용자 정보와 캘린더 연동 상태를 렌더링한다', async () => {
    render(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByText('테스트 사용자')).toBeTruthy();
      expect(screen.getByText('user@example.com')).toBeTruthy();
      expect(screen.getByText('연동됨')).toBeTruthy();
    });
  });

  it('돌아가기 버튼을 누르면 navigation.goBack을 호출한다', async () => {
    render(<SettingsScreen />);

    await waitFor(() => expect(screen.getByText('돌아가기')).toBeTruthy());
    fireEvent.press(screen.getByText('돌아가기'));

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('로그아웃 확인에서 destructive action을 실행하면 signOut을 호출한다', async () => {
    render(<SettingsScreen />);

    await waitFor(() => expect(screen.getByText('로그아웃')).toBeTruthy());
    fireEvent.press(screen.getByText('로그아웃'));

    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as { text: string; onPress?: () => void }[];
    const confirmButton = buttons.find((button) => button.text === '로그아웃');

    await act(async () => {
      await confirmButton?.onPress?.();
    });

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });
});
