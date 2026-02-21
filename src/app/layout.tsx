// import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Metadata } from "next";
import ClientAuthProvider from '@/components/ClientAuthProvider';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "FixTray - Work Order Management",
  description: "Streamlined work order management for roadside and in-shop services",
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
        </ClientAuthProvider>
      </body>
    </html>
  );
}
