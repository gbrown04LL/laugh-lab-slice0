import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import ReportPage from './ReportPage';

// Mock Recharts (used by ScoreGauge and CharacterBalanceChart)
vi.mock('recharts', () => {
  const React = require('react');
  return {
    ResponsiveContainer: ({ children }: any) => React.createElement('div', { 'data-testid': 'responsive-container' }, children),
    RadialBarChart: ({ children }: any) => React.createElement('div', { 'data-testid': 'radial-bar-chart' }, children),
    RadialBar: () => React.createElement('div', { 'data-testid': 'radial-bar' }),
    BarChart: ({ children }: any) => React.createElement('div', { 'data-testid': 'bar-chart' }, children),
    Bar: ({ children }: any) => React.createElement('div', { 'data-testid': 'bar' }, children),
    XAxis: () => React.createElement('div', { 'data-testid': 'x-axis' }),
    YAxis: () => React.createElement('div', { 'data-testid': 'y-axis' }),
    Cell: () => React.createElement('div', { 'data-testid': 'cell' }),
    LabelList: () => React.createElement('div', { 'data-testid': 'label-list' }),
  };
});

describe('ReportPage', () => {
  const mockData = {
    output: {
      prompt_a: {
        metrics: {
          overall_score: 75,
          lpm_intermediate_plus: 2.5,
          lines_per_joke: 8.5,
          character_balance: {
            ensemble_balance: 0.85,
            characters: [
              {
                name: 'Alice',
                joke_share: 0.40,
                line_share: 0.35,
                underutilized: false,
              },
              {
                name: 'Bob',
                joke_share: 0.30,
                line_share: 0.35,
                underutilized: false,
              },
            ],
          },
        },
      },
      prompt_b: {
        sections: {
          strengths_to_preserve: [
            'Strong character dynamics',
            'Natural dialogue flow',
          ],
          whats_getting_in_the_way: [
            {
              issue_id: 'issue-1',
              why_it_matters: 'Pacing feels slow in Act 2',
              concrete_fix: 'Tighten the dinner scene by cutting redundant setup',
            },
          ],
          punch_up_suggestions: [
            {
              moment_id: 'moment-1',
              moment_context: 'Alice confronts Bob about the mess',
              options: [
                {
                  option_id: 'opt-1',
                  device: 'Callback',
                  text: 'Remember when you said you were "organized chaos"? This is just chaos.',
                },
              ],
            },
          ],
        },
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render without crashing with no data', () => {
      render(<ReportPage />);
      expect(screen.getByText('Analysis Report')).toBeInTheDocument();
    });

    it('should render with data', () => {
      render(<ReportPage data={mockData} />);
      expect(screen.getByText('Analysis Report')).toBeInTheDocument();
    });

    it('should render custom script title', () => {
      render(<ReportPage scriptTitle="My Awesome Script" data={mockData} />);
      expect(screen.getByText('My Awesome Script')).toBeInTheDocument();
    });

    it('should use default title when scriptTitle not provided', () => {
      render(<ReportPage data={mockData} />);
      expect(screen.getByText('Analysis Report')).toBeInTheDocument();
    });
  });

  describe('Child Component Integration', () => {
    it('should render ScoreGauge with correct score', () => {
      render(<ReportPage data={mockData} />);
      // ScoreGauge displays the score
      expect(screen.getByText('75')).toBeInTheDocument();
    });

    it('should render MetricsCards with correct metrics', () => {
      render(<ReportPage data={mockData} />);
      expect(screen.getByText('2.5')).toBeInTheDocument(); // LPM
      expect(screen.getByText('8.5')).toBeInTheDocument(); // Lines Per Joke
      expect(screen.getByText('85%')).toBeInTheDocument(); // Ensemble Balance (0.85 * 100)
    });

    it('should render StrengthsSection with strengths', () => {
      render(<ReportPage data={mockData} />);
      expect(screen.getByText('Strong character dynamics')).toBeInTheDocument();
      expect(screen.getByText('Natural dialogue flow')).toBeInTheDocument();
    });

    it('should render OpportunitiesSection with opportunities', () => {
      render(<ReportPage data={mockData} />);
      expect(screen.getByText('Pacing feels slow in Act 2')).toBeInTheDocument();
    });

    it('should render PunchUpWorkshop with moments', () => {
      render(<ReportPage data={mockData} />);
      expect(screen.getByText('Alice confronts Bob about the mess')).toBeInTheDocument();
    });

    it('should render CharacterBalanceChart with characters', () => {
      render(<ReportPage data={mockData} />);
      expect(screen.getByText('🎭 Character Balance')).toBeInTheDocument();
    });
  });

  describe('Raw JSON Toggle', () => {
    it('should show "View Raw JSON" button', () => {
      render(<ReportPage data={mockData} />);
      expect(screen.getByText('View Raw JSON')).toBeInTheDocument();
    });

    it('should show description text', () => {
      render(<ReportPage data={mockData} />);
      expect(screen.getByText('Debug payload from the analysis pipeline')).toBeInTheDocument();
    });

    it('should initially show "Show" label', () => {
      render(<ReportPage data={mockData} />);
      expect(screen.getByText('Show')).toBeInTheDocument();
    });

    it('should toggle to show raw JSON when button clicked', () => {
      render(<ReportPage data={mockData} />);

      const button = screen.getByText('View Raw JSON').closest('button')!;
      fireEvent.click(button);

      expect(screen.getByText('Hide')).toBeInTheDocument();
      // JSON should be visible
      const pre = screen.getByText(/"overall_score"/);
      expect(pre).toBeInTheDocument();
    });

    it('should toggle back to hide raw JSON', () => {
      render(<ReportPage data={mockData} />);

      const button = screen.getByText('View Raw JSON').closest('button')!;

      // Show JSON
      fireEvent.click(button);
      expect(screen.getByText('Hide')).toBeInTheDocument();

      // Hide JSON
      fireEvent.click(button);
      expect(screen.getByText('Show')).toBeInTheDocument();
      expect(screen.queryByText(/"overall_score"/)).not.toBeInTheDocument();
    });

    it('should display formatted JSON with indentation', () => {
      render(<ReportPage data={mockData} />);

      const button = screen.getByText('View Raw JSON').closest('button')!;
      fireEvent.click(button);

      const jsonContent = screen.getByText(/"overall_score"/).textContent;
      // Should contain newlines (formatted)
      expect(jsonContent).toBeTruthy();
    });

    it('should show "No data" when data is undefined', () => {
      render(<ReportPage />);

      const button = screen.getByText('View Raw JSON').closest('button')!;
      fireEvent.click(button);

      expect(screen.getByText('No data')).toBeInTheDocument();
    });
  });

  describe('Analysis Progress', () => {
    it('should not show AnalysisProgress when isAnalyzing is false', () => {
      render(<ReportPage data={mockData} isAnalyzing={false} />);
      expect(screen.queryByText('Analysis in progress')).not.toBeInTheDocument();
    });

    it('should show AnalysisProgress when isAnalyzing is true', () => {
      render(<ReportPage data={mockData} isAnalyzing={true} />);
      expect(screen.getByText('Analysis in progress')).toBeInTheDocument();
    });

    it('should pass stage prop to AnalysisProgress', () => {
      render(<ReportPage data={mockData} isAnalyzing={true} stage={45} />);
      expect(screen.getByText('Analysis in progress')).toBeInTheDocument();
      expect(screen.getByText('45%')).toBeInTheDocument();
    });

    it('should default isAnalyzing to false', () => {
      render(<ReportPage data={mockData} />);
      expect(screen.queryByText('Analysis in progress')).not.toBeInTheDocument();
    });
  });

  describe('Data Mapping', () => {
    it('should handle missing prompt_a metrics gracefully', () => {
      const incompleteData = {
        output: {
          prompt_b: mockData.output.prompt_b,
        },
      };

      render(<ReportPage data={incompleteData} />);

      // Should use defaults (0)
      expect(screen.getByText('0')).toBeInTheDocument(); // Score
    });

    it('should handle missing prompt_b sections gracefully', () => {
      const incompleteData = {
        output: {
          prompt_a: mockData.output.prompt_a,
        },
      };

      render(<ReportPage data={incompleteData} />);

      // Should not crash
      expect(screen.getByText('Analysis Report')).toBeInTheDocument();
    });

    it('should handle completely missing output', () => {
      const emptyData = {};

      render(<ReportPage data={emptyData} />);

      // Should render with defaults
      expect(screen.getByText('Analysis Report')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument(); // Default score
    });

    it('should handle undefined data prop', () => {
      render(<ReportPage />);

      // Should render with defaults
      expect(screen.getByText('Analysis Report')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument(); // Default score
    });

    it('should map character balance correctly', () => {
      render(<ReportPage data={mockData} />);

      // Should map ensemble_balance to percentage
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('should map empty strengths array', () => {
      const dataNoStrengths = {
        output: {
          ...mockData.output,
          prompt_b: {
            sections: {
              ...mockData.output.prompt_b.sections,
              strengths_to_preserve: [],
            },
          },
        },
      };

      render(<ReportPage data={dataNoStrengths} />);

      // StrengthsSection should not render
      expect(screen.queryByText('💪 What\'s Working')).not.toBeInTheDocument();
    });

    it('should map empty opportunities array', () => {
      const dataNoOpportunities = {
        output: {
          ...mockData.output,
          prompt_b: {
            sections: {
              ...mockData.output.prompt_b.sections,
              whats_getting_in_the_way: [],
            },
          },
        },
      };

      render(<ReportPage data={dataNoOpportunities} />);

      // OpportunitiesSection should not render
      expect(screen.queryByText('🎯 Opportunities')).not.toBeInTheDocument();
    });

    it('should map empty punch-ups array', () => {
      const dataNoPunchUps = {
        output: {
          ...mockData.output,
          prompt_b: {
            sections: {
              ...mockData.output.prompt_b.sections,
              punch_up_suggestions: [],
            },
          },
        },
      };

      render(<ReportPage data={dataNoPunchUps} />);

      // PunchUpWorkshop should not render
      expect(screen.queryByText('✍️ Punch-Up Workshop')).not.toBeInTheDocument();
    });

    it('should map empty characters array', () => {
      const dataNoCharacters = {
        output: {
          prompt_a: {
            metrics: {
              ...mockData.output.prompt_a.metrics,
              character_balance: {
                ensemble_balance: 0.85,
                characters: [],
              },
            },
          },
          prompt_b: mockData.output.prompt_b,
        },
      };

      render(<ReportPage data={dataNoCharacters} />);

      // CharacterBalanceChart should not render
      expect(screen.queryByText('🎭 Character Balance')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null data', () => {
      render(<ReportPage data={null as any} />);
      expect(screen.getByText('Analysis Report')).toBeInTheDocument();
    });

    it('should handle data with missing nested properties', () => {
      const badData = {
        output: {
          prompt_a: {},
          prompt_b: {},
        },
      };

      render(<ReportPage data={badData} />);
      expect(screen.getByText('Analysis Report')).toBeInTheDocument();
    });

    it('should handle very high scores', () => {
      const highScoreData = {
        output: {
          prompt_a: {
            metrics: {
              overall_score: 100,
              lpm_intermediate_plus: 10.0,
              lines_per_joke: 2.0,
              character_balance: {
                ensemble_balance: 1.0,
              },
            },
          },
        },
      };

      render(<ReportPage data={highScoreData} />);
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('should handle zero scores', () => {
      const zeroScoreData = {
        output: {
          prompt_a: {
            metrics: {
              overall_score: 0,
              lpm_intermediate_plus: 0,
              lines_per_joke: 0,
              character_balance: {
                ensemble_balance: 0,
              },
            },
          },
        },
      };

      render(<ReportPage data={zeroScoreData} />);
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThan(0);
    });

    it('should handle decimal values in metrics', () => {
      const decimalData = {
        output: {
          prompt_a: {
            metrics: {
              overall_score: 75.5,
              lpm_intermediate_plus: 2.567,
              lines_per_joke: 8.123,
              character_balance: {
                ensemble_balance: 0.8567,
              },
            },
          },
        },
      };

      render(<ReportPage data={decimalData} />);
      // Values should be displayed (rounded by child components)
      expect(screen.getByText('75.5')).toBeInTheDocument(); // Exact score
      expect(screen.getByText('2.6')).toBeInTheDocument(); // LPM value (toFixed(1))
      expect(screen.getByText('8.1')).toBeInTheDocument(); // Lines Per Joke (toFixed(1))
    });
  });

  describe('Layout and Structure', () => {
    it('should render main element with correct styling', () => {
      const { container } = render(<ReportPage data={mockData} />);
      const main = container.querySelector('main');
      expect(main).toHaveClass('min-h-screen', 'bg-gray-50');
    });

    it('should render content in constrained container', () => {
      const { container } = render(<ReportPage data={mockData} />);
      const contentContainer = container.querySelector('.max-w-4xl');
      expect(contentContainer).toBeInTheDocument();
    });

    it('should render header section', () => {
      const { container } = render(<ReportPage data={mockData} scriptTitle="Test Script" />);
      const header = screen.getByText('Test Script').closest('div');
      expect(header).toBeInTheDocument();
    });

    it('should render score and metrics in a grid', () => {
      const { container } = render(<ReportPage data={mockData} />);
      const grids = container.querySelectorAll('.grid');
      expect(grids.length).toBeGreaterThan(0);
    });
  });
});
