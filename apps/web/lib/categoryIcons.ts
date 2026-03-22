import { Utensils, Coffee, Landmark, BedDouble, ShoppingBag, Leaf, Bike, Bus, Music2, Film, Palette, MapPin } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const CATEGORY_META: Record<string, { icon: LucideIcon; label: string; color: string }> = {
  restaurant:     { icon: Utensils,    label: '음식점',   color: '#FF6B47' },
  cafe:           { icon: Coffee,      label: '카페',     color: '#F59E0B' },
  attraction:     { icon: Landmark,    label: '명소',     color: '#3B82F6' },
  accommodation:  { icon: BedDouble,   label: '숙소',     color: '#8B5CF6' },
  shopping:       { icon: ShoppingBag, label: '쇼핑',     color: '#EC4899' },
  nature:         { icon: Leaf,        label: '자연',     color: '#10B981' },
  activity:       { icon: Bike,        label: '액티비티', color: '#EF4444' },
  transportation: { icon: Bus,         label: '교통',     color: '#6B7280' },
  performance:    { icon: Music2,      label: '공연',     color: '#E11D48' },
  movie:          { icon: Film,        label: '영화',     color: '#7C3AED' },
  exhibition:     { icon: Palette,     label: '전시',     color: '#0891B2' },
  other:          { icon: MapPin,      label: '기타',     color: '#C4A882' },
};
