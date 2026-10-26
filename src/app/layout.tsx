import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'IssueLift v1.3 — Pre-Contribution Contract & TraceMap Engine',
  description:
    'Before a newcomer edits code, IssueLift converts a real GitHub issue into an evidence-backed Contribution Contract, maps criteria to test evidence, and exports a verified Proof Bundle. Powered by Google Gemma 4 and deterministic Claim Gate.',
  keywords: [
    'Hacktoberfest 2026',
    'Open Innovation',
    'Gemma 4',
    'GitHub REST',
    'Contribution Contract',
    'TraceMap',
    'Claim Gate',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-canvas text-ink antialiased selection:bg-electric-indigo selection:text-white">
        {children}
      </body>
    </html>
  );
}
