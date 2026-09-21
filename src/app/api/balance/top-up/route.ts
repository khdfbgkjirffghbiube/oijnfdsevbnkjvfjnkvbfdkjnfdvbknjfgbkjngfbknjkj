import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { getSessionUserId } from "@/lib/session";
import { makeId, updateDatabase } from "@/lib/store";

export async function POST(request: NextRequest) {
  const userId = getSessionUserId(request);
  if (!userId) return apiError("Нужна авторизация.", 401);
  const body = (await request.json().catch(() => ({}))) as { amount?: number };
  const amount = Math.round(Number(body.amount));
  if (!Number.isFinite(amount) || amount < 100 || amount > 100000) {
    return apiError("Сумма должна быть от 100 до 100 000 ₽.");
  }

  const balance = await updateDatabase((database) => {
    const user = database.users.find((candidate) => candidate.id === userId);
    if (!user) throw new Error("USER_NOT_FOUND");
    user.viewerBalance += amount;
    database.transactions.push({
      id: makeId("tx"),
      userId,
      type: "topup",
      amount,
      createdAt: new Date().toISOString(),
    });
    return user.viewerBalance;
  }).catch(() => null);

  if (balance === null) return apiError("Пользователь не найден.", 404);
  return NextResponse.json({ ok: true, balance });
}

