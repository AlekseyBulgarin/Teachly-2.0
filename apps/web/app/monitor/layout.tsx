import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Teachly Monitor',
  robots: { index: false, follow: false, nocache: true },
};

export default function MonitorLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
