import type { Metadata, Viewport } from 'next';
import { ClientLayout } from '@/components/layout/ClientLayout';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'CraftyKidsCo | শিশুদের নিরাপদ মোমের রঙ ও খেলনা',
  description:
    'বাংলাদেশের বাচ্চাদের জন্য নিরাপদ নন-টক্সিক মোমের রঙ (Mom er Color), শিক্ষণীয় খেলনা এবং স্পেশাল গিফট কম্বো। দ্রুত হোম ডেলিভারি ও ক্যাশ অন ডেলিভারি।',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;500;600;700;800&family=Hind+Siliguri:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="bg-[#FAF7F2] text-[#2B2B2B] antialiased min-h-screen flex flex-col font-sans"
        suppressHydrationWarning
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
