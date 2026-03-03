import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BiiG OS",
  description: "Weekly networking operations for BiiG.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
