import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";
import ConsoleViewer from "@/components/ConsoleViewer";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "CollegeFind — Find the right college for your future",
  description: "Discover, compare, and get data-driven recommendations for colleges across India.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = headers().get("x-nonce") ?? undefined;

  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <ConsoleViewer />
      </body>
    </html>
  );
}
