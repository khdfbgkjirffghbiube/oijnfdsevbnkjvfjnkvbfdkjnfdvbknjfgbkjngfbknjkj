import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { readDatabase } from "@/lib/store";
import {
  getStorageMode,
  isDemoModeEnabled,
  isTwitchConfigured,
} from "@/lib/runtime";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const userId = getSessionUserId(request);
  const database = await readDatabase();
  const user = userId
    ? (database.users.find((candidate) => candidate.id === userId) ?? null)
    : null;
  const streamers = database.users
    .filter((candidate) => candidate.isStreamer)
    .map(
      ({
        id,
        login,
        displayName,
        avatarUrl,
        category,
        tagline,
        live,
        viewers,
        accent,
      }) => ({
        id,
        login,
        displayName,
        avatarUrl,
        category,
        tagline,
        live,
        viewers,
        accent,
      }),
    );

  const tasks = user
    ? database.tasks
        .filter(
          (task) => task.viewerId === user.id || task.streamerId === user.id,
        )
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map((task) => ({
          ...task,
          viewer: database.users.find((candidate) => candidate.id === task.viewerId)
            ?.displayName,
          streamer: database.users.find(
            (candidate) => candidate.id === task.streamerId,
          )?.displayName,
        }))
    : [];

  const withdrawals = user
    ? database.withdrawals.filter((item) => item.userId === user.id)
    : [];

  return NextResponse.json({
    user,
    streamers,
    tasks,
    withdrawals,
    capabilities: {
      twitchConfigured: isTwitchConfigured(),
      demoMode: isDemoModeEnabled(),
      storageMode: getStorageMode(),
    },
  });
}
