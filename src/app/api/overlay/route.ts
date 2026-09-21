import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { readDatabase } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const streamerId = request.nextUrl.searchParams.get("streamerId");
  const key = request.nextUrl.searchParams.get("key");
  const preview = request.nextUrl.searchParams.get("preview") === "1";
  if (!streamerId) return apiError("Не указан стример.");

  const database = await readDatabase();
  const streamer = database.users.find(
    (user) => user.id === streamerId && user.isStreamer,
  );
  if (!streamer) return apiError("Стример не найден.", 404);
  if (!preview && key !== streamer.overlayKey) return apiError("Неверный ключ оверлея.", 403);

  const tasks = database.tasks
    .filter(
      (task) =>
        task.streamerId === streamer.id &&
        (task.status === "pending" || task.status === "accepted"),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)
    .map((task) => ({
      ...task,
      viewer:
        database.users.find((user) => user.id === task.viewerId)?.displayName ??
        "Зритель",
    }));

  return NextResponse.json({
    streamer: { id: streamer.id, displayName: streamer.displayName },
    tasks,
  });
}

