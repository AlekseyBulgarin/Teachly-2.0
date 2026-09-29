import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Teachly Ecosystem',
  description: 'Единое ядро. Связанные образовательные модули. Одна интеграция.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
