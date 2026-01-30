/**
 * Crypto Polyfills for React Native
 *
 * These must be imported at the very top of the app entry point,
 * BEFORE any other imports that might use crypto.
 *
 * Required for: @solana/web3.js, bitcoinjs-lib, and other crypto libraries
 */

// Polyfill for crypto.getRandomValues()
import 'react-native-get-random-values';

// Polyfill for Buffer global
import { Buffer } from 'buffer';
global.Buffer = Buffer;

// Polyfill for process.env (some libraries expect this)
if (typeof process === 'undefined') {
  global.process = { env: {} } as any;
}

export {};
