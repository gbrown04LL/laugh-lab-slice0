import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { PunchUpWorkshop, PunchUpMoment } from './PunchUpWorkshop';

describe('PunchUpWorkshop', () => {
  const mockMoments: PunchUpMoment[] = [
    {
      moment_id: 'moment-1',
      moment_context: 'Scene where Alice tries to explain the internet to her grandmother',
      options: [
        {
          option_id: 'opt-1',
          device: 'Callback',
          text: 'Remember when you said email was "electronic letters"? Well, the cloud is like... electronic weather.',
        },
        {
          option_id: 'opt-2',
          device: 'Exaggeration',
          text: 'Grandma, you\'re asking me to explain the internet, but you still call the TV remote "the clicker"!',
        },
      ],
    },
    {
      moment_id: 'moment-2',
      moment_context: 'Bob realizes he locked himself out',
      options: [
        {
          option_id: 'opt-3',
          device: 'Wordplay',
          text: "I'm not locked out, I'm just... extremely committed to outdoor living.",
        },
      ],
    },
  ];

  let mockClipboard: { writeText: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.useFakeTimers();
    mockClipboard = {
      writeText: vi.fn().mockResolvedValue(undefined),
    };
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should not render when moments array is empty', () => {
      const { container } = render(<PunchUpWorkshop moments={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render when moments is undefined', () => {
      const { container } = render(<PunchUpWorkshop moments={undefined as any} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render section with title when moments provided', () => {
      render(<PunchUpWorkshop moments={mockMoments} />);
      expect(screen.getByText('✍️ Punch-Up Workshop')).toBeInTheDocument();
    });

    it('should render all moments', () => {
      render(<PunchUpWorkshop moments={mockMoments} />);
      expect(screen.getByText(/Scene where Alice tries to explain/)).toBeInTheDocument();
      expect(screen.getByText(/Bob realizes he locked himself out/)).toBeInTheDocument();
    });

    it('should render scene context label', () => {
      render(<PunchUpWorkshop moments={mockMoments} />);
      const labels = screen.getAllByText('Scene Context');
      expect(labels.length).toBeGreaterThan(0);
    });
  });

  describe('Options Rendering', () => {
    it('should render all options for each moment', () => {
      render(<PunchUpWorkshop moments={mockMoments} />);

      // First moment has 2 options
      expect(screen.getByText(/Remember when you said email/)).toBeInTheDocument();
      expect(screen.getByText(/Grandma, you're asking me to explain/)).toBeInTheDocument();

      // Second moment has 1 option
      expect(screen.getByText(/I'm not locked out/)).toBeInTheDocument();
    });

    it('should display device labels', () => {
      render(<PunchUpWorkshop moments={mockMoments} />);
      expect(screen.getByText('Callback')).toBeInTheDocument();
      expect(screen.getByText('Exaggeration')).toBeInTheDocument();
      expect(screen.getByText('Wordplay')).toBeInTheDocument();
    });

    it('should render copy button for each option', () => {
      render(<PunchUpWorkshop moments={mockMoments} />);
      const copyButtons = screen.getAllByText('Copy to clipboard');
      expect(copyButtons).toHaveLength(3); // 2 options in first moment + 1 in second
    });
  });

  describe('Copy to Clipboard', () => {
    it('should copy option text to clipboard when button clicked', async () => {
      vi.useRealTimers(); // Use real timers for async clipboard
      render(<PunchUpWorkshop moments={mockMoments} />);

      const copyButtons = screen.getAllByText('Copy to clipboard');
      fireEvent.click(copyButtons[0]);

      // Wait for async clipboard operation to complete
      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith(
          'Remember when you said email was "electronic letters"? Well, the cloud is like... electronic weather.'
        );
      });

      vi.useFakeTimers(); // Restore fake timers for next test
    });

    it('should show "Copied" feedback after successful copy', async () => {
      vi.useRealTimers();
      render(<PunchUpWorkshop moments={mockMoments} />);

      const copyButtons = screen.getAllByText('Copy to clipboard');
      fireEvent.click(copyButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('✓ Copied')).toBeInTheDocument();
      });

      vi.useFakeTimers();
    });

    it('should reset "Copied" feedback after 1.5 seconds', async () => {
      vi.useRealTimers();
      render(<PunchUpWorkshop moments={mockMoments} />);

      const copyButtons = screen.getAllByText('Copy to clipboard');
      fireEvent.click(copyButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('✓ Copied')).toBeInTheDocument();
      });

      // Wait for timeout to clear (1.5 seconds + buffer)
      await new Promise(resolve => setTimeout(resolve, 1600));

      expect(screen.queryByText('✓ Copied')).not.toBeInTheDocument();
      expect(screen.getAllByText('Copy to clipboard')).toHaveLength(3);

      vi.useFakeTimers();
    });

    it('should only show "Copied" for the clicked option', async () => {
      vi.useRealTimers();
      render(<PunchUpWorkshop moments={mockMoments} />);

      const copyButtons = screen.getAllByText('Copy to clipboard');

      // Click first button
      fireEvent.click(copyButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('✓ Copied')).toBeInTheDocument();
      });

      // Other buttons should still show "Copy to clipboard"
      expect(screen.getAllByText('Copy to clipboard')).toHaveLength(2);

      vi.useFakeTimers();
    });

    it('should handle multiple copy operations sequentially', async () => {
      vi.useRealTimers();
      render(<PunchUpWorkshop moments={mockMoments} />);

      const copyButtons = screen.getAllByText('Copy to clipboard');

      // Click first button
      fireEvent.click(copyButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('✓ Copied')).toBeInTheDocument();
      });

      // Click second button
      fireEvent.click(copyButtons[1]);

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledTimes(2);
      });

      vi.useFakeTimers();
    });

    it('should handle clipboard API errors gracefully', async () => {
      vi.useRealTimers();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockClipboard.writeText.mockRejectedValue(new Error('Clipboard access denied'));

      render(<PunchUpWorkshop moments={mockMoments} />);

      const copyButtons = screen.getAllByText('Copy to clipboard');
      fireEvent.click(copyButtons[0]);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to copy');
      });

      // Should not show "Copied" on error
      expect(screen.queryByText('✓ Copied')).not.toBeInTheDocument();

      consoleErrorSpy.mockRestore();
      vi.useFakeTimers();
    });
  });

  describe('Layout and Styling', () => {
    it('should render moments in a grid', () => {
      const { container } = render(<PunchUpWorkshop moments={mockMoments} />);
      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });

    it('should render options in a responsive grid', () => {
      const { container } = render(<PunchUpWorkshop moments={mockMoments} />);
      const optionGrids = container.querySelectorAll('.md\\:grid-cols-2');
      expect(optionGrids.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single moment with single option', () => {
      const singleMoment: PunchUpMoment[] = [
        {
          moment_id: 'single',
          moment_context: 'A brief moment',
          options: [
            {
              option_id: 'single-opt',
              device: 'Irony',
              text: 'A single joke',
            },
          ],
        },
      ];

      render(<PunchUpWorkshop moments={singleMoment} />);
      expect(screen.getByText('A brief moment')).toBeInTheDocument();
      expect(screen.getByText('A single joke')).toBeInTheDocument();
    });

    it('should handle moment with empty options array', () => {
      const momentNoOptions: PunchUpMoment[] = [
        {
          moment_id: 'no-opts',
          moment_context: 'Context without options',
          options: [],
        },
      ];

      render(<PunchUpWorkshop moments={momentNoOptions} />);
      expect(screen.getByText('Context without options')).toBeInTheDocument();
    });

    it('should handle moment with undefined options', () => {
      const momentUndefinedOptions: PunchUpMoment[] = [
        {
          moment_id: 'undef-opts',
          moment_context: 'Context with undefined options',
          options: undefined as any,
        },
      ];

      render(<PunchUpWorkshop moments={momentUndefinedOptions} />);
      expect(screen.getByText('Context with undefined options')).toBeInTheDocument();
    });

    it('should handle very long option text', () => {
      const longTextMoment: PunchUpMoment[] = [
        {
          moment_id: 'long',
          moment_context: 'Long text test',
          options: [
            {
              option_id: 'long-opt',
              device: 'Rambling',
              text: 'A'.repeat(500),
            },
          ],
        },
      ];

      render(<PunchUpWorkshop moments={longTextMoment} />);
      expect(screen.getByText('A'.repeat(500))).toBeInTheDocument();
    });

    it('should handle special characters in text', () => {
      const specialCharsMoment: PunchUpMoment[] = [
        {
          moment_id: 'special',
          moment_context: 'Test <script>alert("xss")</script>',
          options: [
            {
              option_id: 'special-opt',
              device: 'Meta',
              text: 'Quote: "Hello" & \'Goodbye\' <3',
            },
          ],
        },
      ];

      render(<PunchUpWorkshop moments={specialCharsMoment} />);
      expect(screen.getByText(/Test <script>alert/)).toBeInTheDocument();
      expect(screen.getByText(/Quote: "Hello"/)).toBeInTheDocument();
    });
  });

  describe('Multiple Copy Interactions', () => {
    it('should update copied state when different option is clicked', async () => {
      vi.useRealTimers();
      render(<PunchUpWorkshop moments={mockMoments} />);

      const copyButtons = screen.getAllByText('Copy to clipboard');

      // Click first button
      fireEvent.click(copyButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('✓ Copied')).toBeInTheDocument();
      });

      // Click second button (should replace the first)
      const secondButton = screen.getAllByText('Copy to clipboard')[0]; // After first changed to "Copied"
      fireEvent.click(secondButton);

      await waitFor(() => {
        // Should still have exactly one "✓ Copied" button
        expect(screen.getByText('✓ Copied')).toBeInTheDocument();
      });

      vi.useFakeTimers();
    });

    it('should not interfere with timeout when clicking different option', async () => {
      vi.useRealTimers();
      render(<PunchUpWorkshop moments={mockMoments} />);

      const copyButtons = screen.getAllByText('Copy to clipboard');

      // Click first button
      fireEvent.click(copyButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('✓ Copied')).toBeInTheDocument();
      });

      // Wait 1 second (not enough to trigger timeout)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Click second button
      const secondButton = screen.getAllByText('Copy to clipboard')[0];
      fireEvent.click(secondButton);

      // Wait for remaining time (1.5 seconds + buffer)
      await new Promise(resolve => setTimeout(resolve, 1600));

      // All buttons should be back to "Copy to clipboard"
      expect(screen.getAllByText('Copy to clipboard')).toHaveLength(3);

      vi.useFakeTimers();
    });
  });
});
