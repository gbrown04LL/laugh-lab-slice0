import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import userEvent from '@testing-library/user-event';
import Home from './page';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window.alert
const mockAlert = vi.fn();
global.alert = mockAlert;

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

    it('should show step 1 content initially', () => {
      render(<Home />);

      expect(screen.getByText('Submit Your Script')).toBeInTheDocument();
    });

    it('should render the textarea for script input', () => {
      render(<Home />);

      expect(
        screen.getByPlaceholderText(/INT\. JERRY'S APARTMENT/)
      ).toBeInTheDocument();
    });

    it('should render the health check button', () => {
      render(<Home />);

      expect(screen.getByRole('button', { name: /Test Health Check/i })).toBeInTheDocument();
    });

    it('should disable submit button when textarea is empty', () => {
      render(<Home />);

      const submitButton = screen.getByRole('button', { name: /Submit Script/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Step 1: Submit Script', () => {
    it('should enable submit button when text is entered', async () => {
      const user = userEvent.setup();
      render(<Home />);

      const textarea = screen.getByPlaceholderText(/INT\. JERRY'S APARTMENT/);
      await user.type(textarea, 'INT. ROOM - DAY');

      const submitButton = screen.getByRole('button', { name: /Submit Script/i });
      expect(submitButton).not.toBeDisabled();
    });

    it('should call POST /api/scripts on submit', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'script-123' }),
      });

      render(<Home />);

      const textarea = screen.getByPlaceholderText(/INT\. JERRY'S APARTMENT/);
      await user.type(textarea, 'INT. ROOM - DAY\nCharacter speaks.');

      const submitButton = screen.getByRole('button', { name: /Submit Script/i });
      await user.click(submitButton);

      expect(mockFetch).toHaveBeenCalledWith('/api/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'INT. ROOM - DAY\nCharacter speaks.' }),
      });
    });

    it('should progress to step 2 after successful script submission', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'script-123' }),
      });

      render(<Home />);

      const textarea = screen.getByPlaceholderText(/INT\. JERRY'S APARTMENT/);
      await user.type(textarea, 'INT. ROOM - DAY');
      await user.click(screen.getByRole('button', { name: /Submit Script/i }));

      await waitFor(() => {
        expect(screen.getByText('Create Analysis Job')).toBeInTheDocument();
      });
    });

    it('should display script ID after submission', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'script-abc-123' }),
      });

      render(<Home />);

      const textarea = screen.getByPlaceholderText(/INT\. JERRY'S APARTMENT/);
      await user.type(textarea, 'INT. ROOM - DAY');
      await user.click(screen.getByRole('button', { name: /Submit Script/i }));

      await waitFor(() => {
        expect(screen.getByText('script-abc-123')).toBeInTheDocument();
      });
    });

    it('should show error message on API failure', async () => {
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
      await user.click(screen.getByRole('button', { name: /Submit Script/i }));

      await waitFor(() => {
        expect(screen.getByText(/Script too short/)).toBeInTheDocument();
      });
    });

    it('should show loading state while submitting', async () => {
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
      await user.click(screen.getByRole('button', { name: /Submit Script/i }));

      expect(screen.getByText('Submitting...')).toBeInTheDocument();

      // Resolve the promise
      resolvePromise!({
        ok: true,
        json: async () => ({ id: 'script-123' }),
      });

      await waitFor(() => {
        expect(screen.queryByText('Submitting...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Step 2: Create Job', () => {
    beforeEach(async () => {
      // Setup: Get to step 2
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'script-123' }),
      });

      const user = userEvent.setup();
      render(<Home />);

      const textarea = screen.getByPlaceholderText(/INT\. JERRY'S APARTMENT/);
      await user.type(textarea, 'INT. ROOM - DAY');
      await user.click(screen.getByRole('button', { name: /Submit Script/i }));

      await waitFor(() => {
        expect(screen.getByText('Create Analysis Job')).toBeInTheDocument();
      });
    });

    it('should call POST /api/jobs with script_id', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'job-456' }),
      });

      await user.click(screen.getByRole('button', { name: /^Create Job$/i }));

      expect(mockFetch).toHaveBeenLastCalledWith('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script_id: 'script-123' }),
      });
    });

    it('should progress to step 3 after job creation', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'job-456' }),
      });

      await user.click(screen.getByRole('button', { name: /^Create Job$/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Run Analysis/i })).toBeInTheDocument();
      });
    });

    it('should show error on job creation failure', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          errors: [{ message: 'Script not found' }],
        }),
      });

      await user.click(screen.getByRole('button', { name: /^Create Job$/i }));

      await waitFor(() => {
        expect(screen.getByText(/Script not found/)).toBeInTheDocument();
      });
    });
  });

  describe('Step 3: Run Analysis', () => {
    beforeEach(async () => {
      // Setup: Get to step 3
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'script-123' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'job-456' }),
        });

      const user = userEvent.setup();
      render(<Home />);

      const textarea = screen.getByPlaceholderText(/INT\. JERRY'S APARTMENT/);
      await user.type(textarea, 'INT. ROOM - DAY');
      await user.click(screen.getByRole('button', { name: /Submit Script/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^Create Job$/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /^Create Job$/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Run Analysis/i })).toBeInTheDocument();
      });
    });

    it('should call POST /api/jobs/[job_id]/run', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ run_id: 'run-789' }),
      });

      await user.click(screen.getByRole('button', { name: /^Run Analysis$/i }));

      expect(mockFetch).toHaveBeenLastCalledWith('/api/jobs/job-456/run', {
        method: 'POST',
      });
    });

    it('should progress to step 4 after analysis runs', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ run_id: 'run-789' }),
      });

      await user.click(screen.getByRole('button', { name: /^Run Analysis$/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /View Report/i })).toBeInTheDocument();
      });
    });

    it('should show error on analysis failure', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          errors: [{ message: 'Job is already running' }],
        }),
      });

      await user.click(screen.getByRole('button', { name: /^Run Analysis$/i }));

      await waitFor(() => {
        expect(screen.getByText(/Job is already running/)).toBeInTheDocument();
      });
    });
  });

  describe('Step 4: View Report', () => {
    const mockReport = {
      id: 'run-789',
      output: {
        prompt_a: {
          metrics: {
            overall_score: 85,
            lpm_intermediate_plus: 3.5,
            lines_per_joke: 4,
          },
        },
        prompt_b: {
          sections: {
            strengths_to_preserve: ['Great pacing', 'Strong character voice'],
            whats_getting_in_the_way: [
              {
                issue_id: 'i1',
                why_it_matters: 'Weak opening',
                concrete_fix: { title: 'Add stronger hook' },
              },
            ],
          },
        },
      },
    };

    beforeEach(async () => {
      // Setup: Get to step 4
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
        });

      const user = userEvent.setup();
      render(<Home />);

      const textarea = screen.getByPlaceholderText(/INT\. JERRY'S APARTMENT/);
      await user.type(textarea, 'INT. ROOM - DAY');
      await user.click(screen.getByRole('button', { name: /Submit Script/i }));

      await waitFor(() => screen.getByRole('button', { name: /^Create Job$/i }));
      await user.click(screen.getByRole('button', { name: /^Create Job$/i }));

      await waitFor(() => screen.getByRole('button', { name: /^Run Analysis$/i }));
      await user.click(screen.getByRole('button', { name: /^Run Analysis$/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /View Report/i })).toBeInTheDocument();
      });
    });

    it('should call GET /api/reports/[run_id]', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockReport,
      });

      await user.click(screen.getByRole('button', { name: /Get Report/i }));

      expect(mockFetch).toHaveBeenLastCalledWith('/api/reports/run-789');
    });

    it('should display report data after fetching', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockReport,
      });

      await user.click(screen.getByRole('button', { name: /Get Report/i }));

      await waitFor(() => {
        expect(screen.getByText('85')).toBeInTheDocument();
      });

      // Check that report sections are rendered (use queryAllByText for potentially duplicate text)
      expect(screen.queryAllByText(/Great pacing/).length).toBeGreaterThan(0);
      expect(screen.queryAllByText(/Weak opening/).length).toBeGreaterThan(0);
    });

    it('should show Start Over button after report is displayed', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockReport,
      });

      await user.click(screen.getByRole('button', { name: /Get Report/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Start Over/i })).toBeInTheDocument();
      });
    });

    it('should show error on report fetch failure', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          errors: [{ message: 'Report not found' }],
        }),
      });

      await user.click(screen.getByRole('button', { name: /Get Report/i }));

      await waitFor(() => {
        expect(screen.getByText(/Report not found/)).toBeInTheDocument();
      });
    });
  });

  describe('Reset Functionality', () => {
    it('should reset to step 1 when Start Over is clicked', async () => {
      const user = userEvent.setup();

      // Go through full workflow
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
          json: async () => ({
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
          }),
        });

      render(<Home />);

      const textarea = screen.getByPlaceholderText(/INT\. JERRY'S APARTMENT/);
      await user.type(textarea, 'INT. ROOM - DAY');
      await user.click(screen.getByRole('button', { name: /Submit Script/i }));

      await waitFor(() => screen.getByRole('button', { name: /^Create Job$/i }));
      await user.click(screen.getByRole('button', { name: /^Create Job$/i }));

      await waitFor(() => screen.getByRole('button', { name: /^Run Analysis$/i }));
      await user.click(screen.getByRole('button', { name: /^Run Analysis$/i }));

      await waitFor(() => screen.getByRole('button', { name: /Get Report/i }));
      await user.click(screen.getByRole('button', { name: /Get Report/i }));

      await waitFor(() => screen.getByRole('button', { name: /Start Over/i }));
      await user.click(screen.getByRole('button', { name: /Start Over/i }));

      // Should be back at step 1
      expect(screen.getByText('Submit Your Script')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/INT\. JERRY'S APARTMENT/)).toHaveValue('');
    });
  });

  describe('Health Check', () => {
    it('should show success alert when health check passes', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      });

      render(<Home />);

      await user.click(screen.getByRole('button', { name: /Test Health Check/i }));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Health check passed! Database is connected.'
        );
      });
    });

    it('should show failure alert when health check fails', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: false, errors: [{ message: 'DB down' }] }),
      });

      render(<Home />);

      await user.click(screen.getByRole('button', { name: /Test Health Check/i }));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Health check failed. See console for details.'
        );
      });
    });

    it('should call GET /api/health', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      });

      render(<Home />);

      await user.click(screen.getByRole('button', { name: /Test Health Check/i }));

      expect(mockFetch).toHaveBeenCalledWith('/api/health');
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
      await user.click(screen.getByRole('button', { name: /Submit Script/i }));

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
      await user.click(screen.getByRole('button', { name: /Submit Script/i }));

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
      await user.click(screen.getByRole('button', { name: /Submit Script/i }));

      await waitFor(() => {
        expect(screen.getByText(/Failed to submit script/)).toBeInTheDocument();
      });
    });
  });

  describe('Step Indicators', () => {
    it('should display all four step labels', () => {
      render(<Home />);

      // All step labels appear in the step indicator
      expect(screen.getAllByText(/Submit Script/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Create Job/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Run Analysis/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/View Report/i).length).toBeGreaterThan(0);
    });
  });

  describe('API Documentation', () => {
    it('should display API endpoints', () => {
      render(<Home />);

      expect(screen.getByText('/api/health')).toBeInTheDocument();
      expect(screen.getByText('/api/scripts')).toBeInTheDocument();
      expect(screen.getByText('/api/jobs')).toBeInTheDocument();
      expect(screen.getByText('/api/jobs/[job_id]/run')).toBeInTheDocument();
      expect(screen.getByText('/api/reports/[run_id]')).toBeInTheDocument();
    });
  });
});
