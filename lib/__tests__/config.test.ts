import { APP_NAME } from '../config';

describe('APP_NAME', () => {
  it('문자열이다', () => {
    expect(typeof APP_NAME).toBe('string');
  });

  it('비어 있지 않다', () => {
    expect(APP_NAME.length).toBeGreaterThan(0);
  });

  it('"Travel Companion"이다', () => {
    expect(APP_NAME).toBe('Travel Companion');
  });
});
