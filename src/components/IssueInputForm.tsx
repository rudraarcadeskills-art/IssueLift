'use client';

import React, { useState } from 'react';
import { Search, Sparkles, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

interface IssueInputFormProps {
  onScan: (url: string) => void;
  isLoading: boolean;
  error?: string | null;
}

export function IssueInputForm({ onScan, isLoading, error }: IssueInputFormProps) {
  const [url, setUrl] = useState('');

  const sampleIssues = [
    { label: 'React (Custom Attribute)', url: 'https://github.com/facebook/react/issues/1000' },
    { label: 'Next.js (App Router Config)', url: 'https://github.com/vercel/next.js/issues/50000' },
    { label: 'TypeScript (Compiler Option)', url: 'https://github.com/microsoft/TypeScript/issues/45000' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    onScan(url.trim());
  };

  const handleSelectSample = (sampleUrl: string) => {
    setUrl(sampleUrl);
    onScan(sampleUrl);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center shadow-card hover:shadow-card-hover transition-shadow rounded-2xl bg-white border border-ink-border focus-within:border-electric-indigo focus-within:ring-4 focus-within:ring-electric-indigo/10 p-2">
          <div className="pl-4 pr-2 text-ink-muted">
            <Search className="w-5 h-5 text-electric-indigo" />
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
            placeholder="Paste public GitHub issue URL (e.g. https://github.com/owner/repo/issues/123)"
            className="w-full py-3 px-2 text-base text-ink placeholder:text-ink-faint focus:outline-none bg-transparent"
          />
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="flex items-center gap-2 px-6 py-3 rounded-xl gradient-accent text-white font-medium text-sm shadow-md shadow-electric-indigo/25 hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Scanning...</span>
              </>
            ) : (
              <>
                <span>Scan Issue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Samples pills */}
      <div className="mt-3 flex flex-wrap items-center gap-2 justify-center sm:justify-start text-xs text-ink-muted">
        <span className="font-medium text-ink-soft">Quick samples:</span>
        {sampleIssues.map((sample) => (
          <button
            key={sample.url}
            type="button"
            disabled={isLoading}
            onClick={() => handleSelectSample(sample.url)}
            className="px-2.5 py-1 rounded-lg bg-white/80 hover:bg-white border border-ink-border/80 text-ink-soft hover:text-electric-indigo hover:border-electric-indigo/40 transition-all cursor-pointer"
          >
            {sample.label}
          </button>
        ))}
      </div>

      {/* Error state alert */}
      {error && (
        <div className="mt-4 p-4 rounded-xl bg-caution-surface border border-caution-border text-caution-coral flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong className="font-semibold block mb-0.5">Scan Notice:</strong>
            <p className="leading-relaxed">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
