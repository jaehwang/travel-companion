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
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import MapView, { Marker, PROVIDER_GOOGLE, MapType } from 'react-native-maps';
import * as Location from 'expo-location';
import { searchPlaces, getPlaceDetails } from '../lib/api';
import type { PlacePrediction } from '../lib/api';
import type { AppStackParamList } from '../navigation/AppNavigator';

type NavigationProp = StackNavigationProp<AppStackParamList, 'LocationPicker'>;
type PickerRouteProp = RouteProp<AppStackParamList, 'LocationPicker'>;

export default function LocationPickerScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PickerRouteProp>();
  const { initialLatitude, initialLongitude } = route.params;

  const mapRef = useRef<MapView>(null);

  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(
    initialLatitude != null && initialLongitude != null
      ? { latitude: initialLatitude, longitude: initialLongitude }
      : null
  );
  const [selectedPlace, setSelectedPlace] = useState<{ name: string; place_id: string } | null>(null);
  const [mapType, setMapType] = useState<MapType>('standard');

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingPlace, setLoadingPlace] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get current location if no initial
  useEffect(() => {
    if (selectedLocation) return;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setSelectedLocation(coords);
        mapRef.current?.animateToRegion({
          ...coords,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 500);
      } catch {
        setSelectedLocation({ latitude: 37.5665, longitude: 126.9780 });
      }
    })();
  }, []);

  // Search places
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setPredictions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchPlaces(
          searchQuery.trim(),
          selectedLocation?.latitude,
          selectedLocation?.longitude,
        );
        setPredictions(results);
      } catch {
        setPredictions([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
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
      mapRef.current?.animateToRegion({
        ...coords,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 500);
    } catch {
      // ignore
    } finally {
      setLoadingPlace(false);
    }
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
    setSelectedPlace(null);
  };

  const handleMarkerDragEnd = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
    setSelectedPlace(null);
  };

  const handleConfirm = () => {
    if (!selectedLocation) return;
    // Go back to previous screen and pass selected location via params
    const parentRoute = navigation.getParent()?.getState()?.routes;
    // Use navigation.navigate to pass result back to CheckinFormScreen
    navigation.goBack();
    // Set params on the CheckinForm screen in the stack
    const state = navigation.getState();
    const checkinFormRoute = state.routes.find(r => r.name === 'CheckinForm');
    if (checkinFormRoute) {
      navigation.setParams({} as any); // This doesn't work for other screens
    }
    // Instead, emit event through navigation
    navigation.navigate('CheckinForm', {
      tripId: '', // placeholder - will merge with existing params
      tripTitle: '',
      locationResult: {
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        placeName: selectedPlace?.name,
        placeId: selectedPlace?.place_id,
      },
    } as any);
  };

  const defaultRegion = {
    latitude: initialLatitude ?? selectedLocation?.latitude ?? 37.5665,
    longitude: initialLongitude ?? selectedLocation?.longitude ?? 126.9780,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleArea}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>위치 선택</Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
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
          {searching && (
            <Text style={styles.searchingLabel}>검색 중...</Text>
          )}
        </View>

        {/* Search Results */}
        {predictions.length > 0 && (
          <View style={styles.predictionsContainer}>
            <FlatList
              data={predictions}
              keyExtractor={(item) => item.place_id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelectPrediction(item)}
                  style={styles.predictionItem}
                >
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
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelBtn}>
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

      {/* Map Type Toggle */}
      <View style={styles.mapTypeToggle}>
        <TouchableOpacity
          onPress={() => setMapType('standard')}
          style={[styles.mapTypeBtn, mapType === 'standard' && styles.mapTypeBtnActive]}
        >
          <Text style={[styles.mapTypeBtnText, mapType === 'standard' && styles.mapTypeBtnTextActive]}>지도</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setMapType('satellite')}
          style={[styles.mapTypeBtn, mapType === 'satellite' && styles.mapTypeBtnActive]}
        >
          <Text style={[styles.mapTypeBtnText, mapType === 'satellite' && styles.mapTypeBtnTextActive]}>위성</Text>
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={defaultRegion}
          mapType={mapType}
          onPress={handleMapPress}
        >
          {selectedLocation && (
            <Marker
              coordinate={selectedLocation}
              draggable
              onDragEnd={handleMarkerDragEnd}
            >
              <Text style={styles.markerPin}>📍</Text>
            </Marker>
          )}
        </MapView>

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
                <Text style={styles.overlayHint}>마커를 드래그하여 미세 조정 가능</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitleArea: {
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  closeButton: {
    fontSize: 20,
    color: '#6B7280',
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 10,
    color: '#1F2937',
  },
  searchingLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  predictionsContainer: {
    maxHeight: 192,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    overflow: 'hidden',
  },
  predictionsList: {
    maxHeight: 192,
  },
  predictionItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
  },
  predictionMain: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  predictionSecondary: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#2563EB',
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  mapTypeToggle: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapTypeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  mapTypeBtnActive: {
    backgroundColor: '#2563EB',
  },
  mapTypeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  mapTypeBtnTextActive: {
    color: '#FFFFFF',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  markerPin: {
    fontSize: 32,
  },
  locationOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderTopWidth: 1,
    borderTopColor: '#BFDBFE',
  },
  overlayPlace: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
  },
  overlayCoords: {
    fontSize: 14,
    color: '#1E40AF',
  },
  overlayHint: {
    fontSize: 12,
    color: '#2563EB',
    marginTop: 2,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
});
