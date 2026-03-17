import type { MetadataRoute } from 'next';
import { APP_NAME } from '@/lib/config';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: '사진으로 여행 경로를 시각화하고 공유하는 앱',
    start_url: '/',
    display: 'standalone',
    background_color: '#1c1917',
    theme_color: '#1c1917',
    icons: [
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
