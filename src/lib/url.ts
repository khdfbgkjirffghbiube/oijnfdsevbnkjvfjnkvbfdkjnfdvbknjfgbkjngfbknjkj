import type { NextRequest } from "next/server";

export function getAppOrigin(request: NextRequest) {
  const hostname = request.nextUrl.hostname;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return request.nextUrl.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
}

