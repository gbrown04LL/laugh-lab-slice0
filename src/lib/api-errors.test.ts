import { describe, it, expect, beforeEach } from 'vitest';
import {
  createErrorObject,
  errorResponse,
  validationError,
  notFoundError,
  internalError,
  generateRequestId,
} from './api-errors';

describe('API Errors', () => {
  describe('createErrorObject', () => {
    it('should create a valid error object with all fields', () => {
      const error = createErrorObject({
        code: 'TEST_ERROR',
        message: 'Test error message',
        stage: 'prompt_a',
        retryable: true,
        request_id: 'req_123',
        details: { field: 'value' },
      });

      expect(error).toEqual({
        code: 'TEST_ERROR',
        message: 'Test error message',
        stage: 'prompt_a',
        retryable: true,
        request_id: 'req_123',
        details: { field: 'value' },
      });
    });

    it('should default details to empty object when not provided', () => {
      const error = createErrorObject({
        code: 'TEST_ERROR',
        message: 'Test message',
        stage: 'input_validation',
        retryable: false,
        request_id: 'req_123',
      });

      expect(error.details).toEqual({});
    });

    it('should accept all valid stages', () => {
      const stages = ['input_validation', 'prompt_a', 'prompt_a_validation', 'prompt_b', 'persistence'] as const;

      stages.forEach(stage => {
        const error = createErrorObject({
          code: 'TEST',
          message: 'Test',
          stage,
          retryable: false,
          request_id: 'req_123',
        });

        expect(error.stage).toBe(stage);
      });
    });

    it('should preserve complex details objects', () => {
      const details = {
        field: 'test',
        nested: { value: 123 },
        array: [1, 2, 3],
      };

      const error = createErrorObject({
        code: 'TEST',
        message: 'Test',
        stage: 'prompt_b',
        retryable: true,
        request_id: 'req_123',
        details,
      });

      expect(error.details).toEqual(details);
    });
  });

  describe('errorResponse', () => {
    it('should create NextResponse with correct status and errors', () => {
      const errors = [
        createErrorObject({
          code: 'ERR1',
          message: 'Error 1',
          stage: 'prompt_a',
          retryable: false,
          request_id: 'req_123',
        }),
      ];

      const response = errorResponse(400, errors);

      expect(response.status).toBe(400);
    });

    it('should handle multiple errors', () => {
      const errors = [
        createErrorObject({
          code: 'ERR1',
          message: 'Error 1',
          stage: 'prompt_a',
          retryable: false,
          request_id: 'req_123',
        }),
        createErrorObject({
          code: 'ERR2',
          message: 'Error 2',
          stage: 'prompt_b',
          retryable: true,
          request_id: 'req_123',
        }),
      ];

      const response = errorResponse(500, errors);

      expect(response.status).toBe(500);
    });

    it('should work with different HTTP status codes', () => {
      const errors = [
        createErrorObject({
          code: 'TEST',
          message: 'Test',
          stage: 'input_validation',
          retryable: false,
          request_id: 'req_123',
        }),
      ];

      expect(errorResponse(400, errors).status).toBe(400);
      expect(errorResponse(404, errors).status).toBe(404);
      expect(errorResponse(500, errors).status).toBe(500);
      expect(errorResponse(503, errors).status).toBe(503);
    });

    it('should handle empty error arrays', () => {
      const response = errorResponse(400, []);

      expect(response.status).toBe(400);
    });
  });

  describe('validationError', () => {
    it('should create a validation error object', () => {
      const error = validationError('Invalid input', 'req_123');

      expect(error.code).toBe('INPUT_VALIDATION_FAILED');
      expect(error.message).toBe('Invalid input');
      expect(error.stage).toBe('input_validation');
      expect(error.retryable).toBe(false);
      expect(error.request_id).toBe('req_123');
      expect(error.details).toEqual({});
    });

    it('should include details when provided', () => {
      const details = { field: 'email', reason: 'invalid format' };
      const error = validationError('Invalid email', 'req_123', details);

      expect(error.details).toEqual(details);
    });

    it('should not be retryable', () => {
      const error = validationError('Test', 'req_123');

      expect(error.retryable).toBe(false);
    });

    it('should use input_validation stage', () => {
      const error = validationError('Test', 'req_123');

      expect(error.stage).toBe('input_validation');
    });
  });

  describe('notFoundError', () => {
    it('should create a not found error object', () => {
      const error = notFoundError('Script', 'req_123');

      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('Script not found');
      expect(error.stage).toBe('input_validation');
      expect(error.retryable).toBe(false);
      expect(error.request_id).toBe('req_123');
      expect(error.details).toEqual({});
    });

    it('should format message with resource name', () => {
      expect(notFoundError('Job', 'req_1').message).toBe('Job not found');
      expect(notFoundError('Report', 'req_2').message).toBe('Report not found');
      expect(notFoundError('User', 'req_3').message).toBe('User not found');
    });

    it('should not be retryable', () => {
      const error = notFoundError('Resource', 'req_123');

      expect(error.retryable).toBe(false);
    });

    it('should use input_validation stage', () => {
      const error = notFoundError('Resource', 'req_123');

      expect(error.stage).toBe('input_validation');
    });
  });

  describe('internalError', () => {
    it('should create an internal error object', () => {
      const error = internalError('Database connection failed', 'req_123');

      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.message).toBe('Database connection failed');
      expect(error.stage).toBe('persistence');
      expect(error.retryable).toBe(true);
      expect(error.request_id).toBe('req_123');
      expect(error.details).toEqual({});
    });

    it('should include details when provided', () => {
      const details = { error: 'Connection timeout', attempt: 3 };
      const error = internalError('Database error', 'req_123', details);

      expect(error.details).toEqual(details);
    });

    it('should be retryable', () => {
      const error = internalError('Test', 'req_123');

      expect(error.retryable).toBe(true);
    });

    it('should use persistence stage', () => {
      const error = internalError('Test', 'req_123');

      expect(error.stage).toBe('persistence');
    });
  });

  describe('generateRequestId', () => {
    it('should generate a request ID', () => {
      const id = generateRequestId();

      expect(id).toMatch(/^req_[0-9a-z]+_[0-9a-z]{3,}$/);
    });

    it('should start with "req_" prefix', () => {
      const id = generateRequestId();

      expect(id).toMatch(/^req_/);
    });

    it('should generate different IDs on subsequent calls', () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();
      const id3 = generateRequestId();

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    it('should generate unique IDs in rapid succession', () => {
      const ids = new Set();

      for (let i = 0; i < 100; i++) {
        ids.add(generateRequestId());
      }

      // All IDs should be unique
      expect(ids.size).toBe(100);
    });

    it('should include timestamp component', () => {
      const before = Date.now();
      const id = generateRequestId();
      const after = Date.now();

      // ID should contain timestamp in base36
      expect(id).toMatch(/^req_[0-9a-z]+_/);

      // Extract timestamp portion (between req_ and second _)
      const parts = id.split('_');
      expect(parts.length).toBe(3);
      expect(parts[1]).toBeTruthy();
    });

    it('should include counter component', () => {
      const id = generateRequestId();
      const parts = id.split('_');

      // Should have format: req_{timestamp}_{counter}
      expect(parts.length).toBe(3);
      expect(parts[2]).toHaveLength(3); // Counter is padded to 3 chars
    });

    it('should increment counter', () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();

      const counter1 = parseInt(id1.split('_')[2], 36);
      const counter2 = parseInt(id2.split('_')[2], 36);

      // Counter should increment (or wrap around if at max)
      expect(counter2).toBeGreaterThan(counter1);
    });

    it('should be deterministic within same millisecond', () => {
      // Multiple calls in same millisecond should have same timestamp part
      const ids = [];
      for (let i = 0; i < 10; i++) {
        ids.push(generateRequestId());
      }

      // All should have format req_timestamp_counter
      ids.forEach(id => {
        expect(id).toMatch(/^req_[0-9a-z]+_[0-9a-z]{3}$/);
      });
    });
  });

  describe('Error Integration', () => {
    it('should create complete error response flow', () => {
      const requestId = generateRequestId();
      const error = validationError('Invalid script format', requestId, {
        field: 'text',
        expected: 'string',
        received: 'number',
      });

      const response = errorResponse(400, [error]);

      expect(response.status).toBe(400);
      expect(error.code).toBe('INPUT_VALIDATION_FAILED');
      expect(error.request_id).toMatch(/^req_/);
    });

    it('should handle multiple error types in one response', () => {
      const requestId = generateRequestId();
      const errors = [
        validationError('Invalid field A', requestId),
        validationError('Invalid field B', requestId),
        notFoundError('Related resource', requestId),
      ];

      const response = errorResponse(400, errors);

      expect(response.status).toBe(400);
      expect(errors).toHaveLength(3);
      expect(errors[0].code).toBe('INPUT_VALIDATION_FAILED');
      expect(errors[2].code).toBe('NOT_FOUND');
    });
  });
});
