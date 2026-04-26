import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import SideDrawer from '../SideDrawer';
import type { Trip } from '@travel-companion/shared';

jest.mock('react-native/Libraries/Modal/Modal', () => ({
  __esModule: true,
  default: ({ children, visible }: { children: React.ReactNode; visible: boolean }) =>
    visible ? children : null,
}));

function makeTrip(id: string, overrides: Partial<Trip> = {}): Trip {
  return {
    id,
    title: `여행 ${id}`,
    is_public: false,
    is_frequent: false,
    is_default: false,
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
    ...overrides,
  };
}

const defaultProps = {
  visible: true,
  onClose: jest.fn(),
  trips: [makeTrip('t1'), makeTrip('t2')],
  currentTripId: 't1',
  onSelectTrip: jest.fn(),
  onCreateTrip: jest.fn(),
};

describe('SideDrawer', () => {
  beforeEach(() => jest.clearAllMocks());

  it('여행 목록을 표시한다', () => {
    render(<SideDrawer {...defaultProps} />);
    expect(screen.getByText('여행 t1')).toBeTruthy();
    expect(screen.getByText('여행 t2')).toBeTruthy();
  });

  it('자주 가는 곳 배지를 표시한다', () => {
    render(
      <SideDrawer
        {...defaultProps}
        trips={[makeTrip('t1', { is_frequent: true }), makeTrip('t2')]}
      />,
    );
    expect(screen.getByText('자주 가는 곳')).toBeTruthy();
  });

  it('여행을 누르면 onSelectTrip을 호출한다', () => {
    const onSelectTrip = jest.fn();
    const trips = [makeTrip('t1'), makeTrip('t2')];
    render(<SideDrawer {...defaultProps} trips={trips} onSelectTrip={onSelectTrip} />);
    fireEvent.press(screen.getByText('여행 t2'));
    expect(onSelectTrip).toHaveBeenCalledWith(trips[1]);
  });

  it('새 여행 만들기를 누르면 onCreateTrip을 호출한다', () => {
    const onCreateTrip = jest.fn();
    render(<SideDrawer {...defaultProps} onCreateTrip={onCreateTrip} />);
    fireEvent.press(screen.getByText('+ 새 여행 만들기'));
    expect(onCreateTrip).toHaveBeenCalledTimes(1);
  });

  it('visible이 false이면 아무것도 렌더링하지 않는다', () => {
    const { toJSON } = render(<SideDrawer {...defaultProps} visible={false} />);
    expect(toJSON()).toBeNull();
  });
});
