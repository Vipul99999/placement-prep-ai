import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      emailVerified?: boolean;
      sessionId?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    emailVerified?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    emailVerified?: boolean;
    sessionId?: string;
  }
}
