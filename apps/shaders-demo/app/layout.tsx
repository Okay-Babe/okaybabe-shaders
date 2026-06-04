import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '@okaybabe/shaders — local demo',
  description: 'Visual-verification surface for the okaybabe shader pack.',
  // Avoid public indexing — local dev only
  robots: 'noindex, nofollow',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
