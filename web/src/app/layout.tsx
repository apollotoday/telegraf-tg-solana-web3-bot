import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "./providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["100", "400", "600", "800"],
  style: "normal",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MomentumAI",
  description:
    "Next-level market making, with decision making driven by AI - automating trading, liquidity and treasury management for tokens.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
