import "./globals.css";
import { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { headers } from 'next/headers';
import ClientAuthProvider from '@/components/ClientAuthProvider';
import OfflineBanner from '@/components/OfflineBanner';
import FloatingSignOut from '@/components/FloatingSignOut';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import { NativeProvider } from '@/context/NativeContext';

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read the native flag injected by middleware (from the Android cookie).
  // This runs server-side so the correct layout is rendered from byte 1.
  const headersList = await headers();
  const nativeHeader = headersList.get('x-fixtray-native') as 'android' | 'ios' | null;
  const isNative = nativeHeader === 'android' || nativeHeader === 'ios';

  return (
    <html lang="en">
      <body className={`${inter.variable} ${plusJakartaSans.variable}`}>
        <ErrorBoundary>
          <NativeProvider isNative={isNative} platform={nativeHeader ?? null}>
            <ClientAuthProvider>
              {children}
              <OfflineBanner />
              <FloatingSignOut />
              <ServiceWorkerRegister />
            </ClientAuthProvider>
          </NativeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
