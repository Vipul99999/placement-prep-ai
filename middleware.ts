import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedPaths = ["/dashboard", "/prep", "/account", "/admin"];

function isProtectedPath(pathname: string) {
  return protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();
  const isProd = process.env.NODE_ENV === "production";
  const csp = [
    "default-src 'self'",
    `script-src 'self'${isProd ? "" : " 'unsafe-eval'"}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://generativelanguage.googleapis.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join("; ");

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), browsing-topics=()"
  );
  if (isProd) {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  if (!isProtectedPath(pathname)) {
    return response;
  }

  if (
    process.env.E2E_BYPASS_AUTH === "1" &&
    request.cookies.get("e2e-bypass-auth")?.value === "1"
  ) {
    return response;
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/prep/:path*", "/account/:path*", "/admin/:path*"]
};
