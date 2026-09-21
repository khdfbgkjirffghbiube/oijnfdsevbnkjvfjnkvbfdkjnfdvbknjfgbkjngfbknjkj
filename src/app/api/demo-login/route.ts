import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { setSession } from "@/lib/session";
import { isDemoModeEnabled } from "@/lib/runtime";

function login(role: string | null) {
  if (!isDemoModeEnabled()) {
    return apiError("Демо-вход отключён.", 403);
  }
  if (role !== "viewer" && role !== "streamer") {
    return apiError("Выберите роль зрителя или стримера.");
  }
  const response = NextResponse.json({ ok: true });
  setSession(response, role === "viewer" ? "demo-viewer" : "streamer-foxxy");
  return response;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { role?: string };
  return login(body.role ?? null);
}

export async function GET(request: NextRequest) {
  const response = login(request.nextUrl.searchParams.get("role"));
  if (response.status !== 200) return response;
  const redirect = NextResponse.redirect(new URL("/app", request.url));
  const role = request.nextUrl.searchParams.get("role");
  setSession(redirect, role === "viewer" ? "demo-viewer" : "streamer-foxxy");
  return redirect;
}
