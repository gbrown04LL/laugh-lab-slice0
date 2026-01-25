'use client';

import React, { useState } from 'react';

export default function Home() {
  const [scriptText, setScriptText] = useState('');
  const [scriptId, setScriptId] = useState('');
  const [jobId, setJobId] = useState('');
  const [runId, setRunId] = useState('');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'script' | 'job' | 'run' | 'report'>('script');

  const handleSubmitScript = async () => {
    if (!scriptText.trim()) {
      setError('Please enter some script text');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: scriptText }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors?.[0]?.message || 'Failed to submit script');
      }
      
      const data = await response.json();
      setScriptId(data.id);
      setStep('job');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script_id: scriptId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors?.[0]?.message || 'Failed to create job');
      }
      
      const data = await response.json();
      setJobId(data.id);
      setStep('run');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAnalysis = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/jobs/${jobId}/run`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors?.[0]?.message || 'Failed to run analysis');
      }
      
      const data = await response.json();
      setRunId(data.run_id);
      setStep('report');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGetReport = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/reports/${runId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors?.[0]?.message || 'Failed to get report');
      }
      
      const data = await response.json();
      setReport(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setScriptText('');
    setScriptId('');
    setJobId('');
    setRunId('');
    setReport(null);
    setError('');
    setStep('script');
  };

  const handleTestHealth = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      
      if (data.ok) {
        alert('✅ Health check passed! Database is connected.');
      } else {
        alert('❌ Health check failed. See console for details.');
        console.error('Health check response:', data);
      }
    } catch (err: any) {
      setError(err.message);
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
        <h1 style={{ color: '#333', marginBottom: '0.5rem' }}>🎭 Laugh Lab - Slice 0</h1>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>
          AI-powered comedy script analysis. Test the full workflow below.
        </p>

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
            marginBottom: '2rem',
            opacity: loading ? 0.6 : 1
          }}
        >
          Test Health Check
        </button>

        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginBottom: '2rem',
          borderBottom: '2px solid #e9ecef',
          paddingBottom: '1rem'
        }}>
          <div style={{ 
            flex: 1, 
            textAlign: 'center',
            opacity: step === 'script' ? 1 : 0.4,
            fontWeight: step === 'script' ? 'bold' : 'normal'
          }}>
            1. Submit Script
          </div>
          <div style={{ 
            flex: 1, 
            textAlign: 'center',
            opacity: step === 'job' ? 1 : 0.4,
            fontWeight: step === 'job' ? 'bold' : 'normal'
          }}>
            2. Create Job
          </div>
          <div style={{ 
            flex: 1, 
            textAlign: 'center',
            opacity: step === 'run' ? 1 : 0.4,
            fontWeight: step === 'run' ? 'bold' : 'normal'
          }}>
            3. Run Analysis
          </div>
          <div style={{ 
            flex: 1, 
            textAlign: 'center',
            opacity: step === 'report' ? 1 : 0.4,
            fontWeight: step === 'report' ? 'bold' : 'normal'
          }}>
            4. View Report
          </div>
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

        {/* Step 1: Submit Script */}
        {step === 'script' && (
          <div>
            <h2 style={{ color: '#333', fontSize: '1.5rem', marginBottom: '1rem' }}>
              Step 1: Submit Your Script
            </h2>
            <textarea
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              placeholder="Paste your comedy script here..."
              style={{
                width: '100%',
                minHeight: '200px',
                padding: '1rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '0.95rem',
                fontFamily: 'monospace',
                marginBottom: '1rem'
              }}
            />
            <button
              onClick={handleSubmitScript}
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
              {loading ? 'Submitting...' : 'Submit Script'}
            </button>
          </div>
        )}

        {/* Step 2: Create Job */}
        {step === 'job' && (
          <div>
            <h2 style={{ color: '#333', fontSize: '1.5rem', marginBottom: '1rem' }}>
              Step 2: Create Analysis Job
            </h2>
            <div style={{ 
              background: '#f8f9fa', 
              padding: '1rem', 
              borderRadius: '6px',
              marginBottom: '1rem'
            }}>
              <p style={{ margin: '0 0 0.5rem 0', color: '#666' }}>
                <strong>Script ID:</strong> <code style={{ background: '#e9ecef', padding: '2px 6px', borderRadius: '3px' }}>{scriptId}</code>
              </p>
            </div>
            <button
              onClick={handleCreateJob}
              disabled={loading}
              style={{
                padding: '0.75rem 2rem',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Creating...' : 'Create Job'}
            </button>
          </div>
        )}

        {/* Step 3: Run Analysis */}
        {step === 'run' && (
          <div>
            <h2 style={{ color: '#333', fontSize: '1.5rem', marginBottom: '1rem' }}>
              Step 3: Run Analysis
            </h2>
            <div style={{ 
              background: '#f8f9fa', 
              padding: '1rem', 
              borderRadius: '6px',
              marginBottom: '1rem'
            }}>
              <p style={{ margin: '0 0 0.5rem 0', color: '#666' }}>
                <strong>Job ID:</strong> <code style={{ background: '#e9ecef', padding: '2px 6px', borderRadius: '3px' }}>{jobId}</code>
              </p>
            </div>
            <button
              onClick={handleRunAnalysis}
              disabled={loading}
              style={{
                padding: '0.75rem 2rem',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Running...' : 'Run Analysis'}
            </button>
          </div>
        )}

        {/* Step 4: View Report */}
        {step === 'report' && !report && (
          <div>
            <h2 style={{ color: '#333', fontSize: '1.5rem', marginBottom: '1rem' }}>
              Step 4: View Report
            </h2>
            <div style={{ 
              background: '#f8f9fa', 
              padding: '1rem', 
              borderRadius: '6px',
              marginBottom: '1rem'
            }}>
              <p style={{ margin: '0 0 0.5rem 0', color: '#666' }}>
                <strong>Run ID:</strong> <code style={{ background: '#e9ecef', padding: '2px 6px', borderRadius: '3px' }}>{runId}</code>
              </p>
            </div>
            <button
              onClick={handleGetReport}
              disabled={loading}
              style={{
                padding: '0.75rem 2rem',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Loading...' : 'Get Report'}
            </button>
          </div>
        )}

        {/* Display Report */}
        {report && (
          <div>
            <h2 style={{ color: '#333', fontSize: '1.5rem', marginBottom: '1rem' }}>
              📊 Analysis Report
            </h2>
            
            <div style={{ 
              background: '#f8f9fa', 
              padding: '1.5rem', 
              borderRadius: '6px',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ marginTop: 0, color: '#333' }}>Comedy Metrics</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff', margin: '0.5rem 0' }}>
                {report.output?.prompt_a?.metrics?.overall_score || 'N/A'}/100
              </p>
              <p style={{ color: '#666', margin: 0 }}>
                LPM: {report.output?.prompt_a?.metrics?.lpm_intermediate_plus || 'N/A'} | 
                Lines per joke: {report.output?.prompt_a?.metrics?.lines_per_joke || 'N/A'}
              </p>
            </div>

            <div style={{ 
              background: '#fff3cd', 
              padding: '1rem', 
              borderRadius: '6px',
              border: '1px solid #ffeaa7',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ marginTop: 0, color: '#856404' }}>🎯 Strengths to Preserve</h3>
              <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
                {report.output?.prompt_b?.sections?.strengths_to_preserve?.map((strength: string, i: number) => (
                  <li key={i} style={{ color: '#856404' }}>{strength}</li>
                ))}
              </ul>
            </div>

            <div style={{ 
              background: '#f8d7da', 
              padding: '1rem', 
              borderRadius: '6px',
              border: '1px solid #f5c6cb',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ marginTop: 0, color: '#721c24' }}>⚠️ What's Getting in the Way</h3>
              {report.output?.prompt_b?.sections?.whats_getting_in_the_way?.map((issue: any, i: number) => (
                <div key={i} style={{ marginBottom: '1rem' }}>
                  <p style={{ fontWeight: 'bold', color: '#721c24', marginBottom: '0.5rem' }}>
                    Issue {i + 1}: {issue.why_it_matters}
                  </p>
                  <p style={{ color: '#721c24', marginBottom: '0.25rem' }}>
                    <strong>Fix:</strong> {issue.concrete_fix?.title}
                  </p>
                </div>
              ))}
            </div>

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
                marginTop: '0.5rem'
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
              Start Over
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
          📚 API Documentation
        </h2>
        <div style={{ color: '#666', lineHeight: '1.6' }}>
          <p><strong>GET /api/health</strong> - Database connectivity check</p>
          <p><strong>POST /api/scripts</strong> - Submit script text</p>
          <p><strong>POST /api/jobs</strong> - Create analysis job</p>
          <p><strong>POST /api/jobs/[job_id]/run</strong> - Run Slice-0 analysis</p>
          <p><strong>GET /api/reports/[run_id]</strong> - Retrieve analysis report</p>
        </div>
      </div>
    </main>
  );
}
