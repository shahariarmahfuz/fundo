import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fundo Foundation | Ethical Financing & Transparent Community Impact',
  description: 'Production-ready Foundation Management & Public Platform providing transparent micro-financing, charitable stewardship, and verified social progress.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-teal-100 selection:text-teal-900">
        {children}
      </body>
    </html>
  );
}
