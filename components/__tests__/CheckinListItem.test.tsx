import { render, screen, fireEvent } from '@testing-library/react';
import { CheckinListItem } from '../CheckinListItem';
import type { Checkin } from '@/types/database';

const baseCheckin: Checkin = {
  id: 'checkin-1',
  trip_id: 'trip-1',
  title: '경복궁',
  latitude: 37.5796,
  longitude: 126.9770,
  checked_in_at: '2026-02-01T10:00:00Z',
  created_at: '2026-02-01T10:00:00Z',
  updated_at: '2026-02-01T10:00:00Z',
};

describe('CheckinListItem', () => {
  it('title을 렌더링한다', () => {
    render(<CheckinListItem checkin={baseCheckin} />);
    expect(screen.getByText('경복궁')).toBeInTheDocument();
  });

  it('title이 없으면 "이름 없는 장소"를 표시한다', () => {
    render(<CheckinListItem checkin={{ ...baseCheckin, title: undefined }} />);
    expect(screen.getByText('이름 없는 장소')).toBeInTheDocument();
  });

  it('place가 있으면 지도 링크 텍스트로 표시한다', () => {
    render(<CheckinListItem checkin={{ ...baseCheckin, place: '경복궁 (Gyeongbokgung)' }} />);
    expect(screen.getByText(/경복궁 \(Gyeongbokgung\)/)).toBeInTheDocument();
  });

  it('place가 없으면 "지도에서 보기"를 표시한다', () => {
    render(<CheckinListItem checkin={baseCheckin} />);
    expect(screen.getByText(/지도에서 보기/)).toBeInTheDocument();
  });

  it('place_id가 있으면 Google Maps 장소 URL을 사용한다', () => {
    render(<CheckinListItem checkin={{ ...baseCheckin, place: '경복궁', place_id: 'ChIJtest123' }} />);
    const link = screen.getByRole('link', { name: /경복궁/ });
    expect(link).toHaveAttribute('href', expect.stringContaining('query_place_id=ChIJtest123'));
  });

  it('place_id가 없으면 좌표 기반 URL을 사용한다', () => {
    render(<CheckinListItem checkin={baseCheckin} />);
    const link = screen.getByRole('link', { name: /지도에서 보기/ });
    expect(link).toHaveAttribute('href', expect.stringContaining('37.5796'));
  });

  it('message가 있으면 표시한다', () => {
    render(<CheckinListItem checkin={{ ...baseCheckin, message: '정말 아름다운 곳이었다' }} />);
    expect(screen.getByText('정말 아름다운 곳이었다')).toBeInTheDocument();
  });

  it('onEdit 핸들러가 제공되면 수정 버튼이 보인다', () => {
    const onEdit = jest.fn();
    render(<CheckinListItem checkin={baseCheckin} onEdit={onEdit} />);
    expect(screen.getByText('수정')).toBeInTheDocument();
  });

  it('수정 버튼 클릭 시 onEdit이 체크인 객체와 함께 호출된다', () => {
    const onEdit = jest.fn();
    render(<CheckinListItem checkin={baseCheckin} onEdit={onEdit} />);
    fireEvent.click(screen.getByText('수정'));
    expect(onEdit).toHaveBeenCalledWith(baseCheckin);
  });

  it('삭제 버튼 클릭 시 confirm 후 onDelete가 호출된다', () => {
    window.confirm = jest.fn(() => true);
    const onDelete = jest.fn();
    render(<CheckinListItem checkin={baseCheckin} onDelete={onDelete} />);
    fireEvent.click(screen.getByText('삭제'));
    expect(window.confirm).toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalledWith('checkin-1');
  });

  it('confirm 취소 시 onDelete가 호출되지 않는다', () => {
    window.confirm = jest.fn(() => false);
    const onDelete = jest.fn();
    render(<CheckinListItem checkin={baseCheckin} onDelete={onDelete} />);
    fireEvent.click(screen.getByText('삭제'));
    expect(onDelete).not.toHaveBeenCalled();
  });
});
