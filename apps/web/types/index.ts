export interface Photo {
  id: string;
  url: string;
  thumbnailUrl?: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  altitude?: number;
  title?: string;
  description?: string;
}

export interface Trip {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  photos: Photo[];
  isPublic: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  photo: Photo;
}
