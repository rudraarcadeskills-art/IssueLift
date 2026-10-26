'use client';

import React, { useState } from 'react';
import { KeyRound, ChevronDown, ChevronUp, Copy, Check, ExternalLink } from 'lucide-react';

export function MissingKeyBanner() {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const envLine = 'GEMMA_API_KEY=your_api_key_here';

  const handleCopy = () => {
    navigator.clipboard.writeText(envLine);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-6 p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-amber-950 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-amber-900">
              Gemma 4 API Key Pending — Baseline Compiler Active
            </h4>
            <p className="text-xs text-amber-800/90 mt-0.5">
              Live GitHub data, Claim Gate, TraceMap, Setup Truth, and ProofBundle are fully functional using deterministic rules.
            </p>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-amber-100/80 hover:bg-amber-200/80 text-amber-900 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <span>One-Step Key Setup</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-amber-200/80 text-xs space-y-3 animate-in fade-in">
          <p className="text-amber-900">
            <strong>Exact Action:</strong> Add your Google AI Studio key to the git-ignored <code className="px-1.5 py-0.5 rounded bg-white font-mono text-[11px] border border-amber-300">.env.local</code> file in your IssueLift workspace root:
          </p>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/90 border border-amber-300 font-mono text-xs text-ink">
            <span>{envLine}</span>
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-amber-50 text-amber-800 transition-colors flex items-center gap-1"
              title="Copy snippet"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="text-[11px] font-sans font-medium">{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-amber-800">
            <span>• Key is free of charge on the Google AI Studio free tier.</span>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-electric-indigo underline"
            >
              Get Free Gemma Key <ExternalLink className="w-3 h-3" />
            </a>
            <span>• Never commit .env.local; keep it strictly server-side.</span>
          </div>
        </div>
      )}
    </div>
  );
}
