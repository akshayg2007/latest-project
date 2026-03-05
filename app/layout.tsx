import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Plus_Jakarta_Sans, Bricolage_Grotesque } from "next/font/google";
// Components
import Navbar from "./Navbar";
import Footer from "./Footer";
import { Providers } from "@/components/Providers";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import { GlobalNavFooter } from "@/components/GlobalNavFooter";

import { auth } from "@/auth";

// Configure Fonts
const font = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans" });
const logoFont = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-logo" });

export const metadata: Metadata = {
  title: "Truework",
  description: "Freelance Marketplace",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en">
      <body className={cn(
        "min-h-screen w-full bg-white text-slate-900 antialiased flex flex-col",
        font.variable,
        logoFont.variable,
        font.className // Applies the font class
      )}>
        <Providers session={session}>
          <ImpersonationBanner />
          <GlobalNavFooter navbar={<Navbar />} footer={<Footer />}>
            {children}
          </GlobalNavFooter>
        </Providers>
      </body>
    </html>
  );
}