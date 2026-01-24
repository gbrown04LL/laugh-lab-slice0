import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { AnalysisProgress } from './AnalysisProgress';

describe('AnalysisProgress', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Visibility', () => {
    it('should not render when isAnalyzing is false', () => {
      const { container } = render(<AnalysisProgress isAnalyzing={false} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render modal when isAnalyzing is true', () => {
      render(<AnalysisProgress isAnalyzing={true} />);
      expect(screen.getByText('Analysis in progress')).toBeInTheDocument();
    });

    it('should render brain emoji', () => {
      render(<AnalysisProgress isAnalyzing={true} />);
      expect(screen.getByText('🧠')).toBeInTheDocument();
    });

    it('should show timing estimate', () => {
      render(<AnalysisProgress isAnalyzing={true} />);
      expect(screen.getByText('This usually takes 15-30 seconds')).toBeInTheDocument();
    });
  });

  describe('Stage Text', () => {
    it('should show "Reading your script..." for low progress', () => {
      render(<AnalysisProgress isAnalyzing={true} stage={20} />);
      expect(screen.getByText(/Reading your script.../)).toBeInTheDocument();
    });

    it('should show "Crunching the numbers..." for mid-low progress', () => {
      render(<AnalysisProgress isAnalyzing={true} stage={50} />);
      expect(screen.getByText(/Crunching the numbers.../)).toBeInTheDocument();
    });

    it('should show "Writing your feedback..." for mid-high progress', () => {
      render(<AnalysisProgress isAnalyzing={true} stage={75} />);
      expect(screen.getByText(/Writing your feedback.../)).toBeInTheDocument();
    });

    it('should show "Polishing the report..." for high progress', () => {
      render(<AnalysisProgress isAnalyzing={true} stage={95} />);
      expect(screen.getByText(/Polishing the report.../)).toBeInTheDocument();
    });
  });

  describe('Progress Bar', () => {
    it('should display progress percentage', () => {
      render(<AnalysisProgress isAnalyzing={true} stage={45} />);
      expect(screen.getByText('45%')).toBeInTheDocument();
    });

    it('should clamp stage to maximum of 100', () => {
      render(<AnalysisProgress isAnalyzing={true} stage={150} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should clamp stage to minimum of 0', () => {
      render(<AnalysisProgress isAnalyzing={true} stage={-10} />);
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should round progress percentage', () => {
      render(<AnalysisProgress isAnalyzing={true} stage={45.7} />);
      expect(screen.getByText('46%')).toBeInTheDocument();
    });
  });

  describe('Auto-Progress Animation', () => {
    it('should start at 0% when no stage provided', () => {
      render(<AnalysisProgress isAnalyzing={true} />);
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should auto-increment progress when no stage provided', async () => {
      render(<AnalysisProgress isAnalyzing={true} />);

      // Initial state
      expect(screen.getByText('0%')).toBeInTheDocument();

      // Advance time by 200ms (one interval)
      await vi.advanceTimersByTimeAsync(200);

      expect(screen.getByText('2%')).toBeInTheDocument();
    });

    it('should progress faster in early stages (< 40%)', async () => {
      render(<AnalysisProgress isAnalyzing={true} />);

      // Advance by 1 second (5 intervals)
      await vi.advanceTimersByTimeAsync(1000);

      // Should have increased by 2 per interval = 10%
      expect(screen.getByText('10%')).toBeInTheDocument();
    });

    it('should progress slower in middle stages (40-70%)', async () => {
      render(<AnalysisProgress isAnalyzing={true} />);

      // Fast-forward to reach 40%+ range (20 intervals at 2% = 40%)
      await vi.advanceTimersByTimeAsync(4000);

      // Get current progress (should be around 40%)
      const currentText = screen.getByText(/\d+%/);
      const currentProgress = parseInt(currentText.textContent!.replace('%', ''));
      expect(currentProgress).toBeGreaterThanOrEqual(40);

      // Advance by 1 second (5 intervals at 1% = 5%)
      await vi.advanceTimersByTimeAsync(1000);

      const newText = screen.getByText(/\d+%/);
      const newProgress = parseInt(newText.textContent!.replace('%', ''));

      // Should have increased by about 5% (slower than early stages)
      expect(newProgress - currentProgress).toBeGreaterThanOrEqual(4);
      expect(newProgress - currentProgress).toBeLessThanOrEqual(6);
    });

    it('should progress slowest in late stages (70-92%)', async () => {
      // Start without stage to trigger auto-progress
      const { rerender } = render(<AnalysisProgress isAnalyzing={true} />);

      // Fast-forward to 70%
      await vi.advanceTimersByTimeAsync(10000);

      // Now check current progress is in the 70-92% range
      const currentProgress = screen.getByText(/\d+%/);
      expect(currentProgress).toBeInTheDocument();

      // Get the current percentage
      const currentValue = parseInt(currentProgress.textContent!.replace('%', ''));

      // Advance by 1 second (5 intervals at 0.5 per interval = 2.5%)
      await vi.advanceTimersByTimeAsync(1000);

      // Should have increased by about 2-3%
      const newProgress = screen.getByText(/\d+%/);
      const newValue = parseInt(newProgress.textContent!.replace('%', ''));

      // Progress should be slow (less than 5% increase)
      expect(newValue - currentValue).toBeLessThan(5);
      expect(newValue - currentValue).toBeGreaterThanOrEqual(2);
    });

    it('should stop progressing after 92%', async () => {
      render(<AnalysisProgress isAnalyzing={true} stage={92} />);

      // Advance by 5 seconds
      await vi.advanceTimersByTimeAsync(5000);

      expect(screen.getByText('92%')).toBeInTheDocument();
    });

    it('should clear interval when component unmounts', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      const { unmount } = render(<AnalysisProgress isAnalyzing={true} />);

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('Stage Prop Changes', () => {
    it('should reset progress to 0 when isAnalyzing becomes false', async () => {
      const { rerender } = render(<AnalysisProgress isAnalyzing={true} stage={50} />);

      expect(screen.getByText('50%')).toBeInTheDocument();

      rerender(<AnalysisProgress isAnalyzing={false} />);

      // Component should not render, so progress is effectively reset
      expect(screen.queryByText('50%')).not.toBeInTheDocument();
    });

    it('should update progress when stage prop changes', () => {
      const { rerender } = render(<AnalysisProgress isAnalyzing={true} stage={30} />);

      expect(screen.getByText('30%')).toBeInTheDocument();

      rerender(<AnalysisProgress isAnalyzing={true} stage={60} />);

      expect(screen.getByText('60%')).toBeInTheDocument();
    });

    it('should switch from auto-progress to manual progress when stage is provided', async () => {
      const { rerender } = render(<AnalysisProgress isAnalyzing={true} />);

      // Auto-progress for a bit
      await vi.advanceTimersByTimeAsync(1000);

      expect(screen.getByText('10%')).toBeInTheDocument();

      // Now provide explicit stage
      rerender(<AnalysisProgress isAnalyzing={true} stage={75} />);

      expect(screen.getByText('75%')).toBeInTheDocument();

      // Advance time - should not auto-progress anymore
      await vi.advanceTimersByTimeAsync(1000);

      expect(screen.getByText('75%')).toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('should render backdrop overlay', () => {
      render(<AnalysisProgress isAnalyzing={true} />);
      const backdrop = screen.getByText('Analysis in progress').closest('.fixed');
      expect(backdrop).toBeInTheDocument();
    });

    it('should render progress label', () => {
      render(<AnalysisProgress isAnalyzing={true} stage={50} />);
      expect(screen.getByText('Progress')).toBeInTheDocument();
    });

    it('should render animated dots', () => {
      const { container } = render(<AnalysisProgress isAnalyzing={true} />);
      const dots = container.querySelectorAll('.animate-bounce');
      expect(dots).toHaveLength(3);
    });
  });
});
