import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { CharacterBalanceChart, CharacterBalanceItem } from './CharacterBalanceChart';

// Mock Recharts
vi.mock('recharts', () => {
  const React = require('react');
  return {
    ResponsiveContainer: ({ children }: any) => React.createElement('div', { 'data-testid': 'responsive-container' }, children),
    BarChart: ({ children, data }: any) => React.createElement('div', { 'data-testid': 'bar-chart', 'data-chart-data': JSON.stringify(data) }, children),
    Bar: ({ children }: any) => React.createElement('div', { 'data-testid': 'bar' }, children),
    XAxis: () => React.createElement('div', { 'data-testid': 'x-axis' }),
    YAxis: ({ dataKey }: any) => React.createElement('div', { 'data-testid': 'y-axis', 'data-key': dataKey }),
    Cell: () => React.createElement('div', { 'data-testid': 'cell' }),
    LabelList: ({ dataKey, formatter }: any) => React.createElement('div', { 'data-testid': 'label-list', 'data-key': dataKey }),
  };
});

describe('CharacterBalanceChart', () => {
  const mockCharactersBalanced: CharacterBalanceItem[] = [
    {
      name: 'Alice',
      joke_share: 0.35,
      line_share: 0.30,
      underutilized: false,
    },
    {
      name: 'Bob',
      joke_share: 0.30,
      line_share: 0.35,
      underutilized: false,
    },
    {
      name: 'Charlie',
      joke_share: 0.20,
      line_share: 0.20,
      underutilized: false,
    },
  ];

  const mockCharactersUnderutilized: CharacterBalanceItem[] = [
    {
      name: 'Lead',
      joke_share: 0.50,
      line_share: 0.45,
      underutilized: false,
    },
    {
      name: 'Supporting',
      joke_share: 0.12,
      line_share: 0.15,
      underutilized: true,
    },
    {
      name: 'Minor',
      joke_share: 0.05,
      line_share: 0.10,
      underutilized: true,
    },
  ];

  describe('Rendering', () => {
    it('should not render when characters array is empty', () => {
      const { container } = render(<CharacterBalanceChart characters={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render section with title when characters provided', () => {
      render(<CharacterBalanceChart characters={mockCharactersBalanced} />);
      expect(screen.getByText('🎭 Character Balance')).toBeInTheDocument();
    });

    it('should render chart components', () => {
      render(<CharacterBalanceChart characters={mockCharactersBalanced} />);
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      expect(screen.getByTestId('bar')).toBeInTheDocument();
    });

    it('should render legend with status indicators', () => {
      render(<CharacterBalanceChart characters={mockCharactersBalanced} />);
      expect(screen.getByText('Balanced')).toBeInTheDocument();
      expect(screen.getByText('Underutilized')).toBeInTheDocument();
      expect(screen.getByText('Severely')).toBeInTheDocument();
    });
  });

  describe('Data Processing', () => {
    it('should calculate joke_pct correctly from joke_share', () => {
      const { container } = render(<CharacterBalanceChart characters={mockCharactersBalanced} />);
      const chartElement = container.querySelector('[data-testid="bar-chart"]');
      const chartData = JSON.parse(chartElement?.getAttribute('data-chart-data') || '[]');

      expect(chartData[0].joke_pct).toBe(35); // 0.35 * 100 = 35
      expect(chartData[1].joke_pct).toBe(30); // 0.30 * 100 = 30
      expect(chartData[2].joke_pct).toBe(20); // 0.20 * 100 = 20
    });

    it('should sort characters by joke_share in descending order', () => {
      const unsortedCharacters: CharacterBalanceItem[] = [
        { name: 'Low', joke_share: 0.10, line_share: 0.10, underutilized: true },
        { name: 'High', joke_share: 0.50, line_share: 0.50, underutilized: false },
        { name: 'Medium', joke_share: 0.25, line_share: 0.25, underutilized: false },
      ];

      const { container } = render(<CharacterBalanceChart characters={unsortedCharacters} />);
      const chartElement = container.querySelector('[data-testid="bar-chart"]');
      const chartData = JSON.parse(chartElement?.getAttribute('data-chart-data') || '[]');

      expect(chartData[0].name).toBe('High');
      expect(chartData[1].name).toBe('Medium');
      expect(chartData[2].name).toBe('Low');
    });

    it('should round joke_pct to nearest integer', () => {
      const characters: CharacterBalanceItem[] = [
        { name: 'Test', joke_share: 0.337, line_share: 0.30, underutilized: false },
      ];

      const { container } = render(<CharacterBalanceChart characters={characters} />);
      const chartElement = container.querySelector('[data-testid="bar-chart"]');
      const chartData = JSON.parse(chartElement?.getAttribute('data-chart-data') || '[]');

      expect(chartData[0].joke_pct).toBe(34); // Math.round(33.7) = 34
    });
  });

  describe('Color Coding', () => {
    it('should use green for balanced characters', () => {
      const { container } = render(<CharacterBalanceChart characters={mockCharactersBalanced} />);
      const chartElement = container.querySelector('[data-testid="bar-chart"]');
      const chartData = JSON.parse(chartElement?.getAttribute('data-chart-data') || '[]');

      chartData.forEach((char: any) => {
        expect(char.fill).toBe('#22c55e'); // green-500
      });
    });

    it('should use amber for underutilized characters (>= 8%)', () => {
      const { container } = render(<CharacterBalanceChart characters={mockCharactersUnderutilized} />);
      const chartElement = container.querySelector('[data-testid="bar-chart"]');
      const chartData = JSON.parse(chartElement?.getAttribute('data-chart-data') || '[]');

      const supporting = chartData.find((c: any) => c.name === 'Supporting');
      expect(supporting.fill).toBe('#f59e0b'); // amber-500 (12% >= 8%)
    });

    it('should use red for severely underutilized characters (< 8%)', () => {
      const { container } = render(<CharacterBalanceChart characters={mockCharactersUnderutilized} />);
      const chartElement = container.querySelector('[data-testid="bar-chart"]');
      const chartData = JSON.parse(chartElement?.getAttribute('data-chart-data') || '[]');

      const minor = chartData.find((c: any) => c.name === 'Minor');
      expect(minor.fill).toBe('#ef4444'); // red-500 (5% < 8%)
    });

    it('should use green for balanced characters even with low joke_share', () => {
      const characters: CharacterBalanceItem[] = [
        { name: 'Low But Balanced', joke_share: 0.05, line_share: 0.05, underutilized: false },
      ];

      const { container } = render(<CharacterBalanceChart characters={characters} />);
      const chartElement = container.querySelector('[data-testid="bar-chart"]');
      const chartData = JSON.parse(chartElement?.getAttribute('data-chart-data') || '[]');

      expect(chartData[0].fill).toBe('#22c55e'); // Still green because not underutilized
    });
  });

  describe('Chart Height Calculation', () => {
    it('should calculate chart height based on number of characters', () => {
      const { container } = render(<CharacterBalanceChart characters={mockCharactersBalanced} />);
      const chartContainer = container.querySelector('[style]');

      // With 3 characters: 3 * 50 = 150, but minimum is 200
      expect(chartContainer?.getAttribute('style')).toContain('height: 200px');
    });

    it('should use minimum height of 200px for small datasets', () => {
      const characters: CharacterBalanceItem[] = [
        { name: 'Single', joke_share: 0.50, line_share: 0.50, underutilized: false },
      ];

      const { container } = render(<CharacterBalanceChart characters={characters} />);
      const chartContainer = container.querySelector('[style]');

      expect(chartContainer?.getAttribute('style')).toContain('height: 200px');
    });

    it('should increase height for larger datasets', () => {
      const manyCharacters: CharacterBalanceItem[] = Array.from({ length: 10 }, (_, i) => ({
        name: `Character ${i}`,
        joke_share: 0.1,
        line_share: 0.1,
        underutilized: false,
      }));

      const { container } = render(<CharacterBalanceChart characters={manyCharacters} />);
      const chartContainer = container.querySelector('[style]');

      // 10 * 50 = 500px
      expect(chartContainer?.getAttribute('style')).toContain('height: 500px');
    });
  });

  describe('Edge Cases', () => {
    it('should handle single character', () => {
      const characters: CharacterBalanceItem[] = [
        { name: 'Solo', joke_share: 1.0, line_share: 1.0, underutilized: false },
      ];

      render(<CharacterBalanceChart characters={characters} />);
      expect(screen.getByText('🎭 Character Balance')).toBeInTheDocument();
    });

    it('should handle zero joke_share', () => {
      const characters: CharacterBalanceItem[] = [
        { name: 'No Jokes', joke_share: 0, line_share: 0.10, underutilized: true },
      ];

      const { container } = render(<CharacterBalanceChart characters={characters} />);
      const chartElement = container.querySelector('[data-testid="bar-chart"]');
      const chartData = JSON.parse(chartElement?.getAttribute('data-chart-data') || '[]');

      expect(chartData[0].joke_pct).toBe(0);
      expect(chartData[0].fill).toBe('#ef4444'); // Red (severely underutilized)
    });

    it('should handle undefined characters prop gracefully', () => {
      const { container } = render(<CharacterBalanceChart characters={undefined as any} />);
      expect(container.firstChild).toBeNull();
    });

    it('should handle exactly 8% threshold for color coding', () => {
      const characters: CharacterBalanceItem[] = [
        { name: 'Exactly 8%', joke_share: 0.08, line_share: 0.08, underutilized: true },
      ];

      const { container } = render(<CharacterBalanceChart characters={characters} />);
      const chartElement = container.querySelector('[data-testid="bar-chart"]');
      const chartData = JSON.parse(chartElement?.getAttribute('data-chart-data') || '[]');

      // Should be amber (not red) because 8% >= 8%
      expect(chartData[0].fill).toBe('#f59e0b');
    });

    it('should handle very small joke_share values', () => {
      const characters: CharacterBalanceItem[] = [
        { name: 'Tiny', joke_share: 0.001, line_share: 0.001, underutilized: true },
      ];

      const { container } = render(<CharacterBalanceChart characters={characters} />);
      const chartElement = container.querySelector('[data-testid="bar-chart"]');
      const chartData = JSON.parse(chartElement?.getAttribute('data-chart-data') || '[]');

      expect(chartData[0].joke_pct).toBe(0); // Math.round(0.1) = 0
    });
  });

  describe('Data Preservation', () => {
    it('should preserve all character data fields in chart data', () => {
      const { container } = render(<CharacterBalanceChart characters={mockCharactersBalanced} />);
      const chartElement = container.querySelector('[data-testid="bar-chart"]');
      const chartData = JSON.parse(chartElement?.getAttribute('data-chart-data') || '[]');

      chartData.forEach((char: any, i: number) => {
        expect(char).toHaveProperty('name');
        expect(char).toHaveProperty('joke_share');
        expect(char).toHaveProperty('joke_pct');
        expect(char).toHaveProperty('fill');
      });
    });
  });
});
