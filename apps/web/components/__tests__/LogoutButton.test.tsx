import { render, screen, fireEvent } from '@testing-library/react';
import LogoutButton from '../LogoutButton';

const mockSignOut = jest.fn();

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn().mockReturnValue({
    auth: { signOut: (...args: any[]) => mockSignOut(...args) },
  }),
}));

describe('LogoutButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSignOut.mockResolvedValue({});
  });

  it('로그아웃 버튼을 렌더링한다', () => {
    render(<LogoutButton />);
    expect(screen.getByText('로그아웃')).toBeInTheDocument();
  });

  it('버튼 클릭 시 signOut을 호출한다', async () => {
    render(<LogoutButton />);
    fireEvent.click(screen.getByText('로그아웃'));
    await Promise.resolve(); // flush microtasks
    expect(mockSignOut).toHaveBeenCalled();
  });
});
