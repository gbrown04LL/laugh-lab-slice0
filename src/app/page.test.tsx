import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import userEvent from '@testing-library/user-event';
import Home from './page';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial Render', () => {
    it('should render the page title', () => {
      render(<Home />);

      expect(screen.getByText('Laugh Lab')).toBeInTheDocument();
    });

    it('should show script input form initially', () => {
      render(<Home />);

      expect(screen.getByText('Analyze Your Script')).toBeInTheDocument();
    });

    it('should render the textarea for script input', () => {
      render(<Home />);

      expect(
        screen.getByPlaceholderText(/INT\. JERRY'S APARTMENT/)
      ).toBeInTheDocument();
    });

    it('should disable analyze button when textarea is empty', () => {
      render(<Home />);

      const analyzeButton = screen.getByRole('button', { name: /Analyze Script/i });
      expect(analyzeButton).toBeDisabled();
    });
  });

  describe('Script Analysis', () => {
    it('should enable analyze button when text is entered', async () => {
      const user = userEvent.setup();
      render(<Home />);

      const textarea = screen.getByPlaceholderText(/INT\. JERRY'S APARTMENT/);
      await user.type(textarea, 'INT. ROOM - DAY');

      const analyzeButton = screen.getByRole('button', { name: /Analyze Script/i });
      expect(analyzeButton).not.toBeDisabled();
    });

    it('should chain all API calls when analyze is clicked', async () => {
      const user = userEvent.setup();
      const mockReport = {
        id: 'run-789',
        output: {
          prompt_a: { metrics: { overall_score: 85 } },
          prompt_b: {
            sections: {
              strengths_to_preserve: ['Great pacing'],
              whats_getting_in_the_way: [],
            },
          },
        },
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'script-123' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'job-456' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ run_id: 'run-789' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockReport,
        });

      render(<Home />);

      const textarea = screen.getByPlaceholderText(/INT\. JERRY'S APARTMENT/);
      await user.type(textarea, 'INT. ROOM - DAY\nCharacter speaks.');

      const analyzeButton = screen.getByRole('button', { name: /Analyze Script/i });
      await user.click(analyzeButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(4);
      });

      // Verify all API calls were made in order
      expect(mockFetch).toHaveBeenNthCalledWith(1, '/api/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'INT. ROOM - DAY\nCharacter speaks.' }),
      });

      expect(mockFetch).toHaveBeenNthCalledWith(2, '/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script_id: 'script-123' }),
      });

      expect(mockFetch).toHaveBeenNthCalledWith(3, '/api/jobs/job-456/run', {
        method: 'POST',
      });

      expect(mockFetch).toHaveBeenNthCalledWith(4, '/api/reports/run-789');
    });

    it('should display report after successful analysis', async () => {
      const user = userEvent.setup();
      const mockReport = {
        id: 'run-789',
        output: {
          prompt_a: { metrics: { overall_score: 85 } },
          prompt_b: {
            sections: {
              strengths_to_preserve: ['Great pacing'],
              whats_getting_in_the_way: [],
            },
          },
        },
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'script-123' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'job-456' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ run_id: 'run-789' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockReport,
        });

      render(<Home />);

      const textarea = screen.getByPlaceholderText(/INT\. JERRY'S APARTMENT/);
      await user.type(textarea, 'INT. ROOM - DAY');
      await user.click(screen.getByRole('button', { name: /Analyze Script/i }));

      await waitFor(() => {
        expect(screen.getByText('85')).toBeInTheDocument();
      });
    });

    it('should show loading state while analyzing', async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: any) => void;
      mockFetch.mockReturnValueOnce(
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
      );

      render(<Home />);

      const textarea = screen.getByPlaceholderText(/INT\. JERRY'S APARTMENT/);
      await user.type(textarea, 'INT. ROOM - DAY');
      await user.click(screen.getByRole('button', { name: /Analyze Script/i }));

      expect(screen.getByText('Analyzing...')).toBeInTheDocument();

      // Resolve the promise
      resolvePromise!({
        ok: true,
        json: async () => ({ id: 'script-123' }),
      });
    });

    it('should show error on script submission failure', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          errors: [{ message: 'Script too short' }],
        }),
      });

      render(<Home />);

      const textarea = screen.getByPlaceholderText(/INT\. JERRY'S APARTMENT/);
      await user.type(textarea, 'INT. ROOM - DAY');
      await user.click(screen.getByRole('button', { name: /Analyze Script/i }));

      await waitFor(() => {
        expect(screen.getByText(/Script too short/)).toBeInTheDocument();
      });
    });

    it('should show error on job creation failure', async () => {
      const user = userEvent.setup();
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'script-123' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            errors: [{ message: 'Script not found' }],
          }),
        });

      render(<Home />);

      const textarea = screen.getByPlaceholderText(/INT\. JERRY'S APARTMENT/);
      await user.type(textarea, 'INT. ROOM - DAY');
      await user.click(screen.getByRole('button', { name: /Analyze Script/i }));

      await waitFor(() => {
        expect(screen.getByText(/Script not found/)).toBeInTheDocument();
      });
    });

    it('should show error on analysis failure', async () => {
      const user = userEvent.setup();
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'script-123' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'job-456' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            errors: [{ message: 'Analysis failed' }],
          }),
        });

      render(<Home />);

      const textarea = screen.getByPlaceholderText(/INT\. JERRY'S APARTMENT/);
      await user.type(textarea, 'INT. ROOM - DAY');
      await user.click(screen.getByRole('button', { name: /Analyze Script/i }));

      await waitFor(() => {
        expect(screen.getByText(/Analysis failed/)).toBeInTheDocument();
      });
    });

    it('should show error on report fetch failure', async () => {
      const user = userEvent.setup();
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'script-123' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'job-456' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ run_id: 'run-789' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            errors: [{ message: 'Report not found' }],
          }),
        });

      render(<Home />);

      const textarea = screen.getByPlaceholderText(/INT\. JERRY'S APARTMENT/);
      await user.type(textarea, 'INT. ROOM - DAY');
      await user.click(screen.getByRole('button', { name: /Analyze Script/i }));

      await waitFor(() => {
        expect(screen.getByText(/Report not found/)).toBeInTheDocument();
      });
    });
  });

  describe('Reset Functionality', () => {
    it('should reset to input form when Start Over is clicked', async () => {
      const user = userEvent.setup();
      const mockReport = {
        id: 'run-789',
        output: {
          prompt_a: { metrics: { overall_score: 85 } },
          prompt_b: {
            sections: {
              strengths_to_preserve: [],
              whats_getting_in_the_way: [],
            },
          },
        },
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'script-123' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'job-456' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ run_id: 'run-789' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockReport,
        });

      render(<Home />);

      const textarea = screen.getByPlaceholderText(/INT\. JERRY'S APARTMENT/);
      await user.type(textarea, 'INT. ROOM - DAY');
      await user.click(screen.getByRole('button', { name: /Analyze Script/i }));

      await waitFor(() => screen.getByRole('button', { name: /Start Over/i }));
      await user.click(screen.getByRole('button', { name: /Start Over/i }));

      // Should be back at input form
      expect(screen.getByText('Analyze Your Script')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/INT\. JERRY'S APARTMENT/)).toHaveValue('');
    });

    it('should show Start Over button after report is displayed', async () => {
      const user = userEvent.setup();
      const mockReport = {
        id: 'run-789',
        output: {
          prompt_a: { metrics: { overall_score: 85 } },
          prompt_b: {
            sections: {
              strengths_to_preserve: [],
              whats_getting_in_the_way: [],
            },
          },
        },
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'script-123' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'job-456' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ run_id: 'run-789' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockReport,
        });

      render(<Home />);

      const textarea = screen.getByPlaceholderText(/INT\. JERRY'S APARTMENT/);
      await user.type(textarea, 'INT. ROOM - DAY');
      await user.click(screen.getByRole('button', { name: /Analyze Script/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Start Over/i })).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message in error box', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          errors: [{ message: 'Something went wrong' }],
        }),
      });

      render(<Home />);

      const textarea = screen.getByPlaceholderText(/INT\. JERRY'S APARTMENT/);
      await user.type(textarea, 'INT. ROOM - DAY');
      await user.click(screen.getByRole('button', { name: /Analyze Script/i }));

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<Home />);

      const textarea = screen.getByPlaceholderText(/INT\. JERRY'S APARTMENT/);
      await user.type(textarea, 'INT. ROOM - DAY');
      await user.click(screen.getByRole('button', { name: /Analyze Script/i }));

      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });
    });

    it('should use fallback error message when no message in response', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}), // No errors array
      });

      render(<Home />);

      const textarea = screen.getByPlaceholderText(/INT\. JERRY'S APARTMENT/);
      await user.type(textarea, 'INT. ROOM - DAY');
      await user.click(screen.getByRole('button', { name: /Analyze Script/i }));

      await waitFor(() => {
        expect(screen.getByText(/Failed to submit script/)).toBeInTheDocument();
      });
    });
  });
});
