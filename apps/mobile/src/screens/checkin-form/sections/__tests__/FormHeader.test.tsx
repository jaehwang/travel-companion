import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import FormHeader from '../FormHeader';
import type { Trip } from '@travel-companion/shared';

jest.mock('expo-image', () => ({ Image: 'Image' }));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text>{name}</Text>;
  },
}));

function makeTrip(id: string, title: string): Trip {
  return {
    id,
    title,
    is_public: false,
    is_frequent: false,
    is_default: false,
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
  };
}

const defaultProps = {
  avatarUrl: undefined,
  paramTripId: undefined,
  tripTitle: undefined,
  trips: [makeTrip('t1', '서울 여행'), makeTrip('t2', '제주 여행')],
  selectedTripId: undefined,
  onSelectTripId: jest.fn(),
  isEditMode: false,
  isSubmitting: false,
  canSubmit: true,
  onCancel: jest.fn(),
  onSubmit: jest.fn(),
};

describe('FormHeader', () => {
  beforeEach(() => jest.clearAllMocks());

  it('paramTripId가 없으면 여행 선택 목록을 표시한다', () => {
    render(<FormHeader {...defaultProps} />);
    expect(screen.getByTestId('trip-selector')).toBeTruthy();
  });

  it('paramTripId가 있으면 여행 제목 텍스트를 표시한다', () => {
    render(<FormHeader {...defaultProps} paramTripId="t1" tripTitle="서울 여행" />);
    expect(screen.getByText('서울 여행')).toBeTruthy();
    expect(screen.queryByTestId('trip-selector')).toBeNull();
  });

  it('취소 버튼을 누르면 onCancel을 호출한다', () => {
    const onCancel = jest.fn();
    render(<FormHeader {...defaultProps} onCancel={onCancel} />);
    fireEvent.press(screen.getByText('취소'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('저장 버튼을 누르면 onSubmit을 호출한다', () => {
    const onSubmit = jest.fn();
    render(<FormHeader {...defaultProps} canSubmit onSubmit={onSubmit} />);
    fireEvent.press(screen.getByTestId('btn-save-checkin'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('isEditMode=false이면 "체크인" 레이블을 표시한다', () => {
    render(<FormHeader {...defaultProps} isEditMode={false} />);
    expect(screen.getByText('체크인')).toBeTruthy();
  });

  it('isEditMode=true이면 "저장" 레이블을 표시한다', () => {
    render(<FormHeader {...defaultProps} isEditMode />);
    expect(screen.getByText('저장')).toBeTruthy();
  });

  it('isSubmitting=true이면 버튼 텍스트를 숨긴다', () => {
    render(<FormHeader {...defaultProps} isEditMode={false} isSubmitting />);
    expect(screen.queryByText('체크인')).toBeNull();
  });
});
