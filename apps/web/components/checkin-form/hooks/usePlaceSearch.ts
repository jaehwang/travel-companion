'use client';

import { useState, useEffect } from 'react';

export interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface UsePlaceSearchOptions {
  isActive: boolean;
  location?: { lat: number; lng: number };
  onPlaceSelected: (lat: number, lng: number, name: string, placeId: string) => void;
  onError?: (message: string) => void;
}

export interface UsePlaceSearchReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  predictions: PlacePrediction[];
  searchingPlaces: boolean;
  handleSelectPlace: (prediction: PlacePrediction) => Promise<void>;
  reset: () => void;
}

export function usePlaceSearch({
  isActive,
  location,
  onPlaceSelected,
  onError,
}: UsePlaceSearchOptions): UsePlaceSearchReturn {
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [searchingPlaces, setSearchingPlaces] = useState(false);

  useEffect(() => {
    if (!isActive || !searchQuery || searchQuery.trim().length < 2) {
      setPredictions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingPlaces(true);
      try {
        const params = new URLSearchParams({ input: searchQuery });
        if (location) {
          params.set('lat', String(location.lat));
          params.set('lng', String(location.lng));
        }
        const response = await fetch(`/api/places/autocomplete?${params.toString()}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setPredictions(data.predictions || []);
      } catch {
        setPredictions([]);
      } finally {
        setSearchingPlaces(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, isActive]);

  const handleSelectPlace = async (prediction: PlacePrediction) => {
    setSearchingPlaces(true);
    try {
      const response = await fetch(`/api/places/details?place_id=${prediction.place_id}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      onPlaceSelected(
        data.place.latitude,
        data.place.longitude,
        prediction.structured_formatting.main_text,
        prediction.place_id,
      );
    } catch {
      onError?.('장소 정보를 가져오는데 실패했습니다.');
    } finally {
      setSearchingPlaces(false);
    }
  };

  const reset = () => {
    setSearchQuery('');
    setPredictions([]);
  };

  return { searchQuery, setSearchQuery, predictions, searchingPlaces, handleSelectPlace, reset };
}
