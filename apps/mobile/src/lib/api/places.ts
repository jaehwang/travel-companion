import { apiFetch } from './rest-client';
import type { PlacePrediction, PlaceDetails } from '@travel-companion/shared';

export type { PlacePrediction, PlaceDetails };

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
