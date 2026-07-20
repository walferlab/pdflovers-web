import "./globals.css";
import { Metadata } from "next";
import Navbar from "@/components/UI/Navbar";

export const metadata:Metadata = {
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
        url: 'https://pdflovers.app/og-image.jpg', // Create a striking 1200x630px image
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
    images: ['https://pdflovers.app/twitter-image.jpg'], // Can reuse the OG image
  },

  // 5. Robots directives (Explicitly telling Google to crawl and feature your snippets)
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
    <html lang="en">
      <head>
        <link href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&f[]=clash-grotesk@400,500,600,700&display=swap" rel="stylesheet" />
      </head>
      <body className="w-full flex flex-col items-center p-2">
        <Navbar />
        <div className="max-w-7xl w-full mt-16 pt-5 sm:pt-8">
          {children}
        </div>
      </body>
    </html>
  );
}
