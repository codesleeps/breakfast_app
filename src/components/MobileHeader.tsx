"use client";

import { Menu } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

export function MobileHeader() {
  const { isMobile, toggleSidebar } = useSidebar();

  if (!isMobile) {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-20 flex h-12 items-center justify-between border-b border-sidebar-border bg-sidebar px-4 md:hidden">
      <Button variant="ghost" size="icon" onClick={toggleSidebar}>
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle Menu</span>
      </Button>
      <span className="font-semibold">{process.env.NEXT_PUBLIC_APP_NAME || "Breakfast App"}</span>
      <ThemeToggle />
    </header>
  );
}
