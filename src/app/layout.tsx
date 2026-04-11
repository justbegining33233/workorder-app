import "./globals.css";
import { Metadata, Viewport } from "next";
import ClientAuthProvider from '@/components/ClientAuthProvider';
import OfflineBanner from '@/components/OfflineBanner';
import FloatingSignOut from '@/components/FloatingSignOut';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

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
      <body>
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
