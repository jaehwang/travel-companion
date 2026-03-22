import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

export type IoniconName = ComponentProps<typeof Ionicons>['name'];

export const CATEGORY_ICONS: Record<string, IoniconName> = {
  restaurant: 'restaurant-outline',
  cafe: 'cafe-outline',
  attraction: 'compass-outline',
  accommodation: 'bed-outline',
  shopping: 'bag-handle-outline',
  nature: 'leaf-outline',
  activity: 'bicycle-outline',
  transportation: 'bus-outline',
  performance: 'musical-notes-outline',
  movie: 'film-outline',
  exhibition: 'color-palette-outline',
  other: 'location-outline',
};

export const CATEGORY_COLORS: Record<string, string> = {
  restaurant: '#FF6B47',
  cafe: '#F59E0B',
  attraction: '#3B82F6',
  accommodation: '#8B5CF6',
  shopping: '#EC4899',
  nature: '#10B981',
  activity: '#EF4444',
  transportation: '#6B7280',
  performance: '#E11D48',
  movie: '#7C3AED',
  exhibition: '#0891B2',
  other: '#C4A882',
};

export const CATEGORY_META: Record<string, { icon: IoniconName; label: string; color: string }> = {
  restaurant:     { icon: 'restaurant-outline',      label: '음식점',   color: '#FF6B47' },
  cafe:           { icon: 'cafe-outline',             label: '카페',     color: '#F59E0B' },
  attraction:     { icon: 'compass-outline',          label: '명소',     color: '#3B82F6' },
  accommodation:  { icon: 'bed-outline',              label: '숙소',     color: '#8B5CF6' },
  shopping:       { icon: 'bag-handle-outline',       label: '쇼핑',     color: '#EC4899' },
  nature:         { icon: 'leaf-outline',             label: '자연',     color: '#10B981' },
  activity:       { icon: 'bicycle-outline',          label: '액티비티', color: '#EF4444' },
  transportation: { icon: 'bus-outline',              label: '교통',     color: '#6B7280' },
  performance:    { icon: 'musical-notes-outline',    label: '공연',     color: '#E11D48' },
  movie:          { icon: 'film-outline',             label: '영화',     color: '#7C3AED' },
  exhibition:     { icon: 'color-palette-outline',    label: '전시',     color: '#0891B2' },
  other:          { icon: 'location-outline',         label: '기타',     color: '#C4A882' },
};
