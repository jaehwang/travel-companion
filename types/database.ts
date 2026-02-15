// Database Types for Supabase

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
