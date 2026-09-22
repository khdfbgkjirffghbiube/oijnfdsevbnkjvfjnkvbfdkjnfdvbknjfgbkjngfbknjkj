import { NextRequest, NextResponse } from "next/server";
import { setSession } from "@/lib/session";
import { upsertTwitchUser } from "@/lib/store";
import { getAppOrigin } from "@/lib/url";

type TwitchTokenResponse = {
  access_token?: string;
};

type TwitchUsersResponse = {
  data?: Array<{
    id: string;
    login: string;
    display_name: string;
    profile_image_url?: string;
  }>;
};

function fail(request: NextRequest, reason: string) {
  return NextResponse.redirect(
    new URL(`/app?authError=${reason}`, getAppOrigin(request)),
  );
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const oauthError = request.nextUrl.searchParams.get("error");
  const savedState = request.cookies.get("taskdrop_oauth_state")?.value;
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!state || !savedState || state !== savedState) {
    return fail(request, "invalid_state");
  }
  if (oauthError) return fail(request, "access_denied");
  if (!code) return fail(request, "token_missing");
  if (!clientId || !clientSecret) {
    return fail(request, "twitch_not_configured");
  }

  try {
    const origin = getAppOrigin(request);
    const redirectUri = `${origin}/api/auth/twitch/callback`;
    const tokenUrl = new URL("https://id.twitch.tv/oauth2/token");
    tokenUrl.searchParams.set("client_id", clientId);
    tokenUrl.searchParams.set("client_secret", clientSecret);
    tokenUrl.searchParams.set("code", code);
    tokenUrl.searchParams.set("grant_type", "authorization_code");
    tokenUrl.searchParams.set("redirect_uri", redirectUri);

    const tokenResponse = await fetch(tokenUrl, { method: "POST" });
    if (!tokenResponse.ok) return fail(request, "token_exchange_failed");
    const token = (await tokenResponse.json()) as TwitchTokenResponse;
    if (!token.access_token) return fail(request, "token_missing");

    const usersResponse = await fetch("https://api.twitch.tv/helix/users", {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "Client-Id": clientId,
      },
      cache: "no-store",
    });
    if (!usersResponse.ok) return fail(request, "profile_failed");
    const users = (await usersResponse.json()) as TwitchUsersResponse;
    const profile = users.data?.[0];
    if (!profile) return fail(request, "profile_missing");

    const user = await upsertTwitchUser({
      id: profile.id,
      login: profile.login,
      displayName: profile.display_name,
      avatarUrl: profile.profile_image_url,
    });
    const response = NextResponse.redirect(
      new URL("/app", getAppOrigin(request)),
    );
    response.cookies.delete("taskdrop_oauth_state");
    setSession(response, user.id);
    return response;
  } catch {
    return fail(request, "unexpected_error");
  }
}
