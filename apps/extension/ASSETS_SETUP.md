# Assets Setup for Salmon Wallet Extension

This document describes the asset configuration for the Salmon Wallet browser extension built with WXT.

## Overview

The extension now has centralized access to shared assets from the `@salmon/ui` package, copied into the extension's `public/` directory for compatibility with the WXT build system.

## Directory Structure

```
apps/extension/
├── public/
│   ├── images/           # 47 image assets (icons, logos, etc.)
│   │   ├── IconWallet.png, IconWallet.svg
│   │   ├── IconNFT.png, IconNFT.svg
│   │   ├── IconSwap.png, IconSwap.svg
│   │   ├── IconBalance.png, IconBalance.svg
│   │   ├── IconSettings.png, IconSettings.svg
│   │   ├── Transaction icons (sent, received, swap, etc.)
│   │   ├── Brand assets (AppIcon, Logo, etc.)
│   │   └── Common UI icons (copy, close, arrows, etc.)
│   └── fonts/            # 3 font files
│       ├── DMSans-Regular.ttf
│       ├── DMSans-Medium.ttf
│       └── DMSans-Bold.ttf
└── src/
    └── assets/
        ├── index.ts      # Asset path exports
        ├── fonts.css     # Font face declarations
        ├── example.tsx   # Usage examples
        └── README.md     # Documentation
```

## Configuration Changes

### 1. WXT Configuration (`wxt.config.ts`)

Added web-accessible resources to make images and fonts available:

```typescript
web_accessible_resources: [
  {
    resources: ['injected.js'],
    matches: ['<all_urls>'],
  },
  {
    resources: ['images/*', 'fonts/*'],
    matches: ['<all_urls>'],
  },
]
```

### 2. TypeScript Configuration (`tsconfig.json`)

Added path alias for easier imports:

```json
{
  "paths": {
    "@/*": ["./src/*"],
    "@/assets": ["./src/assets"],
    "@salmon/shared": ["../../packages/shared/src"],
    "@salmon/ui-extension": ["../../packages/ui-extension/src"]
  }
}
```

## Asset Categories

### Navigation Icons (PNG + SVG)
- Wallet, NFT, Swap, Balance, Settings

### Transaction Icons
- Sent, Received, Swap, Interaction
- Result icons (Success, Fail, Warning, Unknown)
- Call icons (Made, Received)

### Brand Assets
- AppIcon, Logo, AppTitle, IconSalmon
- BoolSplashLogo (1x, 2x, 3x, 4x variants)

### Common UI Icons
- Actions: Copy, Close, Add, Search, Edit, Delete
- Navigation: Chevrons, Arrows, Expand/Collapse
- State: Info, Success, Failed, Visibility
- Tools: QRCodeScanner

### Fonts
- DM Sans Regular (400)
- DM Sans Medium (500)
- DM Sans Bold (700)

## Usage Examples

### Basic Import

```typescript
import { IconWallet, IconNFT, Logo } from '@/assets';

function MyComponent() {
  return (
    <div>
      <img src={IconWallet} alt="Wallet" width={24} height={24} />
      <img src={Logo} alt="Salmon Wallet" />
    </div>
  );
}
```

### Using Grouped Exports

```typescript
import { NavigationIcons, TransactionIcons, BrandAssets } from '@/assets';

// Access via groups
<img src={NavigationIcons.wallet} alt="Wallet" />
<img src={TransactionIcons.sent} alt="Sent" />
<img src={BrandAssets.logo} alt="Logo" />
```

### Using Fonts

```typescript
// Import once in your main entry point
import '@/assets/fonts.css';

// Then use in CSS
body {
  font-family: 'DM Sans', sans-serif;
  font-weight: 400; // Regular
}

h1 {
  font-weight: 700; // Bold
}
```

### Dynamic Asset URLs

```typescript
import { getAssetUrl } from '@/assets';

const fullUrl = getAssetUrl('/images/IconWallet.png');
// Returns: chrome-extension://<extension-id>/images/IconWallet.png
```

## Build Process

WXT automatically:
1. Copies all files from `public/` to the build output (`dist/`)
2. Makes web-accessible resources available to extension pages
3. Preserves directory structure

No additional build configuration is needed.

## Maintenance

### Adding New Assets

1. Copy the asset to the appropriate `public/` subdirectory
2. Add export to `src/assets/index.ts`
3. Update documentation if needed

### Syncing with UI Package

When assets are updated in `@salmon/ui`, you can re-copy them:

```bash
# From extension directory
cp ../../packages/ui/src/assets/images/NewIcon.png public/images/
```

Then update `src/assets/index.ts` with the new export.

## Notes

- All asset paths use leading slashes (e.g., `/images/icon.png`)
- Assets are loaded from the extension's public URL scheme
- SVG versions available for some icons for better scaling
- Font files use `font-display: swap` for better performance
- Web-accessible resources are available to content scripts and extension pages

## Testing

To verify assets are working:

1. Build the extension: `npm run build`
2. Load the extension in Chrome/Firefox
3. Open DevTools and check for any 404 errors
4. Verify images and fonts load correctly

## Compatibility

- Works with WXT v0.20.13+
- Compatible with Chrome Manifest V3
- Supports both Chrome and Firefox extensions
- React 19.1.0+ compatible

## References

- [WXT Documentation](https://wxt.dev/)
- [Chrome Extension Web Accessible Resources](https://developer.chrome.com/docs/extensions/mv3/manifest/web_accessible_resources/)
- See `src/assets/example.tsx` for more usage examples
- See `src/assets/README.md` for detailed documentation
