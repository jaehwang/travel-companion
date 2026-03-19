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

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#F97316" />
      </View>
    );
  }

  if (!tagline) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sparkle}>✨</Text>
      <Text style={styles.text} numberOfLines={2}>{tagline}</Text>
      <TouchableOpacity onPress={load} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Text style={styles.refresh}>🔄</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  sparkle: {
    fontSize: 16,
  },
  text: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    fontWeight: '500',
    lineHeight: 18,
  },
  refresh: {
    fontSize: 14,
  },
});
