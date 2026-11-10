import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";

const { conversations, conversationMembers, messages } = schema;

export async function isMember(conversationId: string, profileId: string) {
  const db = await getDb();
  const [row] = await db
    .select({ c: conversationMembers.conversationId })
    .from(conversationMembers)
    .where(and(eq(conversationMembers.conversationId, conversationId), eq(conversationMembers.profileId, profileId)));
  return !!row;
}

/** Finds or creates the 1:1 conversation between two profiles. */
export async function ensureDm(a: string, b: string) {
  const db = await getDb();
  const dmKey = [a, b].sort().join(":");
  const [found] = await db.select().from(conversations).where(eq(conversations.dmKey, dmKey));
  if (found) return found.id;
  const [created] = await db
    .insert(conversations)
    .values({ kind: "dm", dmKey, createdBy: a })
    .onConflictDoNothing({ target: conversations.dmKey })
    .returning();
  const id = created?.id ?? (await db.select().from(conversations).where(eq(conversations.dmKey, dmKey)))[0].id;
  await db
    .insert(conversationMembers)
    .values([
      { conversationId: id, profileId: a },
      { conversationId: id, profileId: b },
    ])
    .onConflictDoNothing();
  return id;
}

export async function postMessage(conversationId: string, senderId: string | null, body: string, system = false) {
  const db = await getDb();
  const [msg] = await db.insert(messages).values({ conversationId, senderId, body, system }).returning();
  await db.update(conversations).set({ lastMessageAt: sql`now()` }).where(eq(conversations.id, conversationId));
  return msg;
}
