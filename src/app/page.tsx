'use client';

import { useState } from 'react';

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
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-purple-500/30">
                <span className="text-white text-lg">📊</span>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                Analysis Report
              </h2>
            </div>

            {/* Comedy Metrics Card */}
            <div className="relative bg-gradient-to-br from-white to-slate-50/80 border border-gray-200/60 rounded-2xl p-6 mb-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-blue-100/40 to-transparent rounded-bl-full" />
              <div className="relative">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Comedy Metrics</h3>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-5xl font-black bg-gradient-to-br from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {report.output?.prompt_a?.metrics?.overall_score || 'N/A'}
                  </span>
                  <span className="text-2xl font-medium text-gray-400">/100</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-full border border-blue-200/50">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    LPM: {report.output?.prompt_a?.metrics?.lpm_intermediate_plus || 'N/A'}
                  </span>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 text-sm font-medium rounded-full border border-purple-200/50">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    Lines per joke: {report.output?.prompt_a?.metrics?.lines_per_joke || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Strengths Section */}
            <div className="relative rounded-2xl bg-gradient-to-br from-emerald-50 via-green-50/80 to-teal-50/60 border border-emerald-200/50 p-6 mb-6 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.15)] overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-200/30 to-transparent rounded-bl-full" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-green-500 shadow-lg shadow-green-500/25">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Strengths to Preserve</h3>
                </div>
                <div className="space-y-3">
                  {report.output?.prompt_b?.sections?.strengths_to_preserve?.map((strength: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)]">
                      <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 shadow-sm shadow-green-500/50" />
                      <p className="text-sm text-gray-700 leading-relaxed">{strength}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Issues Section */}
            <div className="relative rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50/80 to-yellow-50/60 border border-amber-200/50 p-6 mb-6 shadow-[0_4px_20px_-4px_rgba(245,158,11,0.15)] overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-200/30 to-transparent rounded-bl-full" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/25">
                    <span className="text-white text-sm">!</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">What's Getting in the Way</h3>
                </div>
                <div className="space-y-4">
                  {report.output?.prompt_b?.sections?.whats_getting_in_the_way?.map((issue: any, i: number) => (
                    <div key={i} className="bg-white/70 backdrop-blur-sm rounded-xl p-5 border border-white/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)]">
                      <div className="flex items-start gap-3 mb-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center mt-0.5">
                          {i + 1}
                        </span>
                        <p className="font-semibold text-gray-900 text-sm leading-relaxed">{issue.why_it_matters}</p>
                      </div>
                      <div className="ml-9 flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-700/70">Fix:</span>
                        <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 text-sm font-medium rounded-full border border-emerald-200/50">
                          {issue.concrete_fix?.title}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* JSON Report Toggle */}
            <details className="group mb-6">
              <summary className="cursor-pointer list-none">
                <div className="flex items-center justify-between bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.12)] transition-all duration-300">
                  <div>
                    <p className="font-semibold text-gray-900">View Full JSON Report</p>
                    <p className="text-sm text-gray-500">Debug payload from the analysis pipeline</p>
                  </div>
                  <span className="text-xs text-gray-600 bg-gray-100 border border-gray-200 rounded-full px-3 py-1.5 font-medium group-open:bg-gray-200 transition-colors">
                    <span className="group-open:hidden">Show</span>
                    <span className="hidden group-open:inline">Hide</span>
                  </span>
                </div>
              </summary>
              <div className="mt-3 p-4 bg-gradient-to-b from-gray-50/50 to-transparent rounded-xl">
                <pre className="bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 text-xs p-5 rounded-xl overflow-auto max-h-96 shadow-inner">
                  {JSON.stringify(report, null, 2)}
                </pre>
              </div>
            </details>

            <button
              onClick={handleReset}
              className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-medium rounded-xl shadow-lg shadow-gray-500/20 hover:shadow-xl hover:shadow-gray-500/30 hover:-translate-y-0.5 transition-all duration-300"
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
