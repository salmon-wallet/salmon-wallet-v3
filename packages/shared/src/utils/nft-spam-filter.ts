import type { NftDataBase } from './nft';

// ============================================================================
// NFT Spam / Scam Detection
// ============================================================================

/**
 * URL-like patterns found in attribute values, descriptions, or names.
 * Legitimate NFTs use trait_type/value for properties like "Background: Blue",
 * NOT URLs pointing to external sites.
 */
const URL_PATTERN = /https?:\/\/|\.com\b|\.io\b|\.pro\b|\.lol\b|\.xyz\b|\.net\b|\.org\b|\.app\b/i;

/**
 * Domain-like pattern in NFT names. Matches "WORD.TLD" where TLD is a known
 * scam-favoured extension. Legitimate NFTs are never named after domains.
 * Examples: "JUP.PRO Drop Pass", "MAGICEDEN.LOL REWARD", "MFI.EXPERT WhiteList"
 */
const NAME_DOMAIN_PATTERN =
  /\w+\.(com|io|pro|lol|xyz|net|org|app|red|expert|site|fun|club|promo|top|gg|me|cc|pics|bet)\b/i;

/**
 * Phishing keywords commonly found in scam NFT descriptions or names.
 */
const PHISHING_KEYWORDS =
  /claim your|visit the domain|check available claim|airdrop pass|free mint|eligible for|go to|claim at|lucky box|drop pass|whitelist/i;

/**
 * Keywords in NFT names that are strong spam signals on their own.
 * Legitimate projects don't name NFTs with "AirDrop", "Free Mint", etc.
 */
const SPAM_NAME_KEYWORDS =
  /airdrop|free mint|claim your|lucky box|redeem.*voucher/i;

/**
 * H2 — Check if any attribute value contains a URL-like pattern.
 */
function hasUrlInAttributes(attributes: NftDataBase['attributes']): boolean {
  if (!attributes || attributes.length === 0) return false;
  return attributes.some((attr) => {
    const val = String(attr.value ?? '');
    return URL_PATTERN.test(val);
  });
}

/**
 * H3 — Check if description contains phishing keywords combined with a URL.
 */
function hasPhishingDescription(description: string | undefined): boolean {
  if (!description) return false;
  return PHISHING_KEYWORDS.test(description) && URL_PATTERN.test(description);
}

/**
 * H4 — No image + no collection combined with URL presence in description/attributes.
 * Alone this is weak, but with URLs it becomes a strong signal.
 */
function isBarebonesWithUrls(nft: NftDataBase): boolean {
  if (nft.image || nft.collectionName) return false;
  const descHasUrl = nft.description ? URL_PATTERN.test(nft.description) : false;
  return descHasUrl || hasUrlInAttributes(nft.attributes);
}

/**
 * H5 — Domain pattern embedded in NFT name.
 * Legitimate NFTs are never named "JUP.PRO Drop Pass" or "MAGICEDEN.LOL REWARD".
 */
function hasDomainInName(name: string): boolean {
  return NAME_DOMAIN_PATTERN.test(name);
}

/**
 * Token-ticker pattern in NFT names: "$WORD" (e.g. "$GIFT #1312", "$SOL Reward").
 * Scam NFTs disguise themselves as token airdrops. Legitimate NFTs don't
 * name themselves with ticker-style "$SYMBOL" prefixes.
 */
const TICKER_NAME_PATTERN = /^\$[A-Z]{2,}/i;

/**
 * H6 — NFT name mimics a token ticker ($SYMBOL).
 */
function hasTickerName(name: string): boolean {
  return TICKER_NAME_PATTERN.test(name);
}

/**
 * H7 — NFT name contains spam keywords (airdrop, free mint, etc.).
 */
function hasSpamNameKeyword(name: string): boolean {
  return SPAM_NAME_KEYWORDS.test(name);
}

/**
 * H8 — No description + no collection + no attributes.
 * Legitimate NFTs always have at least a collection or attributes.
 * Random airdrops without any metadata are spam.
 */
function isBarebonesNft(nft: NftDataBase): boolean {
  const noDescription = !nft.description || nft.description.trim() === '';
  const noCollection = !nft.collectionName;
  const noAttributes = !nft.attributes || nft.attributes.length === 0;
  return noDescription && noCollection && noAttributes;
}

/**
 * Determine whether an NFT is likely spam/scam.
 * Any single heuristic hit is enough to flag the NFT.
 *
 * @param nft - NFT data to check (any blockchain)
 * @returns true if the NFT is likely spam
 */
export function isSpamNft(nft: NftDataBase): boolean {
  // H1 — Backend blacklist flag
  if (nft.blacklisted === true) return true;

  // H2 — URLs in attribute values
  if (hasUrlInAttributes(nft.attributes)) return true;

  // H3 — Phishing keywords + URL in description
  if (hasPhishingDescription(nft.description)) return true;

  // H4 — No image, no collection, but has URL content
  if (isBarebonesWithUrls(nft)) return true;

  // H5 — Domain pattern in the NFT name
  if (hasDomainInName(nft.name)) return true;

  // H6 — Name mimics a token ticker ($SYMBOL)
  if (hasTickerName(nft.name)) return true;

  // H7 — Name contains spam keywords (airdrop, free mint, etc.)
  if (hasSpamNameKeyword(nft.name)) return true;

  // H8 — No description, no collection, no attributes (barebones airdrop spam)
  if (isBarebonesNft(nft)) return true;

  return false;
}

/**
 * Filter out spam/scam NFTs from a list.
 *
 * @param nfts - Array of NFT data
 * @returns Filtered array with spam NFTs removed
 */
export function filterSpamNfts<T extends NftDataBase>(nfts: T[]): T[] {
  return nfts.filter((nft) => !isSpamNft(nft));
}
