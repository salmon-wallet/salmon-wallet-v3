const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Polyfills for crypto libraries (Solana, Bitcoin)
// Note: Monorepo support is automatic since Expo SDK 52
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  crypto: require.resolve('expo-crypto'),
  stream: require.resolve('readable-stream'),
  buffer: require.resolve('buffer'),
};

// Support for .cjs files (some packages need this)
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

module.exports = config;
