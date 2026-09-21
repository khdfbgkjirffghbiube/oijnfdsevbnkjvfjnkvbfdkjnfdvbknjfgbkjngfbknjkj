export function isTwitchConfigured() {
  return Boolean(
    process.env.TWITCH_CLIENT_ID?.trim() &&
      process.env.TWITCH_CLIENT_SECRET?.trim(),
  );
}

export function isDemoModeEnabled() {
  return process.env.DEMO_MODE !== "false";
}

export function getStorageMode() {
  return process.env.DATA_DIRECTORY || process.env.RENDER_DISK_PATH
    ? "persistent"
    : "local";
}
