import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import AuthSync from "@/components/AuthSync";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import PwaManager from "@/components/PwaManager";
import { ClerkProvider } from "@clerk/nextjs";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: "HabitFlow | Modern Atomic Habit Tracker",
  description: "Track habits, sleep, and screentime with an interaction-first behavioral operating system based on Atomic Habits.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "HabitFlow",
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
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
        <head>
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="apple-mobile-web-app-title" content="HabitFlow" />
          <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        </head>
        <body className={`${inter.className} bg-[#09090b] text-zinc-100 min-h-screen flex flex-col md:flex-row relative selection:bg-blue-600/30 selection:text-blue-200`}>
          {/* Ambient background glow */}
          <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
            <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/10 blur-[140px] rounded-full" />
            <div className="absolute top-[60%] -right-[10%] w-[500px] h-[400px] bg-violet-600/8 blur-[150px] rounded-full" />
          </div>
          <AuthSync />
          <PwaManager />
          <KeyboardShortcuts />
          <Sidebar />
          <main className="flex-1 md:ml-64 p-4 sm:p-6 md:p-8 min-h-screen overflow-y-auto">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}
