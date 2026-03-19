import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

interface CheckinFormToolbarProps {
  hasPhoto: boolean;
  hasLocation: boolean;
  hasCategory: boolean;
  hasTime: boolean;
  onPhoto: () => void;
  onPlace: () => void;
  onCategory: () => void;
  onTime: () => void;
}

const ACTIVE_COLOR = '#FF6B47';
const INACTIVE_COLOR = '#C4B49A';

function ToolbarButton({
  emoji,
  label,
  active,
  onPress,
}: {
  emoji: string;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, active && styles.buttonActive]}
    >
      <Text style={styles.buttonEmoji}>{emoji}</Text>
      <Text style={[styles.buttonLabel, { color: active ? ACTIVE_COLOR : INACTIVE_COLOR }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function CheckinFormToolbar({
  hasPhoto,
  hasLocation,
  hasCategory,
  hasTime,
  onPhoto,
  onPlace,
  onCategory,
  onTime,
}: CheckinFormToolbarProps) {
  return (
    <View style={styles.container}>
      <ToolbarButton emoji="📷" label="사진" active={hasPhoto} onPress={onPhoto} />
      <ToolbarButton emoji="📍" label="장소" active={hasLocation} onPress={onPlace} />
      <ToolbarButton emoji="🏷️" label="분류" active={hasCategory} onPress={onCategory} />
      <ToolbarButton emoji="⏰" label="시각" active={hasTime} onPress={onTime} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1.5,
    borderTopColor: '#E8E0D4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
    minHeight: 80,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 14,
    gap: 3,
  },
  buttonActive: {
    backgroundColor: 'rgba(255,107,71,0.1)',
  },
  buttonEmoji: {
    fontSize: 26,
  },
  buttonLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
