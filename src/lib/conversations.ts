import "server-only";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { getDb, schema } from "@/db";

const { conversations, conversationMembers, profiles } = schema;

/** Conversations the profile belongs to, with a display title (the other person's name for DMs). */
export async function listMyConversations(meId: string) {
  const db = await getDb();
  const mine = await db
    .select({ c: conversations })
    .from(conversationMembers)
    .innerJoin(conversations, eq(conversations.id, conversationMembers.conversationId))
    .where(eq(conversationMembers.profileId, meId))
    .orderBy(desc(conversations.lastMessageAt))
    .limit(200);
  const dmIds = mine.filter((r) => r.c.kind === "dm").map((r) => r.c.id);
  const others = dmIds.length
    ? await db
        .select({ conversationId: conversationMembers.conversationId, id: profiles.id, name: profiles.name, avatarUrl: profiles.avatarUrl })
        .from(conversationMembers)
        .innerJoin(profiles, eq(profiles.id, conversationMembers.profileId))
        .where(and(inArray(conversationMembers.conversationId, dmIds), ne(conversationMembers.profileId, meId)))
    : [];
  const otherBy = new Map(others.map((o) => [o.conversationId, o]));
  return mine
    .filter(({ c }) => c.kind !== "dm" || otherBy.has(c.id)) // a DM whose other person left is a dead end
    .map(({ c }) => ({
      ...c,
      displayTitle: c.kind === "dm" ? otherBy.get(c.id)!.name : c.title ?? "Untitled",
      other: otherBy.get(c.id) ?? null,
    }));
}

export async function getMembers(conversationId: string) {
  const db = await getDb();
  return db
    .select({ id: profiles.id, name: profiles.name, avatarUrl: profiles.avatarUrl })
    .from(conversationMembers)
    .innerJoin(profiles, eq(profiles.id, conversationMembers.profileId))
    .where(eq(conversationMembers.conversationId, conversationId))
    .limit(500);
}
