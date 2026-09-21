"use client";

import { Gamepad2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { StreamTask } from "@/lib/types";

type OverlayTask = StreamTask & { viewer: string };

const formatMoney = (value: number) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);

export default function OverlayClient({ streamerId }: { streamerId: string }) {
  const [tasks, setTasks] = useState<OverlayTask[]>([]);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);

  const load = useCallback(async () => {
    const params = new URLSearchParams(window.location.search);
    const isPreview = params.get("preview") === "1";
    setPreview(isPreview);
    const apiParams = new URLSearchParams({ streamerId });
    if (params.get("key")) apiParams.set("key", params.get("key")!);
    if (isPreview) apiParams.set("preview", "1");
    const response = await fetch(`/api/overlay?${apiParams.toString()}`, { cache: "no-store" });
    if (!response.ok) {
      setError(response.status === 403 ? "Неверный ключ OBS-оверлея" : "Оверлей недоступен");
      return;
    }
    const result = (await response.json()) as { tasks: OverlayTask[] };
    setTasks(result.tasks);
    setError("");
  }, [streamerId]);

  useEffect(() => {
    document.documentElement.classList.add("overlay-mode");
    const initialLoad = window.setTimeout(() => void load(), 0);
    const interval = window.setInterval(() => void load(), 2500);
    return () => {
      document.documentElement.classList.remove("overlay-mode");
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [load]);

  if (error) return <div className="obs-error">{error}</div>;

  const visibleTasks = tasks.slice(0, 2);
  if (visibleTasks.length === 0 && preview) {
    visibleTasks.push({
      id: "preview",
      viewerId: "preview",
      streamerId,
      viewer: "Viewer_404",
      title: "Сыграй раунд только с ножом",
      description: "Один раунд — никакого огнестрельного оружия.",
      amount: 750,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <main className="obs-page">
      <div className="obs-stack">
        {visibleTasks.map((task) => (
          <article className="obs-task-card" key={task.id}>
            <div className="obs-task-icon"><Gamepad2 size={23} /></div>
            <div className="obs-task-copy">
              <small>{task.status === "accepted" ? "ЗАДАНИЕ ПРИНЯТО" : `НОВОЕ ЗАДАНИЕ ОТ ${task.viewer.toUpperCase()}`}</small>
              <strong>{task.title}</strong>
              <p>{task.description}</p>
            </div>
            <div className="obs-task-amount">{formatMoney(task.amount)}</div>
          </article>
        ))}
        {visibleTasks.length === 0 && <div className="obs-empty">TaskDrop подключён · ждём новое задание</div>}
      </div>
    </main>
  );
}
