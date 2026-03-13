/**
 * Type declarations for crypto modules without native TypeScript support
 */

declare module 'react-native-fast-crypto' {
  export const pbkdf2: {
    deriveAsync: (
      password: Uint8Array,
      salt: Uint8Array,
      iterations: number,
      keyLength: number,
      digest: string
    ) => Promise<ArrayBuffer>;
  };
}

// NOTE: default export is intentional — crypto-js uses CommonJS module.exports,
// so TypeScript needs `export default` for `import CryptoJS from 'crypto-js'` interop.
declare module 'crypto-js' {
  interface WordArray {
    words: number[];
    sigBytes: number;
  }

  interface CryptoJSLib {
    WordArray: {
      create: (typedArray: unknown) => WordArray;
    };
  }

  interface CryptoJSAlgo {
    SHA256: object;
    SHA512: object;
  }

  interface PBKDF2Options {
    keySize: number;
    iterations: number;
    hasher: object;
  }

  const lib: CryptoJSLib;
  const algo: CryptoJSAlgo;
  function PBKDF2(password: string, salt: WordArray, options: PBKDF2Options): WordArray;

  export { lib, algo, PBKDF2 };
  export default { lib, algo, PBKDF2 };
}
