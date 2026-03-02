/**
 * SettingsPanelStack – React Native panel stack with reanimated slide animations.
 *
 * Renders stacked panels on top of the settings menu with translateX slide
 * transitions (300ms push, 200ms pop). Includes swipe-right gesture to pop.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  PanResponder,
  type GestureResponderEvent,
  type PanResponderGestureState,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import {
  useSettingsPanelStack,
  type SettingsScreen,
  colors,
} from '@salmon/shared';

import type { MobileSettingsPanelStackProps } from './types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PUSH_DURATION = 300;
const POP_DURATION = 200;
const SWIPE_THRESHOLD = 80;

export function SettingsPanelStack({
  panelRegistry,
  initialPanels,
}: MobileSettingsPanelStackProps): React.ReactElement {
  const { stack, push, pop, reset, canGoBack } = useSettingsPanelStack();

  const [animating, setAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'in' | 'out'>('in');
  const initialPanelsPushedRef = useRef(false);

  // Push initial panels on mount (no animation)
  useEffect(() => {
    if (initialPanels && initialPanels.length > 0 && !initialPanelsPushedRef.current) {
      initialPanelsPushedRef.current = true;
      for (const entry of initialPanels) {
        push(entry.screen, entry.props);
      }
    }
  }, [initialPanels, push]);

  const handlePush = useCallback(
    (screen: SettingsScreen, props?: Record<string, unknown>) => {
      if (animating) return;
      setSlideDirection('in');
      setAnimating(true);
      push(screen, props);
      setTimeout(() => setAnimating(false), PUSH_DURATION);
    },
    [push, animating],
  );

  const handlePop = useCallback(() => {
    if (animating || !canGoBack) return;
    // Animate out first, then pop after animation completes
    setSlideDirection('out');
    setAnimating(true);
    setTimeout(() => {
      pop();
      setAnimating(false);
    }, POP_DURATION);
  }, [pop, canGoBack, animating]);

  return (
    <View style={styles.container}>
      {stack.map((entry, idx) => {
        const isTop = idx === stack.length - 1;
        // Only render top 2 panels for performance
        if (idx < stack.length - 2) return null;
        const isExiting = isTop && animating && slideDirection === 'out';
        return (
          <PanelSlide
            key={`${entry.screen}-${idx}`}
            direction={isTop && animating ? slideDirection : 'idle'}
            isTop={isTop}
            animating={animating && isTop}
            onSwipeRight={handlePop}
            canSwipe={isTop && !animating}
          >
            {panelRegistry[entry.screen]?.({
              onBack: isExiting ? () => {} : handlePop,
              onNavigate: isExiting ? () => {} : handlePush,
              ...(entry.props || {}),
            })}
          </PanelSlide>
        );
      })}
    </View>
  );
}

// ============================================================================
// PanelSlide — animated panel wrapper
// ============================================================================

interface PanelSlideProps {
  children: React.ReactNode;
  direction: 'in' | 'out' | 'idle';
  isTop: boolean;
  animating: boolean;
  canSwipe?: boolean;
  onSwipeRight?: () => void;
}

function PanelSlide({
  children,
  direction,
  isTop,
  animating,
  canSwipe = false,
  onSwipeRight,
}: PanelSlideProps): React.ReactElement {
  const translateX = useSharedValue(direction === 'in' && animating ? SCREEN_WIDTH : 0);

  useEffect(() => {
    if (animating && isTop) {
      if (direction === 'in') {
        translateX.value = SCREEN_WIDTH;
        translateX.value = withTiming(0, {
          duration: PUSH_DURATION,
          easing: Easing.out(Easing.cubic),
        });
      } else if (direction === 'out') {
        // Panel is already at 0 from previous push — animate it out
        translateX.value = withTiming(SCREEN_WIDTH, {
          duration: POP_DURATION,
          easing: Easing.in(Easing.cubic),
        });
      }
    }
  }, [animating, isTop, direction, translateX]);

  // Swipe-right gesture to pop
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        return canSwipe && gestureState.dx > 10 && Math.abs(gestureState.dy) < 30;
      },
      onPanResponderRelease: (_e: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD && onSwipeRight) {
          onSwipeRight();
        }
      },
    }),
  ).current;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.panel,
        { zIndex: isTop ? 2 : 1 },
        animatedStyle,
      ]}
      {...(canSwipe ? panResponder.panHandlers : {})}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  panel: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background.secondary,
  },
});

export default SettingsPanelStack;
