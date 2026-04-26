import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { MoveCheckinModal } from '../MoveCheckinModal';
import type { Trip } from '@travel-companion/shared';

jest.mock('react-native/Libraries/Modal/Modal', () => ({
  __esModule: true,
  default: ({ children, visible }: { children: React.ReactNode; visible: boolean }) =>
    visible ? children : null,
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text>{name}</Text>;
  },
}));

function makeTrip(id: string, title: string, isFrequent = false): Trip {
  return {
    id,
    title,
    is_public: false,
    is_frequent: isFrequent,
    is_default: false,
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
  };
}

const defaultProps = {
  visible: true,
  assignableTrips: [makeTrip('t1', '서울 여행'), makeTrip('t2', '제주 여행')],
  onClose: jest.fn(),
  onMoveToTrip: jest.fn(),
};

describe('MoveCheckinModal', () => {
  beforeEach(() => jest.clearAllMocks());

  it('여행 목록을 표시한다', () => {
    render(<MoveCheckinModal {...defaultProps} />);
    expect(screen.getByText('서울 여행')).toBeTruthy();
    expect(screen.getByText('제주 여행')).toBeTruthy();
  });

  it('is_frequent 여행에 "자주 가는 곳" 배지를 표시한다', () => {
    render(<MoveCheckinModal {...defaultProps} assignableTrips={[makeTrip('t1', '서울', true)]} />);
    expect(screen.getByText('자주 가는 곳')).toBeTruthy();
  });

  it('assignableTrips가 비어있으면 안내 메시지를 표시한다', () => {
    render(<MoveCheckinModal {...defaultProps} assignableTrips={[]} />);
    expect(screen.getByText('이동할 수 있는 여행이 없습니다')).toBeTruthy();
  });

  it('여행 항목을 누르면 onMoveToTrip을 호출한다', () => {
    const onMoveToTrip = jest.fn();
    render(<MoveCheckinModal {...defaultProps} onMoveToTrip={onMoveToTrip} />);
    fireEvent.press(screen.getByTestId('move-modal-trip-t1'));
    expect(onMoveToTrip).toHaveBeenCalledWith('t1');
  });

  it('닫기 버튼을 누르면 onClose를 호출한다', () => {
    const onClose = jest.fn();
    render(<MoveCheckinModal {...defaultProps} onClose={onClose} />);
    fireEvent.press(screen.getByTestId('move-modal-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('visible=false이면 아무것도 렌더링하지 않는다', () => {
    const { toJSON } = render(<MoveCheckinModal {...defaultProps} visible={false} />);
    expect(toJSON()).toBeNull();
  });
});
