// Database Types for Supabase

// Checkin categories
export const CHECKIN_CATEGORIES = {
  RESTAURANT: 'restaurant',
  ATTRACTION: 'attraction',
  ACCOMMODATION: 'accommodation',
  CAFE: 'cafe',
  SHOPPING: 'shopping',
  NATURE: 'nature',
  ACTIVITY: 'activity',
  TRANSPORTATION: 'transportation',
  PERFORMANCE: 'performance',
  MOVIE: 'movie',
  EXHIBITION: 'exhibition',
  OTHER: 'other',
} as const;

export type CheckinCategory = typeof CHECKIN_CATEGORIES[keyof typeof CHECKIN_CATEGORIES];

export const CHECKIN_CATEGORY_LABELS: Record<CheckinCategory, string> = {
  restaurant: '음식점',
  attraction: '관광지',
  accommodation: '숙소',
  cafe: '카페',
  shopping: '쇼핑',
  nature: '자연',
  activity: '액티비티',
  transportation: '교통',
  performance: '공연',
  movie: '영화',
  exhibition: '전시',
  other: '기타',
};

export interface Trip {
  id: string;
  user_id?: string;
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  is_public: boolean;
  is_frequent: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  first_checkin_date?: string | null;
  cover_photo_url?: string | null;
  place?: string | null;
  place_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface Checkin {
  id: string;
  trip_id: string;
  message?: string;
  title?: string;
  place?: string;
  place_id?: string;
  latitude: number;
  longitude: number;
  category?: string;
  photo_url?: string;
  photo_metadata?: {
    exif?: Record<string, any>;
    width?: number;
    height?: number;
    file_size?: number;
  };
  checked_in_at: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfileSettings {
  calendar_sync_enabled?: boolean;
}

export interface UserProfile {
  id: string;
  google_refresh_token?: string | null;
  settings: UserProfileSettings;
  created_at: string;
  updated_at: string;
}

// Insert types (without auto-generated fields)
export type TripFormData = Omit<TripInsert, 'user_id'>;

export interface TripInsert {
  user_id?: string;
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  is_public?: boolean;
  is_frequent?: boolean;
  is_default?: boolean;
  place?: string | null;
  place_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface CheckinInsert {
  trip_id: string;
  message?: string;
  title?: string;
  place?: string;
  place_id?: string;
  latitude: number;
  longitude: number;
  category?: string;
  photo_url?: string;
  photo_metadata?: {
    exif?: Record<string, any>;
    width?: number;
    height?: number;
    file_size?: number;
  };
  checked_in_at?: string;
}

// Database schema type
export interface Database {
  public: {
    Tables: {
      trips: {
        Row: Trip;
        Insert: TripInsert;
        Update: Partial<TripInsert>;
      };
      checkins: {
        Row: Checkin;
        Insert: CheckinInsert;
        Update: Partial<CheckinInsert>;
      };
      user_profiles: {
        Row: UserProfile;
        Insert: { id: string; google_refresh_token?: string | null; settings?: UserProfileSettings };
        Update: { google_refresh_token?: string | null; settings?: UserProfileSettings };
      };
    };
  };
}
