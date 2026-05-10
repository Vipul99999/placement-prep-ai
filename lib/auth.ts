import { isAdminEmail } from "@/lib/audit";
import { compare } from "bcryptjs";
import { cookies } from "next/headers";
import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { requireEnv } from "@/lib/env";
import { getDb } from "@/lib/mongodb";
import { touchUserSession } from "@/lib/user";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || undefined,
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login"
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const db = await getDb();
        const user = await db.collection("users").findOne<{
          _id: { toString(): string };
          email: string;
          name?: string;
          emailVerifiedAt?: Date | null;
          passwordHash?: string;
        }>({
          email: credentials.email.toLowerCase().trim()
        });

        if (!user?.passwordHash) {
          return null;
        }

        const isValid = await compare(credentials.password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name ?? user.email.split("@")[0],
          emailVerified: Boolean(user.emailVerifiedAt)
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.emailVerified = Boolean(user.emailVerified);
        token.sessionId = crypto.randomUUID();
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        session.user.id = token.userId;
        session.user.emailVerified = Boolean(token.emailVerified);
        session.user.sessionId = token.sessionId;
      }

      return session;
    }
  }
};

export async function getAuthSession() {
  if (process.env.E2E_BYPASS_AUTH === "1") {
    const cookieStore = await cookies();
    if (cookieStore.get("e2e-bypass-auth")?.value === "1") {
      return {
        user: {
          id: "e2e-user",
          email: "e2e@example.com",
          name: "E2E User",
          emailVerified: true,
          sessionId: "e2e-session"
        },
        expires: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      };
    }
  }

  const session = await getServerSession(authOptions);
  if (session?.user?.id && session.user.sessionId) {
    const active = await touchUserSession({
      userId: session.user.id,
      sessionId: session.user.sessionId
    });
    if (!active) {
      return null;
    }
  }

  return session;
}

export async function requireUserSession() {
  requireEnv("NEXTAUTH_SECRET");
  const session = await getAuthSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireVerifiedUserSession() {
  const session = await requireUserSession();
  if (!session.user.emailVerified) {
    throw new Error("Email verification required");
  }

  return session;
}

export async function requireAdminSession() {
  const session = await requireUserSession();
  if (!session.user.email || !isAdminEmail(session.user.email)) {
    throw new Error("Forbidden");
  }

  return session;
}
