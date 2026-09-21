"use client";

import {
  Bell,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Copy,
  Gamepad2,
  Info,
  LogOut,
  Plus,
  Radio,
  RotateCcw,
  Sparkles,
  WalletCards,
  X,
  Zap,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { PublicStreamer, StreamTask, TaskStatus, User, Withdrawal } from "@/lib/types";

type AppTask = StreamTask & { viewer?: string; streamer?: string };
type AppData = {
  user: User | null;
  streamers: PublicStreamer[];
  tasks: AppTask[];
  withdrawals: Withdrawal[];
  capabilities: {
    twitchConfigured: boolean;
    demoMode: boolean;
    storageMode: "persistent" | "local";
  };
};
type Mode = "viewer" | "streamer";

const formatMoney = (value: number) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);

const statusInfo: Record<TaskStatus, { label: string; icon: typeof Clock3 }> = {
  pending: { label: "Ожидает решения", icon: Clock3 },
  accepted: { label: "Принято", icon: Gamepad2 },
  completed: { label: "Выполнено", icon: CheckCircle2 },
  rejected: { label: "Отклонено · возврат", icon: RotateCcw },
};

const authErrorMessages: Record<string, string> = {
  twitch_not_configured:
    "Twitch-вход ещё не настроен на сервере. Добавьте Client ID и Client Secret в переменные окружения Render.",
  invalid_state: "Сессия входа устарела. Нажмите «Продолжить с Twitch» ещё раз.",
  access_denied: "Twitch не разрешил вход. Попробуйте снова и подтвердите доступ.",
  token_exchange_failed: "Twitch отклонил данные приложения. Проверьте Client ID, Client Secret и Redirect URL.",
  token_missing: "Twitch не вернул токен доступа. Попробуйте войти ещё раз.",
  profile_failed: "Не удалось получить профиль Twitch. Попробуйте чуть позже.",
  profile_missing: "Twitch не вернул данные профиля.",
  unexpected_error: "Во время входа произошла ошибка. Попробуйте ещё раз.",
};

function Avatar({ user, size }: { user: Pick<User, "displayName" | "avatarUrl" | "accent"> | PublicStreamer; size?: "large" }) {
  const style = user.avatarUrl
    ? { backgroundImage: `url("${user.avatarUrl}")`, backgroundColor: user.accent }
    : { background: user.accent };
  return (
    <div className="avatar" style={style} data-size={size}>
      {!user.avatarUrl && user.displayName.charAt(0).toUpperCase()}
    </div>
  );
}

function Logo() {
  return (
    <Link className="brand" href="/">
      <span className="brand-mark"><Zap size={18} fill="currentColor" /></span>
      <span>TASKDROP</span>
    </Link>
  );
}

export default function DashboardClient() {
  const [data, setData] = useState<AppData | null>(null);
  const [mode, setMode] = useState<Mode>("viewer");
  const [selectedStreamer, setSelectedStreamer] = useState<PublicStreamer | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/app", { cache: "no-store" });
    const nextData = (await response.json()) as AppData;
    setData(nextData);
    if (nextData.user?.id.startsWith("streamer-")) setMode("streamer");
  }, []);

  useEffect(() => {
    const authError = new URLSearchParams(window.location.search).get("authError");
    let errorTimer: number | undefined;
    if (authError) {
      errorTimer = window.setTimeout(
        () =>
          setError(
            authErrorMessages[authError] || "Не удалось войти через Twitch.",
          ),
        0,
      );
      window.history.replaceState({}, "", window.location.pathname);
    }
    const initialLoad = window.setTimeout(() => void load(), 0);
    return () => {
      window.clearTimeout(initialLoad);
      if (errorTimer !== undefined) window.clearTimeout(errorTimer);
    };
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function request(url: string, body?: unknown) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Произошла ошибка.");
      await load();
      return true;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Произошла ошибка.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function demoLogin(role: Mode) {
    if (await request("/api/demo-login", { role })) {
      setMode(role);
      setToast(role === "viewer" ? "Включён демо-режим зрителя" : "Включён демо-режим стримера");
    }
  }

  async function logout() {
    await request("/api/auth/logout");
    setData((current) => current ? { ...current, user: null, tasks: [], withdrawals: [] } : current);
  }

  async function topUp() {
    if (await request("/api/balance/top-up", { amount: 1000 })) {
      setToast("Тестовый баланс пополнен на 1 000 ₽");
    }
  }

  async function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedStreamer) return;
    const form = new FormData(event.currentTarget);
    const ok = await request("/api/tasks", {
      streamerId: selectedStreamer.id,
      title: form.get("title"),
      description: form.get("description"),
      amount: Number(form.get("amount")),
    });
    if (ok) {
      setSelectedStreamer(null);
      setToast("Задание отправлено, сумма зарезервирована");
    }
  }

  async function taskAction(taskId: string, action: "accept" | "reject" | "complete") {
    const ok = await request(`/api/tasks/${taskId}/action`, { action });
    if (ok) {
      const messages = {
        accept: "Задание принято и появилось в очереди",
        reject: "Задание отклонено, деньги возвращены зрителю",
        complete: "Задание выполнено, награда начислена",
      };
      setToast(messages[action]);
    }
  }

  async function submitWithdrawal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const ok = await request("/api/withdrawals", {
      amount: Number(form.get("amount")),
      cardLast4: form.get("cardLast4"),
    });
    if (ok) {
      setWithdrawOpen(false);
      setToast("Тестовая заявка на вывод создана");
    }
  }

  if (!data) return <div className="loading-screen"><div className="spinner" /></div>;

  if (!data.user) {
    return (
      <div className="app-shell">
        <header className="topbar app-topbar"><Logo /><Link className="text-link" href="/">На главную</Link></header>
        <main className="auth-page">
          <section className="auth-card">
            <div className="auth-logo"><Radio size={27} /></div>
            <h1>Войти в TaskDrop</h1>
            <p>Подключи Twitch, чтобы отправлять задания или принимать их во время стрима.</p>
            <div className="auth-options">
              {data.capabilities.twitchConfigured ? (
                <a className="button twitch-button" href="/api/auth/twitch"><Radio size={18} /> Продолжить с Twitch</a>
              ) : (
                <span className="button twitch-button button-disabled" aria-disabled="true"><Radio size={18} /> Twitch ещё не подключён</span>
              )}
              {data.capabilities.demoMode && (
                <div className="demo-row">
                  <button disabled={busy} onClick={() => demoLogin("viewer")}>Демо: зритель</button>
                  <button disabled={busy} onClick={() => demoLogin("streamer")}>Демо: стример</button>
                </div>
              )}
            </div>
            {error && <div className="form-error" style={{ marginTop: 14 }}>{error}</div>}
            <div className="auth-note"><Info size={17} /><span>Сайт уже работает как MVP. Пока платёжная система не подключена, рубли, пополнение и вывод остаются тестовыми.</span></div>
          </section>
        </main>
      </div>
    );
  }

  const user = data.user;
  const viewerTasks = data.tasks.filter((task) => task.viewerId === user.id);
  const streamerTasks = data.tasks.filter((task) => task.streamerId === user.id);
  const pendingTasks = streamerTasks.filter((task) => task.status === "pending");
  const activeTasks = streamerTasks.filter((task) => task.status === "accepted");
  const completedTasks = streamerTasks.filter((task) => task.status === "completed");
  const overlayUrl = typeof window === "undefined" ? "" : `${window.location.origin}/overlay/${user.id}?key=${user.overlayKey}`;

  async function copyOverlay() {
    await navigator.clipboard.writeText(overlayUrl);
    setToast("Ссылка для OBS скопирована");
  }

  return (
    <div className="app-shell">
      <header className="topbar app-topbar">
        <Logo />
        <div className="header-actions">
          <button className="icon-button" aria-label="Уведомления"><Bell size={17} /></button>
          <div className="profile-chip"><Avatar user={user} /><strong>{user.displayName}</strong></div>
          <button className="icon-button" onClick={logout} aria-label="Выйти"><LogOut size={17} /></button>
        </div>
      </header>

      <main className="app-main">
        <div className="app-heading">
          <div><span className="section-kicker">ЛИЧНЫЙ КАБИНЕТ</span><h1>{mode === "viewer" ? `Привет, ${user.displayName}` : "Пульт стримера"}</h1><p>{mode === "viewer" ? "Придумай задание, которое запомнит весь чат." : "Управляй заданиями, оверлеем и заработком."}</p></div>
          {user.isStreamer && (
            <div className="mode-switch">
              <button className={mode === "viewer" ? "active" : ""} onClick={() => setMode("viewer")}>Я зритель</button>
              <button className={mode === "streamer" ? "active" : ""} onClick={() => setMode("streamer")}>Я стример</button>
            </div>
          )}
        </div>

        {mode === "viewer" ? (
          <ViewerDashboard data={data} tasks={viewerTasks} topUp={topUp} busy={busy} openTask={setSelectedStreamer} />
        ) : (
          <StreamerDashboard
            user={user}
            pendingTasks={pendingTasks}
            activeTasks={activeTasks}
            completedTasks={completedTasks}
            withdrawals={data.withdrawals}
            overlayUrl={overlayUrl}
            copyOverlay={copyOverlay}
            openWithdrawal={() => { setError(""); setWithdrawOpen(true); }}
            action={taskAction}
            busy={busy}
          />
        )}
      </main>

      {selectedStreamer && (
        <TaskModal streamer={selectedStreamer} balance={user.viewerBalance} error={error} busy={busy} close={() => { setError(""); setSelectedStreamer(null); }} submit={submitTask} />
      )}
      {withdrawOpen && (
        <WithdrawalModal balance={user.streamerBalance} error={error} busy={busy} close={() => { setError(""); setWithdrawOpen(false); }} submit={submitWithdrawal} />
      )}
      {toast && <div className="toast"><Check size={17} /> {toast}</div>}
    </div>
  );
}

function ViewerDashboard({ data, tasks, topUp, busy, openTask }: { data: AppData; tasks: AppTask[]; topUp: () => void; busy: boolean; openTask: (streamer: PublicStreamer) => void }) {
  const user = data.user!;
  const held = tasks.filter((task) => task.status === "pending" || task.status === "accepted").reduce((sum, task) => sum + task.amount, 0);
  const completed = tasks.filter((task) => task.status === "completed").length;
  return (
    <div className="dashboard-grid">
      <div className="dashboard-column">
        <section className="panel">
          <div className="panel-title"><h2>Стримеры</h2><span>{data.streamers.filter((item) => item.live).length} сейчас в эфире</span></div>
          <div className="app-streamers">
            {data.streamers.filter((streamer) => streamer.id !== user.id).map((streamer) => (
              <div className="app-streamer" key={streamer.id}>
                <Avatar user={streamer} />
                <div className="app-streamer-copy"><strong>{streamer.displayName}</strong><small>{streamer.live && <span className="live-dot" />}{streamer.category || "Twitch"}</small></div>
                <button className="small-action" onClick={() => openTask(streamer)}>Задание</button>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="panel-title"><h2>Мои задания</h2><span>{tasks.length} всего</span></div>
          <TaskList tasks={tasks} perspective="viewer" />
        </section>
      </div>
      <div className="dashboard-column">
        <section className="panel balance-card">
          <div className="balance-label"><WalletCards size={16} /> Баланс зрителя</div>
          <div className="balance-value">{formatMoney(user.viewerBalance)}</div>
          <div className="balance-footer"><button disabled={busy} className="button button-primary" onClick={topUp}><Plus size={16} /> Пополнить на 1 000 ₽</button><small>тестовый режим</small></div>
        </section>
        <div className="mini-stat-grid">
          <div className="mini-stat"><small>В резерве</small><strong>{formatMoney(held)}</strong></div>
          <div className="mini-stat"><small>Выполнено</small><strong>{completed}</strong></div>
          <div className="mini-stat"><small>Возвраты</small><strong>{tasks.filter((task) => task.status === "rejected").length}</strong></div>
        </div>
      </div>
    </div>
  );
}

function StreamerDashboard({ user, pendingTasks, activeTasks, completedTasks, withdrawals, overlayUrl, copyOverlay, openWithdrawal, action, busy }: { user: User; pendingTasks: AppTask[]; activeTasks: AppTask[]; completedTasks: AppTask[]; withdrawals: Withdrawal[]; overlayUrl: string; copyOverlay: () => void; openWithdrawal: () => void; action: (taskId: string, action: "accept" | "reject" | "complete") => void; busy: boolean }) {
  const totalEarned = completedTasks.reduce((sum, task) => sum + task.amount, 0);
  return (
    <div className="dashboard-grid">
      <div className="dashboard-column">
        <section className="panel">
          <div className="panel-title"><h2>Новые предложения</h2><span>{pendingTasks.length} ожидают решения</span></div>
          <TaskList tasks={pendingTasks} perspective="streamer" action={action} busy={busy} />
        </section>
        <section className="panel">
          <div className="panel-title"><h2>Очередь на выполнение</h2><span>{activeTasks.length} активных</span></div>
          <TaskList tasks={activeTasks} perspective="streamer" action={action} busy={busy} />
        </section>
      </div>
      <div className="dashboard-column">
        <section className="panel balance-card">
          <div className="balance-label"><CircleDollarSign size={16} /> Баланс стримера</div>
          <div className="balance-value">{formatMoney(user.streamerBalance)}</div>
          <div className="balance-footer"><button className="button button-primary" onClick={openWithdrawal}>Вывести деньги</button><small>демо-операция</small></div>
        </section>
        <div className="mini-stat-grid">
          <div className="mini-stat"><small>Заработано</small><strong>{formatMoney(totalEarned)}</strong></div>
          <div className="mini-stat"><small>Выполнено</small><strong>{completedTasks.length}</strong></div>
          <div className="mini-stat"><small>Ожидает</small><strong>{pendingTasks.length}</strong></div>
        </div>
        <section className="panel overlay-panel">
          <div className="panel-title"><h2>OBS-оверлей</h2><span>Browser Source</span></div>
          <div className="overlay-preview"><div className="preview-alert"><i><Zap size={17} /></i><div><small>НОВОЕ ЗАДАНИЕ · 900 ₽</small><strong>Только саппортом</strong></div></div></div>
          <div className="url-field"><input readOnly value={overlayUrl} aria-label="Ссылка на OBS-оверлей" /><button onClick={copyOverlay} aria-label="Скопировать"><Copy size={15} /></button></div>
        </section>
        {withdrawals.length > 0 && <section className="panel"><div className="panel-title"><h2>Последние выводы</h2></div><div className="withdraw-list">{withdrawals.slice(-3).reverse().map((item) => <div className="withdraw-row" key={item.id}><strong>{formatMoney(item.amount)} · •••• {item.cardLast4}</strong><span>В обработке</span></div>)}</div></section>}
      </div>
    </div>
  );
}

function TaskList({ tasks, perspective, action, busy }: { tasks: AppTask[]; perspective: Mode; action?: (taskId: string, action: "accept" | "reject" | "complete") => void; busy?: boolean }) {
  if (tasks.length === 0) return <div className="empty-state"><div><Sparkles size={28} /><strong>Здесь пока пусто</strong><p>Новые задания появятся в этом разделе.</p></div></div>;
  return (
    <div className="task-list">
      {tasks.map((task) => {
        const status = statusInfo[task.status];
        const StatusIcon = status.icon;
        return (
          <article className="task-row" key={task.id}>
            <div className={`task-status-icon ${task.status}`}><StatusIcon size={18} /></div>
            <div className="task-copy"><strong>{task.title}</strong><div className="task-meta"><span>{perspective === "viewer" ? task.streamer : task.viewer}</span><span>•</span><span>{new Date(task.createdAt).toLocaleDateString("ru-RU")}</span></div></div>
            <div className="task-amount">{formatMoney(task.amount)}<span className="status-label">{status.label}</span>
              {perspective === "streamer" && task.status === "pending" && <div className="task-actions"><button disabled={busy} className="action-reject" onClick={() => action?.(task.id, "reject")}>Отказать</button><button disabled={busy} className="action-accept" onClick={() => action?.(task.id, "accept")}>Принять</button></div>}
              {perspective === "streamer" && task.status === "accepted" && <div className="task-actions"><button disabled={busy} className="action-complete" onClick={() => action?.(task.id, "complete")}>Выполнено</button></div>}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function TaskModal({ streamer, balance, error, busy, close, submit }: { streamer: PublicStreamer; balance: number; error: string; busy: boolean; close: () => void; submit: (event: FormEvent<HTMLFormElement>) => void }) {
  const [amount, setAmount] = useState(500);
  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <form className="modal" onSubmit={submit}>
        <div className="modal-header"><div><h2>Задание для {streamer.displayName}</h2><p>Сумма будет зарезервирована до решения стримера.</p></div><button type="button" className="modal-close" onClick={close}><X size={17} /></button></div>
        <label className="field"><span>Короткое название</span><input name="title" minLength={5} maxLength={90} required placeholder="Например: выиграй раунд без брони" /></label>
        <label className="field"><span>Условия задания</span><textarea name="description" minLength={10} maxLength={500} required placeholder="Опиши понятные и выполнимые условия…" /></label>
        <label className="field"><span>Награда</span><div className="amount-input"><input name="amount" type="number" min={100} max={100000} value={amount} onChange={(event) => setAmount(Number(event.target.value))} required /><span>₽</span></div></label>
        <div className="modal-summary"><span>Доступно: <strong>{formatMoney(balance)}</strong></span><span>После отправки: <strong>{formatMoney(Math.max(0, balance - amount))}</strong></span></div>
        {error && <div className="form-error">{error}</div>}
        <button className="button button-primary" disabled={busy || amount > balance}>{busy ? "Отправляем…" : "Отправить задание"}<Zap size={17} /></button>
      </form>
    </div>
  );
}

function WithdrawalModal({ balance, error, busy, close, submit }: { balance: number; error: string; busy: boolean; close: () => void; submit: (event: FormEvent<HTMLFormElement>) => void }) {
  const [amount, setAmount] = useState(Math.min(balance, 1000));
  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <form className="modal" onSubmit={submit}>
        <div className="modal-header"><div><h2>Вывод средств</h2><p>Демонстрационная заявка без реального перевода.</p></div><button type="button" className="modal-close" onClick={close}><X size={17} /></button></div>
        <label className="field"><span>Сумма</span><div className="amount-input"><input name="amount" type="number" min={500} max={balance} value={amount} onChange={(event) => setAmount(Number(event.target.value))} required /><span>₽</span></div></label>
        <label className="field"><span>Последние 4 цифры карты</span><input name="cardLast4" inputMode="numeric" minLength={4} maxLength={4} pattern="[0-9]{4}" required placeholder="1234" /></label>
        <div className="modal-summary"><span>Доступно</span><strong>{formatMoney(balance)}</strong></div>
        {error && <div className="form-error">{error}</div>}
        <button className="button button-primary" disabled={busy || amount > balance || balance < 500}>{busy ? "Создаём заявку…" : "Создать заявку"}</button>
      </form>
    </div>
  );
}
