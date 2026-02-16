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
  other: '기타',
};

export interface Trip {
  id: string;
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface Checkin {
  id: string;
  trip_id: string;
  message?: string;
  location_name?: string;
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

// Insert types (without auto-generated fields)
export interface TripInsert {
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  is_public?: boolean;
}

export interface CheckinInsert {
  trip_id: string;
  message?: string;
  location_name?: string;
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
    };
  };
}
