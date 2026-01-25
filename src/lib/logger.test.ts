import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from './logger';

describe('Logger', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('log levels', () => {
    it('should format info messages correctly', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      logger.info('Script processed');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[2024-06-15T12:00:00.000Z] [INFO] Script processed'
      );
    });

    it('should format warn messages correctly', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      logger.warn('Rate limit approaching');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[2024-06-15T12:00:00.000Z] [WARN] Rate limit approaching'
      );
    });

    it('should format error messages correctly', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      logger.error('Database connection failed');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[2024-06-15T12:00:00.000Z] [ERROR] Database connection failed'
      );
    });

    it('should only output debug messages in development mode', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      const originalEnv = process.env.NODE_ENV;

      // Test in development
      process.env.NODE_ENV = 'development';
      logger.debug('Debug info');
      expect(consoleSpy).toHaveBeenCalledTimes(1);

      consoleSpy.mockClear();

      // Test in production
      process.env.NODE_ENV = 'production';
      logger.debug('Debug info');
      expect(consoleSpy).not.toHaveBeenCalled();

      // Restore
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('context formatting', () => {
    it('should include context as JSON', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      logger.info('Job created', { job_id: 'abc-123', user_id: 'user-456' });

      const output = consoleSpy.mock.calls[0][0];
      expect(output).toContain('[INFO] Job created');
      expect(output).toContain('"job_id":"abc-123"');
      expect(output).toContain('"user_id":"user-456"');
    });

    it('should handle empty context', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      logger.info('Simple message', {});

      const output = consoleSpy.mock.calls[0][0];
      expect(output).toContain('[INFO] Simple message {}');
    });

    it('should handle undefined context', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      logger.info('No context');

      const output = consoleSpy.mock.calls[0][0];
      expect(output).toBe('[2024-06-15T12:00:00.000Z] [INFO] No context');
    });

    it('should include all context properties', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      logger.info('Full context', {
        job_id: 'job-1',
        script_id: 'script-1',
        run_id: 'run-1',
        user_id: 'user-1',
        duration_ms: 1500,
        status: 'completed',
      });

      const output = consoleSpy.mock.calls[0][0];
      expect(output).toContain('"job_id":"job-1"');
      expect(output).toContain('"script_id":"script-1"');
      expect(output).toContain('"run_id":"run-1"');
      expect(output).toContain('"user_id":"user-1"');
      expect(output).toContain('"duration_ms":1500');
      expect(output).toContain('"status":"completed"');
    });

    it('should handle custom context properties', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      logger.info('Custom props', {
        custom_string: 'value',
        custom_number: 42,
        custom_bool: true,
      });

      const output = consoleSpy.mock.calls[0][0];
      expect(output).toContain('"custom_string":"value"');
      expect(output).toContain('"custom_number":42');
      expect(output).toContain('"custom_bool":true');
    });
  });

  describe('startTimer', () => {
    it('should log start message immediately', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      logger.startTimer('Analysis pipeline');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[2024-06-15T12:00:00.000Z] [INFO] Analysis pipeline started'
      );
    });

    it('should log completion with duration when timer is called', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const endTimer = logger.startTimer('Analysis pipeline');

      // Advance time by 1500ms
      vi.advanceTimersByTime(1500);

      endTimer();

      expect(consoleSpy).toHaveBeenCalledTimes(2);
      const completionLog = consoleSpy.mock.calls[1][0];
      expect(completionLog).toContain('[INFO] Analysis pipeline completed');
      expect(completionLog).toContain('"duration_ms":1500');
    });

    it('should preserve original context in completion log', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const endTimer = logger.startTimer('POST /api/analyze', {
        request_id: 'req-123',
        user_id: 'user-456',
      });

      vi.advanceTimersByTime(250);
      endTimer();

      const completionLog = consoleSpy.mock.calls[1][0];
      expect(completionLog).toContain('"request_id":"req-123"');
      expect(completionLog).toContain('"user_id":"user-456"');
      expect(completionLog).toContain('"duration_ms":250');
    });

    it('should return a reusable timer function', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const endTimer = logger.startTimer('Operation');

      vi.advanceTimersByTime(100);
      endTimer();

      vi.advanceTimersByTime(200);
      endTimer();

      // Should be called 3 times: 1 start + 2 completions
      expect(consoleSpy).toHaveBeenCalledTimes(3);

      // First completion at 100ms
      expect(consoleSpy.mock.calls[1][0]).toContain('"duration_ms":100');

      // Second completion at 300ms (100 + 200)
      expect(consoleSpy.mock.calls[2][0]).toContain('"duration_ms":300');
    });
  });

  describe('timestamp format', () => {
    it('should use ISO 8601 format', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      logger.info('Test');

      const output = consoleSpy.mock.calls[0][0];
      // ISO format: YYYY-MM-DDTHH:mm:ss.sssZ
      expect(output).toMatch(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
    });
  });
});
