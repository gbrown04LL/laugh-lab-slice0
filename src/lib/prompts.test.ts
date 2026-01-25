import { describe, it, expect } from 'vitest';
import { normalizeForHash, sha256, PROMPT_A_SYSTEM, PROMPT_B_SYSTEM } from './prompts';

describe('prompts utilities', () => {
  describe('normalizeForHash', () => {
    it('should normalize CRLF line endings to LF', () => {
      const input = 'hello\r\nworld';
      const expected = 'hello world';

      expect(normalizeForHash(input)).toBe(expected);
    });

    it('should normalize CR line endings to LF', () => {
      const input = 'hello\rworld';
      const expected = 'hello world';

      expect(normalizeForHash(input)).toBe(expected);
    });

    it('should replace non-breaking spaces with regular spaces', () => {
      const input = 'hello\u00A0world';
      const expected = 'hello world';

      expect(normalizeForHash(input)).toBe(expected);
    });

    it('should collapse multiple whitespace into single space', () => {
      const input = 'hello    world';
      const expected = 'hello world';

      expect(normalizeForHash(input)).toBe(expected);
    });

    it('should trim leading and trailing whitespace', () => {
      const input = '  hello world  ';
      const expected = 'hello world';

      expect(normalizeForHash(input)).toBe(expected);
    });

    it('should handle mixed whitespace scenarios', () => {
      const input = '  hello\r\n\r\n  world\u00A0\u00A0test  ';
      const expected = 'hello world test';

      expect(normalizeForHash(input)).toBe(expected);
    });

    it('should preserve case (not lower-case)', () => {
      const input = 'Hello World TEST';

      expect(normalizeForHash(input)).toBe('Hello World TEST');
    });

    it('should handle empty string', () => {
      expect(normalizeForHash('')).toBe('');
    });

    it('should handle string with only whitespace', () => {
      expect(normalizeForHash('   \r\n  \t  ')).toBe('');
    });

    it('should produce consistent output for equivalent inputs', () => {
      const input1 = 'hello\r\nworld';
      const input2 = 'hello\nworld';
      const input3 = 'hello\rworld';

      const normalized1 = normalizeForHash(input1);
      const normalized2 = normalizeForHash(input2);
      const normalized3 = normalizeForHash(input3);

      expect(normalized1).toBe(normalized2);
      expect(normalized2).toBe(normalized3);
    });

    it('should handle Unicode characters correctly', () => {
      const input = 'Héllo Wörld 你好';

      expect(normalizeForHash(input)).toBe('Héllo Wörld 你好');
    });

    it('should handle tabs as whitespace', () => {
      const input = 'hello\t\tworld';

      expect(normalizeForHash(input)).toBe('hello world');
    });
  });

  describe('sha256', () => {
    it('should return a 64-character hex string', () => {
      const hash = sha256('test');

      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should produce consistent hash for same input', () => {
      const hash1 = sha256('hello world');
      const hash2 = sha256('hello world');

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = sha256('hello');
      const hash2 = sha256('world');

      expect(hash1).not.toBe(hash2);
    });

    it('should match known SHA-256 hash', () => {
      // Known hash for "test" string
      const hash = sha256('test');

      expect(hash).toBe(
        '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
      );
    });

    it('should handle empty string', () => {
      const hash = sha256('');

      // Known hash for empty string
      expect(hash).toBe(
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      );
    });

    it('should handle Unicode characters', () => {
      const hash = sha256('你好世界');

      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should be case-sensitive', () => {
      const hashLower = sha256('hello');
      const hashUpper = sha256('HELLO');

      expect(hashLower).not.toBe(hashUpper);
    });
  });

  describe('normalizeForHash + sha256 integration', () => {
    it('should produce same hash for equivalent inputs with different line endings', () => {
      const script1 = 'INT. ROOM - DAY\r\nCharacter speaks.\r\nEnd scene.';
      const script2 = 'INT. ROOM - DAY\nCharacter speaks.\nEnd scene.';

      const hash1 = sha256(normalizeForHash(script1));
      const hash2 = sha256(normalizeForHash(script2));

      expect(hash1).toBe(hash2);
    });

    it('should produce same hash for equivalent inputs with different whitespace', () => {
      const script1 = '  hello   world  ';
      const script2 = 'hello world';

      const hash1 = sha256(normalizeForHash(script1));
      const hash2 = sha256(normalizeForHash(script2));

      expect(hash1).toBe(hash2);
    });
  });

  describe('PROMPT_A_SYSTEM', () => {
    it('should be a non-empty string', () => {
      expect(typeof PROMPT_A_SYSTEM).toBe('string');
      expect(PROMPT_A_SYSTEM.length).toBeGreaterThan(0);
    });

    it('should contain JSON schema specification', () => {
      expect(PROMPT_A_SYSTEM).toContain('JSON Schema');
    });

    it('should specify classification fields', () => {
      expect(PROMPT_A_SYSTEM).toContain('inferred_format');
      expect(PROMPT_A_SYSTEM).toContain('word_count');
      expect(PROMPT_A_SYSTEM).toContain('estimated_pages');
      expect(PROMPT_A_SYSTEM).toContain('tier_compatibility');
    });

    it('should specify metrics fields', () => {
      expect(PROMPT_A_SYSTEM).toContain('overall_score');
      expect(PROMPT_A_SYSTEM).toContain('lpm_intermediate_plus');
      expect(PROMPT_A_SYSTEM).toContain('lines_per_joke');
      expect(PROMPT_A_SYSTEM).toContain('peak_moments');
      expect(PROMPT_A_SYSTEM).toContain('character_balance');
      expect(PROMPT_A_SYSTEM).toContain('retention_risk');
    });

    it('should specify issue_candidates structure', () => {
      expect(PROMPT_A_SYSTEM).toContain('issue_candidates');
      expect(PROMPT_A_SYSTEM).toContain('issue_id');
      expect(PROMPT_A_SYSTEM).toContain('severity');
      expect(PROMPT_A_SYSTEM).toContain('evidence');
    });

    it('should specify valid format types', () => {
      expect(PROMPT_A_SYSTEM).toContain('scene');
      expect(PROMPT_A_SYSTEM).toContain('half_hour');
      expect(PROMPT_A_SYSTEM).toContain('hour');
      expect(PROMPT_A_SYSTEM).toContain('feature');
    });

    it('should specify severity levels', () => {
      expect(PROMPT_A_SYSTEM).toContain('minor');
      expect(PROMPT_A_SYSTEM).toContain('moderate');
      expect(PROMPT_A_SYSTEM).toContain('major');
    });

    it('should instruct to return valid JSON only', () => {
      expect(PROMPT_A_SYSTEM).toContain('valid JSON');
      expect(PROMPT_A_SYSTEM).toContain('Do not include any explanatory text');
    });
  });

  describe('PROMPT_B_SYSTEM', () => {
    it('should be a non-empty string', () => {
      expect(typeof PROMPT_B_SYSTEM).toBe('string');
      expect(PROMPT_B_SYSTEM.length).toBeGreaterThan(0);
    });

    it('should contain JSON schema specification', () => {
      expect(PROMPT_B_SYSTEM).toContain('JSON Schema');
    });

    it('should reference Prompt A output', () => {
      expect(PROMPT_B_SYSTEM).toContain('Prompt A');
      expect(PROMPT_B_SYSTEM).toContain('must exist in Prompt A output');
    });

    it('should specify not to introduce new issues', () => {
      expect(PROMPT_B_SYSTEM).toContain('Do not introduce new issues');
    });

    it('should specify sections structure', () => {
      expect(PROMPT_B_SYSTEM).toContain('comedy_metrics_snapshot');
      expect(PROMPT_B_SYSTEM).toContain('strengths_to_preserve');
      expect(PROMPT_B_SYSTEM).toContain('whats_getting_in_the_way');
      expect(PROMPT_B_SYSTEM).toContain('recommended_fixes');
      expect(PROMPT_B_SYSTEM).toContain('punch_up_suggestions');
      expect(PROMPT_B_SYSTEM).toContain('how_to_revise_this_efficiently');
    });

    it('should specify revision plan modes', () => {
      expect(PROMPT_B_SYSTEM).toContain('time_boxed');
      expect(PROMPT_B_SYSTEM).toContain('multi_pass');
    });

    it('should specify punch-up options structure', () => {
      expect(PROMPT_B_SYSTEM).toContain('option_id');
      expect(PROMPT_B_SYSTEM).toContain('device');
    });
  });
});
