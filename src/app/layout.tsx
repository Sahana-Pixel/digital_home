import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "My House – Your personal digital house",
  description: "A calm space to organize your life, one room at a time.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="antialiased">
      <body className={`${inter.variable} font-sans bg-[#0B1220] text-[#F1F5F9]`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
