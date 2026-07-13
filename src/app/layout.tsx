import type { Metadata, Viewport } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";
import PWAProviders from "@/components/PWAProviders";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aeva — AI FemTech & Cycle-Syncing Vault",
  description: "A HIPAA-compliant, zero-knowledge encrypted AI ecosystem synchronizing women's cycle fitness, menopause symptoms, and hormonal health.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Aeva",
  },
};

export const viewport: Viewport = {
  themeColor: "#FAF6F0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${playfair.variable} h-full`}>
      <body className="bg-slate-200 flex min-h-screen items-center justify-center font-sans antialiased text-slate-900">
        {/* Centered mobile-first canvas wrapper */}
        <div className="relative flex h-full min-h-screen md:h-[85vh] w-full max-w-[480px] flex-col overflow-hidden bg-cream-50 shadow-2xl md:rounded-[40px] border border-cream-200/50">
          <PWAProviders>
            {children}
          </PWAProviders>
        </div>
      </body>
    </html>
  );
}
