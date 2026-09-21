import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { getSessionUserId } from "@/lib/session";
import { makeId, updateDatabase } from "@/lib/store";
import type { StreamTask } from "@/lib/types";

export async function POST(request: NextRequest) {
  const userId = getSessionUserId(request);
  if (!userId) return apiError("Нужна авторизация.", 401);
  const body = (await request.json().catch(() => ({}))) as {
    streamerId?: string;
    title?: string;
    description?: string;
    amount?: number;
  };

  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  const amount = Math.round(Number(body.amount));
  if (!body.streamerId) return apiError("Выберите стримера.");
  if (title.length < 5 || title.length > 90) {
    return apiError("Название должно содержать от 5 до 90 символов.");
  }
  if (description.length < 10 || description.length > 500) {
    return apiError("Описание должно содержать от 10 до 500 символов.");
  }
  if (!Number.isFinite(amount) || amount < 100 || amount > 100000) {
    return apiError("Сумма должна быть от 100 до 100 000 ₽.");
  }

  try {
    const task = await updateDatabase((database) => {
      const viewer = database.users.find((user) => user.id === userId);
      const streamer = database.users.find(
        (user) => user.id === body.streamerId && user.isStreamer,
      );
      if (!viewer) throw new Error("USER_NOT_FOUND");
      if (!streamer) throw new Error("STREAMER_NOT_FOUND");
      if (viewer.id === streamer.id) throw new Error("SELF_TASK");
      if (viewer.viewerBalance < amount) throw new Error("INSUFFICIENT_FUNDS");

      const createdAt = new Date().toISOString();
      const newTask: StreamTask = {
        id: makeId("task"),
        viewerId: viewer.id,
        streamerId: streamer.id,
        title,
        description,
        amount,
        status: "pending",
        createdAt,
        updatedAt: createdAt,
      };
      viewer.viewerBalance -= amount;
      database.tasks.push(newTask);
      database.transactions.push({
        id: makeId("tx"),
        userId: viewer.id,
        type: "task_hold",
        amount: -amount,
        taskId: newTask.id,
        createdAt,
      });
      return newTask;
    });
    return NextResponse.json({ ok: true, task }, { status: 201 });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "UNKNOWN";
    if (reason === "INSUFFICIENT_FUNDS") return apiError("Недостаточно средств.");
    if (reason === "STREAMER_NOT_FOUND") return apiError("Стример не найден.", 404);
    if (reason === "SELF_TASK") return apiError("Нельзя отправить задание самому себе.");
    return apiError("Не удалось создать задание.", 500);
  }
}

