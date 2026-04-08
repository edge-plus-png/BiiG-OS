import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BiiG OS",
  description: "Weekly networking operations for BiiG.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BiiG OS",
  },
};

export const viewport = {
  themeColor: "#0B54A3",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
