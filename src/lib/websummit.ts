import * as cheerio from "cheerio";
import type { WsSession } from "@/db/schema";

const HOST = "attend.websummit.com";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EVENT = /^[a-z]{2,6}\d{2}$/i;

export type WsRef = { event: string; id: string };

export type WsProfile = {
  event: string;
  id: string;
  name: string;
  jobTitle: string | null;
  company: string | null;
  location: string | null;
  industry: string | null;
  bio: string | null;
  avatarUrl: string | null;
  sessions: WsSession[];
};

/**
 * Accepts the "Copy profile link" URL from the Web Summit app
 * (https://attend.websummit.com/dl/lis26/attendee?id=<uuid>) or the profile page
 * (https://attend.websummit.com/lis26/profiles/<uuid>). Returns null for anything else.
 */
export function parseWsUrl(input: string): WsRef | null {
  // People paste links out of share sheets: surrounding text, no scheme, http, trailing punctuation…
  const found = input.match(/(?:https?:\/\/)?(?:www\.)?attend\.websummit\.com\/[^\s<>"']+/i)?.[0];
  if (!found) return null;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(found) ? found : `https://${found}`);
  } catch {
    return null;
  }
  if (url.hostname.replace(/^www\./, "") !== HOST) return null;
  const parts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
  const event = parts.find((p) => EVENT.test(p));
  // The id is either ?id=<uuid> (share link) or a path segment (/lis26/profiles/<uuid>, /lis26/attendees/<uuid>, …)
  const id = [url.searchParams.get("id") ?? "", ...parts].map((p) => p.replace(/[.,;)]+$/, "")).find((p) => UUID.test(p));
  if (!event || !id) return null;
  return { event: event.toLowerCase(), id: id.toLowerCase() };
}

export function profilePageUrl(ref: WsRef) {
  // Built from validated parts only, never from user input directly.
  return `https://${HOST}/${ref.event}/profiles/${ref.id}`;
}

const clean = (s: string | undefined | null) => {
  const t = (s ?? "").replace(/\s+/g, " ").trim();
  return t.length ? t : null;
};

export function parseWsProfileHtml(html: string, ref: WsRef): WsProfile | null {
  const $ = cheerio.load(html);
  const name = clean($(".profile-name").first().text());
  if (!name) return null;

  const card = $(".profile-name").first().parent();
  const titleP = $(".profile-name").first().nextAll("p").first();
  const company = clean(titleP.find("span").first().text());
  let jobTitle = clean(titleP.text());
  if (jobTitle && company) jobTitle = clean(jobTitle.replace(new RegExp(`\\s*at\\s*${escapeRe(company)}\\s*$`), ""));

  let location: string | null = null;
  let industry: string | null = null;
  card.find("span").each((_, el) => {
    const icon = $(el).find("i").attr("class") ?? "";
    if (icon.includes("map-pin")) location = clean($(el).text());
    if (icon.includes("iconoir-city")) industry = clean($(el).text());
  });

  // Bio is the last centered paragraph in the top card.
  const ps = card.children("p.text-center");
  const bioP = ps.length >= 2 ? ps.last() : null;
  const bio = bioP ? clean(bioP.text()) : null;

  const avatarUrl = $(".avatar img").first().attr("src") ?? null;

  const sessions: WsSession[] = [];
  $(".event-card").each((_, el) => {
    const title = clean($(el).find("h4").first().text());
    if (!title) return;
    const time = clean($(el).find(".event-content > div span").first().text()) ?? "";
    const stage = clean($(el).find(".bi-geo-alt").next("span").text()) ?? undefined;
    const track = clean($(el).find(".bi-list").next("span").text()) ?? undefined;
    sessions.push({ title, time, stage, track });
  });

  return { ...ref, name, jobTitle, company, location, industry, bio, avatarUrl: avatarUrl?.startsWith("https://") ? avatarUrl : null, sessions };
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Fetches one public Web Summit profile page. Only ever called for a link the user pasted. */
export async function fetchWsProfile(ref: WsRef): Promise<WsProfile | null> {
  const res = await fetch(profilePageUrl(ref), {
    headers: { "User-Agent": "RainoutSummit/0.1 (profile import requested by the profile owner)" },
    redirect: "error",
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const html = (await res.text()).slice(0, 2_000_000);
  return parseWsProfileHtml(html, ref);
}
