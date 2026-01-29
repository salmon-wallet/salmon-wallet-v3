import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  outDir: 'dist',

  manifest: {
    name: 'Salmon Wallet',
    description: 'Your all-in-one & open-source wallet for the crypto space.',
    version: '1.0.0',
    permissions: ['storage', 'alarms', 'tabs'],
    web_accessible_resources: [
      {
        resources: ['injected.js'],
        matches: ['file://*/*', 'http://*/*', 'https://*/*'],
      },
    ],
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'",
    },
  },

  modules: ['@wxt-dev/module-react'],
});
