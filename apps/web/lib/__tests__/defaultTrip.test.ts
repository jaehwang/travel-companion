/**
 * @jest-environment node
 */
import { buildDefaultTripName, getOrCreateDefaultTrip } from '../defaultTrip';

// --- Supabase mock ---
const mockFrom = jest.fn();
const mockSupabase = { from: mockFrom };

function makeBuilder(resolved: { data: unknown; error: unknown }) {
  const b: Record<string, unknown> = {};
  b.select = jest.fn(() => b);
  b.insert = jest.fn(() => b);
  b.eq = jest.fn(() => b);
  b.single = jest.fn().mockResolvedValue(resolved);
  b.then = (resolve: (v: unknown) => unknown, reject: (v: unknown) => unknown) =>
    Promise.resolve(resolved).then(resolve, reject);
  return b;
}

// ------------------------------------------------------------------
describe('buildDefaultTripName', () => {
  it('userId_default 형식을 반환한다', () => {
    expect(buildDefaultTripName('user-123')).toBe('user-123_default');
  });

  it('빈 문자열 userId도 처리한다', () => {
    expect(buildDefaultTripName('')).toBe('_default');
  });
});

// ------------------------------------------------------------------
describe('getOrCreateDefaultTrip', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('이미 default trip이 있으면 기존 trip을 반환하고 insert를 호출하지 않는다', async () => {
    const existingTrip = { id: 'trip-1', title: 'user-1_default', is_default: true };
    const builder = makeBuilder({ data: existingTrip, error: null });
    mockFrom.mockReturnValue(builder);

    const result = await getOrCreateDefaultTrip(mockSupabase as never, 'user-1');

    expect(result).toEqual(existingTrip);
    expect(builder.insert).not.toHaveBeenCalled();
  });

  it('default trip이 없으면 is_default=true로 새 trip을 생성해 반환한다', async () => {
    const newTrip = { id: 'trip-new', title: 'user-2_default', is_default: true };
    // 첫 번째 from() 호출(select) → no rows 에러
    const selectBuilder = makeBuilder({ data: null, error: { code: 'PGRST116' } });
    // 두 번째 from() 호출(insert) → 성공
    const insertBuilder = makeBuilder({ data: newTrip, error: null });
    mockFrom
      .mockReturnValueOnce(selectBuilder)
      .mockReturnValueOnce(insertBuilder);

    const result = await getOrCreateDefaultTrip(mockSupabase as never, 'user-2');

    expect(result).toEqual(newTrip);
    expect(insertBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ is_default: true, user_id: 'user-2' })
    );
  });

  it('select 중 예상치 못한 DB 오류가 발생하면 throw한다', async () => {
    const builder = makeBuilder({ data: null, error: { code: 'SOME_ERROR', message: 'DB error' } });
    mockFrom.mockReturnValue(builder);

    await expect(getOrCreateDefaultTrip(mockSupabase as never, 'user-3')).rejects.toThrow();
  });

  it('insert 중 오류가 발생하면 throw한다', async () => {
    const selectBuilder = makeBuilder({ data: null, error: { code: 'PGRST116' } });
    const insertBuilder = makeBuilder({ data: null, error: { message: 'insert failed' } });
    mockFrom
      .mockReturnValueOnce(selectBuilder)
      .mockReturnValueOnce(insertBuilder);

    await expect(getOrCreateDefaultTrip(mockSupabase as never, 'user-4')).rejects.toThrow();
  });
});
