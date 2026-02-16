import { defineConfig } from 'wxt';
import { loadEnv } from 'vite';
import path from 'path';

export default defineConfig({
  srcDir: 'src',
  outDir: 'dist',

  vite: () => {
    const env = loadEnv('development', __dirname, 'VITE_');
    return {
      define: {
        'global': 'globalThis',
        'process.env.VITE_SALMON_ENV': JSON.stringify(env.VITE_SALMON_ENV ?? 'local'),
        'process.env.VITE_API_HOST': JSON.stringify(env.VITE_API_HOST ?? ''),
        'process.env.VITE_API_PORT': JSON.stringify(env.VITE_API_PORT ?? ''),
        'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL ?? ''),
        'process.env.VITE_STATIC_API_URL': JSON.stringify(env.VITE_STATIC_API_URL ?? ''),
        'process.env.VITE_HELIUS_API_KEY': JSON.stringify(env.VITE_HELIUS_API_KEY ?? ''),
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'development'),
      },
      resolve: {
        alias: {
          // Mock react-native modules for web extension build
          'react-native-fast-crypto': path.resolve(__dirname, 'src/stubs/react-native-fast-crypto.ts'),
          'react-native': path.resolve(__dirname, 'src/stubs/react-native.ts'),
          // Resolve Node.js built-ins to npm polyfills (prevents Vite from externalizing them)
          'buffer': path.resolve(__dirname, 'node_modules/buffer'),
          'process': path.resolve(__dirname, 'node_modules/process'),
        },
      },
      optimizeDeps: {
        include: ['buffer'],
        esbuildOptions: {
          define: {
            global: 'globalThis',
          },
          // Inject Buffer into every pre-bundled dependency that references it
          inject: [path.resolve(__dirname, 'src/buffer-shim.js')],
        },
      },
    };
  },

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
    permissions: ['storage', 'alarms', 'tabs'],
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
  },

  modules: ['@wxt-dev/module-react'],
});
