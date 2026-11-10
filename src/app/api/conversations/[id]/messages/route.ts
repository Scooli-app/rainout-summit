import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, gt } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { getMe } from "@/lib/me";
import { isMember, postMessage } from "@/lib/chat";
import { MAX_MESSAGE_LENGTH } from "@/lib/constants";

const { messages, profiles } = schema;

async function guard(ctx: RouteContext<"/api/conversations/[id]/messages">) {
  const { id } = await ctx.params;
  if (!z.uuid().safeParse(id).success) return null;
  if (!(await auth()).userId) return null;
  const me = await getMe();
  if (!(await isMember(id, me.id))) return null;
  return { id, me };
}

// GET ?after=<lastMessageId> → new messages (oldest first). Without `after`, the latest 50.
export async function GET(req: Request, ctx: RouteContext<"/api/conversations/[id]/messages">) {
  const g = await guard(ctx);
  if (!g) return NextResponse.json({ error: "not found" }, { status: 404 });
  const after = Number(new URL(req.url).searchParams.get("after") ?? 0) || 0;
  const db = await getDb();
  const cols = {
    id: messages.id,
    body: messages.body,
    system: messages.system,
    createdAt: messages.createdAt,
    senderId: messages.senderId,
    senderName: profiles.name,
    senderAvatar: profiles.avatarUrl,
  };
  const rows = after
    ? await db
        .select(cols)
        .from(messages)
        .leftJoin(profiles, eq(profiles.id, messages.senderId))
        .where(and(eq(messages.conversationId, g.id), gt(messages.id, after)))
        .orderBy(messages.id)
        .limit(200)
    : (
        await db
          .select(cols)
          .from(messages)
          .leftJoin(profiles, eq(profiles.id, messages.senderId))
          .where(eq(messages.conversationId, g.id))
          .orderBy(desc(messages.id))
          .limit(50)
      ).reverse();
  return NextResponse.json({ messages: rows }, { headers: { "Cache-Control": "no-store" } });
}

const lastPost = new Map<string, number>();

export async function POST(req: Request, ctx: RouteContext<"/api/conversations/[id]/messages">) {
  const g = await guard(ctx);
  if (!g) return NextResponse.json({ error: "not found" }, { status: 404 });
  const body = await req.json().catch(() => null);
  const text = typeof body?.body === "string" ? body.body.trim() : "";
  if (!text || text.length > MAX_MESSAGE_LENGTH) return NextResponse.json({ error: "empty or too long" }, { status: 400 });
  // Basic per-instance flood protection: 1 message per 700ms per user.
  const now = Date.now();
  if (now - (lastPost.get(g.me.id) ?? 0) < 700) return NextResponse.json({ error: "slow down" }, { status: 429 });
  lastPost.set(g.me.id, now);
  const msg = await postMessage(g.id, g.me.id, text);
  return NextResponse.json({ id: msg.id });
}
