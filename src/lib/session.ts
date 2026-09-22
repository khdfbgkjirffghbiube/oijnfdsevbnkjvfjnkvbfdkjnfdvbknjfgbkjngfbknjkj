import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "taskdrop_session";

function secret() {
  return process.env.SESSION_SECRET || "taskdrop-local-development-secret";
}

export function shouldUseSecureCookies() {
  if (process.env.RENDER) return true;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl) return appUrl.startsWith("https://");
  return process.env.NODE_ENV === "production";
}

function signature(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function encodeSession(userId: string) {
  const encoded = Buffer.from(userId, "utf8").toString("base64url");
  return `${encoded}.${signature(encoded)}`;
}

export function getSessionUserId(request: NextRequest): string | null {
  const raw = request.cookies.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const [encoded, receivedSignature] = raw.split(".");
  if (!encoded || !receivedSignature) return null;

  const expected = signature(encoded);
  const receivedBuffer = Buffer.from(receivedSignature);
  const expectedBuffer = Buffer.from(expected);
  if (
    receivedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(receivedBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    return Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

export function setSession(response: NextResponse, userId: string) {
  response.cookies.set(COOKIE_NAME, encodeSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSession(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
    maxAge: 0,
  });
}
