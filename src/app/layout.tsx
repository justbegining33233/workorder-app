import "./globals.css";
import { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import ClientAuthProvider from '@/components/ClientAuthProvider';
import OfflineBanner from '@/components/OfflineBanner';
import FloatingSignOut from '@/components/FloatingSignOut';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#e5332a',
};

export const metadata: Metadata = {
  title: "FixTray - Work Order Management",
  description: "Streamlined work order management for roadside and in-shop services",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FixTray',
  },
  // Performance optimizations
  other: {
    'dns-prefetch': 'https://res.cloudinary.com',
    'preconnect': 'https://api.stripe.com',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${plusJakartaSans.variable}`}>
        <ErrorBoundary>
          <ClientAuthProvider>
            {children}
            <OfflineBanner />
            <FloatingSignOut />
            <ServiceWorkerRegister />
          </ClientAuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
