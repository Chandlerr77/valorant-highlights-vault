import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "高光存档",
  description: "个人《无畏契约》游戏高光视频存档",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh" className={`${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
