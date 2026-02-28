"use client";

import { Home, LogIn } from "lucide-react";
import Link from "next/link";
import { authClient, getAuthClient } from "@/client-lib/auth-client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Topbar() {
  const { data: session } = getAuthClient();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/";
        },
      },
    });
  };

  const handleSignIn = () => {
    authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
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
            {session ? (
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
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={handleSignOut}>
                    <span className="text-destructive font-semibold">Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button onClick={handleSignIn} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition">
                <LogIn className="h-4 w-4" />
                <span>Sign in</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
