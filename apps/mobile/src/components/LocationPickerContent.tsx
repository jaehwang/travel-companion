import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE, MapPressEvent, MarkerDragStartEndEvent, PoiClickEvent } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { searchPlaces, getPlaceDetails } from '../lib/api';
import type { PlacePrediction } from '../lib/api';

interface LocationPickerContentProps {
  initialLatitude?: number;
  initialLongitude?: number;
  onConfirm: (lat: number, lng: number, placeName?: string, placeId?: string) => void;
  onClose: () => void;
}

export default function LocationPickerContent({
  initialLatitude,
  initialLongitude,
  onConfirm,
  onClose,
}: LocationPickerContentProps) {
  const mapRef = useRef<MapView>(null);

  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(
    initialLatitude != null && initialLongitude != null
      ? { latitude: initialLatitude, longitude: initialLongitude }
      : null
  );
  const [selectedPlace, setSelectedPlace] = useState<{ name: string; place_id: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingPlace, setLoadingPlace] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentRegionRef = useRef({ latitudeDelta: 0.01, longitudeDelta: 0.01 });
  const poiClickedRef = useRef(false);

  // 초기 위치가 없으면 현재 위치로 이동
  useEffect(() => {
    if (selectedLocation) return;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setSelectedLocation(coords);
        mapRef.current?.animateToRegion({ ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 500);
      } catch {
        setSelectedLocation({ latitude: 37.5665, longitude: 126.9780 });
      }
    })();
  }, []);

  // 장소 검색 debounce
  useEffect(() => {
    if (searchQuery.trim().length < 2) { setPredictions([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        setPredictions(await searchPlaces(searchQuery.trim(), selectedLocation?.latitude, selectedLocation?.longitude));
      } catch {
        setPredictions([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  const handleSelectPrediction = async (prediction: PlacePrediction) => {
    setLoadingPlace(true);
    try {
      const details = await getPlaceDetails(prediction.place_id);
      const coords = { latitude: details.latitude, longitude: details.longitude };
      setSelectedLocation(coords);
      setSelectedPlace({ name: details.name, place_id: details.place_id });
      setSearchQuery('');
      setPredictions([]);
      mapRef.current?.animateToRegion({ ...coords, latitudeDelta: 0.005, longitudeDelta: 0.005 }, 500);
    } catch {
      // ignore
    } finally {
      setLoadingPlace(false);
    }
  };

  const handleZoomIn = () => {
    const center = selectedLocation ?? { latitude: 37.5665, longitude: 126.9780 };
    mapRef.current?.animateToRegion({
      ...center,
      latitudeDelta: currentRegionRef.current.latitudeDelta / 2,
      longitudeDelta: currentRegionRef.current.longitudeDelta / 2,
    }, 300);
  };

  const handleZoomOut = () => {
    const center = selectedLocation ?? { latitude: 37.5665, longitude: 126.9780 };
    mapRef.current?.animateToRegion({
      ...center,
      latitudeDelta: Math.min(currentRegionRef.current.latitudeDelta * 2, 90),
      longitudeDelta: Math.min(currentRegionRef.current.longitudeDelta * 2, 90),
    }, 300);
  };

  const handleGoToCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setSelectedLocation(coords);
      setSelectedPlace(null);
      mapRef.current?.animateToRegion({ ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 500);
    } catch {
      // ignore
    }
  };

  const handleMapPress = (event: MapPressEvent) => {
    if (poiClickedRef.current) return;
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
    setSelectedPlace(null);
  };

  const handlePoiClick = async (event: PoiClickEvent) => {
    poiClickedRef.current = true;
    setTimeout(() => { poiClickedRef.current = false; }, 300);
    const { coordinate, placeId, name } = event.nativeEvent;
    setSelectedLocation(coordinate);
    setSelectedPlace({ name, place_id: placeId });
    setLoadingPlace(true);
    try {
      const details = await getPlaceDetails(placeId);
      setSelectedLocation({ latitude: details.latitude, longitude: details.longitude });
      setSelectedPlace({ name: details.name || name, place_id: details.place_id || placeId });
    } catch {
      // 이벤트 데이터로 폴백
    } finally {
      setLoadingPlace(false);
    }
  };

  const handleMarkerDragEnd = (event: MarkerDragStartEndEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
    setSelectedPlace(null);
  };

  const handleConfirm = () => {
    if (!selectedLocation) return;
    onConfirm(
      selectedLocation.latitude,
      selectedLocation.longitude,
      selectedPlace?.name,
      selectedPlace?.place_id,
    );
  };

  const defaultRegion = {
    latitude: initialLatitude ?? selectedLocation?.latitude ?? 37.5665,
    longitude: initialLongitude ?? selectedLocation?.longitude ?? 126.9780,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleArea}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>위치 선택</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.headerSubtitle}>장소를 검색하거나 지도를 탭하세요</Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="장소 검색..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            autoCorrect={false}
            autoComplete="off"
          />
          {searching && <Text style={styles.searchingLabel}>검색 중...</Text>}
        </View>

        {/* Search Results */}
        {predictions.length > 0 && (
          <View style={styles.predictionsContainer}>
            <FlatList
              data={predictions}
              keyExtractor={(item) => item.place_id}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleSelectPrediction(item)} style={styles.predictionItem}>
                  <Text style={styles.predictionMain}>{item.structured_formatting.main_text}</Text>
                  <Text style={styles.predictionSecondary}>{item.structured_formatting.secondary_text}</Text>
                </TouchableOpacity>
              )}
              style={styles.predictionsList}
            />
          </View>
        )}

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>취소</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={!selectedLocation || loadingPlace}
            style={[styles.confirmBtn, (!selectedLocation || loadingPlace) && styles.confirmBtnDisabled]}
          >
            <Text style={styles.confirmBtnText}>
              {loadingPlace ? '불러오는 중...' : '위치 확정'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={defaultRegion}
          onPress={handleMapPress}
          onPoiClick={handlePoiClick}
          onRegionChangeComplete={(region) => {
            currentRegionRef.current = { latitudeDelta: region.latitudeDelta, longitudeDelta: region.longitudeDelta };
          }}
        >
          {selectedLocation && (
            <Marker
              coordinate={selectedLocation}
              draggable
              onDragEnd={handleMarkerDragEnd}
              pinColor="#FF6B47"
            />
          )}
        </MapView>

        {/* Map Control Buttons */}
        <View style={styles.mapControls}>
          <TouchableOpacity onPress={handleGoToCurrentLocation} style={styles.mapControlBtn}>
            <Ionicons name="navigate" size={20} color="#2563EB" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleZoomIn} style={styles.mapControlBtn}>
            <Text style={styles.mapControlText}>＋</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleZoomOut} style={styles.mapControlBtn}>
            <Text style={styles.mapControlText}>－</Text>
          </TouchableOpacity>
        </View>

        {/* Location Info Overlay */}
        {selectedLocation && (
          <View style={styles.locationOverlay}>
            {selectedPlace ? (
              <>
                <Text style={styles.overlayPlace}>📍 {selectedPlace.name}</Text>
                <Text style={styles.overlayCoords}>
                  {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.overlayCoords}>
                  📍 {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                </Text>
                <Text style={styles.overlayHint}>💡 지도를 탭하거나 장소를 검색하세요</Text>
              </>
            )}
          </View>
        )}
      </View>

      {loadingPlace && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingTop: 16, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitleArea: { marginBottom: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1F2937' },
  closeButton: { fontSize: 20, color: '#6B7280', fontWeight: '600' },
  headerSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB',
    borderRadius: 8, paddingHorizontal: 12, marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 10, color: '#1F2937' },
  searchingLabel: { fontSize: 12, color: '#9CA3AF' },
  predictionsContainer: {
    maxHeight: 192, borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 8, backgroundColor: '#FFFFFF', marginBottom: 12, overflow: 'hidden',
  },
  predictionsList: { maxHeight: 192 },
  predictionItem: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB' },
  predictionMain: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  predictionSecondary: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  buttonRow: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 10, backgroundColor: '#E5E7EB', borderRadius: 8, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#4B5563' },
  confirmBtn: { flex: 1, paddingVertical: 10, backgroundColor: '#2563EB', borderRadius: 8, alignItems: 'center' },
  confirmBtnDisabled: { backgroundColor: '#9CA3AF' },
  confirmBtnText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  mapContainer: { flex: 1 },
  map: { flex: 1 },
  mapControls: { position: 'absolute', right: 16, bottom: 80, gap: 8 },
  mapControlBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
  },
  mapControlText: { fontSize: 22, fontWeight: '600', color: '#1F2937', lineHeight: 26 },
  locationOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 12, backgroundColor: 'rgba(255,255,255,0.9)',
    borderTopWidth: 1, borderTopColor: '#BFDBFE',
  },
  overlayPlace: { fontSize: 14, fontWeight: '600', color: '#1E40AF' },
  overlayCoords: { fontSize: 14, color: '#1E40AF' },
  overlayHint: { fontSize: 12, color: '#2563EB', marginTop: 2 },
  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
});
