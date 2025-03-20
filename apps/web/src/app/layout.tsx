import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getLocale } from "next-intl/server";
import type { PropsWithChildren } from "react";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Libranote",
  description:
    "Libranote is a note-taking app that allows you to take notes and share them with others.",
};

export default async function RootLayout({
  children,
}: PropsWithChildren) {
  const locale = await getLocale();

  return (
    <html lang={locale} className="theme-cream" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
