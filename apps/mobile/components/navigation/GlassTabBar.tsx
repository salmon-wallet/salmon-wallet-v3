import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { HomeSvgIcon, GridViewSvgIcon, SwapSvgIcon } from '@salmon/ui';

/**
 * Design specs from Figma:
 * - Glass effect pill-shaped container (transparent/blur background)
 * - Rounded corners: 82px border radius
 * - 3 tabs: Home, Collectibles, Swap
 * - Active tab: Orange/red color #ff5c45 for both icon and text
 * - Inactive tab: White color with slight opacity
 * - Font: DM Sans SemiBold, ~11px
 * - Icons: ~28px height
 * - Padding: 60px horizontal, items centered with space-between
 */

const TAB_COLORS = {
  active: '#ff5c45',
  inactive: 'rgba(255, 255, 255, 0.6)',
  inactiveIcon: 'rgba(255, 255, 255, 0.7)',
} as const;

interface TabConfig {
  name: string;
  icon: React.FC<{ size?: number; color?: string }>;
  label: string;
}

const TAB_CONFIG: Record<string, TabConfig> = {
  index: {
    name: 'index',
    icon: HomeSvgIcon,
    label: 'Home',
  },
  collectibles: {
    name: 'collectibles',
    icon: GridViewSvgIcon,
    label: 'Collectibles',
  },
  swap: {
    name: 'swap',
    icon: SwapSvgIcon,
    label: 'Swap',
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

  const iconColor = isFocused ? TAB_COLORS.active : TAB_COLORS.inactiveIcon;
  const labelColor = isFocused ? TAB_COLORS.active : TAB_COLORS.inactive;
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
        <IconComponent size={28} color={iconColor} />
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
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      <BlurView intensity={40} tint="dark" style={styles.blurContainer}>
        <View style={styles.pillContainer}>
          {visibleRoutes.map((route) => {
            const { options } = descriptors[route.key];
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
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  blurContainer: {
    borderRadius: 82,
    overflow: 'hidden',
    // Glass effect background fallback
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 60,
    paddingVertical: 12,
    minWidth: 320,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  tabIconContainer: {
    width: 28,
    height: 28,
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontFamily: 'DMSansBold',
    fontSize: 11,
    textAlign: 'center',
  },
});

export default GlassTabBar;
