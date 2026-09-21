import { NextRequest, NextResponse } from "next/server";
import { clearSession } from "@/lib/session";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearSession(response);
  return response;
}

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.url));
  clearSession(response);
  return response;
}
