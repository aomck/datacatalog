import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

const kanit = Kanit({
  weight: "400",
  subsets: ["latin", "thai"],
  variable: "--font-kanit",
});

export const metadata: Metadata = {
  title: "ศูนย์กลางข้อมูลด้านความมั่นคง",
  description: "ศูนย์กลางข้อมูลด้านความมั่นคง",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${kanit.variable} font-sans antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
