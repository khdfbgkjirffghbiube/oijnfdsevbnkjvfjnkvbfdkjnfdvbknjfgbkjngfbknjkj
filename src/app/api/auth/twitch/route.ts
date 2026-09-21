import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getAppOrigin } from "@/lib/url";
import { isTwitchConfigured } from "@/lib/runtime";
import { shouldUseSecureCookies } from "@/lib/session";

export async function GET(request: NextRequest) {
  const clientId = process.env.TWITCH_CLIENT_ID;
  if (!clientId || !isTwitchConfigured()) {
    return NextResponse.redirect(
      new URL("/app?authError=twitch_not_configured", request.url),
    );
  }

  const state = randomBytes(24).toString("hex");
  const origin = getAppOrigin(request);
  const redirectUri = `${origin}/api/auth/twitch/callback`;
  const authorize = new URL("https://id.twitch.tv/oauth2/authorize");
  authorize.searchParams.set("client_id", clientId);
  authorize.searchParams.set("redirect_uri", redirectUri);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("scope", "user:read:email");
  authorize.searchParams.set("state", state);

  const response = NextResponse.redirect(authorize);
  response.cookies.set("taskdrop_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
    maxAge: 600,
  });
  return response;
}
