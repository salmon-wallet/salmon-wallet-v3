import { defineConfig } from 'wxt';
import { loadEnv } from 'vite';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const bufferPath = path.dirname(require.resolve('buffer/package.json'));
const processPath = path.dirname(require.resolve('process/package.json'));

export default defineConfig({
  srcDir: 'src',
  outDir: 'dist',

  vite: (wxtEnv) => {
    const env = loadEnv(wxtEnv.mode, __dirname, 'VITE_');
    return {
      define: {
        'global': 'globalThis',
        // Define process as a minimal object so typeof process !== 'undefined' guards pass
        // (process global doesn't exist in extension runtime — the npm polyfill is only
        // injected during dev pre-bundling, not in production Rollup/esbuild builds)
        'process': JSON.stringify({ env: {} }),
        // Define process.env as a complete object so both static (process.env.X) and
        // dynamic (process.env[key]) access work at runtime.
        // esbuild/Rollup use the most specific match: process.env wins over process.
        'process.env': JSON.stringify({
          VITE_SALMON_ENV: env.VITE_SALMON_ENV ?? 'local',
          VITE_API_HOST: env.VITE_API_HOST ?? '',
          VITE_API_PORT: env.VITE_API_PORT ?? '',
          VITE_API_URL: env.VITE_API_URL ?? '',
          VITE_STATIC_API_URL: env.VITE_STATIC_API_URL ?? '',
          VITE_HELIUS_API_KEY: env.VITE_HELIUS_API_KEY ?? '',
          NODE_ENV: process.env.NODE_ENV ?? 'development',
        }),
      },
      resolve: {
        alias: {
          '@salmon/shared': path.resolve(__dirname, '../../packages/shared/src'),
          '@salmon/ui': path.resolve(__dirname, '../../packages/ui/src'),
          // Mock react-native modules for web extension build
          'react-native-fast-crypto': path.resolve(__dirname, 'src/stubs/react-native-fast-crypto.ts'),
          'react-native': path.resolve(__dirname, 'src/stubs/react-native.ts'),
          // Resolve Node.js built-ins to npm polyfills (prevents Vite from externalizing them)
          'buffer': bufferPath,
          'process': processPath,
        },
      },
      optimizeDeps: {
        entries: [
          path.resolve(__dirname, 'src/entrypoints/popup/index.html'),
          path.resolve(__dirname, 'src/entrypoints/sidepanel/index.html'),
        ],
        include: ['buffer', 'process'],
        esbuildOptions: {
          define: {
            global: 'globalThis',
          },
        },
      },
      build: {
        chunkSizeWarningLimit: 6000,
      },
    };
  },

  manifest: ({ browser }) => ({
    // Use i18n message placeholders for name and description
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    // Set default locale for i18n
    default_locale: 'en',
    version: '0.9.2',
    icons: {
      16: 'icon-16.png',
      48: 'icon-48.png',
      128: 'icon-128.png',
    },
    permissions: ['storage', 'alarms', 'clipboardRead'],
    host_permissions: [
      'https://te4x28v8e0.execute-api.us-east-1.amazonaws.com/*',
      'https://d1fh2pwo7kzely.cloudfront.net/*',
    ],
    side_panel: {
      default_path: 'entrypoints/sidepanel/index.html',
    },
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
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          id: 'firefoxextension@salmonwallet.io',
          strict_min_version: '142.0',
          data_collection_permissions: {
            required: ['none'],
            personally_identifying_info: false,
            health_info: false,
            financial_and_payment_info: false,
            authentication_info: false,
            personal_communications: false,
            location: false,
            browsing_history: false,
            technical_and_interaction: false,
          },
        },
      },
    }),
  }),

  zip: {
    exclude: ['**/__MACOSX/**', '**/.*'],
  },

  modules: ['@wxt-dev/module-react'],
});
