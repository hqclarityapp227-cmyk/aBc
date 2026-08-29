/**
 * Secure License Key Validation Engine for Commission Engine Pro.
 * 
 * Securely communicates with the serverless endpoint (Netlify Functions)
 * which verifies customer license keys against the Whop API using WHOP_API_KEY.
 */

export const STORAGE_KEY_PRO_UNLOCKED = 'commission_engine_pro_unlocked';
export const STORAGE_KEY_LICENSE = 'commission_engine_license_key';

export interface LicenseValidationResult {
  isValid: boolean;
  error?: string;
  keyType?: string;
  formattedKey?: string;
  email?: string | null;
  expires_at?: string | null;
}

/**
 * Validates a user-supplied license key format (basic non-empty & length check).
 */
export function validateLicenseKey(rawKey: string | null | undefined): LicenseValidationResult {
  if (!rawKey || typeof rawKey !== 'string') {
    return {
      isValid: false,
      error: 'Please enter your Whop License Key to unlock.',
    };
  }

  const trimmed = rawKey.trim();

  if (!trimmed || trimmed.length < 4) {
    return {
      isValid: false,
      error: 'Please enter a valid Whop License Key.',
    };
  }

  return {
    isValid: true,
    formattedKey: trimmed,
  };
}

/**
 * Validates a user-supplied license key securely via the Netlify serverless function
 * (which calls the Whop API with the private WHOP_API_KEY).
 */
export async function validateLicenseWithServer(rawKey: string | null | undefined): Promise<LicenseValidationResult> {
  if (!rawKey || typeof rawKey !== 'string') {
    return {
      isValid: false,
      error: 'Please enter your Whop License Key to unlock.',
    };
  }

  const trimmed = rawKey.trim();

  if (!trimmed || trimmed.length < 3) {
    return {
      isValid: false,
      error: 'Please enter a valid Whop License Key.',
    };
  }

  try {
    const response = await fetch('/.netlify/functions/validate-license', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key: trimmed }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.valid === true || data.status === 'valid') {
        return {
          isValid: true,
          keyType: 'whop',
          formattedKey: data.key || trimmed,
          email: data.email || null,
          expires_at: data.expires_at || null,
        };
      } else {
        return {
          isValid: false,
          error: data.message || 'Invalid or expired Whop license key.',
        };
      }
    } else {
      const errData = await response.json().catch(() => ({}));
      return {
        isValid: false,
        error: errData.message || `Validation error (${response.status}): Could not verify license with Whop.`,
      };
    }
  } catch (networkErr: any) {
    console.error('License validation server error:', networkErr);
    return {
      isValid: false,
      error: 'Network error connecting to license validation service. Please check your connection.',
    };
  }
}

/**
 * Checks if the current browser session has an active validated license.
 */
export function checkIsProUnlocked(): boolean {
  try {
    const isFlagged = localStorage.getItem(STORAGE_KEY_PRO_UNLOCKED) === 'true';
    if (!isFlagged) return false;

    const savedKey = localStorage.getItem(STORAGE_KEY_LICENSE);
    if (!savedKey || savedKey.trim().length === 0) return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Persists validated license state in local storage after successful Whop verification.
 */
export function persistValidatedLicense(key: string): boolean {
  if (!key || typeof key !== 'string' || key.trim().length === 0) return false;

  try {
    localStorage.setItem(STORAGE_KEY_PRO_UNLOCKED, 'true');
    localStorage.setItem(STORAGE_KEY_LICENSE, key.trim());
    return true;
  } catch {
    return false;
  }
}

/**
 * Revokes and clears stored license.
 */
export function revokeLicense(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_PRO_UNLOCKED);
    localStorage.removeItem(STORAGE_KEY_LICENSE);
  } catch {
    // ignore
  }
}
