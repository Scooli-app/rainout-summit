import "server-only";
import { randomBytes } from "node:crypto";

/** Creates a video room for a meeting. Daily.co if configured, otherwise a Jitsi link. */
export async function createVideoRoom(startsAt: Date, durationMin: number): Promise<string> {
  const key = process.env.DAILY_API_KEY;
  if (key) {
    try {
      const exp = Math.floor(startsAt.getTime() / 1000) + (durationMin + 60) * 60;
      const res = await fetch("https://api.daily.co/v1/rooms", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ privacy: "public", properties: { exp, enable_chat: true, enable_screenshare: true } }),
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const room = (await res.json()) as { url?: string };
        if (room.url) return room.url;
      }
      console.error("Daily room creation failed", res.status);
    } catch (e) {
      console.error("Daily room creation failed", e);
    }
  }
  return `https://meet.jit.si/rainout-${randomBytes(9).toString("base64url")}`;
}

export function googleCalendarUrl(title: string, startsAt: Date, durationMin: number, details: string) {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const end = new Date(startsAt.getTime() + durationMin * 60_000);
  const p = new URLSearchParams({ action: "TEMPLATE", text: title, dates: `${fmt(startsAt)}/${fmt(end)}`, details });
  return `https://calendar.google.com/calendar/render?${p}`;
}
