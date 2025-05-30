import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import WalletContextProvider from "./Components/WalletProvider";
import Navbar from "./Components/Navbar";
import { StarsBackground } from "./Components/StarBackground";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mintify",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletContextProvider>
          <StarsBackground starDensity={0.0005} minTwinkleSpeed={0.2} maxTwinkleSpeed={0.5} />
          <Navbar />
          {children}
        </WalletContextProvider>
      </body>
    </html>
  );
}
