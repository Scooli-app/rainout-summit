import type { Metadata } from "next";
import Link from "next/link";
import { eq, sql } from "drizzle-orm";
import { ChevronRight, Hash, MessageCircle, UsersRound } from "lucide-react";
import { getDb, schema } from "@/db";
import { requireOnboarded } from "@/lib/me";
import { listMyConversations } from "@/lib/conversations";
import { joinRoom } from "@/app/actions";
import { GroupForm } from "@/components/forms";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";

export const metadata: Metadata = { title: "Chat" };
const { conversations, conversationMembers, matchSuggestions, profiles } = schema;

function ago(d: Date) {
  const s = (Date.now() - d.getTime()) / 1000;
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default async function Chat() {
  const me = await requireOnboarded();
  const db = await getDb();
  const mine = await listMyConversations(me.id);
  const joined = new Set(mine.map((c) => c.id));

  const rooms = await db
    .select({
      id: conversations.id,
      title: conversations.title,
      topic: conversations.topic,
      members: sql<number>`(select count(*) from ${conversationMembers} where ${conversationMembers.conversationId} = ${conversations.id})`.mapWith(Number),
    })
    .from(conversations)
    .where(eq(conversations.kind, "room"))
    .orderBy(conversations.createdAt);

  const matchPeople = await db
    .select({ id: profiles.id, name: profiles.name })
    .from(matchSuggestions)
    .innerJoin(profiles, eq(profiles.id, matchSuggestions.candidateId))
    .where(eq(matchSuggestions.profileId, me.id))
    .limit(30);
  const known = new Map<string, string>();
  for (const c of mine) if (c.other) known.set(c.other.id, c.other.name);
  for (const p of matchPeople) known.set(p.id, p.name);
  const openRooms = rooms.filter((r) => !joined.has(r.id));

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
      <div className="flex min-w-0 flex-col gap-10">
        <section aria-labelledby="yours">
          <h1 id="yours" className="page-title">
            Chat
          </h1>
          {mine.length === 0 ? (
            <Empty className="mt-4 border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <MessageCircle aria-hidden />
                </EmptyMedia>
                <EmptyTitle>No conversations yet</EmptyTitle>
                <EmptyDescription>Join a room below, or message someone from People or your matches</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Card className="mt-4 gap-0 py-1">
              <ItemGroup>
                {mine.map((c) => (
                  <Item key={c.id} asChild className="rounded-none border-0 border-b px-4 py-3 last:border-b-0 hover:bg-muted/60">
                    <Link href={`/chat/${c.id}`}>
                      <ItemMedia>
                        {c.kind === "dm" ? (
                          <Avatar name={c.displayTitle} url={c.other?.avatarUrl} size={40} />
                        ) : (
                          <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            {c.kind === "room" ? <Hash aria-hidden className="size-4" /> : <UsersRound aria-hidden className="size-4" />}
                          </span>
                        )}
                      </ItemMedia>
                      <ItemContent className="min-w-0">
                        <ItemTitle className="truncate">{c.displayTitle}</ItemTitle>
                        <ItemDescription>{c.kind === "dm" ? "Direct message" : c.kind === "group" ? "Group" : "Room"}</ItemDescription>
                      </ItemContent>
                      <ItemActions>
                        <span className="tnum text-sm text-subtle-foreground">{ago(c.lastMessageAt)}</span>
                        <ChevronRight aria-hidden className="size-4 text-subtle-foreground" />
                      </ItemActions>
                    </Link>
                  </Item>
                ))}
              </ItemGroup>
            </Card>
          )}
        </section>

        {openRooms.length > 0 && (
          <section aria-labelledby="rooms">
            <h2 id="rooms" className="section-title">
              Topic rooms
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {openRooms.map((r) => (
                <Card key={r.id} className="py-4">
                  <CardContent className="flex items-center gap-3 px-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Hash aria-hidden className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{r.title}</p>
                      <p className="line-clamp-1 text-sm text-muted-foreground">{r.topic}</p>
                      <p className="tnum text-xs text-subtle-foreground">
                        {r.members} {r.members === 1 ? "member" : "members"}
                      </p>
                    </div>
                    <form action={joinRoom.bind(null, r.id)}>
                      <Button type="submit" variant="outline" size="lg">
                        Join
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>

      <aside aria-labelledby="new-group" className="lg:pt-[3.25rem]">
        <Card className="gap-5 py-6">
          <CardHeader className="px-6">
            <CardTitle id="new-group" className="section-title">
              Start a small group
            </CardTitle>
            <CardDescription>Up to 12 people. Good for a founders&apos; circle or a follow-up after a call</CardDescription>
          </CardHeader>
          <CardContent className="px-6">
            <GroupForm people={[...known].map(([id, name]) => ({ id, name }))} />
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
