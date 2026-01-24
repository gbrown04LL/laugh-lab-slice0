import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OpportunitiesSection, type OpportunityItem } from './OpportunitiesSection';

const mockOpportunity: OpportunityItem = {
  issue_id: 'opp-1',
  why_it_matters: 'This will improve pacing',
  concrete_fix: {
    title: 'Add more jokes in Act 2',
    steps: ['Identify key moments', 'Write 3-5 new jokes', 'Test with audience'],
    expected_result: 'Better pacing and audience engagement',
  },
};

const mockOpportunities: OpportunityItem[] = [
  mockOpportunity,
  {
    issue_id: 'opp-2',
    why_it_matters: 'Character balance is off',
    concrete_fix: {
      title: 'Give Bob more screen time',
      steps: ['Add a subplot for Bob', 'Include Bob in key scenes'],
      expected_result: 'More balanced ensemble',
    },
  },
];

describe('OpportunitiesSection', () => {
  describe('Rendering', () => {
    it('should render section title', () => {
      render(<OpportunitiesSection opportunities={mockOpportunities} />);

      expect(screen.getByText('🔧 Opportunities to Level Up')).toBeInTheDocument();
    });

    it('should render all opportunities', () => {
      render(<OpportunitiesSection opportunities={mockOpportunities} />);

      expect(screen.getByText('Add more jokes in Act 2')).toBeInTheDocument();
      expect(screen.getByText('Give Bob more screen time')).toBeInTheDocument();
    });

    it('should render opportunity descriptions', () => {
      render(<OpportunitiesSection opportunities={mockOpportunities} />);

      expect(screen.getByText('This will improve pacing')).toBeInTheDocument();
      expect(screen.getByText('Character balance is off')).toBeInTheDocument();
    });

    it('should show "Expand" button initially', () => {
      render(<OpportunitiesSection opportunities={mockOpportunities} />);

      const expandButtons = screen.getAllByText('Expand');
      expect(expandButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Empty States', () => {
    it('should not render when opportunities array is empty', () => {
      const { container } = render(<OpportunitiesSection opportunities={[]} />);

      expect(container.firstChild).toBeNull();
    });

    it('should not render when opportunities is null', () => {
      const { container } = render(<OpportunitiesSection opportunities={null as any} />);

      expect(container.firstChild).toBeNull();
    });

    it('should not render when opportunities is undefined', () => {
      const { container } = render(<OpportunitiesSection opportunities={undefined as any} />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Expand/Collapse Functionality', () => {
    it('should not show steps initially', () => {
      render(<OpportunitiesSection opportunities={mockOpportunities} />);

      expect(screen.queryByText('Steps to Fix')).not.toBeInTheDocument();
      expect(screen.queryByText('Identify key moments')).not.toBeInTheDocument();
    });

    it('should expand when clicked', () => {
      render(<OpportunitiesSection opportunities={mockOpportunities} />);

      const expandButton = screen.getAllByText('Expand')[0];
      fireEvent.click(expandButton);

      expect(screen.getByText('Steps to Fix')).toBeInTheDocument();
      expect(screen.getByText('Identify key moments')).toBeInTheDocument();
    });

    it('should show "Collapse" after expanding', () => {
      render(<OpportunitiesSection opportunities={mockOpportunities} />);

      const expandButton = screen.getAllByText('Expand')[0];
      fireEvent.click(expandButton);

      expect(screen.getByText('Collapse')).toBeInTheDocument();
      expect(screen.queryByText('Expand')).toBeInTheDocument(); // Other items still show Expand
    });

    it('should collapse when clicked again', () => {
      render(<OpportunitiesSection opportunities={mockOpportunities} />);

      const buttons = screen.getAllByRole('button');
      const firstButton = buttons[0];

      // Expand
      fireEvent.click(firstButton);
      expect(screen.getByText('Steps to Fix')).toBeInTheDocument();

      // Collapse
      fireEvent.click(firstButton);
      expect(screen.queryByText('Steps to Fix')).not.toBeInTheDocument();
    });

    it('should expand multiple opportunities independently', () => {
      render(<OpportunitiesSection opportunities={mockOpportunities} />);

      const buttons = screen.getAllByRole('button');

      // Expand first
      fireEvent.click(buttons[0]);
      expect(screen.getByText('Identify key moments')).toBeInTheDocument();

      // Expand second
      fireEvent.click(buttons[1]);
      expect(screen.getByText('Add a subplot for Bob')).toBeInTheDocument();

      // Both should be expanded
      expect(screen.getByText('Identify key moments')).toBeInTheDocument();
      expect(screen.getByText('Add a subplot for Bob')).toBeInTheDocument();
    });
  });

  describe('Steps Rendering', () => {
    it('should render all steps when expanded', () => {
      render(<OpportunitiesSection opportunities={mockOpportunities} />);

      const expandButton = screen.getAllByText('Expand')[0];
      fireEvent.click(expandButton);

      expect(screen.getByText('Identify key moments')).toBeInTheDocument();
      expect(screen.getByText('Write 3-5 new jokes')).toBeInTheDocument();
      expect(screen.getByText('Test with audience')).toBeInTheDocument();
    });

    it('should render steps as ordered list', () => {
      const { container } = render(<OpportunitiesSection opportunities={mockOpportunities} />);

      const expandButton = screen.getAllByText('Expand')[0];
      fireEvent.click(expandButton);

      const orderedList = container.querySelector('ol.list-decimal');
      expect(orderedList).toBeInTheDocument();
      expect(orderedList?.querySelectorAll('li')).toHaveLength(3);
    });

    it('should handle missing steps array', () => {
      const oppWithoutSteps: OpportunityItem = {
        ...mockOpportunity,
        concrete_fix: {
          ...mockOpportunity.concrete_fix,
          steps: undefined as any,
        },
      };

      render(<OpportunitiesSection opportunities={[oppWithoutSteps]} />);

      const expandButton = screen.getByText('Expand');
      fireEvent.click(expandButton);

      // Should still render the expanded section without crashing
      expect(screen.getByText('Steps to Fix')).toBeInTheDocument();
    });
  });

  describe('Expected Result Rendering', () => {
    it('should show expected result when expanded', () => {
      render(<OpportunitiesSection opportunities={mockOpportunities} />);

      const expandButton = screen.getAllByText('Expand')[0];
      fireEvent.click(expandButton);

      expect(screen.getByText('Expected Result')).toBeInTheDocument();
      expect(screen.getByText('Better pacing and audience engagement')).toBeInTheDocument();
    });

    it('should handle missing expected result', () => {
      const oppWithoutResult: OpportunityItem = {
        ...mockOpportunity,
        concrete_fix: {
          ...mockOpportunity.concrete_fix,
          expected_result: undefined as any,
        },
      };

      render(<OpportunitiesSection opportunities={[oppWithoutResult]} />);

      const expandButton = screen.getByText('Expand');
      fireEvent.click(expandButton);

      // Should render without the expected result section
      expect(screen.queryByText('Expected Result')).not.toBeInTheDocument();
    });

    it('should render expected result in styled container', () => {
      const { container } = render(<OpportunitiesSection opportunities={mockOpportunities} />);

      const expandButton = screen.getAllByText('Expand')[0];
      fireEvent.click(expandButton);

      const resultContainer = container.querySelector('.bg-gray-50.rounded-lg');
      expect(resultContainer).toBeInTheDocument();
    });
  });

  describe('Visual Styling', () => {
    it('should have amber indicator bars', () => {
      const { container } = render(<OpportunitiesSection opportunities={mockOpportunities} />);

      const indicators = container.querySelectorAll('.bg-amber-500');
      expect(indicators.length).toBeGreaterThan(0);
    });

    it('should render in card containers', () => {
      const { container } = render(<OpportunitiesSection opportunities={mockOpportunities} />);

      const cards = container.querySelectorAll('.bg-white.border.rounded-xl');
      expect(cards).toHaveLength(2);
    });

    it('should style expand/collapse button', () => {
      const { container } = render(<OpportunitiesSection opportunities={mockOpportunities} />);

      const buttons = container.querySelectorAll('.text-xs.text-gray-500.border');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Missing Data Handling', () => {
    it('should handle missing concrete_fix title', () => {
      const oppWithoutTitle: OpportunityItem = {
        ...mockOpportunity,
        concrete_fix: {
          ...mockOpportunity.concrete_fix,
          title: undefined as any,
        },
      };

      render(<OpportunitiesSection opportunities={[oppWithoutTitle]} />);

      expect(screen.getByText('Opportunity')).toBeInTheDocument();
    });

    it('should handle missing concrete_fix entirely', () => {
      const oppWithoutFix: OpportunityItem = {
        issue_id: 'opp-missing',
        why_it_matters: 'Test reason',
        concrete_fix: undefined as any,
      };

      render(<OpportunitiesSection opportunities={[oppWithoutFix]} />);

      expect(screen.getByText('Opportunity')).toBeInTheDocument();
      expect(screen.getByText('Test reason')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should use semantic HTML section', () => {
      const { container } = render(<OpportunitiesSection opportunities={mockOpportunities} />);

      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
    });

    it('should use heading for title', () => {
      render(<OpportunitiesSection opportunities={mockOpportunities} />);

      const heading = screen.getByRole('heading', { name: /Opportunities to Level Up/ });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H2');
    });

    it('should use button elements for expand/collapse', () => {
      render(<OpportunitiesSection opportunities={mockOpportunities} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(2);
      buttons.forEach(button => {
        expect(button.tagName).toBe('BUTTON');
      });
    });

    it('should make buttons full width and clickable', () => {
      const { container } = render(<OpportunitiesSection opportunities={mockOpportunities} />);

      const buttons = container.querySelectorAll('button.w-full');
      expect(buttons.length).toBe(2);
    });
  });

  describe('State Management', () => {
    it('should maintain independent state for each opportunity', () => {
      render(<OpportunitiesSection opportunities={mockOpportunities} />);

      const buttons = screen.getAllByRole('button');

      // Expand first
      fireEvent.click(buttons[0]);

      // Check first is expanded
      expect(screen.getByText('Identify key moments')).toBeInTheDocument();

      // Check second is still collapsed
      expect(screen.queryByText('Add a subplot for Bob')).not.toBeInTheDocument();

      // Collapse first
      fireEvent.click(buttons[0]);

      // Expand second
      fireEvent.click(buttons[1]);

      // Check second is now expanded
      expect(screen.getByText('Add a subplot for Bob')).toBeInTheDocument();

      // Check first is collapsed
      expect(screen.queryByText('Identify key moments')).not.toBeInTheDocument();
    });
  });
});
