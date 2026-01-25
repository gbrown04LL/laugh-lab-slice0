import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkUsageLimit, incrementUsage } from './usage';

// Create mock functions at module level
const mockFindFirst = vi.fn();
const mockValues = vi.fn();
const mockWhere = vi.fn();
const mockSet = vi.fn(() => ({ where: mockWhere }));
const mockInsert = vi.fn(() => ({ values: mockValues }));
const mockUpdate = vi.fn(() => ({ set: mockSet }));

const mockDb = {
  query: {
    usageTracking: {
      findFirst: mockFindFirst,
    },
  },
  insert: mockInsert,
  update: mockUpdate,
};

// Mock the database module - default export is a function that returns the db
vi.mock('./db', () => ({
  default: vi.fn(() => mockDb),
  getDb: vi.fn(() => mockDb),
}));

// Also mock the schema to prevent import errors
vi.mock('./db/schema', () => ({
  usageTracking: 'usageTracking',
}));

describe('Usage Tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementations
    mockSet.mockReturnValue({ where: mockWhere });
    mockInsert.mockReturnValue({ values: mockValues });
    mockUpdate.mockReturnValue({ set: mockSet });
    // Reset the system time
    vi.useRealTimers();
  });

  describe('checkUsageLimit', () => {
    it('should allow first-time user', async () => {
      mockFindFirst.mockResolvedValue(null);

      const result = await checkUsageLimit('new-user');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
      expect(result.limit).toBe(2);
      expect(result.reason).toBeUndefined();
    });

    it('should allow user with usage below limit', async () => {
      const currentMonth = new Date();
      const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;

      mockFindFirst.mockResolvedValue({
        identifier: 'user-1',
        monthlyCount: 1,
        monthKey,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await checkUsageLimit('user-1');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
      expect(result.limit).toBe(2);
    });

    it('should deny user at limit', async () => {
      const currentMonth = new Date();
      const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;

      mockFindFirst.mockResolvedValue({
        identifier: 'user-1',
        monthlyCount: 2,
        monthKey,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await checkUsageLimit('user-1');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.limit).toBe(2);
      expect(result.reason).toContain('used all 2 free analyses');
    });

    it('should deny user over limit', async () => {
      const currentMonth = new Date();
      const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;

      mockFindFirst.mockResolvedValue({
        identifier: 'user-1',
        monthlyCount: 5,
        monthKey,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await checkUsageLimit('user-1');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.limit).toBe(2);
    });

    it('should reset usage for new month', async () => {
      // Mock user from previous month
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const oldMonthKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

      mockFindFirst.mockResolvedValue({
        identifier: 'user-1',
        monthlyCount: 2,
        monthKey: oldMonthKey,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await checkUsageLimit('user-1');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
      expect(result.limit).toBe(2);
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should handle edge case of exactly at limit', async () => {
      const currentMonth = new Date();
      const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;

      mockFindFirst.mockResolvedValue({
        identifier: 'user-1',
        monthlyCount: 2,
        monthKey,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await checkUsageLimit('user-1');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should handle null monthlyCount', async () => {
      const currentMonth = new Date();
      const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;

      mockFindFirst.mockResolvedValue({
        identifier: 'user-1',
        monthlyCount: null,
        monthKey,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await checkUsageLimit('user-1');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });

    it('should calculate correct remaining count', async () => {
      const currentMonth = new Date();
      const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;

      // Test with count = 0
      mockFindFirst.mockResolvedValue({
        identifier: 'user-1',
        monthlyCount: 0,
        monthKey,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      let result = await checkUsageLimit('user-1');
      expect(result.remaining).toBe(2);

      // Test with count = 1
      mockFindFirst.mockResolvedValue({
        identifier: 'user-1',
        monthlyCount: 1,
        monthKey,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      result = await checkUsageLimit('user-1');
      expect(result.remaining).toBe(1);
    });

    it('should handle different month boundaries correctly', async () => {
      // Test January
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15'));

      mockFindFirst.mockResolvedValue({
        identifier: 'user-1',
        monthlyCount: 0,
        monthKey: '2024-01',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      let result = await checkUsageLimit('user-1');
      expect(result.allowed).toBe(true);

      // Test December
      vi.setSystemTime(new Date('2024-12-15'));

      mockFindFirst.mockResolvedValue({
        identifier: 'user-1',
        monthlyCount: 0,
        monthKey: '2024-12',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      result = await checkUsageLimit('user-1');
      expect(result.allowed).toBe(true);

      vi.useRealTimers();
    });
  });

  describe('incrementUsage', () => {
    it('should create new record for first-time user', async () => {
      mockFindFirst.mockResolvedValue(null);

      await incrementUsage('new-user');

      expect(mockInsert).toHaveBeenCalled();
    });

    it('should insert with count of 1 for new user', async () => {
      mockFindFirst.mockResolvedValue(null);

      await incrementUsage('new-user');

      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: 'new-user',
          monthlyCount: 1,
        })
      );
    });

    it('should update existing user count', async () => {
      const currentMonth = new Date();
      const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;

      mockFindFirst.mockResolvedValue({
        identifier: 'user-1',
        monthlyCount: 1,
        monthKey,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await incrementUsage('user-1');

      expect(mockUpdate).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          monthlyCount: 2,
        })
      );
    });

    it('should increment from 0 to 1', async () => {
      const currentMonth = new Date();
      const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;

      mockFindFirst.mockResolvedValue({
        identifier: 'user-1',
        monthlyCount: 0,
        monthKey,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await incrementUsage('user-1');

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          monthlyCount: 1,
        })
      );
    });

    it('should handle null monthlyCount', async () => {
      const currentMonth = new Date();
      const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;

      mockFindFirst.mockResolvedValue({
        identifier: 'user-1',
        monthlyCount: null,
        monthKey,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await incrementUsage('user-1');

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          monthlyCount: 1, // 0 (from null) + 1
        })
      );
    });

    it('should set monthKey for new user', async () => {
      mockFindFirst.mockResolvedValue(null);

      const currentMonth = new Date();
      const expectedMonthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;

      await incrementUsage('new-user');

      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          monthKey: expectedMonthKey,
        })
      );
    });

    it('should update updatedAt timestamp', async () => {
      const currentMonth = new Date();
      const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;

      mockFindFirst.mockResolvedValue({
        identifier: 'user-1',
        monthlyCount: 1,
        monthKey,
        createdAt: new Date(),
        updatedAt: new Date('2024-01-01'),
      });

      await incrementUsage('user-1');

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          updatedAt: expect.any(Date),
        })
      );
    });
  });

  describe('Month Key Generation', () => {
    it('should format single-digit months with leading zero', async () => {
      vi.useFakeTimers();

      // Test each month
      const months = [
        { date: '2024-01-15', expected: '2024-01' },
        { date: '2024-02-15', expected: '2024-02' },
        { date: '2024-09-15', expected: '2024-09' },
        { date: '2024-10-15', expected: '2024-10' },
        { date: '2024-11-15', expected: '2024-11' },
        { date: '2024-12-15', expected: '2024-12' },
      ];

      for (const { date, expected } of months) {
        vi.setSystemTime(new Date(date));
        vi.clearAllMocks();
        // Reset mock chain
        mockSet.mockReturnValue({ where: mockWhere });
        mockInsert.mockReturnValue({ values: mockValues });
        mockUpdate.mockReturnValue({ set: mockSet });

        mockFindFirst.mockResolvedValue(null);

        await incrementUsage('test-user');

        expect(mockValues).toHaveBeenCalledWith(
          expect.objectContaining({
            monthKey: expected,
          })
        );
      }

      vi.useRealTimers();
    });

    it('should handle year boundaries', async () => {
      vi.useFakeTimers();

      // Test December to January transition
      vi.setSystemTime(new Date('2024-12-31'));
      mockFindFirst.mockResolvedValue(null);

      await incrementUsage('test-user');
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({ monthKey: '2024-12' })
      );

      vi.clearAllMocks();
      // Reset mock chain
      mockSet.mockReturnValue({ where: mockWhere });
      mockInsert.mockReturnValue({ values: mockValues });
      mockUpdate.mockReturnValue({ set: mockSet });

      vi.setSystemTime(new Date('2025-01-01'));
      mockFindFirst.mockResolvedValue(null);

      await incrementUsage('test-user');
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({ monthKey: '2025-01' })
      );

      vi.useRealTimers();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle full usage cycle for a user', async () => {
      const currentMonth = new Date();
      const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;

      // Check 1: New user
      mockFindFirst.mockResolvedValue(null);
      let result = await checkUsageLimit('user-1');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);

      // Use 1: After first usage
      mockFindFirst.mockResolvedValue({
        identifier: 'user-1',
        monthlyCount: 1,
        monthKey,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      result = await checkUsageLimit('user-1');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);

      // Use 2: After second usage
      mockFindFirst.mockResolvedValue({
        identifier: 'user-1',
        monthlyCount: 2,
        monthKey,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      result = await checkUsageLimit('user-1');
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });
});
