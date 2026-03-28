'use client';

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="p-6 mx-4 my-6 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-red-500">
              <path d="M10 2L18 17H2L10 2Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
              <path d="M10 8V11M10 14H10.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <h3 className="text-sm font-semibold text-red-800">Something went wrong</h3>
          </div>
          <p className="text-sm text-red-600 mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
