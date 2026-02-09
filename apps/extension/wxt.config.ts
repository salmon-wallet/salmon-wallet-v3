import { defineConfig } from 'wxt';
import path from 'path';

export default defineConfig({
  srcDir: 'src',
  outDir: 'dist',

  vite: () => ({
    resolve: {
      alias: {
        // Mock react-native modules for web extension build
        'react-native-fast-crypto': path.resolve(__dirname, 'src/stubs/react-native-fast-crypto.ts'),
        'react-native': path.resolve(__dirname, 'src/stubs/react-native.ts'),
      },
    },
  }),

  manifest: {
    // Use i18n message placeholders for name and description
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    // Set default locale for i18n
    default_locale: 'en',
    version: '1.0.0',
    icons: {
      16: 'icon.png',
      48: 'icon.png',
      128: 'icon-192.png',
      512: 'icon-512.png',
    },
    permissions: ['storage', 'alarms', 'tabs', 'scripting'],
    web_accessible_resources: [
      {
        resources: ['injected.js'],
        matches: ['<all_urls>'],
        // Prevents extension fingerprinting by generating a new ID per session
        // @see https://developer.chrome.com/docs/extensions/reference/manifest/web-accessible-resources
        use_dynamic_url: true,
      },
      {
        resources: ['images/*', 'fonts/*'],
        matches: ['<all_urls>'],
        use_dynamic_url: true,
      },
    ],
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'",
    },
  },

  modules: ['@wxt-dev/module-react'],
});
