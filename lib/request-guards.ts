import type { NextRequest } from "next/server";

function getExpectedOrigin(request: NextRequest) {
  const configuredOrigin = process.env.NEXTAUTH_URL?.trim();
  if (configuredOrigin) {
    try {
      return new URL(configuredOrigin).origin;
    } catch {}
  }

  return request.nextUrl.origin;
}

export function enforceSameOrigin(request: NextRequest) {
  const expectedOrigin = getExpectedOrigin(request);
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  if (origin && origin !== expectedOrigin) {
    throw new Error("Cross-origin request blocked");
  }

  if (!origin && referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (refererOrigin !== expectedOrigin) {
        throw new Error("Cross-origin request blocked");
      }
    } catch {
      throw new Error("Cross-origin request blocked");
    }
  }
}

export async function parseJsonBody<T>(request: NextRequest): Promise<T> {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error("Content-Type must be application/json");
  }

  try {
    return (await request.json()) as T;
  } catch {
    throw new Error("Invalid JSON request body");
  }
}

export function getRequestGuardErrorStatus(error: Error) {
  if (error.message === "Cross-origin request blocked") {
    return 403;
  }

  if (
    error.message === "Content-Type must be application/json" ||
    error.message === "Invalid JSON request body"
  ) {
    return 400;
  }

  return null;
}
