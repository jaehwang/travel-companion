import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Map, { MapPhoto } from '../Map';

jest.mock('@vis.gl/react-google-maps', () => ({
  APIProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Map: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="google-map">{children}</div>
  ),
  AdvancedMarker: ({ children, onClick, title }: any) => (
    <div data-testid="advanced-marker" onClick={onClick} title={title}>
      {children}
    </div>
  ),
  InfoWindow: ({ children, onCloseClick }: any) => (
    <div data-testid="info-window">
      <button onClick={onCloseClick} data-testid="info-window-close">닫기</button>
      {children}
    </div>
  ),
  useMap: () => ({
    panTo: jest.fn(),
    setZoom: jest.fn(),
    fitBounds: jest.fn(),
  }),
}));

jest.mock('@/components/MyLocationButton', () => () => null);

// Google Maps API 전역 객체 mock (MapController에서 google.maps.LatLngBounds 사용)
const mockExtend = jest.fn();
const mockLatLngBounds = jest.fn().mockImplementation(() => ({ extend: mockExtend }));
(global as any).google = {
  maps: { LatLngBounds: mockLatLngBounds },
};

const samplePhotos: MapPhoto[] = [
  {
    id: '1',
    url: 'https://example.com/photo1.jpg',
    latitude: 37.5665,
    longitude: 126.978,
    title: '경복궁',
    message: '아름다운 궁궐',
    takenAt: '2024-04-01T10:00:00Z',
  },
  {
    id: '2',
    url: 'https://example.com/photo2.jpg',
    latitude: 35.1796,
    longitude: 129.0756,
    title: '해운대',
  },
];

describe('Map 컴포넌트', () => {
  const originalEnv = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = originalEnv;
  });

  it('API 키가 없으면 에러 안내 메시지를 표시한다', () => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = '';

    render(<Map photos={[]} />);

    expect(screen.getByText(/Google Maps API 키가 설정되지 않았습니다/)).toBeInTheDocument();
  });

  it('API 키가 기본값이면 에러 안내 메시지를 표시한다', () => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'your-google-maps-api-key';

    render(<Map photos={[]} />);

    expect(screen.getByText(/Google Maps API 키가 설정되지 않았습니다/)).toBeInTheDocument();
  });

  it('photos가 빈 배열이면 지도를 렌더링하되 마커는 없다', () => {
    render(<Map photos={[]} />);

    expect(screen.getByTestId('google-map')).toBeInTheDocument();
    expect(screen.queryAllByTestId('advanced-marker')).toHaveLength(0);
  });

  it('photos 수만큼 마커를 렌더링한다', () => {
    render(<Map photos={samplePhotos} />);

    const markers = screen.getAllByTestId('advanced-marker');
    expect(markers).toHaveLength(2);
  });

  it('마커에 순번이 표시된다', () => {
    render(<Map photos={samplePhotos} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('마커 클릭 시 InfoWindow가 표시된다', () => {
    render(<Map photos={samplePhotos} />);

    expect(screen.queryByTestId('info-window')).not.toBeInTheDocument();

    const markers = screen.getAllByTestId('advanced-marker');
    fireEvent.click(markers[0]);

    expect(screen.getByTestId('info-window')).toBeInTheDocument();
    expect(screen.getByText('경복궁')).toBeInTheDocument();
    expect(screen.getByText('아름다운 궁궐')).toBeInTheDocument();
  });

  it('InfoWindow 닫기 버튼 클릭 시 InfoWindow가 사라진다', () => {
    render(<Map photos={samplePhotos} />);

    const markers = screen.getAllByTestId('advanced-marker');
    fireEvent.click(markers[0]);
    expect(screen.getByTestId('info-window')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('info-window-close'));
    expect(screen.queryByTestId('info-window')).not.toBeInTheDocument();
  });

  it('InfoWindow에서 이전/다음 버튼으로 사진을 탐색한다', () => {
    render(<Map photos={samplePhotos} />);

    const markers = screen.getAllByTestId('advanced-marker');
    fireEvent.click(markers[0]);

    // 첫 번째 사진: '경복궁' 표시
    expect(screen.getByText('경복궁')).toBeInTheDocument();

    // 다음 버튼 클릭 → 두 번째 사진으로 이동
    fireEvent.click(screen.getByText('다음 →'));
    expect(screen.getByText('해운대')).toBeInTheDocument();
    expect(screen.queryByText('경복궁')).not.toBeInTheDocument();
  });
});
