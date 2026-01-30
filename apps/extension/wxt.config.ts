import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  outDir: 'dist',

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
      },
      {
        resources: ['images/*', 'fonts/*'],
        matches: ['<all_urls>'],
      },
    ],
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'",
    },
  },

  modules: ['@wxt-dev/module-react'],
});
