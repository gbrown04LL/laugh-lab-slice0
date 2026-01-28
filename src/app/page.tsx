'use client';

import React, { useState } from 'react';
import ReportPage from '@/components/report/ReportPage';

export default function Home() {
  const [scriptText, setScriptText] = useState('');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyzeScript = async () => {
    if (!scriptText.trim()) {
      setError('Please enter some script text');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Step 1: Submit script
      const scriptResponse = await fetch('/api/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: scriptText }),
      });

      if (!scriptResponse.ok) {
        const errorData = await scriptResponse.json();
        throw new Error(errorData.errors?.[0]?.message || 'Failed to submit script');
      }

      const scriptData = await scriptResponse.json();

      // Step 2: Create job
      const jobResponse = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script_id: scriptData.id }),
      });

      if (!jobResponse.ok) {
        const errorData = await jobResponse.json();
        throw new Error(errorData.errors?.[0]?.message || 'Failed to create job');
      }

      const jobData = await jobResponse.json();

      // Step 3: Run analysis
      const runResponse = await fetch(`/api/jobs/${jobData.id}/run`, {
        method: 'POST',
      });

      if (!runResponse.ok) {
        const errorData = await runResponse.json();
        throw new Error(errorData.errors?.[0]?.message || 'Failed to run analysis');
      }

      const runData = await runResponse.json();

      // Step 4: Get report
      const reportResponse = await fetch(`/api/reports/${runData.run_id}`);

      if (!reportResponse.ok) {
        const errorData = await reportResponse.json();
        throw new Error(errorData.errors?.[0]?.message || 'Failed to get report');
      }

      const reportData = await reportResponse.json();
      setReport(reportData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setScriptText('');
    setReport(null);
    setError('');
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

        {/* Main Content */}
        <div className="card p-8 animate-fade-in">
          {/* Script Input */}
          {!report && (
            <div className="animate-slide-up">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Analyze Your Script
              </h2>
              <p className="text-gray-500 mb-6">
                Paste your comedy script below to get AI-powered analysis.
              </p>
              <textarea
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                placeholder="INT. JERRY'S APARTMENT - DAY

Jerry and George are sitting on the couch...

JERRY: So let me get this straight..."
                className="w-full h-64 p-4 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 outline-none transition-all duration-200 font-mono text-sm resize-none"
                disabled={loading}
              />
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-gray-400">
                  {scriptText.length} characters
                </span>
                <button
                  onClick={handleAnalyzeScript}
                  disabled={loading || !scriptText.trim()}
                  className="btn-primary"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Analyzing...
                    </span>
                  ) : 'Analyze Script'}
                </button>
              </div>
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
      </div>
    </main>
  );
}
