import React, { useCallback } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  StatusBar,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const DISMISS_THRESHOLD = 120; // 이 거리 이상 아래로 드래그하면 닫힘

interface PhotoViewerModalProps {
  visible: boolean;
  uri: string;
  onClose: () => void;
}

export default function PhotoViewerModal({ visible, uri, onClose }: PhotoViewerModalProps) {
  // 현재 스케일 / 위치 (제스처 진행 중)
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // 베이스 스케일 / 위치 (제스처 종료 시점)
  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const closeViewer = useCallback(() => {
    onClose();
  }, [onClose]);

  const resetTransform = useCallback(() => {
    'worklet';
    scale.value = withSpring(1, { damping: 20, stiffness: 200 });
    translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
    translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, [scale, translateX, translateY, savedScale, savedTranslateX, savedTranslateY]);

  // Pinch — 확대/축소
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      const newScale = Math.min(
        Math.max(savedScale.value * e.scale, MIN_SCALE),
        MAX_SCALE
      );
      scale.value = newScale;
    })
    .onEnd(() => {
      if (scale.value < MIN_SCALE) {
        scale.value = withSpring(MIN_SCALE);
        savedScale.value = MIN_SCALE;
      } else {
        savedScale.value = scale.value;
      }
    });

  // Pan — 드래그 (확대 상태에서 이동 + 기본 스케일에서 스와이프 닫기)
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd((e) => {
      // 기본 스케일(1x)일 때 아래로 충분히 드래그 → 닫기
      if (savedScale.value <= 1.05 && e.translationY > DISMISS_THRESHOLD) {
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 }, () => {
          runOnJS(closeViewer)();
        });
        return;
      }

      // 확대 상태: 이미지 경계 내로 클램핑
      const maxTranslateX = (SCREEN_WIDTH * (savedScale.value - 1)) / 2;
      const maxTranslateY = (SCREEN_HEIGHT * (savedScale.value - 1)) / 2;

      const clampedX = Math.min(Math.max(translateX.value, -maxTranslateX), maxTranslateX);
      const clampedY = Math.min(Math.max(translateY.value, -maxTranslateY), maxTranslateY);

      translateX.value = withSpring(clampedX, { damping: 20, stiffness: 200 });
      translateY.value = withSpring(clampedY, { damping: 20, stiffness: 200 });
      savedTranslateX.value = clampedX;
      savedTranslateY.value = clampedY;
    });

  // 더블탭 — 2x 확대 / 초기화 토글
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((e) => {
      if (savedScale.value > 1) {
        resetTransform();
      } else {
        // 탭한 지점 기준으로 2x 확대
        const targetScale = 2.5;
        const tapX = e.x - SCREEN_WIDTH / 2;
        const tapY = e.y - SCREEN_HEIGHT / 2;
        const offsetX = -tapX * (targetScale - 1);
        const offsetY = -tapY * (targetScale - 1);

        scale.value = withSpring(targetScale, { damping: 20, stiffness: 200 });
        translateX.value = withSpring(offsetX, { damping: 20, stiffness: 200 });
        translateY.value = withSpring(offsetY, { damping: 20, stiffness: 200 });
        savedScale.value = targetScale;
        savedTranslateX.value = offsetX;
        savedTranslateY.value = offsetY;
      }
    });

  // 단일 탭 — 닫기 버튼 외 영역 탭 시 (확대 상태가 아닐 때)
  const singleTapGesture = Gesture.Tap()
    .onEnd(() => {
      if (savedScale.value <= 1.05) {
        runOnJS(closeViewer)();
      }
    });

  const composed = Gesture.Simultaneous(
    pinchGesture,
    Gesture.Exclusive(doubleTapGesture, singleTapGesture, panGesture)
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handleClose = useCallback(() => {
    // 상태 리셋 후 닫기
    scale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    onClose();
  }, [onClose, scale, translateX, translateY, savedScale, savedTranslateX, savedTranslateY]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <StatusBar hidden />
      <GestureHandlerRootView style={styles.root}>
        <View style={styles.backdrop}>
          <GestureDetector gesture={composed}>
            <Animated.View style={[styles.imageContainer, animatedStyle]}>
              <Animated.Image
                source={{ uri }}
                style={styles.image}
                resizeMode="contain"
              />
            </Animated.View>
          </GestureDetector>

          {/* 닫기 버튼 */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  closeButton: {
    position: 'absolute',
    top: 56,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
});
