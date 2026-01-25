import React from 'react';
import ReportPage from '@/components/report/ReportPage';

interface ReportPageRouteProps {
  params: {
    id: string;
  };
}

export default async function ReportPageRoute({ params }: ReportPageRouteProps) {
  const { id } = params;

  // Fetch the analysis report data from the API
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  try {
    const res = await fetch(`${baseUrl}/api/reports/${id}`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Report Not Found</h1>
            <p className="text-gray-600">The analysis report you're looking for doesn't exist.</p>
          </div>
        </div>
      );
    }

    const data = await res.json();

    return (
      <ReportPage 
        data={data} 
        scriptTitle={data?.script_title || data?.title || 'Analysis Report'} 
      />
    );
  } catch (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Report</h1>
          <p className="text-gray-600">There was an error loading the analysis report.</p>
        </div>
      </div>
    );
  }
}
