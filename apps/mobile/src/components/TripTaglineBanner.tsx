import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { fetchTripTagline } from '../lib/api';

interface TripTaglineBannerProps {
  tripId: string;
}

export default function TripTaglineBanner({ tripId }: TripTaglineBannerProps) {
  const [tagline, setTagline] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const text = await fetchTripTagline(tripId);
      setTagline(text);
    } catch {
      setTagline(null);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => { load(); }, [load]);

  if (!loading && !tagline) return null;

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.text} numberOfLines={2}>
          {loading ? (
            <Text style={[styles.text, styles.loadingText]}>두근, 두근...</Text>
          ) : (
            <><Text style={styles.sparkle}>✨ </Text>{tagline}</>
          )}
        </Text>
        <TouchableOpacity
          onPress={load}
          disabled={loading}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={[styles.refreshButton, loading && styles.refreshButtonDisabled]}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#B45309" />
          ) : (
            <Text style={styles.refreshIcon}>↺</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 14,
    borderLeftWidth: 4,
    borderLeftColor: 'rgba(255, 107, 71, 0.45)',
    shadowColor: '#2D2416',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 10,
  },
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  sparkle: {
    fontStyle: 'normal',
  },
  text: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
    fontStyle: 'italic',
    color: '#44403C',
  },
  loadingText: {
    color: '#A8A29E',
    fontStyle: 'italic',
  },
  refreshButton: {
    width: 28,
    height: 28,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F0EB',
    borderWidth: 1,
    borderColor: '#E8E0D4',
    borderRadius: 8,
  },
  refreshButtonDisabled: {
    opacity: 0.4,
  },
  refreshIcon: {
    fontSize: 16,
    color: '#B45309',
    lineHeight: 18,
  },
});
