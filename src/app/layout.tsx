import "globals.css";

import { type Metadata, type Viewport } from "next";
import { Inter } from "next/font/google";
import { Sidebar } from "@/components/Sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { NAV_LINKS } from "@/config/nav-links";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const appName = process.env.NEXT_PUBLIC_APP_NAME || "Breakfast App";

export const metadata: Metadata = {
  title: appName,
  description: `${appName} - Community Breakfast Ordering`,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Community Breakfast",
  },
};

export const viewport: Viewport = {
  themeColor: "#f59e0b",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.className}`}>
      <body className="min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <a href="#main-content" className="skip-to-content">
            Skip to main content
          </a>
          {NAV_LINKS.length >= 2 ? (
            <SidebarProvider>
              <div className="print:hidden">
                <Sidebar />
              </div>
              <SidebarInset className="print:!ml-0 print:!p-0">
                <main id="main-content" className="flex-1 p-4 print:p-0">{children}</main>
              </SidebarInset>
            </SidebarProvider>
          ) : (
            <main id="main-content" className="flex-1 p-4 print:p-0">{children}</main>
          )}
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
