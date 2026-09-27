import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Teachly Ecosystem',
  description: 'Educational Intelligence infrastructure for modern learning platforms.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
