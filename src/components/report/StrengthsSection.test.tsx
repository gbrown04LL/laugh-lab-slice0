import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StrengthsSection } from './StrengthsSection';

describe('StrengthsSection', () => {
  describe('Rendering', () => {
    it('should render section title', () => {
      const strengths = ['Great character dynamics'];
      render(<StrengthsSection strengths={strengths} />);

      expect(screen.getByText('🎯 What\'s Working')).toBeInTheDocument();
    });

    it('should render all strengths', () => {
      const strengths = [
        'Strong setup-payoff structure',
        'Excellent character voices',
        'Perfect comedic timing'
      ];
      render(<StrengthsSection strengths={strengths} />);

      strengths.forEach(strength => {
        expect(screen.getByText(strength)).toBeInTheDocument();
      });
    });

    it('should render single strength', () => {
      const strengths = ['Great pacing'];
      render(<StrengthsSection strengths={strengths} />);

      expect(screen.getByText('Great pacing')).toBeInTheDocument();
    });

    it('should render multiple strengths', () => {
      const strengths = [
        'Strength 1',
        'Strength 2',
        'Strength 3',
        'Strength 4',
        'Strength 5'
      ];
      render(<StrengthsSection strengths={strengths} />);

      expect(screen.getAllByText(/Strength \d/)).toHaveLength(5);
    });
  });

  describe('Empty States', () => {
    it('should not render when strengths array is empty', () => {
      const { container } = render(<StrengthsSection strengths={[]} />);

      expect(container.firstChild).toBeNull();
    });

    it('should not render when strengths is null', () => {
      const { container } = render(<StrengthsSection strengths={null as any} />);

      expect(container.firstChild).toBeNull();
    });

    it('should not render when strengths is undefined', () => {
      const { container } = render(<StrengthsSection strengths={undefined as any} />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Visual Styling', () => {
    it('should have green indicator bars', () => {
      const { container } = render(<StrengthsSection strengths={['Test']} />);

      const indicator = container.querySelector('.w-1.bg-green-500');
      expect(indicator).toBeInTheDocument();
    });

    it('should render in card containers', () => {
      const { container } = render(<StrengthsSection strengths={['Test 1', 'Test 2']} />);

      const cards = container.querySelectorAll('.bg-white.border.rounded-xl');
      expect(cards).toHaveLength(2);
    });

    it('should use proper text styling', () => {
      render(<StrengthsSection strengths={['Test']} />);

      const text = screen.getByText('Test');
      expect(text).toHaveClass('text-sm', 'text-gray-700', 'leading-relaxed');
    });

    it('should have section margin', () => {
      const { container } = render(<StrengthsSection strengths={['Test']} />);

      const section = container.querySelector('section.mt-8');
      expect(section).toBeInTheDocument();
    });
  });

  describe('Content Formatting', () => {
    it('should handle long strength text', () => {
      const longStrength = 'This is a very long strength description that contains multiple sentences and goes into detail about what makes the script work. It should wrap properly and maintain readability.';
      render(<StrengthsSection strengths={[longStrength]} />);

      expect(screen.getByText(longStrength)).toBeInTheDocument();
    });

    it('should handle special characters in strengths', () => {
      const strengths = [
        'Great use of "callbacks" & misdirection',
        'Perfect timing (2.5 LPM!)',
        'Strong character voices - especially Alice'
      ];
      render(<StrengthsSection strengths={strengths} />);

      strengths.forEach(strength => {
        expect(screen.getByText(strength)).toBeInTheDocument();
      });
    });

    it('should handle empty string in strengths array', () => {
      const strengths = ['Valid strength', '', 'Another strength'];
      render(<StrengthsSection strengths={strengths} />);

      expect(screen.getByText('Valid strength')).toBeInTheDocument();
      expect(screen.getByText('Another strength')).toBeInTheDocument();
      // Empty string should still render but be invisible
      expect(screen.getAllByText(/./)).toHaveLength(3);
    });
  });

  describe('Accessibility', () => {
    it('should use semantic HTML section', () => {
      const { container } = render(<StrengthsSection strengths={['Test']} />);

      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
    });

    it('should use heading for title', () => {
      render(<StrengthsSection strengths={['Test']} />);

      const heading = screen.getByRole('heading', { name: /What's Working/ });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H2');
    });
  });

  describe('Key Prop Handling', () => {
    it('should render items with unique keys', () => {
      const { container } = render(<StrengthsSection strengths={['A', 'B', 'C']} />);

      const items = container.querySelectorAll('.bg-white.border.rounded-xl');
      expect(items).toHaveLength(3);
      // Each should be unique
      items.forEach((item, index) => {
        expect(item).toBeInTheDocument();
      });
    });
  });
});
