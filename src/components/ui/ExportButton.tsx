'use client';

import { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface ExportButtonProps {
  corridorId: string;
}

export default function ExportButton({ corridorId }: ExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/report?id=${corridorId}`);
      if (!response.ok) throw new Error('Export failed');

      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pulseroute-${corridorId}-report.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isLoading}
      className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-600 transition-all disabled:opacity-50 shadow-md hover:shadow-lg"
    >
      {isLoading ? (
        <LoadingSpinner size="sm" />
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 2V10M8 10L5 7M8 10L11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 12V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
      Export Report
    </button>
  );
}
