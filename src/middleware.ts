import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";

  if (host.endsWith(".vercel.app")) {
    const url = new URL(request.url);
    url.host = "astonbreakfastclub.com";
    url.protocol = "https";
    return NextResponse.redirect(url.toString(), 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico|sw.js|push-sw.js|workbox-.*\\.js|manifest.json).*)",
};
