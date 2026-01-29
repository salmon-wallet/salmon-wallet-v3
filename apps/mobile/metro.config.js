const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo
config.watchFolders = [monorepoRoot];

// Let Metro know where to resolve packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Polyfills for crypto libraries (Solana, Bitcoin)
config.resolver.extraNodeModules = {
  crypto: require.resolve('react-native-crypto'),
  stream: require.resolve('readable-stream'),
  buffer: require.resolve('buffer'),
};

// Disable package exports to avoid issues with some packages
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
