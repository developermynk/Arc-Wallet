import type { Metadata } from "next";
import { ArcWalletProvider } from "@/contexts/ArcWalletProvider";
import { SwapProvider } from "@/contexts/SwapProvider";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { Sidebar } from "@/components/sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arc Wallet",
  description: "Arc network wallet powered by Circle AppKit",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-zinc-950 dark:bg-zinc-950 text-zinc-100 transition-colors duration-200">
        <ThemeProvider>
          <ArcWalletProvider>
            <SwapProvider>
              <div className="flex h-screen overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-auto bg-zinc-950 dark:bg-zinc-950 p-6">{children}</main>
              </div>
            </SwapProvider>
          </ArcWalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
