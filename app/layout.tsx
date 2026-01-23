import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Data Catalog - ISOC",
  description: "Data Catalog Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
