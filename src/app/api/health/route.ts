import { NextResponse } from "next/server";
import {
  getStorageMode,
  isDemoModeEnabled,
  isTwitchConfigured,
} from "@/lib/runtime";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "taskdrop",
    twitchConfigured: isTwitchConfigured(),
    demoMode: isDemoModeEnabled(),
    storageMode: getStorageMode(),
    timestamp: new Date().toISOString(),
  });
}
