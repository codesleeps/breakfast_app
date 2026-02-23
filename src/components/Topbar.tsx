"use client";

import { ExternalLink, Home } from "lucide-react";
import Link from "next/link";
import { authClient, getAuthActiveOrganization, getAuthClient } from "@/client-lib/auth-client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const authUrl = process.env.NEXT_PUBLIC_AUTH_URL ?? "";

export function Topbar() {
  const { data: session } = getAuthClient();
  const { data: activeOrganization } = getAuthActiveOrganization();

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
    <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-950 shadow-sm border-b border-gray-200 dark:border-gray-800 z-[10] h-12">
      <div className="mx-auto h-full px-8">
        <div className="flex justify-between items-center h-full">
          <Link href="/" className="hover:opacity-75 transition">
            <Home className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {session && (
              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={session.user.image ?? undefined} />
                    <AvatarFallback className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                      {session.user.name?.[0]?.toUpperCase() ?? session.user.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {session.user.name ?? "User"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{session.user.email}</p>
                    {"phone" in session.user && session.user.phone && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{session.user.phone}</p>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Organization</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {activeOrganization?.name ?? "No organization selected"}
                    </p>
                  </div>
                  <DropdownMenuItem
                    className="text-gray-600 dark:text-gray-400 cursor-pointer"
                    onClick={() => window.open(`${authUrl}/organizations`, "_blank")}
                  >
                    Manage organizations <ExternalLink className="w-4 h-4" />
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled={true} className="cursor-pointer" onClick={handleSignOut}>
                    <span className="text-destructive font-semibold">Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
