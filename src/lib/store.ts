import { randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Database, PublicStreamer, StreamTask, User } from "@/lib/types";

const DATA_DIRECTORY = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIRECTORY, "db.json");

const now = () => new Date().toISOString();
const overlayKey = () => randomBytes(18).toString("hex");

function seedDatabase(): Database {
  const createdAt = now();

  return {
    users: [
      {
        id: "demo-viewer",
        login: "viewer_demo",
        displayName: "Макс",
        viewerBalance: 4800,
        streamerBalance: 0,
        isStreamer: false,
        accent: "#c8ff46",
        overlayKey: overlayKey(),
        createdAt,
      },
      {
        id: "streamer-foxxy",
        login: "foxxy_live",
        displayName: "FOXxy",
        viewerBalance: 1200,
        streamerBalance: 7340,
        isStreamer: true,
        category: "Dota 2",
        tagline: "Рейтинг, челленджи и немного хаоса",
        live: true,
        viewers: 12400,
        accent: "#ff5c7c",
        overlayKey: overlayKey(),
        createdAt,
      },
      {
        id: "streamer-vlad",
        login: "vlad_force",
        displayName: "VLAD FORCE",
        viewerBalance: 800,
        streamerBalance: 2580,
        isStreamer: true,
        category: "Counter-Strike 2",
        tagline: "Проверяю самые безумные тактики",
        live: true,
        viewers: 8430,
        accent: "#8d72ff",
        overlayKey: overlayKey(),
        createdAt,
      },
      {
        id: "streamer-mashu",
        login: "mashu_chat",
        displayName: "MASHU",
        viewerBalance: 2150,
        streamerBalance: 10920,
        isStreamer: true,
        category: "Just Chatting",
        tagline: "Общаемся, спорим и выполняем ваши идеи",
        live: false,
        viewers: 2780,
        accent: "#51d9ff",
        overlayKey: overlayKey(),
        createdAt,
      },
    ],
    tasks: [
      {
        id: "task-warmup-1",
        viewerId: "demo-viewer",
        streamerId: "streamer-foxxy",
        title: "Сыграй матч только саппортом",
        description: "Без покупки урона — только сейвы команды и варды.",
        amount: 900,
        status: "pending",
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: "task-warmup-2",
        viewerId: "demo-viewer",
        streamerId: "streamer-vlad",
        title: "Раунд только с Deagle",
        description: "Один полный закупочный раунд без другого оружия.",
        amount: 500,
        status: "accepted",
        createdAt,
        updatedAt: createdAt,
      },
    ],
    transactions: [],
    withdrawals: [],
  };
}

declare global {
  var streamTaskWriteQueue: Promise<void> | undefined;
}

async function ensureDatabase() {
  await mkdir(DATA_DIRECTORY, { recursive: true });
  try {
    await readFile(DATA_FILE, "utf8");
  } catch {
    await writeFile(DATA_FILE, JSON.stringify(seedDatabase(), null, 2), "utf8");
  }
}

export async function readDatabase(): Promise<Database> {
  await ensureDatabase();
  return JSON.parse(await readFile(DATA_FILE, "utf8")) as Database;
}

export async function updateDatabase<T>(
  updater: (database: Database) => T | Promise<T>,
): Promise<T> {
  let resolveResult!: (value: T) => void;
  let rejectResult!: (reason: unknown) => void;
  const result = new Promise<T>((resolve, reject) => {
    resolveResult = resolve;
    rejectResult = reject;
  });

  const previous = global.streamTaskWriteQueue ?? Promise.resolve();
  global.streamTaskWriteQueue = previous
    .catch(() => undefined)
    .then(async () => {
      try {
        const database = await readDatabase();
        const value = await updater(database);
        await writeFile(DATA_FILE, JSON.stringify(database, null, 2), "utf8");
        resolveResult(value);
      } catch (error) {
        rejectResult(error);
      }
    });

  await global.streamTaskWriteQueue;
  return result;
}

export async function findUser(userId: string) {
  const database = await readDatabase();
  return database.users.find((user) => user.id === userId) ?? null;
}

export async function getPublicStreamers(): Promise<PublicStreamer[]> {
  const database = await readDatabase();
  return database.users
    .filter((user) => user.isStreamer)
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
}

export async function getTasksForUser(userId: string): Promise<StreamTask[]> {
  const database = await readDatabase();
  return database.tasks
    .filter((task) => task.viewerId === userId || task.streamerId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

type TwitchProfile = {
  id: string;
  login: string;
  displayName: string;
  avatarUrl?: string;
};

export async function upsertTwitchUser(profile: TwitchProfile): Promise<User> {
  return updateDatabase((database) => {
    const existing = database.users.find((user) => user.twitchId === profile.id);
    if (existing) {
      existing.login = profile.login;
      existing.displayName = profile.displayName;
      existing.avatarUrl = profile.avatarUrl;
      return existing;
    }

    const user: User = {
      id: `twitch-${profile.id}`,
      twitchId: profile.id,
      login: profile.login,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      viewerBalance: 1500,
      streamerBalance: 0,
      isStreamer: true,
      category: "Twitch",
      tagline: "Новый стример на TaskDrop",
      live: false,
      viewers: 0,
      accent: "#9147ff",
      overlayKey: overlayKey(),
      createdAt: now(),
    };
    database.users.push(user);
    return user;
  });
}

export function makeId(prefix: string) {
  return `${prefix}-${randomUUID()}`;
}
