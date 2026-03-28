'use client';

import { useState } from 'react';

interface GrantParagraphProps {
  grant: string;
  isStreaming?: boolean;
}

export default function GrantParagraph({ grant, isStreaming }: GrantParagraphProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!grant) return;
    try {
      await navigator.clipboard.writeText(grant);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
          FTA Pilot Program — Draft Language
        </span>
        <button
          onClick={handleCopy}
          disabled={!grant}
          className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-md transition-colors disabled:opacity-40"
        >
          {copied ? (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="3.5" y="3.5" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1" fill="none" />
                <path d="M8.5 3.5V2.5C8.5 1.95 8.05 1.5 7.5 1.5H2.5C1.95 1.5 1.5 1.95 1.5 2.5V7.5C1.5 8.05 1.95 8.5 2.5 8.5H3.5" stroke="currentColor" strokeWidth="1" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      {grant ? (
        <p className="text-[12px] text-blue-900/80 leading-relaxed">
          {grant}
          {isStreaming && (
            <span className="inline-block w-[2px] h-3 bg-blue-500 ml-0.5 animate-cursor-blink align-middle" />
          )}
        </p>
      ) : (
        <p className="text-[12px] text-blue-400 italic">
          Grant language generating...
        </p>
      )}
    </div>
  );
}
