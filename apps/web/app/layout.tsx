import type { Metadata } from "next";
import { cookies } from "next/headers";
import { GeistSans } from "geist/font/sans";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LenisProvider } from "@/components/providers/LenisProvider";
import { GsapProvider } from "@/components/providers/GsapProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageTransition } from "@/components/shared/PageTransition";
import { SELECTED_ROLE_COOKIE, isSelectedRole } from "@/lib/role";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:4000"),
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
  const cookieValue = (await cookies()).get(SELECTED_ROLE_COOKIE)?.value;
  const role = isSelectedRole(cookieValue) ? cookieValue : null;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <LenisProvider>
            <GsapProvider>
              <Navbar role={role} />
              <main className="flex-1">
                <PageTransition>{children}</PageTransition>
              </main>
              <Footer role={role} />
            </GsapProvider>
          </LenisProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
