"use client";

import { ExternalLink, Menu } from "lucide-react";
import Link from "next/link";
import { authClient, getAuthActiveOrganization, getAuthClient } from "@/client-lib/auth-client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  Sidebar as SidebarPrimitive,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { NAV_LINKS } from "@/config/nav-links";

const authUrl = process.env.NEXT_PUBLIC_AUTH_URL ?? "";

export function Sidebar() {
  const { data: session } = getAuthClient();
  const { data: activeOrganization } = getAuthActiveOrganization();
  const { state, isMobile, toggleSidebar } = useSidebar();
  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = `${authUrl}/login`;
        },
      },
    });
  };
  return (
    <SidebarPrimitive collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center justify-between px-[2px] py-2 gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isMobile ? (
              <Button variant="ghost" size="icon" onClick={toggleSidebar} className="shrink-0">
                <Menu className="h-4 w-4" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            ) : (
              <SidebarTrigger className="shrink-0" />
            )}
            {state === "expanded" && (
              <span className="font-semibold text-sidebar-foreground truncate">
                {process.env.NEXT_PUBLIC_APP_NAME || "Breakfast App"}
              </span>
            )}
          </div>
          {state === "expanded" && <ThemeToggle />}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_LINKS.map((link) => (
                <SidebarMenuItem key={link.href}>
                  <SidebarMenuButton asChild>
                    <Link href={link.href}>
                      <link.icon />
                      <span>{link.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {session && (
        <SidebarFooter className="border-t border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="w-full outline-none">
                  <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session.user.image ?? undefined} />
                      <AvatarFallback className="text-xs bg-sidebar-accent text-sidebar-accent-foreground">
                        {session.user.name?.[0]?.toUpperCase() ?? session.user.email?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-left text-sm">
                      <span className="font-medium">{session.user.name ?? "User"}</span>
                      <span className="text-xs text-sidebar-foreground/70">{session.user.email}</span>
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="right" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{session.user.name ?? "User"}</p>
                    <p className="text-xs text-muted-foreground">{session.user.email}</p>
                    {"phone" in session.user && session.user.phone && (
                      <p className="text-xs text-muted-foreground">{session.user.phone}</p>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Organization</p>
                    <p className="text-sm">{activeOrganization?.name ?? "No organization selected"}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => window.open(`${authUrl}/organizations`, "_blank")}
                  >
                    Manage organizations <ExternalLink className="ml-auto w-4 h-4" />
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled={true} className="cursor-pointer" onClick={handleSignOut}>
                    <span className="text-destructive font-semibold">Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}
    </SidebarPrimitive>
  );
}
