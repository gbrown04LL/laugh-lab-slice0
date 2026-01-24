import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ScoreGauge } from './ScoreGauge';

// Mock Recharts to avoid canvas rendering issues in tests
vi.mock('recharts', () => {
  const React = require('react');
  return {
    ResponsiveContainer: ({ children }: any) => React.createElement('div', { 'data-testid': 'responsive-container' }, children),
    RadialBarChart: ({ children }: any) => React.createElement('div', { 'data-testid': 'radial-bar-chart' }, children),
    RadialBar: () => React.createElement('div', { 'data-testid': 'radial-bar' }),
  };
});

describe('ScoreGauge', () => {
  describe('Rendering', () => {
    it('should render score number', () => {
      render(<ScoreGauge score={75} />);

      expect(screen.getByText('75')).toBeInTheDocument();
      expect(screen.getByText('/100')).toBeInTheDocument();
    });

    it('should render with default percentile', () => {
      render(<ScoreGauge score={80} />);

      expect(screen.getByText(/Better than 75% of sitcom pilots/)).toBeInTheDocument();
    });

    it('should render with custom percentile', () => {
      render(<ScoreGauge score={90} percentile={95} />);

      expect(screen.getByText(/Better than 95% of sitcom pilots/)).toBeInTheDocument();
    });

    it('should render Recharts components', () => {
      render(<ScoreGauge score={75} />);

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('radial-bar-chart')).toBeInTheDocument();
      expect(screen.getByTestId('radial-bar')).toBeInTheDocument();
    });
  });

  describe('Score Zones', () => {
    it('should handle low score (0-50)', () => {
      render(<ScoreGauge score={30} />);

      expect(screen.getByText('30')).toBeInTheDocument();
    });

    it('should handle medium score (50-70)', () => {
      render(<ScoreGauge score={60} />);

      expect(screen.getByText('60')).toBeInTheDocument();
    });

    it('should handle high score (70-100)', () => {
      render(<ScoreGauge score={85} />);

      expect(screen.getByText('85')).toBeInTheDocument();
    });

    it('should handle boundary scores', () => {
      const { rerender } = render(<ScoreGauge score={50} />);
      expect(screen.getByText('50')).toBeInTheDocument();

      rerender(<ScoreGauge score={70} />);
      expect(screen.getByText('70')).toBeInTheDocument();

      rerender(<ScoreGauge score={100} />);
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('should handle minimum score', () => {
      render(<ScoreGauge score={0} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle maximum score', () => {
      render(<ScoreGauge score={100} />);

      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });

  describe('Percentile Display', () => {
    it('should show percentile badge', () => {
      render(<ScoreGauge score={75} percentile={80} />);

      const badge = screen.getByText(/Better than 80% of sitcom pilots/);
      expect(badge).toBeInTheDocument();
    });

    it('should handle 0 percentile', () => {
      render(<ScoreGauge score={25} percentile={0} />);

      expect(screen.getByText(/Better than 0% of sitcom pilots/)).toBeInTheDocument();
    });

    it('should handle 100 percentile', () => {
      render(<ScoreGauge score={95} percentile={100} />);

      expect(screen.getByText(/Better than 100% of sitcom pilots/)).toBeInTheDocument();
    });
  });

  describe('Visual Structure', () => {
    it('should have correct CSS classes for styling', () => {
      const { container } = render(<ScoreGauge score={75} />);

      // Check for flex container
      expect(container.querySelector('.flex.flex-col.items-center')).toBeInTheDocument();

      // Check for score overlay with correct margin and styling
      expect(container.querySelector('.-mt-24.text-center')).toBeInTheDocument();

      // Check for percentile badge styling
      expect(container.querySelector('.bg-amber-100.text-amber-800')).toBeInTheDocument();
    });

    it('should render score with large font', () => {
      render(<ScoreGauge score={75} />);

      const scoreElement = screen.getByText('75');
      expect(scoreElement).toHaveClass('text-5xl', 'font-bold', 'text-gray-900');
    });
  });
});
