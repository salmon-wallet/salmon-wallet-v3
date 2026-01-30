/**
 * Example Component demonstrating how to use assets in the Salmon Wallet Extension
 *
 * This file shows various ways to import and use the centralized assets.
 * You can use this as a reference when building components.
 */

import React from 'react';
import {
  // Individual imports
  IconWallet,
  IconNFT,
  IconSwap,
  Logo,

  // Grouped imports
  NavigationIcons,
  TransactionIcons,
  BrandAssets,

  // Utility function
  getAssetUrl,
} from '@/assets';

// Import fonts
import '@/assets/fonts.css';

export function AssetExampleComponent() {
  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <h1>Asset Usage Examples</h1>

      {/* Using individual exports */}
      <section>
        <h2>Individual Icon Imports</h2>
        <img src={IconWallet} alt="Wallet" width={24} height={24} />
        <img src={IconNFT} alt="NFT" width={24} height={24} />
        <img src={IconSwap} alt="Swap" width={24} height={24} />
      </section>

      {/* Using grouped exports */}
      <section>
        <h2>Navigation Icons (Grouped)</h2>
        {Object.entries(NavigationIcons).map(([key, iconPath]) => (
          <img
            key={key}
            src={iconPath}
            alt={key}
            width={24}
            height={24}
            title={key}
          />
        ))}
      </section>

      {/* Transaction icons */}
      <section>
        <h2>Transaction Icons</h2>
        <img src={TransactionIcons.sent} alt="Sent" width={24} height={24} />
        <img
          src={TransactionIcons.received}
          alt="Received"
          width={24}
          height={24}
        />
        <img src={TransactionIcons.swap} alt="Swap" width={24} height={24} />
      </section>

      {/* Brand assets */}
      <section>
        <h2>Brand Assets</h2>
        <img src={Logo} alt="Salmon Wallet" width={120} />
        <img src={BrandAssets.appIcon} alt="App Icon" width={64} />
      </section>

      {/* Using getAssetUrl for dynamic paths */}
      <section>
        <h2>Dynamic Asset URL</h2>
        <p>Full URL: {getAssetUrl('/images/IconWallet.png')}</p>
      </section>

      {/* Font weights demonstration */}
      <section>
        <h2>Font Weights</h2>
        <p style={{ fontWeight: 400 }}>DM Sans Regular (400)</p>
        <p style={{ fontWeight: 500 }}>DM Sans Medium (500)</p>
        <p style={{ fontWeight: 700 }}>DM Sans Bold (700)</p>
      </section>
    </div>
  );
}

/**
 * Example of using assets in a navigation component
 */
export function NavigationExample() {
  const navItems = [
    { id: 'wallet', icon: NavigationIcons.wallet, label: 'Wallet' },
    { id: 'nft', icon: NavigationIcons.nft, label: 'NFTs' },
    { id: 'swap', icon: NavigationIcons.swap, label: 'Swap' },
    { id: 'balance', icon: NavigationIcons.balance, label: 'Balance' },
    { id: 'settings', icon: NavigationIcons.settings, label: 'Settings' },
  ];

  return (
    <nav>
      {navItems.map((item) => (
        <button key={item.id}>
          <img src={item.icon} alt={item.label} width={20} height={20} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

/**
 * Example of using transaction icons based on transaction type
 */
export function TransactionIconExample({ type }: { type: string }) {
  const iconMap: Record<string, string> = {
    sent: TransactionIcons.sent,
    received: TransactionIcons.received,
    swap: TransactionIcons.swap,
    interaction: TransactionIcons.interaction,
  };

  const icon = iconMap[type] || TransactionIcons.unknown;

  return (
    <div>
      <img src={icon} alt={type} width={32} height={32} />
    </div>
  );
}
