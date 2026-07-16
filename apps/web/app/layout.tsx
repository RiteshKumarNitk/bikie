import type { Metadata } from "next";
import { cookies } from "next/headers";
import { GeistSans } from "geist/font/sans";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LenisProvider } from "@/components/providers/LenisProvider";
import { GsapProvider } from "@/components/providers/GsapProvider";
import { ToastProvider } from "@/components/ui/Toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:4000")
  ),
  title: {
    default: "BIKIE — Find Your Next Ride",
    template: "%s | BIKIE",
  },
  description: "India's premium motorcycle travel platform. Rent premium motorcycles anywhere.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${inter.variable} antialiased`}
    >
      <body className="flex flex-col" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <LenisProvider>
            <GsapProvider>
              <ToastProvider>
                <main className="flex-1 flex flex-col">{children}</main>
              </ToastProvider>
            </GsapProvider>
          </LenisProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
