import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dahira Connect',
  description: 'Simple Dahira management SaaS MVP'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
