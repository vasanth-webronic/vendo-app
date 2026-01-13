import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import '../index.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Vamo Store - Vending Machine',
  description: 'Vending Machine Mobile Web Application',
  manifest: '/manifest.json',
  themeColor: '#4A90D9',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Vamo Store',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icon-192.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
