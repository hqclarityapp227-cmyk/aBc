/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const WHOP_CHECKOUT_URL = 'https://whop.com/salty-flamingo/commission-engine-pro-74/';
export const STORAGE_KEY_WHOP_AFFILIATE = 'whop_affiliate_id';

/**
 * Extracts and sanitizes an affiliate code from URL parameters.
 * Checks for standard Whop affiliate query params ('a', 'affiliate', 'whop_affiliate').
 */
export function extractAffiliateCodeFromQuery(queryStringOrUrl?: string): string | null {
  try {
    let search = queryStringOrUrl;
    if (!search && typeof window !== 'undefined') {
      search = window.location.search;
      if (!search && window.location.hash && window.location.hash.includes('?')) {
        search = window.location.hash.substring(window.location.hash.indexOf('?'));
      }
    }

    if (!search) return null;

    // Handle full URL strings if passed
    if (search.startsWith('http://') || search.startsWith('https://')) {
      const parsedUrl = new URL(search);
      search = parsedUrl.search;
    }

    const params = new URLSearchParams(search);
    const rawCode =
      params.get('a') ||
      params.get('affiliate') ||
      params.get('whop_affiliate') ||
      params.get('ref') ||
      params.get('via');

    if (!rawCode) return null;

    const trimmed = rawCode.trim().replace(/^@/, '');
    if (trimmed.length > 0 && trimmed.length <= 128) {
      return trimmed;
    }
  } catch (err) {
    console.warn('Error parsing affiliate query parameters:', err);
  }
  return null;
}

/**
 * Captures the affiliate code from the current browser URL if present and
 * securely persists it in browser storage (localStorage & sessionStorage)
 * to maintain attribution across internal page navigation and sessions.
 */
export function captureAndPersistWhopAffiliate(): string | null {
  if (typeof window === 'undefined') return null;

  const urlAffiliate = extractAffiliateCodeFromQuery();
  if (urlAffiliate) {
    try {
      localStorage.setItem(STORAGE_KEY_WHOP_AFFILIATE, urlAffiliate);
      sessionStorage.setItem(STORAGE_KEY_WHOP_AFFILIATE, urlAffiliate);
    } catch {
      // Storage access may be blocked in strict private browsing modes
    }
    return urlAffiliate;
  }

  return getStoredWhopAffiliate();
}

/**
 * Retrieves the stored Whop affiliate code from storage.
 */
export function getStoredWhopAffiliate(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const sessionVal = sessionStorage.getItem(STORAGE_KEY_WHOP_AFFILIATE);
    if (sessionVal && sessionVal.trim()) return sessionVal.trim();

    const localVal = localStorage.getItem(STORAGE_KEY_WHOP_AFFILIATE);
    if (localVal && localVal.trim()) return localVal.trim();
  } catch {
    // Storage access error fallback
  }

  return null;
}

/**
 * Returns the active affiliate code by checking current URL first, then stored value.
 */
export function getActiveWhopAffiliate(): string | null {
  const fromUrl = extractAffiliateCodeFromQuery();
  if (fromUrl) {
    // Also persist it for subsequent navigation
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_WHOP_AFFILIATE, fromUrl);
        sessionStorage.setItem(STORAGE_KEY_WHOP_AFFILIATE, fromUrl);
      }
    } catch {}
    return fromUrl;
  }
  return getStoredWhopAffiliate();
}

/**
 * Constructs the official Whop checkout URL with affiliate attribution.
 * 
 * If an affiliate code is present (?a=...):
 * It appends the parameter `?a=AFFILIATE_CODE` to the Whop checkout URL.
 * 
 * If no affiliate code is present:
 * It returns the normal checkout URL unchanged.
 * 
 * @param baseUrl Base Whop checkout or product URL
 * @returns Fully qualified Whop checkout URL with or without ?a= attribution
 */
export function getWhopCheckoutUrl(baseUrl: string = WHOP_CHECKOUT_URL): string {
  const affiliateCode = getActiveWhopAffiliate();

  if (!affiliateCode) {
    return baseUrl;
  }

  try {
    const url = new URL(baseUrl);
    url.searchParams.set('a', affiliateCode);
    return url.toString();
  } catch {
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}a=${encodeURIComponent(affiliateCode)}`;
  }
}
