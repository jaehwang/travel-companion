import { apiFetch } from './rest-client';

export interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface PlaceDetails {
  name: string;
  place_id: string;
  latitude: number;
  longitude: number;
}

export async function searchPlaces(input: string, lat?: number, lng?: number): Promise<PlacePrediction[]> {
  let path = `/api/places/autocomplete?input=${encodeURIComponent(input)}`;
  if (lat != null && lng != null) {
    path += `&lat=${lat}&lng=${lng}`;
  }
  const data = await apiFetch<{ predictions: PlacePrediction[] }>(path);
  return data.predictions;
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  const data = await apiFetch<{ place: PlaceDetails }>(`/api/places/details?place_id=${placeId}`);
  return data.place;
}
