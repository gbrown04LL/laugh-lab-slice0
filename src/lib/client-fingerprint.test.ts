import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('client-fingerprint', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  describe('getFingerprint', () => {
    it('should return visitor ID from FingerprintJS', async () => {
      vi.doMock('@fingerprintjs/fingerprintjs', () => ({
        default: {
          load: vi.fn().mockResolvedValue({
            get: vi.fn().mockResolvedValue({
              visitorId: 'test-visitor-id-123',
            }),
          }),
        },
      }));

      const { getFingerprint } = await import('./client-fingerprint');
      const fingerprint = await getFingerprint();

      expect(fingerprint).toBe('test-visitor-id-123');
    });

    it('should cache the fingerprint on subsequent calls', async () => {
      const mockGet = vi.fn().mockResolvedValue({
        visitorId: 'cached-visitor-id',
      });
      const mockLoad = vi.fn().mockResolvedValue({
        get: mockGet,
      });

      vi.doMock('@fingerprintjs/fingerprintjs', () => ({
        default: {
          load: mockLoad,
        },
      }));

      const { getFingerprint } = await import('./client-fingerprint');

      const firstCall = await getFingerprint();
      const secondCall = await getFingerprint();
      const thirdCall = await getFingerprint();

      expect(firstCall).toBe('cached-visitor-id');
      expect(secondCall).toBe('cached-visitor-id');
      expect(thirdCall).toBe('cached-visitor-id');

      // FingerprintJS should only be called once due to caching
      expect(mockLoad).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    it('should return fallback ID when FingerprintJS.load() fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.doMock('@fingerprintjs/fingerprintjs', () => ({
        default: {
          load: vi.fn().mockRejectedValue(new Error('Load failed')),
        },
      }));

      const { getFingerprint } = await import('./client-fingerprint');
      const fingerprint = await getFingerprint();

      expect(fingerprint).toMatch(/^fallback-\d+-[a-z0-9]+$/);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to generate fingerprint:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should return fallback ID when fp.get() fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.doMock('@fingerprintjs/fingerprintjs', () => ({
        default: {
          load: vi.fn().mockResolvedValue({
            get: vi.fn().mockRejectedValue(new Error('Get failed')),
          }),
        },
      }));

      const { getFingerprint } = await import('./client-fingerprint');
      const fingerprint = await getFingerprint();

      expect(fingerprint).toMatch(/^fallback-\d+-[a-z0-9]+$/);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should cache fallback ID on subsequent calls after error', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});

      const mockLoad = vi.fn().mockRejectedValue(new Error('Load failed'));

      vi.doMock('@fingerprintjs/fingerprintjs', () => ({
        default: {
          load: mockLoad,
        },
      }));

      const { getFingerprint } = await import('./client-fingerprint');

      const firstCall = await getFingerprint();
      const secondCall = await getFingerprint();

      // Should return the same fallback ID
      expect(firstCall).toBe(secondCall);
      expect(firstCall).toMatch(/^fallback-/);

      // Should only attempt to load once (then use cached fallback)
      expect(mockLoad).toHaveBeenCalledTimes(1);
    });

    it('fallback ID should contain timestamp and random string', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.doMock('@fingerprintjs/fingerprintjs', () => ({
        default: {
          load: vi.fn().mockRejectedValue(new Error('Load failed')),
        },
      }));

      const beforeTime = Date.now();

      const { getFingerprint } = await import('./client-fingerprint');
      const fingerprint = await getFingerprint();

      const afterTime = Date.now();

      // Parse the fallback ID: "fallback-{timestamp}-{random}"
      const parts = fingerprint.split('-');
      expect(parts[0]).toBe('fallback');

      const timestamp = parseInt(parts[1], 10);
      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);

      // Random part should exist and be alphanumeric
      expect(parts[2]).toMatch(/^[a-z0-9]+$/);
    });
  });
});
