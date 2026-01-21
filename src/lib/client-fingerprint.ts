import FingerprintJS from '@fingerprintjs/fingerprintjs';

let cachedFingerprint: string | null = null;

/**
 * Generate a browser fingerprint for anonymous user tracking.
 * This is used client-side to identify users across sessions without authentication.
 */
export async function getFingerprint(): Promise<string> {
  if (cachedFingerprint) return cachedFingerprint;
  
  try {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    cachedFingerprint = result.visitorId;
    return cachedFingerprint;
  } catch (error) {
    console.error('Failed to generate fingerprint:', error);
    // Fallback to a random ID if fingerprinting fails
    cachedFingerprint = `fallback-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    return cachedFingerprint;
  }
}
