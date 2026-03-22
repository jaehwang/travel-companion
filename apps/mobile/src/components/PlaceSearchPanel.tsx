import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { searchPlaces, getPlaceDetails } from '../lib/api';
import type { PlacePrediction } from '../lib/api';

interface PlaceSearchPanelProps {
  visible: boolean;
  onClose: () => void;
  onPlaceSelected: (
    latitude: number,
    longitude: number,
    name: string,
    placeId: string,
  ) => void;
  currentLat?: number;
  currentLng?: number;
}

export default function PlaceSearchPanel({
  visible,
  onClose,
  onPlaceSelected,
  currentLat,
  currentLng,
}: PlaceSearchPanelProps) {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setPredictions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchPlaces(query.trim(), currentLat, currentLng);
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
  }, [query, currentLat, currentLng]);

  const handleSelect = async (prediction: PlacePrediction) => {
    setLoading(true);
    try {
      const details = await getPlaceDetails(prediction.place_id);
      onPlaceSelected(details.latitude, details.longitude, details.name, details.place_id);
      setQuery('');
      setPredictions([]);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setQuery('');
    setPredictions([]);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Search Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.backButton}>
            <Ionicons name="chevron-back" size={16} color="#6B7280" />
            <Text style={styles.backText}>뒤로</Text>
          </TouchableOpacity>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={16} color="#9CA3AF" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="장소 이름을 입력하세요"
              placeholderTextColor="#C4B49A"
              style={styles.searchInput}
              autoFocus
              autoCorrect={false}
              autoComplete="off"
              spellCheck={false}
            />
            {searching && <ActivityIndicator size="small" color="#F97316" />}
            {query && !searching && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#F97316" />
          </View>
        )}

        {/* Results */}
        <FlatList
          data={predictions}
          keyExtractor={(item) => item.place_id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleSelect(item)}
              style={styles.resultItem}
            >
              <View style={styles.resultMainRow}>
                <Ionicons name="location-outline" size={14} color="#F97316" />
                <Text style={styles.resultMain}>
                  {item.structured_formatting.main_text}
                </Text>
              </View>
              <Text style={styles.resultSecondary}>
                {item.structured_formatting.secondary_text}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              {query.trim().length >= 2 && !searching ? (
                <>
                  <Ionicons name="search-outline" size={40} color="#C4B49A" />
                  <Text style={styles.emptyText}>검색 결과가 없습니다</Text>
                </>
              ) : (
                <>
                  <Ionicons name="location-outline" size={40} color="#C4B49A" />
                  <Text style={styles.emptyText}>장소 이름을 2자 이상 입력하세요</Text>
                </>
              )}
            </View>
          }
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: '#E8E0D4',
    gap: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  backText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F97316',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8E0D4',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,248,240,0.8)',
    zIndex: 10,
  },
  resultItem: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D4',
  },
  resultMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  resultMain: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  resultSecondary: {
    fontSize: 12,
    color: '#6B7280',
    paddingLeft: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#C4B49A',
  },
});
