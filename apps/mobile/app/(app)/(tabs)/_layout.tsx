import React from 'react';
import { Tabs } from 'expo-router';

import { GlassTabBar } from '@salmon/ui';

/**
 * Tab Layout for Salmon Wallet
 *
 * Design specs from Figma:
 * - Glass effect pill-shaped container (transparent/blur background)
 * - Rounded corners: 82px border radius
 * - 3 tabs: Home, Collectibles, Swap
 * - Active tab: Orange/red color #ff5c45 for both icon and text
 * - Inactive tab: White color with slight opacity
 * - Font: DM Sans SemiBold, ~11px
 * - Icons: ~28px height
 * - Padding: 60px horizontal, items centered with space-between
 *
 * Note: Settings tab is excluded from the tab bar and accessible elsewhere in the app.
 */
export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // Hide the default tab bar styling
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="collectibles"
        options={{
          title: 'Collectibles',
        }}
      />
      <Tabs.Screen
        name="swap"
        options={{
          title: 'Swap',
        }}
      />
      {/* Settings is hidden from the tab bar but still accessible via navigation */}
      <Tabs.Screen
        name="settings"
        options={{
          href: null, // Hide from tab bar
          title: 'Settings',
        }}
      />
    </Tabs>
  );
}
