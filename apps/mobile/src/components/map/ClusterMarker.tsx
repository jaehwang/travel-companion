import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CLUSTER_SIZE = 64;

interface ClusterMarkerProps {
  count: number;
  photoUrl: string | undefined;
  onImageLoad?: () => void;
}

export default function ClusterMarker({ count, photoUrl, onImageLoad }: ClusterMarkerProps) {
  return (
    <View style={styles.container}>
      <View testID="cluster-circle" style={styles.circle}>
        {photoUrl ? (
          <Image
            testID="cluster-photo"
            source={{ uri: photoUrl }}
            style={styles.photo}
            onLoad={onImageLoad}
          />
        ) : (
          <View testID="cluster-icon" style={styles.iconBg}>
            <Ionicons name="images-outline" size={26} color="#FFFFFF" />
          </View>
        )}
        <View testID="cluster-badge" style={styles.badge}>
          <Text testID="cluster-count" style={styles.badgeText}>
            {count}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: CLUSTER_SIZE,
    height: CLUSTER_SIZE,
    borderRadius: CLUSTER_SIZE / 2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: '#9CA3AF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  iconBg: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B7280',
  },
  badge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
