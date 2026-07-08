import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LenisProvider } from "@/components/providers/LenisProvider";
import { GsapProvider } from "@/components/providers/GsapProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/home/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BIKIE — Find Your Next Ride",
  description: "India's premium motorcycle travel platform. Rent premium motorcycles anywhere.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <LenisProvider>
            <GsapProvider>
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </GsapProvider>
          </LenisProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
