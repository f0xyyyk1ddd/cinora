import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import YandexMetrika from "@/components/YandexMetrika";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

import MobileStubWrapper from "@/components/MobileStubWrapper";

export const metadata: Metadata = {
  title: "CINORA | КИНОРА - Твой любимый кинотеатр",
  description: "Unlimited movies, TV shows, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.className} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col bg-[#0a0a0f] text-white">
        <YandexMetrika />
        <AuthProvider>
          <MobileStubWrapper>
            {children}
          </MobileStubWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
