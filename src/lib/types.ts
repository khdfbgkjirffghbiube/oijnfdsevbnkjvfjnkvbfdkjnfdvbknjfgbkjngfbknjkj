export type TaskStatus = "pending" | "accepted" | "completed" | "rejected";

export type User = {
  id: string;
  twitchId?: string;
  login: string;
  displayName: string;
  avatarUrl?: string;
  viewerBalance: number;
  streamerBalance: number;
  isStreamer: boolean;
  category?: string;
  tagline?: string;
  live?: boolean;
  viewers?: number;
  accent: string;
  overlayKey: string;
  createdAt: string;
};

export type StreamTask = {
  id: string;
  viewerId: string;
  streamerId: string;
  title: string;
  description: string;
  amount: number;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
};

export type Transaction = {
  id: string;
  userId: string;
  type: "topup" | "task_hold" | "task_refund" | "task_income" | "withdrawal";
  amount: number;
  taskId?: string;
  createdAt: string;
};

export type Withdrawal = {
  id: string;
  userId: string;
  amount: number;
  cardLast4: string;
  status: "processing" | "paid";
  createdAt: string;
};

export type Database = {
  users: User[];
  tasks: StreamTask[];
  transactions: Transaction[];
  withdrawals: Withdrawal[];
};

export type PublicStreamer = Pick<
  User,
  | "id"
  | "login"
  | "displayName"
  | "avatarUrl"
  | "category"
  | "tagline"
  | "live"
  | "viewers"
  | "accent"
>;

