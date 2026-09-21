import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { getSessionUserId } from "@/lib/session";
import { makeId, updateDatabase } from "@/lib/store";

export async function POST(request: NextRequest) {
  const userId = getSessionUserId(request);
  if (!userId) return apiError("Нужна авторизация.", 401);
  const body = (await request.json().catch(() => ({}))) as {
    amount?: number;
    cardLast4?: string;
  };
  const amount = Math.round(Number(body.amount));
  const cardLast4 = String(body.cardLast4 ?? "").replace(/\D/g, "");
  if (!Number.isFinite(amount) || amount < 500) {
    return apiError("Минимальная сумма вывода — 500 ₽.");
  }
  if (!/^\d{4}$/.test(cardLast4)) {
    return apiError("Укажите последние четыре цифры карты.");
  }

  try {
    const withdrawal = await updateDatabase((database) => {
      const user = database.users.find((candidate) => candidate.id === userId);
      if (!user) throw new Error("USER_NOT_FOUND");
      if (user.streamerBalance < amount) throw new Error("INSUFFICIENT_FUNDS");
      const createdAt = new Date().toISOString();
      user.streamerBalance -= amount;
      const item = {
        id: makeId("withdrawal"),
        userId,
        amount,
        cardLast4,
        status: "processing" as const,
        createdAt,
      };
      database.withdrawals.push(item);
      database.transactions.push({
        id: makeId("tx"),
        userId,
        type: "withdrawal",
        amount: -amount,
        createdAt,
      });
      return item;
    });
    return NextResponse.json({ ok: true, withdrawal });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "UNKNOWN";
    if (reason === "INSUFFICIENT_FUNDS") return apiError("Недостаточно средств.");
    return apiError("Не удалось оформить вывод.", 500);
  }
}

