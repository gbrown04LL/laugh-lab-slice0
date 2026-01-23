import '@testing-library/jest-dom';
import { expect, vi } from 'vitest';

// Mock environment variables
process.env.OPENAI_API_KEY = 'test-api-key';
process.env.LAUGHLAB_LLM_MODEL = 'gpt-4o-2024-08-06';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Global test utilities
global.structuredClone = vi.fn((val) => JSON.parse(JSON.stringify(val)));
