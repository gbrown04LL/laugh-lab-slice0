import { describe, it, expect } from 'vitest';
import {
  normalizeForHash,
  computeInputHash,
  countWords,
  estimatePages,
  inferFormat,
  tierCompatibility,
  computeScriptFingerprint,
} from './fingerprint';

describe('Fingerprint Utils', () => {
  describe('normalizeForHash', () => {
    it('should normalize line endings to \\n', () => {
      expect(normalizeForHash('hello\r\nworld')).toBe('hello world');
      expect(normalizeForHash('hello\rworld')).toBe('hello world');
      expect(normalizeForHash('hello\nworld')).toBe('hello world');
    });

    it('should replace non-breaking spaces with regular spaces', () => {
      expect(normalizeForHash('hello\u00A0world')).toBe('hello world');
    });

    it('should collapse multiple spaces to single space', () => {
      expect(normalizeForHash('hello    world')).toBe('hello world');
      expect(normalizeForHash('hello  \t  world')).toBe('hello world');
    });

    it('should trim leading and trailing whitespace', () => {
      expect(normalizeForHash('  hello world  ')).toBe('hello world');
      expect(normalizeForHash('\n\nhello world\n\n')).toBe('hello world');
    });

    it('should handle empty strings', () => {
      expect(normalizeForHash('')).toBe('');
      expect(normalizeForHash('   ')).toBe('');
    });

    it('should apply all normalizations together', () => {
      const input = '  hello\r\n\r\nworld  \u00A0  test  ';
      expect(normalizeForHash(input)).toBe('hello world test');
    });

    it('should preserve single spaces between words', () => {
      expect(normalizeForHash('hello world')).toBe('hello world');
    });
  });

  describe('computeInputHash', () => {
    it('should produce consistent SHA-256 hashes', () => {
      const text = 'This is a test script';
      const hash1 = computeInputHash(text);
      const hash2 = computeInputHash(text);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex chars
    });

    it('should produce different hashes for different texts', () => {
      const hash1 = computeInputHash('Script A');
      const hash2 = computeInputHash('Script B');

      expect(hash1).not.toBe(hash2);
    });

    it('should normalize before hashing (same hash for equivalent texts)', () => {
      const hash1 = computeInputHash('hello\r\nworld');
      const hash2 = computeInputHash('hello\nworld');
      const hash3 = computeInputHash('hello  world');

      expect(hash1).toBe(hash2);
      expect(hash2).toBe(hash3);
    });

    it('should produce valid hex strings', () => {
      const hash = computeInputHash('test');
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should handle empty strings', () => {
      const hash = computeInputHash('');
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should handle unicode characters', () => {
      const hash = computeInputHash('Hello 世界 🎭');
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('countWords', () => {
    it('should count words correctly', () => {
      expect(countWords('hello world')).toBe(2);
      expect(countWords('one two three four')).toBe(4);
    });

    it('should handle multiple spaces', () => {
      expect(countWords('hello    world')).toBe(2);
      expect(countWords('one  two   three')).toBe(3);
    });

    it('should handle line breaks', () => {
      expect(countWords('hello\nworld')).toBe(2);
      expect(countWords('hello\r\nworld')).toBe(2);
      expect(countWords('one\ntwo\nthree')).toBe(3);
    });

    it('should handle tabs', () => {
      expect(countWords('hello\tworld')).toBe(2);
    });

    it('should return 0 for empty strings', () => {
      expect(countWords('')).toBe(0);
      expect(countWords('   ')).toBe(0);
      expect(countWords('\n\n')).toBe(0);
    });

    it('should handle single words', () => {
      expect(countWords('hello')).toBe(1);
    });

    it('should handle punctuation', () => {
      expect(countWords('Hello, world!')).toBe(2);
      expect(countWords('one, two, three.')).toBe(3);
    });

    it('should handle script-like text', () => {
      const script = `INT. COFFEE SHOP - DAY

      ALICE sits at a table, typing on her laptop.

      ALICE
      This is taking forever.`;

      expect(countWords(script)).toBeGreaterThan(10);
    });
  });

  describe('estimatePages', () => {
    it('should estimate pages at ~250 words per page', () => {
      expect(estimatePages(250)).toBe(1);
      expect(estimatePages(500)).toBe(2);
      expect(estimatePages(750)).toBe(3);
      expect(estimatePages(1000)).toBe(4);
    });

    it('should have minimum of 0.5 pages', () => {
      expect(estimatePages(0)).toBe(0.5);
      expect(estimatePages(50)).toBe(0.5);
      expect(estimatePages(100)).toBe(0.5);
    });

    it('should round to 1 decimal place', () => {
      expect(estimatePages(300)).toBe(1.2);
      expect(estimatePages(375)).toBe(1.5);
      expect(estimatePages(625)).toBe(2.5);
    });

    it('should handle typical script lengths', () => {
      expect(estimatePages(2500)).toBe(10); // ~10 pages (scene)
      expect(estimatePages(7500)).toBe(30); // ~30 pages (half-hour sitcom)
      expect(estimatePages(15000)).toBe(60); // ~60 pages (feature)
    });

    it('should handle edge cases', () => {
      expect(estimatePages(1)).toBe(0.5);
      expect(estimatePages(25000)).toBe(100);
    });
  });

  describe('inferFormat', () => {
    it('should classify as "scene" for short scripts', () => {
      expect(inferFormat(1000, 4)).toBe('scene');
      expect(inferFormat(1500, 6)).toBe('scene');
    });

    it('should classify based on word count < 2000', () => {
      expect(inferFormat(1500, 6)).toBe('scene');
      expect(inferFormat(1999, 8)).toBe('scene');
    });

    it('should classify based on pages <= 8', () => {
      expect(inferFormat(2500, 8)).toBe('scene');
      expect(inferFormat(2500, 7)).toBe('scene');
    });

    it('should classify as "half_hour" for sitcom-length scripts', () => {
      expect(inferFormat(5000, 20)).toBe('half_hour');
      expect(inferFormat(7500, 30)).toBe('half_hour');
      expect(inferFormat(10000, 40)).toBe('half_hour');
    });

    it('should classify as "hour" for hour-long scripts', () => {
      expect(inferFormat(12500, 50)).toBe('hour');
      expect(inferFormat(15000, 60)).toBe('hour');
      expect(inferFormat(18000, 72)).toBe('hour');
    });

    it('should classify as "feature" for feature-length scripts', () => {
      expect(inferFormat(20000, 80)).toBe('feature');
      expect(inferFormat(25000, 100)).toBe('feature');
      expect(inferFormat(30000, 120)).toBe('feature');
    });

    it('should handle boundary cases', () => {
      expect(inferFormat(2000, 8)).toBe('scene'); // Exactly 8 pages
      expect(inferFormat(2001, 9)).toBe('half_hour'); // Just over 8 pages
      expect(inferFormat(5000, 45)).toBe('half_hour'); // Exactly 45 pages
      expect(inferFormat(5000, 46)).toBe('hour'); // Just over 45 pages
      expect(inferFormat(10000, 75)).toBe('hour'); // Exactly 75 pages
      expect(inferFormat(10000, 76)).toBe('feature'); // Just over 75 pages
    });
  });

  describe('tierCompatibility', () => {
    describe('scene format', () => {
      it('should accept scripts in valid range (200-6000 words)', () => {
        expect(tierCompatibility('scene', 200)).toBe('ok');
        expect(tierCompatibility('scene', 3000)).toBe('ok');
        expect(tierCompatibility('scene', 6000)).toBe('ok');
      });

      it('should reject too short scripts', () => {
        expect(tierCompatibility('scene', 100)).toBe('too_short');
        expect(tierCompatibility('scene', 199)).toBe('too_short');
      });

      it('should reject too long scripts', () => {
        expect(tierCompatibility('scene', 6001)).toBe('too_long');
        expect(tierCompatibility('scene', 10000)).toBe('too_long');
      });
    });

    describe('half_hour format', () => {
      it('should accept scripts in valid range (2500-15000 words)', () => {
        expect(tierCompatibility('half_hour', 2500)).toBe('ok');
        expect(tierCompatibility('half_hour', 8000)).toBe('ok');
        expect(tierCompatibility('half_hour', 15000)).toBe('ok');
      });

      it('should reject too short scripts', () => {
        expect(tierCompatibility('half_hour', 2000)).toBe('too_short');
        expect(tierCompatibility('half_hour', 2499)).toBe('too_short');
      });

      it('should reject too long scripts', () => {
        expect(tierCompatibility('half_hour', 15001)).toBe('too_long');
        expect(tierCompatibility('half_hour', 20000)).toBe('too_long');
      });
    });

    describe('hour format', () => {
      it('should accept scripts in valid range (5000-25000 words)', () => {
        expect(tierCompatibility('hour', 5000)).toBe('ok');
        expect(tierCompatibility('hour', 15000)).toBe('ok');
        expect(tierCompatibility('hour', 25000)).toBe('ok');
      });

      it('should reject too short scripts', () => {
        expect(tierCompatibility('hour', 4000)).toBe('too_short');
        expect(tierCompatibility('hour', 4999)).toBe('too_short');
      });

      it('should reject too long scripts', () => {
        expect(tierCompatibility('hour', 25001)).toBe('too_long');
        expect(tierCompatibility('hour', 30000)).toBe('too_long');
      });
    });

    describe('feature format', () => {
      it('should accept scripts in valid range (10000-50000 words)', () => {
        expect(tierCompatibility('feature', 10000)).toBe('ok');
        expect(tierCompatibility('feature', 30000)).toBe('ok');
        expect(tierCompatibility('feature', 50000)).toBe('ok');
      });

      it('should reject too short scripts', () => {
        expect(tierCompatibility('feature', 9000)).toBe('too_short');
        expect(tierCompatibility('feature', 9999)).toBe('too_short');
      });

      it('should reject too long scripts', () => {
        expect(tierCompatibility('feature', 50001)).toBe('too_long');
        expect(tierCompatibility('feature', 100000)).toBe('too_long');
      });
    });
  });

  describe('computeScriptFingerprint', () => {
    it('should compute complete fingerprint for short script', () => {
      const text = 'INT. ROOM - DAY\n\nALICE\nHello world.';
      const fingerprint = computeScriptFingerprint(text);

      expect(fingerprint).toHaveProperty('input_hash');
      expect(fingerprint).toHaveProperty('word_count');
      expect(fingerprint).toHaveProperty('estimated_pages');
      expect(fingerprint).toHaveProperty('inferred_format');
      expect(fingerprint).toHaveProperty('tier_compatibility');

      expect(fingerprint.input_hash).toHaveLength(64);
      expect(fingerprint.word_count).toBeGreaterThan(0);
      expect(fingerprint.estimated_pages).toBeGreaterThan(0);
    });

    it('should classify scene correctly', () => {
      const text = 'A short scene. '.repeat(100); // ~300 words (3 words * 100 repeats)
      const fingerprint = computeScriptFingerprint(text);

      expect(fingerprint.inferred_format).toBe('scene');
      expect(fingerprint.word_count).toBeCloseTo(300, -1);
    });

    it('should classify half_hour correctly', () => {
      const text = 'A half hour script. '.repeat(1500); // ~6000 words
      const fingerprint = computeScriptFingerprint(text);

      expect(fingerprint.inferred_format).toBe('half_hour');
      expect(fingerprint.word_count).toBeCloseTo(6000, -2);
    });

    it('should classify hour correctly', () => {
      const text = 'An hour long script. '.repeat(3000); // ~12000 words
      const fingerprint = computeScriptFingerprint(text);

      expect(fingerprint.inferred_format).toBe('hour');
      expect(fingerprint.word_count).toBeCloseTo(12000, -2);
    });

    it('should classify feature correctly', () => {
      const text = 'A feature film script. '.repeat(5000); // ~20000 words
      const fingerprint = computeScriptFingerprint(text);

      expect(fingerprint.inferred_format).toBe('feature');
      expect(fingerprint.word_count).toBeCloseTo(20000, -2);
    });

    it('should detect too_short compatibility', () => {
      const text = 'Too short.'; // < 200 words
      const fingerprint = computeScriptFingerprint(text);

      expect(fingerprint.tier_compatibility).toBe('too_short');
    });

    it('should detect too_long compatibility', () => {
      const text = 'A very long script. '.repeat(30000); // > 50000 words
      const fingerprint = computeScriptFingerprint(text);

      expect(fingerprint.tier_compatibility).toBe('too_long');
    });

    it('should detect ok compatibility', () => {
      const text = 'A properly sized script. '.repeat(1000); // ~4000 words
      const fingerprint = computeScriptFingerprint(text);

      expect(fingerprint.tier_compatibility).toBe('ok');
    });

    it('should produce consistent fingerprints for same text', () => {
      const text = 'Test script content';
      const fp1 = computeScriptFingerprint(text);
      const fp2 = computeScriptFingerprint(text);

      expect(fp1).toEqual(fp2);
    });

    it('should produce different hashes for different texts', () => {
      const fp1 = computeScriptFingerprint('Script A');
      const fp2 = computeScriptFingerprint('Script B');

      expect(fp1.input_hash).not.toBe(fp2.input_hash);
    });

    it('should normalize before fingerprinting', () => {
      const fp1 = computeScriptFingerprint('hello\r\nworld');
      const fp2 = computeScriptFingerprint('hello\nworld');
      const fp3 = computeScriptFingerprint('hello  world');

      expect(fp1.input_hash).toBe(fp2.input_hash);
      expect(fp2.input_hash).toBe(fp3.input_hash);
    });

    it('should handle realistic script format', () => {
      const script = `
INT. COFFEE SHOP - DAY

ALICE (30s, witty) sits typing on her laptop. BOB (30s, nervous) approaches.

BOB
Alice! I need to tell you something.

ALICE
(without looking up)
Let me guess. You forgot my birthday?

BOB
No! I mean... when is your birthday?

ALICE
(deadpan)
Yesterday.

Bob freezes. Alice grins.

ALICE (CONT'D)
Just kidding. It's in June.

BOB
(relieved)
Oh thank god. Actually, I came to tell you
that I accidentally sent your script to my mom
instead of mine.

ALICE
And?

BOB
She thinks you're a genius.

ALICE
Well, she's not wrong.

FADE OUT.
      `;

      const fingerprint = computeScriptFingerprint(script);

      expect(fingerprint.word_count).toBeGreaterThan(50);
      expect(fingerprint.estimated_pages).toBeGreaterThan(0);
      expect(fingerprint.inferred_format).toBe('scene');
      expect(fingerprint.input_hash).toMatch(/^[0-9a-f]{64}$/);
    });
  });
});
