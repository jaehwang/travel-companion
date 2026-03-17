import { humanizeDuration } from '../humanizeDuration';

describe('humanizeDuration', () => {
  describe('분 단위 (60분 미만)', () => {
    it('1분', () => expect(humanizeDuration(1)).toBe('1분 후'));
    it('30분', () => expect(humanizeDuration(30)).toBe('30분 후'));
    it('59분', () => expect(humanizeDuration(59)).toBe('59분 후'));
  });

  describe('시간 단위 (60분 이상 ~ 24시간 미만)', () => {
    it('60분 → 1시간 후', () => expect(humanizeDuration(60)).toBe('1시간 후'));
    it('90분 → 1시간 30분 후', () => expect(humanizeDuration(90)).toBe('1시간 30분 후'));
    it('119분 → 1시간 59분 후', () => expect(humanizeDuration(119)).toBe('1시간 59분 후'));
    it('120분 → 2시간 후', () => expect(humanizeDuration(120)).toBe('2시간 후'));
    it('1439분 → 23시간 59분 후', () => expect(humanizeDuration(1439)).toBe('23시간 59분 후'));
  });

  describe('일 단위 (1440분 이상)', () => {
    it('1440분 → 1일 후', () => expect(humanizeDuration(1440)).toBe('1일 후'));
    it('1500분 → 1일 1시간 후', () => expect(humanizeDuration(1500)).toBe('1일 1시간 후'));
    it('2880분 → 2일 후', () => expect(humanizeDuration(2880)).toBe('2일 후'));
    it('20160분 → 14일 후', () => expect(humanizeDuration(20160)).toBe('14일 후'));
    it('20167분 → 14일 후 (버그 재현 방지)', () => expect(humanizeDuration(20167)).toBe('14일 후'));
  });
});
