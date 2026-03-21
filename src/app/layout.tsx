import "./globals.css";
import { Metadata, Viewport } from "next";
import ClientAuthProvider from '@/components/ClientAuthProvider';
import OfflineBanner from '@/components/OfflineBanner';
import FloatingSignOut from '@/components/FloatingSignOut';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',          // enables env(safe-area-inset-*) on iOS + Android Chrome
  themeColor: '#e5332a',         // Android Chrome toolbar color
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ClientAuthProvider>
          {children}
          <OfflineBanner />
          <FloatingSignOut />
        </ClientAuthProvider>
      </body>
    </html>
  );
}
