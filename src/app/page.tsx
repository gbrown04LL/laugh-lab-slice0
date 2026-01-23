'use client';

import { useState } from 'react';

export default function Home() {
  const [scriptText, setScriptText] = useState('');
  const [title, setTitle] = useState('');
  const [format, setFormat] = useState('auto');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [remaining, setRemaining] = useState<number | null>(null);

  const handleAnalyze = async () => {
    if (!scriptText.trim()) {
      setError('Please enter some script text');
      return;
    }

    if (scriptText.trim().length < 100) {
      setError('Script is too short for meaningful analysis (minimum 100 characters)');
      return;
    }

    setLoading(true);
    setError('');
    setReport(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: scriptText,
          title: title || 'Untitled Script',
          format: format
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Analysis failed');
      }

      setReport(data.data);
      setRemaining(data.remaining);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setScriptText('');
    setTitle('');
    setFormat('auto');
    setReport(null);
    setError('');
  };

  const handleTestHealth = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/health');
      const data = await response.json();

      if (data.ok) {
        alert('Health check passed! Database is connected.');
      } else {
        alert('Health check failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      setError('Health check failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{
      padding: '2rem',
      fontFamily: 'system-ui, sans-serif',
      maxWidth: '1000px',
      margin: '0 auto',
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #ffffff, #f8f9fa)'
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ color: '#333', marginBottom: '0.5rem' }}>Laugh Lab - Slice 0</h1>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>
          AI-powered comedy script analysis. Submit your script below.
        </p>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button
            onClick={handleTestHealth}
            disabled={loading}
            style={{
              padding: '0.5rem 1rem',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              opacity: loading ? 0.6 : 1
            }}
          >
            Test Health Check
          </button>
          {remaining !== null && (
            <span style={{
              padding: '0.5rem 1rem',
              background: '#e9ecef',
              borderRadius: '6px',
              color: '#666'
            }}>
              Analyses remaining this month: {remaining}
            </span>
          )}
        </div>

        {error && (
          <div style={{
            padding: '1rem',
            background: '#fee',
            color: '#c33',
            borderRadius: '6px',
            marginBottom: '1.5rem',
            border: '1px solid #fcc'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {!report ? (
          <div>
            <h2 style={{ color: '#333', fontSize: '1.5rem', marginBottom: '1rem' }}>
              Submit Your Script
            </h2>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="My Comedy Script"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <div style={{ width: '200px' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
                  Format
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    background: 'white'
                  }}
                >
                  <option value="auto">Auto-detect</option>
                  <option value="sitcom">Sitcom</option>
                  <option value="feature">Feature Film</option>
                  <option value="sketch">Sketch</option>
                  <option value="standup">Stand-up</option>
                </select>
              </div>
            </div>

            <textarea
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              placeholder="Paste your comedy script here..."
              style={{
                width: '100%',
                minHeight: '250px',
                padding: '1rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '0.95rem',
                fontFamily: 'monospace',
                marginBottom: '1rem'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={handleAnalyze}
                disabled={loading || !scriptText.trim()}
                style={{
                  padding: '0.75rem 2rem',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading || !scriptText.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500',
                  opacity: loading || !scriptText.trim() ? 0.6 : 1
                }}
              >
                {loading ? 'Analyzing...' : 'Analyze Script'}
              </button>
              <span style={{ color: '#999', fontSize: '0.9rem' }}>
                {scriptText.length.toLocaleString()} characters
              </span>
            </div>
          </div>
        ) : (
          <div>
            <h2 style={{ color: '#333', fontSize: '1.5rem', marginBottom: '1rem' }}>
              Analysis Report
            </h2>

            {/* Comedy Metrics */}
            <div style={{
              background: '#f8f9fa',
              padding: '1.5rem',
              borderRadius: '6px',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ marginTop: 0, color: '#333' }}>Comedy Metrics</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff', margin: '0.5rem 0' }}>
                {report.prompt_a?.metrics?.overall_score ?? 'N/A'}/100
              </p>
              <p style={{ color: '#666', margin: 0 }}>
                LPM: {report.prompt_a?.metrics?.lpm_intermediate_plus ?? 'N/A'} |
                Lines per joke: {report.prompt_a?.metrics?.lines_per_joke ?? 'N/A'}
              </p>
            </div>

            {/* Strengths */}
            {report.prompt_b?.sections?.strengths_to_preserve?.length > 0 && (
              <div style={{
                background: '#d4edda',
                padding: '1rem',
                borderRadius: '6px',
                border: '1px solid #c3e6cb',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{ marginTop: 0, color: '#155724' }}>Strengths to Preserve</h3>
                <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
                  {report.prompt_b.sections.strengths_to_preserve.map((strength: string, i: number) => (
                    <li key={i} style={{ color: '#155724', marginBottom: '0.5rem' }}>{strength}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Issues */}
            {report.prompt_b?.sections?.whats_getting_in_the_way?.length > 0 && (
              <div style={{
                background: '#f8d7da',
                padding: '1rem',
                borderRadius: '6px',
                border: '1px solid #f5c6cb',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{ marginTop: 0, color: '#721c24' }}>What's Getting in the Way</h3>
                {report.prompt_b.sections.whats_getting_in_the_way.map((issue: any, i: number) => (
                  <div key={i} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: i < report.prompt_b.sections.whats_getting_in_the_way.length - 1 ? '1px solid #f5c6cb' : 'none' }}>
                    <p style={{ fontWeight: 'bold', color: '#721c24', marginBottom: '0.5rem' }}>
                      {issue.why_it_matters}
                    </p>
                    {issue.concrete_fix && (
                      <p style={{ color: '#721c24', marginBottom: '0' }}>
                        <strong>Fix:</strong> {issue.concrete_fix.title}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Punch-up Opportunities */}
            {report.prompt_b?.sections?.punch_up_opportunities?.length > 0 && (
              <div style={{
                background: '#fff3cd',
                padding: '1rem',
                borderRadius: '6px',
                border: '1px solid #ffeaa7',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{ marginTop: 0, color: '#856404' }}>Punch-up Opportunities</h3>
                {report.prompt_b.sections.punch_up_opportunities.map((opp: any, i: number) => (
                  <div key={i} style={{ marginBottom: '1rem' }}>
                    <p style={{ fontWeight: 'bold', color: '#856404', marginBottom: '0.25rem' }}>
                      Line {opp.line_number}: "{opp.original_line}"
                    </p>
                    {opp.options?.map((opt: any, j: number) => (
                      <p key={j} style={{ color: '#856404', marginLeft: '1rem', marginBottom: '0.25rem' }}>
                        Option {j + 1}: "{opt.rewrite}" ({opt.technique})
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Full JSON */}
            <details style={{ marginBottom: '1rem' }}>
              <summary style={{
                cursor: 'pointer',
                padding: '0.75rem',
                background: '#e9ecef',
                borderRadius: '6px',
                fontWeight: '500'
              }}>
                View Full JSON Report
              </summary>
              <pre style={{
                background: '#f8f9fa',
                padding: '1rem',
                borderRadius: '6px',
                overflow: 'auto',
                fontSize: '0.85rem',
                marginTop: '0.5rem',
                maxHeight: '400px'
              }}>
                {JSON.stringify(report, null, 2)}
              </pre>
            </details>

            <button
              onClick={handleReset}
              style={{
                padding: '0.75rem 2rem',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500'
              }}
            >
              Analyze Another Script
            </button>
          </div>
        )}
      </div>

      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#333', fontSize: '1.3rem', marginBottom: '1rem' }}>
          API Documentation
        </h2>
        <div style={{ color: '#666', lineHeight: '1.6' }}>
          <p><strong>GET /api/health</strong> - Database connectivity check</p>
          <p><strong>POST /api/analyze</strong> - Submit script and get analysis (all-in-one)</p>
        </div>
      </div>
    </main>
  );
}
