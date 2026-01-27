'use client';

import React, { useState } from 'react';
import ReportPage from '@/components/report/ReportPage';

const steps = [
  { id: 'script', label: 'Submit Script', icon: '1' },
  { id: 'job', label: 'Create Job', icon: '2' },
  { id: 'run', label: 'Run Analysis', icon: '3' },
  { id: 'report', label: 'View Report', icon: '4' },
] as const;

type StepId = typeof steps[number]['id'];

export default function Home() {
  const [scriptText, setScriptText] = useState('');
  const [scriptId, setScriptId] = useState('');
  const [jobId, setJobId] = useState('');
  const [runId, setRunId] = useState('');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<StepId>('script');

  const currentStepIndex = steps.findIndex(s => s.id === step);

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
        alert('Health check passed! Database is connected.');
      } else {
        alert('Health check failed. See console for details.');
        console.error('Health check response:', data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30 mb-4">
            <span className="text-3xl">🎭</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Laugh Lab
          </h1>
          <p className="text-gray-500 text-lg">
            AI-powered comedy script analysis
          </p>
          <button
            onClick={handleTestHealth}
            disabled={loading}
            className="mt-4 btn-success"
          >
            {loading ? 'Checking...' : 'Test Health Check'}
          </button>
        </div>

        {/* Progress Steps */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between">
            {steps.map((s, index) => (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
                      ${index < currentStepIndex
                        ? 'bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-lg shadow-green-500/30'
                        : index === currentStepIndex
                          ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/30 ring-4 ring-violet-100'
                          : 'bg-gray-100 text-gray-400'
                      }
                    `}
                  >
                    {index < currentStepIndex ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      s.icon
                    )}
                  </div>
                  <span className={`
                    mt-2 text-xs font-medium transition-colors duration-300
                    ${index <= currentStepIndex ? 'text-gray-900' : 'text-gray-400'}
                  `}>
                    {s.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    flex-1 h-1 mx-2 rounded-full transition-colors duration-300
                    ${index < currentStepIndex ? 'bg-gradient-to-r from-emerald-400 to-green-500' : 'bg-gray-100'}
                  `} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 animate-fade-in">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-3 h-3 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-red-800">Error</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="card p-8 animate-fade-in">
          {/* Step 1: Submit Script */}
          {step === 'script' && (
            <div className="animate-slide-up">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Submit Your Script
              </h2>
              <p className="text-gray-500 mb-6">
                Paste your comedy script below to begin the analysis.
              </p>
              <textarea
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                placeholder="INT. JERRY'S APARTMENT - DAY

Jerry and George are sitting on the couch...

JERRY: So let me get this straight..."
                className="w-full h-64 p-4 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 outline-none transition-all duration-200 font-mono text-sm resize-none"
              />
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-gray-400">
                  {scriptText.length} characters
                </span>
                <button
                  onClick={handleSubmitScript}
                  disabled={loading || !scriptText.trim()}
                  className="btn-primary"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Submitting...
                    </span>
                  ) : 'Submit Script'}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Create Job */}
          {step === 'job' && (
            <div className="animate-slide-up">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Create Analysis Job
              </h2>
              <p className="text-gray-500 mb-6">
                Your script has been submitted. Create a job to analyze it.
              </p>
              <div className="p-4 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-violet-600 uppercase tracking-wider">Script ID</p>
                    <p className="font-mono text-sm text-gray-900">{scriptId}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleCreateJob}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating Job...
                  </span>
                ) : 'Create Job'}
              </button>
            </div>
          )}

          {/* Step 3: Run Analysis */}
          {step === 'run' && (
            <div className="animate-slide-up">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Run Analysis
              </h2>
              <p className="text-gray-500 mb-6">
                Your job is ready. Start the AI-powered comedy analysis.
              </p>
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-indigo-600 uppercase tracking-wider">Job ID</p>
                    <p className="font-mono text-sm text-gray-900">{jobId}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleRunAnalysis}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Running Analysis...
                  </span>
                ) : 'Run Analysis'}
              </button>
            </div>
          )}

          {/* Step 4: View Report */}
          {step === 'report' && !report && (
            <div className="animate-slide-up">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                View Report
              </h2>
              <p className="text-gray-500 mb-6">
                Analysis complete! Retrieve your comedy script report.
              </p>
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-purple-600 uppercase tracking-wider">Run ID</p>
                    <p className="font-mono text-sm text-gray-900">{runId}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleGetReport}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Loading Report...
                  </span>
                ) : 'Get Report'}
              </button>
            </div>
          )}

          {/* Display Report */}
          {report && (
            <div className="animate-slide-up -mx-8 -mb-8">
              <ReportPage data={report} scriptTitle="Analysis Report" />
              <div className="px-8 pb-8 -mt-4">
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Start Over
                </button>
              </div>
            </div>
          )}
        </div>

        {/* API Documentation */}
        <div className="card p-6 mt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900">API Documentation</h2>
          </div>
          <div className="grid gap-2">
            {[
              { method: 'GET', path: '/api/health', desc: 'Database connectivity check' },
              { method: 'POST', path: '/api/scripts', desc: 'Submit script text' },
              { method: 'POST', path: '/api/jobs', desc: 'Create analysis job' },
              { method: 'POST', path: '/api/jobs/[job_id]/run', desc: 'Run Slice-0 analysis' },
              { method: 'GET', path: '/api/reports/[run_id]', desc: 'Retrieve analysis report' },
            ].map((endpoint, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <span className={`
                  px-2 py-1 text-xs font-bold rounded
                  ${endpoint.method === 'GET' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}
                `}>
                  {endpoint.method}
                </span>
                <code className="text-sm font-mono text-gray-700">{endpoint.path}</code>
                <span className="text-sm text-gray-500 ml-auto">{endpoint.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
