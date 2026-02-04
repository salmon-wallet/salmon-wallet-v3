import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, gradients, spacing, s, vs, ms } from '@salmon/shared';
import { HomeSvgIcon, GridViewSvgIcon, SwapSvgIcon, GlassContainer } from '@salmon/ui';

/**
 * Design specs from Figma (node 1698:4682, 1698:4683):
 * - Outer container: padding-x 24px, gradient fade black→transparent
 * - Glass pill: border-radius 62px, padding-x 45px, height 60px
 * - Tab items: width ~49px, height 60px, padding-x 14px, gap 3px
 * - Icons: Home 20x21, Grid 22x22, Swap 23x18
 * - Labels: DM Sans SemiBold, 8px, tracking 0.16px, line-height 1.4
 * - Active: #ff5c45, Inactive: rgba(255,255,255,0.6)
 *
 * iOS 26+: Uses native Liquid Glass effect via expo-glass-effect
 * iOS < 26 / Android: Falls back to BlurView with enhanced glass simulation
 */

interface TabConfig {
  name: string;
  icon: React.FC<{ size?: number; color?: string }>;
  label: string;
  iconSize: number;
}

const TAB_CONFIG: Record<string, TabConfig> = {
  index: {
    name: 'index',
    icon: HomeSvgIcon,
    label: 'Home',
    iconSize: s(26),
  },
  collectibles: {
    name: 'collectibles',
    icon: GridViewSvgIcon,
    label: 'Collectibles',
    iconSize: s(26),
  },
  swap: {
    name: 'swap',
    icon: SwapSvgIcon,
    label: 'Swap',
    iconSize: s(26),
  },
};

// Order of tabs as they should appear
const TAB_ORDER = ['index', 'collectibles', 'swap'];

interface TabItemProps {
  routeName: string;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

function TabItem({ routeName, isFocused, onPress, onLongPress }: TabItemProps) {
  const config = TAB_CONFIG[routeName];

  if (!config) {
    return null;
  }

  const iconColor = isFocused ? colors.tabBar.active : colors.tabBar.inactive;
  const labelColor = isFocused ? colors.tabBar.active : colors.tabBar.inactive;
  const IconComponent = config.icon;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={config.label}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabItem}
    >
      <View style={styles.tabIconContainer}>
        <IconComponent size={config.iconSize} color={iconColor} />
      </View>
      <Text style={[styles.tabLabel, { color: labelColor }]}>
        {config.label}
      </Text>
    </TouchableOpacity>
  );
}

export function GlassTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  // Filter and order routes to only show Home, Collectibles, and Swap
  const visibleRoutes = TAB_ORDER
    .map(tabName => state.routes.find(route => route.name === tabName))
    .filter((route): route is typeof state.routes[0] => route !== undefined);

  return (
    <LinearGradient
      colors={gradients.tabBarFade.colors}
      start={gradients.tabBarFade.start}
      end={gradients.tabBarFade.end}
      style={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) }]}
    >
      <GlassContainer
        style={styles.glassContainer}
        fallbackBlurIntensity={80}
        fallbackBackgroundColor={colors.background.glass}
        fallbackBorderColor={colors.border.subtle}
        fallbackBorderWidth={1}
      >
        <View style={styles.pillContainer}>
          {visibleRoutes.map((route) => {
            const isFocused = state.routes[state.index]?.name === route.name;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <TabItem
                key={route.key}
                routeName={route.name}
                isFocused={isFocused}
                onPress={onPress}
                onLongPress={onLongPress}
              />
            );
          })}
        </View>
      </GlassContainer>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  // Outer container with gradient fade
  // Figma: padding-x 24px, gradient black→transparent
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: s(spacing['2xl']), // 24px
    paddingTop: vs(spacing['3xl']), // Extra padding for gradient fade effect
  },
  // Glass pill container
  // Figma: border-radius 61.538px
  glassContainer: {
    borderRadius: 62,
    overflow: 'hidden',
  },
  // Inner pill content
  // Figma: padding-x 59.75px (node 1697:3514)
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(60),
  },
  // Tab item - enlarged for better touch target
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(18),
    paddingVertical: vs(14),
    gap: s(5),
  },
  // Icon container
  tabIconContainer: {
    height: vs(28),
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Tab label
  tabLabel: {
    fontFamily: 'DMSansSemiBold',
    fontSize: ms(11),
    letterSpacing: ms(0.2, 0.3),
    textAlign: 'center',
  },
});

export default GlassTabBar;
