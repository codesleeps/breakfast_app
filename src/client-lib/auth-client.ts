import { createAuthClient } from "better-auth/react";

const authBaseUrl = process.env.NEXT_PUBLIC_AUTH_URL ?? "";

export const authClient = createAuthClient({
  baseURL: authBaseUrl,
});

export function getAuthClient() {
  if (process.env.NEXT_PUBLIC_DEV_USER_NAME) {
    return {
      data: {
        user: {
          name: process.env.NEXT_PUBLIC_DEV_USER_NAME,
          email: process.env.NEXT_PUBLIC_DEV_USER_EMAIL,
          image: process.env.NEXT_PUBLIC_DEV_USER_IMAGE ?? undefined,
          phone: process.env.NEXT_PUBLIC_DEV_USER_PHONE ?? undefined,
        },
      },
    };
  }

  return authClient.useSession();
}
