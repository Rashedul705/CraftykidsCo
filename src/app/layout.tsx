import type { Metadata } from 'next';
import { ClientLayout } from '@/components/layout/ClientLayout';
import './globals.css';

export const metadata: Metadata = {
  title: 'রংধনু কিডস (Rongdhonu Kids) | শিশুদের নিরাপদ মোমের রঙ ও খেলনা',
  description:
    'বাংলাদেশের বাচ্চাদের জন্য নিরাপদ নন-টক্সিক মোমের রঙ (Mom er Color), শিক্ষণীয় খেলনা এবং স্পেশাল গিফট কম্বো। দ্রুত হোম ডেলিভারি ও ক্যাশ অন ডেলিভারি।',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Hind+Siliguri:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#FAF7F2] text-[#2B2B2B] antialiased min-h-screen flex flex-col font-sans">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
