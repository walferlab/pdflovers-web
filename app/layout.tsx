import "./globals.css";
import { Metadata } from "next";
import Navbar from "@/components/UI/Navbar";
import localFont from "next/font/local";

const generalSans = localFont({
  src: [
    { path: "./fonts/GeneralSans-Regular.woff2",  weight: "400", style: "normal" },
    { path: "./fonts/GeneralSans-Medium.woff2",   weight: "500", style: "normal" },
    { path: "./fonts/GeneralSans-Semibold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/GeneralSans-Bold.woff2",     weight: "700", style: "normal" },
  ],
  variable: "--font-general",
  display: "swap",
});

const clashGrotesk = localFont({
  src: [
    { path: "./fonts/ClashGrotesk-Regular.woff2",  weight: "400", style: "normal" },
    { path: "./fonts/ClashGrotesk-Medium.woff2",   weight: "500", style: "normal" },
    { path: "./fonts/ClashGrotesk-Semibold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/ClashGrotesk-Bold.woff2",     weight: "700", style: "normal" },
  ],
  variable: "--font-cabinet",
  display: "swap",
});

export const metadata: Metadata = {
  keywords: ['digital products marketplace', 'buy ebooks online', 'sell digital downloads', 'PDF marketplace', 'instant download docs'],
  alternates: {
    canonical: 'https://pdflovers.app',
  },

  // 3. Open Graph (For rich previews on Discord, WhatsApp, LinkedIn, Facebook)
  openGraph: {
    title: 'PDF Lovers | Buy & Sell Digital Products',
    description: 'Empower your digital journey with PDF Lovers. Buy, sell, and download premium ebooks and digital products instantly.',
    url: 'https://pdflovers.app',
    siteName: 'PDF Lovers',
    images: [
      {
        url: 'https://pdflovers.app/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'PDF Lovers Marketplace Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  // 4. Twitter Cards (For rich previews on X/Twitter)
  twitter: {
    card: 'summary_large_image',
    title: 'PDF Lovers | The Digital Products Marketplace',
    description: 'Empower your digital journey with PDF Lovers. Buy, sell, and download premium ebooks instantly.',
    images: ['https://pdflovers.app/twitter-image.jpg'],
  },

  // 5. Robots directives
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${generalSans.variable} ${clashGrotesk.variable}`}>
      <body className="w-full flex flex-col items-center p-2">
        <Navbar />
        <div className="max-w-7xl w-full mt-14 pt-2 sm:pt-8">
          {children}
        </div>
      </body>
    </html>
  );
}
