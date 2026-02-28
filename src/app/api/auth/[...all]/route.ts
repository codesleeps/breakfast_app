import { auth } from "@/server-lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handler = toNextJsHandler(auth);

export async function GET(request: Request) {
  try {
    return await handler.GET(request);
  } catch (error: unknown) {
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : String(error)
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function POST(request: Request) {
  // Try using auth.handler directly instead of toNextJsHandler
  try {
    const url = new URL(request.url);
    const body = await request.json();
    
    // Direct call to auth API
    const result = await auth.api.signInSocial({
      body: {
        provider: body.provider,
        callbackURL: body.callbackURL || "/",
      },
    });
    
    return new Response(JSON.stringify({ 
      success: true,
      result 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: unknown) {
    const err = error as Error;
    return new Response(JSON.stringify({ 
      directCallError: true,
      error: err.message,
      stack: err.stack,
      name: err.name
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
