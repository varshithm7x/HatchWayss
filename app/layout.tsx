import type { Metadata } from "next";
import { Mona_Sans, Urbanist } from "next/font/google";
import "./globals.css";

const monaSans = Mona_Sans({
  variable: "--font-mona-sans",
  subsets: ["latin"],
});

const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hatchways",
  description: "Your Personal AI Powered Mock Interviewer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark ">
      <body className={`${monaSans.variable} ${urbanist.variable} ${urbanist.className} antialiased pattern`}>
        {children}
      </body>
    </html>
  );
}
