import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import {
  SettingsHeader,
  SettingsProfileCard,
  SettingsCalendarSection,
  SettingsAccountSection,
} from '../SettingsSections';

jest.mock('expo-image', () => ({ Image: 'Image' }));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text>{name}</Text>;
  },
}));

describe('SettingsHeader', () => {
  it('"설정" 제목을 표시한다', () => {
    render(<SettingsHeader onBack={jest.fn()} />);
    expect(screen.getByText('설정')).toBeTruthy();
  });

  it('"돌아가기"를 누르면 onBack을 호출한다', () => {
    const onBack = jest.fn();
    render(<SettingsHeader onBack={onBack} />);
    fireEvent.press(screen.getByText('돌아가기'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe('SettingsProfileCard', () => {
  it('이름과 이메일을 표시한다', () => {
    render(<SettingsProfileCard userName="홍길동" userEmail="hong@test.com" />);
    expect(screen.getByText('홍길동')).toBeTruthy();
    expect(screen.getByText('hong@test.com')).toBeTruthy();
  });

  it('이름이 빈 문자열이면 "사용자"를 표시한다', () => {
    render(<SettingsProfileCard userName="" userEmail="hong@test.com" />);
    expect(screen.getByText('사용자')).toBeTruthy();
  });

  it('avatarUrl이 없으면 기본 아이콘을 표시한다', () => {
    render(<SettingsProfileCard userName="홍길동" userEmail="hong@test.com" />);
    expect(screen.getByText('person-outline')).toBeTruthy();
  });
});

describe('SettingsCalendarSection', () => {
  const defaultProps = {
    calendarConnected: false,
    calendarLoading: false,
    calendarConnecting: false,
    onConnect: jest.fn(),
    onDisconnect: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('연동된 상태이면 "연동됨"을 표시한다', () => {
    render(<SettingsCalendarSection {...defaultProps} calendarConnected />);
    expect(screen.getByText('연동됨')).toBeTruthy();
  });

  it('미연동 상태이면 "미연동"을 표시한다', () => {
    render(<SettingsCalendarSection {...defaultProps} calendarConnected={false} />);
    expect(screen.getByText('미연동')).toBeTruthy();
  });

  it('미연동 상태에서 "연동하기" 버튼을 누르면 onConnect를 호출한다', () => {
    const onConnect = jest.fn();
    render(<SettingsCalendarSection {...defaultProps} onConnect={onConnect} />);
    fireEvent.press(screen.getByText('연동하기'));
    expect(onConnect).toHaveBeenCalledTimes(1);
  });

  it('연동된 상태에서 "연동 해제"를 누르면 onDisconnect를 호출한다', () => {
    const onDisconnect = jest.fn();
    render(<SettingsCalendarSection {...defaultProps} calendarConnected onDisconnect={onDisconnect} />);
    fireEvent.press(screen.getByText('연동 해제'));
    expect(onDisconnect).toHaveBeenCalledTimes(1);
  });

  it('calendarLoading=true이면 연동/해제 버튼을 표시하지 않는다', () => {
    render(<SettingsCalendarSection {...defaultProps} calendarLoading />);
    expect(screen.queryByText('연동하기')).toBeNull();
    expect(screen.queryByText('연동 해제')).toBeNull();
  });
});

describe('SettingsAccountSection', () => {
  it('"로그아웃" 버튼을 누르면 onLogout을 호출한다', () => {
    const onLogout = jest.fn();
    render(<SettingsAccountSection loggingOut={false} onLogout={onLogout} />);
    fireEvent.press(screen.getByText('로그아웃'));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('loggingOut=true이면 "로그아웃" 텍스트를 숨긴다', () => {
    render(<SettingsAccountSection loggingOut onLogout={jest.fn()} />);
    expect(screen.queryByText('로그아웃')).toBeNull();
  });
});
