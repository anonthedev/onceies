import type { Metadata } from "next";
import { Comic_Neue } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/providers/SessionProvider";
import { Toaster } from "@/components/ui/sonner";
import Navbar from "@/components/Navbar";


const comicNeue = Comic_Neue({
  variable: "--font-comic-neue",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

export const metadata: Metadata = {
  title: "Onceies - Create Amazing Stories",
  description: "Onceies helps you create personalized, engaging stories for children. Generate unique tales with AI-powered storytelling that captivates young minds.",
  keywords: ["kids stories", "children's books", "story generator", "AI storytelling", "personalized stories", "bedtime stories"],
  authors: [{ name: "Onceies" }],
  creator: "Onceies",
  publisher: "Onceies",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://onceies.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Onceies - Create Amazing Stories",
    description: "Generate personalized, engaging stories for children with AI-powered storytelling.",
    url: "https://onceies.com",
    siteName: "Onceies",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Onceies - AI Story Generator for Kids",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Onceies - Create Amazing Stories",
    description: "Generate personalized, engaging stories for children with AI-powered storytelling.",
    images: ["/og-image.jpg"],
    creator: "@onceies",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${comicNeue.variable} antialiased`}
      >
        <SessionProvider>
          <Navbar />
          {children}
        </SessionProvider>
        <Toaster richColors duration={5000} theme="light" />
      </body>
    </html>
  );
}
