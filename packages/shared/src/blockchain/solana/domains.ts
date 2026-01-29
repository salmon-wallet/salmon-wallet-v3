/**
 * Solana Domain Name Services
 * Migrated from salmon-wallet-v2:
 * - src/adapter/services/solana/solana-name-service.js
 * - src/adapter/services/solana/alldomains-name-service.js
 *
 * Provides functionality for resolving Solana domain names:
 * - SPL Name Service (.sol domains via @bonfida/spl-name-service)
 * - AllDomains (multiple TLDs via @onsol/tldparser)
 *
 * Features:
 * - Resolve .sol domains to public keys
 * - Resolve any TLD domains to public keys
 * - Get domain names for public keys (with fallback)
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { resolve, getFavoriteDomain } from '@bonfida/spl-name-service';
import { TldParser } from '@onsol/tldparser';

// ============================================================================
// SPL Name Service (.sol domains)
// ============================================================================

/**
 * Gets the .sol domain for a public key
 *
 * Uses Bonfida's SPL Name Service to get the favorite .sol domain
 * associated with a public key.
 *
 * @param connection - Solana connection
 * @param publicKey - Public key to look up
 * @returns Domain name with .sol extension, or null if not found
 *
 * @example
 * ```typescript
 * const domain = await getSolDomain(connection, new PublicKey('...'));
 * // Returns: 'mydomain.sol' or null
 * ```
 */
export async function getSolDomain(
  connection: Connection,
  publicKey: PublicKey
): Promise<string | null> {
  try {
    const favorite = await getFavoriteDomain(connection, publicKey);
    if (!favorite?.domain) {
      return null;
    }
    return favorite.domain + '.sol';
  } catch {
    return null;
  }
}

/**
 * Resolves a .sol domain to its owner's public key
 *
 * @param connection - Solana connection
 * @param domain - Domain name (with or without .sol extension)
 * @returns Owner's public key as base58 string, or null if not found
 *
 * @example
 * ```typescript
 * const owner = await resolveSolDomain(connection, 'mydomain.sol');
 * // Returns: 'PublicKeyBase58...' or null
 * ```
 */
export async function resolveSolDomain(
  connection: Connection,
  domain: string
): Promise<string | null> {
  try {
    const domainName = domain.endsWith('.sol')
      ? domain.slice(0, -4)
      : domain;
    const owner = await resolve(connection, domainName);
    if (!owner) {
      return null;
    }
    return owner.toBase58();
  } catch {
    return null;
  }
}

// ============================================================================
// AllDomains (multiple TLDs)
// ============================================================================

/**
 * Gets the main domain for a public key using AllDomains
 *
 * Uses TldParser to get the main domain associated with a public key.
 * Supports multiple TLDs beyond just .sol.
 *
 * @param connection - Solana connection
 * @param publicKey - Public key to look up
 * @returns Domain name with TLD extension, or null if not found
 *
 * @example
 * ```typescript
 * const domain = await getAllDomain(connection, new PublicKey('...'));
 * // Returns: 'mydomain.abc' or null
 * ```
 */
export async function getAllDomain(
  connection: Connection,
  publicKey: PublicKey
): Promise<string | null> {
  try {
    const parser = new TldParser(connection);
    const mainDomain = await parser.getMainDomain(publicKey);
    if (!mainDomain?.domain || !mainDomain?.tld) {
      return null;
    }
    return mainDomain.domain + mainDomain.tld;
  } catch {
    return null;
  }
}

/**
 * Resolves any TLD domain to its owner's public key using AllDomains
 *
 * @param connection - Solana connection
 * @param domain - Full domain name including TLD (e.g., 'mydomain.abc')
 * @returns Owner's public key as base58 string, or null if not found
 *
 * @example
 * ```typescript
 * const owner = await resolveAllDomain(connection, 'mydomain.abc');
 * // Returns: 'PublicKeyBase58...' or null
 * ```
 */
export async function resolveAllDomain(
  connection: Connection,
  domain: string
): Promise<string | null> {
  try {
    const parser = new TldParser(connection);
    const owner = await parser.getOwnerFromDomainTld(domain);
    if (!owner) {
      return null;
    }
    return owner.toString();
  } catch {
    return null;
  }
}

// ============================================================================
// Combined Functions (with fallback)
// ============================================================================

/**
 * Gets a domain name for a public key with fallback
 *
 * Tries AllDomains first, then falls back to SPL Name Service (.sol).
 * This provides the best chance of finding a domain for a given public key.
 *
 * @param connection - Solana connection
 * @param publicKey - Public key to look up
 * @returns Domain name with extension, or null if not found
 *
 * @example
 * ```typescript
 * const domain = await getDomain(connection, new PublicKey('...'));
 * // Returns: 'mydomain.abc', 'mydomain.sol', or null
 * ```
 */
export async function getDomain(
  connection: Connection,
  publicKey: PublicKey
): Promise<string | null> {
  // Try AllDomains first (supports multiple TLDs)
  const allDomain = await getAllDomain(connection, publicKey);
  if (allDomain) {
    return allDomain;
  }

  // Fall back to SPL Name Service (.sol)
  return getSolDomain(connection, publicKey);
}

/**
 * Alias for getDomain - gets a domain name for a public key
 *
 * @param connection - Solana connection
 * @param publicKey - Public key to look up
 * @returns Domain name with extension, or null if not found
 */
export async function getDomainFromPublicKey(
  connection: Connection,
  publicKey: PublicKey
): Promise<string | null> {
  return getDomain(connection, publicKey);
}

/**
 * Resolves a domain to its owner's public key based on TLD
 *
 * Automatically detects the domain type:
 * - For .sol domains, uses SPL Name Service
 * - For other TLDs, uses AllDomains
 *
 * @param connection - Solana connection
 * @param domain - Full domain name including TLD
 * @returns Owner's public key as base58 string, or null if not found
 *
 * @example
 * ```typescript
 * // Resolves .sol domain
 * const owner1 = await getPublicKeyFromDomain(connection, 'mydomain.sol');
 *
 * // Resolves other TLD domain
 * const owner2 = await getPublicKeyFromDomain(connection, 'mydomain.abc');
 * ```
 */
export async function getPublicKeyFromDomain(
  connection: Connection,
  domain: string
): Promise<string | null> {
  if (domain.endsWith('.sol')) {
    return resolveSolDomain(connection, domain);
  }
  return resolveAllDomain(connection, domain);
}
