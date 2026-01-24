import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MetricsCards } from './MetricsCards';

describe('MetricsCards', () => {
  describe('Rendering', () => {
    it('should render all three metric cards', () => {
      render(<MetricsCards lpm={2.5} linesPerJoke={5.5} ensembleBalance={0.85} />);

      expect(screen.getByText('LPM (Laughs/Min)')).toBeInTheDocument();
      expect(screen.getByText('Lines Per Joke')).toBeInTheDocument();
      expect(screen.getByText('Ensemble Balance')).toBeInTheDocument();
    });

    it('should display LPM value correctly', () => {
      render(<MetricsCards lpm={2.5} linesPerJoke={5.5} ensembleBalance={0.85} />);

      expect(screen.getByText('2.5')).toBeInTheDocument();
    });

    it('should display lines per joke correctly', () => {
      render(<MetricsCards lpm={2.5} linesPerJoke={7.3} ensembleBalance={0.85} />);

      expect(screen.getByText('7.3')).toBeInTheDocument();
    });

    it('should display ensemble balance as percentage', () => {
      render(<MetricsCards lpm={2.5} linesPerJoke={5.5} ensembleBalance={0.85} />);

      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('should round ensemble balance correctly', () => {
      render(<MetricsCards lpm={2.5} linesPerJoke={5.5} ensembleBalance={0.876} />);

      // 0.876 * 100 = 87.6, rounded to 88
      expect(screen.getByText('88%')).toBeInTheDocument();
    });
  });

  describe('LPM Status', () => {
    it('should show "Above Average" for high LPM', () => {
      render(<MetricsCards lpm={2.5} linesPerJoke={5.5} ensembleBalance={0.85} />);

      expect(screen.getByText('↑ Above Average')).toBeInTheDocument();
    });

    it('should show "On Target" for medium LPM', () => {
      render(<MetricsCards lpm={1.7} linesPerJoke={5.5} ensembleBalance={0.85} />);

      expect(screen.getByText('→ On Target')).toBeInTheDocument();
    });

    it('should show "Below Average" for low LPM', () => {
      render(<MetricsCards lpm={1.2} linesPerJoke={5.5} ensembleBalance={0.85} />);

      expect(screen.getByText('↓ Below Average')).toBeInTheDocument();
    });

    it('should handle boundary value at 2.0', () => {
      render(<MetricsCards lpm={2.0} linesPerJoke={5.5} ensembleBalance={0.85} />);

      expect(screen.getByText('↑ Above Average')).toBeInTheDocument();
    });

    it('should handle boundary value at 1.5', () => {
      render(<MetricsCards lpm={1.5} linesPerJoke={5.5} ensembleBalance={0.85} />);

      expect(screen.getByText('→ On Target')).toBeInTheDocument();
    });

    it('should handle LPM just below 1.5', () => {
      render(<MetricsCards lpm={1.4} linesPerJoke={5.5} ensembleBalance={0.85} />);

      expect(screen.getByText('↓ Below Average')).toBeInTheDocument();
    });
  });

  describe('Lines Per Joke Status', () => {
    it('should show "Tight pacing" for low LPJ', () => {
      render(<MetricsCards lpm={2.5} linesPerJoke={5.0} ensembleBalance={0.85} />);

      expect(screen.getByText('Tight pacing')).toBeInTheDocument();
    });

    it('should show "Could be snappier" for medium LPJ', () => {
      render(<MetricsCards lpm={2.5} linesPerJoke={8.0} ensembleBalance={0.85} />);

      expect(screen.getByText('Could be snappier')).toBeInTheDocument();
    });

    it('should show "Needs more jokes" for high LPJ', () => {
      render(<MetricsCards lpm={2.5} linesPerJoke={15.0} ensembleBalance={0.85} />);

      expect(screen.getByText('Needs more jokes')).toBeInTheDocument();
    });

    it('should handle boundary value at 6', () => {
      render(<MetricsCards lpm={2.5} linesPerJoke={6.0} ensembleBalance={0.85} />);

      expect(screen.getByText('Tight pacing')).toBeInTheDocument();
    });

    it('should handle boundary value at 10', () => {
      render(<MetricsCards lpm={2.5} linesPerJoke={10.0} ensembleBalance={0.85} />);

      expect(screen.getByText('Could be snappier')).toBeInTheDocument();
    });

    it('should handle LPJ just above 10', () => {
      render(<MetricsCards lpm={2.5} linesPerJoke={10.1} ensembleBalance={0.85} />);

      expect(screen.getByText('Needs more jokes')).toBeInTheDocument();
    });
  });

  describe('Ensemble Balance Status', () => {
    it('should show "Well balanced" for high balance', () => {
      render(<MetricsCards lpm={2.5} linesPerJoke={5.5} ensembleBalance={0.9} />);

      expect(screen.getByText('Well balanced')).toBeInTheDocument();
    });

    it('should show "Slightly uneven" for medium balance', () => {
      render(<MetricsCards lpm={2.5} linesPerJoke={5.5} ensembleBalance={0.7} />);

      expect(screen.getByText('Slightly uneven')).toBeInTheDocument();
    });

    it('should show "Needs balance" for low balance', () => {
      render(<MetricsCards lpm={2.5} linesPerJoke={5.5} ensembleBalance={0.4} />);

      expect(screen.getByText('Needs balance')).toBeInTheDocument();
    });

    it('should handle boundary value at 0.8', () => {
      render(<MetricsCards lpm={2.5} linesPerJoke={5.5} ensembleBalance={0.8} />);

      expect(screen.getByText('Well balanced')).toBeInTheDocument();
    });

    it('should handle boundary value at 0.6', () => {
      render(<MetricsCards lpm={2.5} linesPerJoke={5.5} ensembleBalance={0.6} />);

      expect(screen.getByText('Slightly uneven')).toBeInTheDocument();
    });

    it('should handle balance just below 0.6', () => {
      render(<MetricsCards lpm={2.5} linesPerJoke={5.5} ensembleBalance={0.5} />);

      expect(screen.getByText('Needs balance')).toBeInTheDocument();
    });
  });

  describe('Color Coding', () => {
    it('should apply green color for good LPM', () => {
      const { container } = render(<MetricsCards lpm={2.5} linesPerJoke={5.5} ensembleBalance={0.85} />);

      const lpmStatus = screen.getByText('↑ Above Average');
      expect(lpmStatus).toHaveClass('text-green-600');
    });

    it('should apply red color for bad LPM', () => {
      const { container } = render(<MetricsCards lpm={1.0} linesPerJoke={5.5} ensembleBalance={0.85} />);

      const lpmStatus = screen.getByText('↓ Below Average');
      expect(lpmStatus).toHaveClass('text-red-600');
    });

    it('should apply green color for tight pacing', () => {
      const { container } = render(<MetricsCards lpm={2.5} linesPerJoke={5.0} ensembleBalance={0.85} />);

      const lpjStatus = screen.getByText('Tight pacing');
      expect(lpjStatus).toHaveClass('text-green-600');
    });

    it('should apply amber color for medium pacing', () => {
      const { container } = render(<MetricsCards lpm={2.5} linesPerJoke={8.0} ensembleBalance={0.85} />);

      const lpjStatus = screen.getByText('Could be snappier');
      expect(lpjStatus).toHaveClass('text-amber-600');
    });

    it('should apply green color for well balanced', () => {
      const { container } = render(<MetricsCards lpm={2.5} linesPerJoke={5.5} ensembleBalance={0.9} />);

      const balanceStatus = screen.getByText('Well balanced');
      expect(balanceStatus).toHaveClass('text-green-600');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero values', () => {
      render(<MetricsCards lpm={0} linesPerJoke={0} ensembleBalance={0} />);

      expect(screen.getAllByText('0.0')).toHaveLength(2); // LPM and LPJ both 0.0
      expect(screen.getByText('0%')).toBeInTheDocument(); // Balance
    });

    it('should handle very high values', () => {
      render(<MetricsCards lpm={10.5} linesPerJoke={100.7} ensembleBalance={1.0} />);

      expect(screen.getByText('10.5')).toBeInTheDocument();
      expect(screen.getByText('100.7')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should handle decimal precision for LPM', () => {
      render(<MetricsCards lpm={2.567} linesPerJoke={5.5} ensembleBalance={0.85} />);

      // Should be rounded to 1 decimal place
      expect(screen.getByText('2.6')).toBeInTheDocument();
    });

    it('should handle decimal precision for LPJ', () => {
      render(<MetricsCards lpm={2.5} linesPerJoke={5.678} ensembleBalance={0.85} />);

      // Should be rounded to 1 decimal place
      expect(screen.getByText('5.7')).toBeInTheDocument();
    });
  });

  describe('Layout', () => {
    it('should use grid layout', () => {
      const { container } = render(<MetricsCards lpm={2.5} linesPerJoke={5.5} ensembleBalance={0.85} />);

      const grid = container.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2.md\\:grid-cols-3');
      expect(grid).toBeInTheDocument();
    });

    it('should render three card containers', () => {
      const { container } = render(<MetricsCards lpm={2.5} linesPerJoke={5.5} ensembleBalance={0.85} />);

      const cards = container.querySelectorAll('.bg-white.border.border-gray-200.rounded-xl');
      expect(cards).toHaveLength(3);
    });
  });
});
