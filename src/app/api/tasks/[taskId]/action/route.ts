import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { getSessionUserId } from "@/lib/session";
import { makeId, updateDatabase } from "@/lib/store";

type Context = { params: Promise<{ taskId: string }> };

export async function POST(request: NextRequest, context: Context) {
  const userId = getSessionUserId(request);
  if (!userId) return apiError("Нужна авторизация.", 401);
  const { taskId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { action?: string };
  if (!body.action || !["accept", "reject", "complete"].includes(body.action)) {
    return apiError("Неизвестное действие.");
  }

  try {
    const task = await updateDatabase((database) => {
      const taskToUpdate = database.tasks.find((item) => item.id === taskId);
      if (!taskToUpdate) throw new Error("TASK_NOT_FOUND");
      if (taskToUpdate.streamerId !== userId) throw new Error("FORBIDDEN");
      const streamer = database.users.find((user) => user.id === userId);
      const viewer = database.users.find((user) => user.id === taskToUpdate.viewerId);
      if (!streamer || !viewer) throw new Error("USER_NOT_FOUND");

      const createdAt = new Date().toISOString();
      if (body.action === "accept") {
        if (taskToUpdate.status !== "pending") throw new Error("INVALID_STATUS");
        taskToUpdate.status = "accepted";
      }
      if (body.action === "reject") {
        if (taskToUpdate.status !== "pending") throw new Error("INVALID_STATUS");
        taskToUpdate.status = "rejected";
        viewer.viewerBalance += taskToUpdate.amount;
        database.transactions.push({
          id: makeId("tx"),
          userId: viewer.id,
          type: "task_refund",
          amount: taskToUpdate.amount,
          taskId: taskToUpdate.id,
          createdAt,
        });
      }
      if (body.action === "complete") {
        if (taskToUpdate.status !== "accepted") throw new Error("INVALID_STATUS");
        taskToUpdate.status = "completed";
        streamer.streamerBalance += taskToUpdate.amount;
        database.transactions.push({
          id: makeId("tx"),
          userId: streamer.id,
          type: "task_income",
          amount: taskToUpdate.amount,
          taskId: taskToUpdate.id,
          createdAt,
        });
      }
      taskToUpdate.updatedAt = createdAt;
      return taskToUpdate;
    });
    return NextResponse.json({ ok: true, task });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "UNKNOWN";
    if (reason === "TASK_NOT_FOUND") return apiError("Задание не найдено.", 404);
    if (reason === "FORBIDDEN") return apiError("Нет доступа.", 403);
    if (reason === "INVALID_STATUS") return apiError("Статус задания уже изменился.", 409);
    return apiError("Не удалось изменить задание.", 500);
  }
}

