'use client';

import React, { useState } from 'react';
import { ContributionContract } from '@/lib/types';
import { generateProofBundleMarkdown, generateProofBundleJson } from '@/lib/proof-bundle';
import { Download, FileText, Check, Copy, X, Code2 } from 'lucide-react';

interface ProofBundleExportModalProps {
  contract: ContributionContract;
  isOpen: boolean;
  onClose: () => void;
}

export function ProofBundleExportModal({ contract, isOpen, onClose }: ProofBundleExportModalProps) {
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<'markdown' | 'json'>('markdown');

  if (!isOpen) return null;

  const markdownContent = generateProofBundleMarkdown(contract);
  const jsonContent = generateProofBundleJson(contract);
  const activeContent = format === 'markdown' ? markdownContent : jsonContent;

  const fileName = `issuelift-proof-bundle-${contract.issue_metadata.owner}-${contract.issue_metadata.repo}-${contract.issue_metadata.number}.${
    format === 'markdown' ? 'md' : 'json'
  }`;

  const handleDownload = () => {
    const blob = new Blob([activeContent], {
      type: format === 'markdown' ? 'text/markdown;charset=utf-8' : 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-white rounded-2xl border border-ink-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-ink-border flex items-center justify-between bg-canvas-subtle/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl gradient-accent text-white shadow-sm">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-ink">Download Contribution Proof Bundle</h3>
              <p className="text-xs text-ink-muted">
                Pre-implementation evidence trail matching current on-screen contract.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-ink-border/50 text-ink-muted hover:text-ink transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector */}
        <div className="px-5 py-3 border-b border-ink-border/50 flex items-center justify-between text-xs bg-white">
          <div className="flex items-center gap-2">
            <span className="text-ink-muted font-medium">Export Format:</span>
            <button
              onClick={() => setFormat('markdown')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                format === 'markdown'
                  ? 'bg-electric-indigo text-white'
                  : 'bg-canvas-subtle text-ink hover:bg-canvas-subtle/80'
              }`}
            >
              Markdown (.md)
            </button>
            <button
              onClick={() => setFormat('json')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                format === 'json'
                  ? 'bg-electric-indigo text-white'
                  : 'bg-canvas-subtle text-ink hover:bg-canvas-subtle/80'
              }`}
            >
              JSON (.json)
            </button>
          </div>

          <span className="font-mono text-ink-faint text-[11px] hidden sm:inline">{fileName}</span>
        </div>

        {/* Preview Content */}
        <div className="p-5 flex-1 overflow-y-auto bg-canvas-subtle/30 font-mono text-xs text-ink whitespace-pre-wrap leading-relaxed select-all border-b border-ink-border">
          {activeContent}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-ink-faint">
            *Export is generated synchronously from validated in-memory contract (0 extra API calls).
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopy}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl border border-ink-border hover:bg-canvas-subtle text-ink text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Text'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex-1 sm:flex-initial px-5 py-2 rounded-xl gradient-accent text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-electric-indigo/20 hover:opacity-95 transition-opacity cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
