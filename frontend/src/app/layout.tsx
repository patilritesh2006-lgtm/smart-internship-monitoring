import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Smart Internship Management & Monitoring System",
  description:
    "Next-generation academic internship tracking platform with explainable deterministic intelligence, skill gap analysis, and progress monitoring.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased bg-slate-100 text-slate-800 min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
