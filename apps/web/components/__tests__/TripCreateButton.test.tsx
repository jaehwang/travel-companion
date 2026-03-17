import { render, screen, fireEvent } from '@testing-library/react';
import TripCreateButton from '../TripCreateButton';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/components/TripFormModal', () => ({
  __esModule: true,
  default: ({ onCancel }: { onCancel: () => void }) => (
    <div data-testid="trip-form-modal">
      <button onClick={onCancel}>취소</button>
    </div>
  ),
}));

describe('TripCreateButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('+ 버튼을 렌더링한다', () => {
    render(<TripCreateButton />);
    expect(screen.getByRole('button', { name: '새 여행 만들기' })).toBeInTheDocument();
  });

  it('초기 상태에서 모달이 표시되지 않는다', () => {
    render(<TripCreateButton />);
    expect(screen.queryByTestId('trip-form-modal')).not.toBeInTheDocument();
  });

  it('+ 버튼 클릭 시 TripFormModal이 표시된다', () => {
    render(<TripCreateButton />);
    fireEvent.click(screen.getByRole('button', { name: '새 여행 만들기' }));
    expect(screen.getByTestId('trip-form-modal')).toBeInTheDocument();
  });

  it('모달에서 취소 시 모달이 닫힌다', () => {
    render(<TripCreateButton />);
    fireEvent.click(screen.getByRole('button', { name: '새 여행 만들기' }));
    expect(screen.getByTestId('trip-form-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByText('취소'));
    expect(screen.queryByTestId('trip-form-modal')).not.toBeInTheDocument();
  });
});
