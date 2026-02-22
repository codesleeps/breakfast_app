import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

const authBaseUrl = process.env.NEXT_PUBLIC_AUTH_URL ?? "";

export const authClient = createAuthClient({
  baseURL: authBaseUrl,
  plugins: [organizationClient()],
});

export function getAuthClient() {
  if (process.env.NEXT_PUBLIC_DEV_USER_NAME) {
    return {
      data: {
        user: {
          name: process.env.NEXT_PUBLIC_DEV_USER_NAME,
          email: process.env.NEXT_PUBLIC_DEV_USER_EMAIL,
          image: process.env.NEXT_PUBLIC_DEV_USER_IMAGE ?? undefined,
        },
      },
    };
  }

  return authClient.useSession();
}

export function getAuthActiveOrganization() {
  if (process.env.NEXT_PUBLIC_DEV_USER_NAME) {
    return {
      data: {
        name: `${process.env.NEXT_PUBLIC_DEV_USER_NAME}'s org`,
      },
    };
  }

  return authClient.useActiveOrganization();
}
