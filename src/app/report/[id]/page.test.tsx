import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// Mock the ReportPage component
vi.mock('@/components/report/ReportPage', () => ({
  default: ({ data, scriptTitle }: { data: any; scriptTitle: string }) => (
    <div data-testid="report-page">
      <span data-testid="script-title">{scriptTitle}</span>
      <span data-testid="report-data">{JSON.stringify(data)}</span>
    </div>
  ),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ReportPageRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set default environment
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch report data and render ReportPage on success', async () => {
    const mockReportData = {
      id: 'report-123',
      script_title: 'My Comedy Script',
      output: { metrics: { overall_score: 85 } },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockReportData,
    });

    // Import dynamically to get fresh module
    const { default: ReportPageRoute } = await import('./page');

    // Call the async server component
    const result = await ReportPageRoute({ params: { id: 'report-123' } });

    // Render the result
    render(result);

    expect(screen.getByTestId('report-page')).toBeInTheDocument();
    expect(screen.getByTestId('script-title')).toHaveTextContent('My Comedy Script');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/reports/report-123',
      { cache: 'no-store' }
    );
  });

  it('should use title as fallback when script_title is missing', async () => {
    const mockReportData = {
      id: 'report-123',
      title: 'Fallback Title',
      output: {},
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockReportData,
    });

    const { default: ReportPageRoute } = await import('./page');
    const result = await ReportPageRoute({ params: { id: 'report-123' } });

    render(result);

    expect(screen.getByTestId('script-title')).toHaveTextContent('Fallback Title');
  });

  it('should use default title when both script_title and title are missing', async () => {
    const mockReportData = {
      id: 'report-123',
      output: {},
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockReportData,
    });

    const { default: ReportPageRoute } = await import('./page');
    const result = await ReportPageRoute({ params: { id: 'report-123' } });

    render(result);

    expect(screen.getByTestId('script-title')).toHaveTextContent('Analysis Report');
  });

  it('should show not found message when API returns 404', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const { default: ReportPageRoute } = await import('./page');
    const result = await ReportPageRoute({ params: { id: 'nonexistent-id' } });

    render(result);

    expect(screen.getByText('Report Not Found')).toBeInTheDocument();
    expect(screen.getByText("The analysis report you're looking for doesn't exist.")).toBeInTheDocument();
  });

  it('should show not found message when API returns other error status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const { default: ReportPageRoute } = await import('./page');
    const result = await ReportPageRoute({ params: { id: 'some-id' } });

    render(result);

    expect(screen.getByText('Report Not Found')).toBeInTheDocument();
  });

  it('should show error message when fetch throws', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { default: ReportPageRoute } = await import('./page');
    const result = await ReportPageRoute({ params: { id: 'some-id' } });

    render(result);

    expect(screen.getByText('Error Loading Report')).toBeInTheDocument();
    expect(screen.getByText('There was an error loading the analysis report.')).toBeInTheDocument();
  });

  it('should use environment variable for API URL', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'test' }),
    });

    const { default: ReportPageRoute } = await import('./page');
    await ReportPageRoute({ params: { id: 'test-id' } });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/api/reports/test-id',
      { cache: 'no-store' }
    );
  });

  it('should fall back to localhost when NEXT_PUBLIC_API_URL is not set', async () => {
    delete process.env.NEXT_PUBLIC_API_URL;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'test' }),
    });

    // Need to reset modules to pick up env change
    vi.resetModules();
    const { default: ReportPageRoute } = await import('./page');
    await ReportPageRoute({ params: { id: 'test-id' } });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/reports/test-id',
      { cache: 'no-store' }
    );
  });

  it('should pass report data to ReportPage component', async () => {
    const mockReportData = {
      id: 'report-456',
      script_title: 'Test Script',
      output: {
        prompt_a: { metrics: { overall_score: 75 } },
        prompt_b: { sections: {} },
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockReportData,
    });

    const { default: ReportPageRoute } = await import('./page');
    const result = await ReportPageRoute({ params: { id: 'report-456' } });

    render(result);

    const reportDataElement = screen.getByTestId('report-data');
    expect(reportDataElement.textContent).toContain('report-456');
    expect(reportDataElement.textContent).toContain('overall_score');
  });
});
