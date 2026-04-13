import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { ClerkProvider } from "@clerk/nextjs";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HabitFlow | Modern Habit Tracker",
  description: "Track your habits with a sleek, dark interaction-focused UI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      afterSignOutUrl="/"
      appearance={{
        baseTheme: undefined, // customize if needed
        variables: { colorPrimary: '#3b82f6' }
      }}
    >
      <html lang="en" className="dark scroll-smooth">
        <body className={`${inter.className} bg-[#09090b] text-zinc-100 min-h-screen flex`}>
          <Sidebar />
          <main className="flex-1 ml-64 p-8 min-h-screen overflow-y-auto">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}
