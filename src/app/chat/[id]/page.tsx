import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { ArrowLeft, Hash, LogOut } from "lucide-react";
import { getDb, schema } from "@/db";
import { requireOnboarded } from "@/lib/me";
import { isMember } from "@/lib/chat";
import { getMembers } from "@/lib/conversations";
import { joinRoom, leaveConversation } from "@/app/actions";
import { ChatRoom } from "@/components/ChatRoom";
import { Avatar } from "@/components/Avatar";
import { BookDialog } from "@/components/BookDialog";
import { Button } from "@/components/ui/button";

export default async function ConversationPage({ params }: PageProps<"/chat/[id]">) {
  const me = await requireOnboarded();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const db = await getDb();
  const [conv] = await db.select().from(schema.conversations).where(eq(schema.conversations.id, id));
  if (!conv) notFound();

  if (!(await isMember(id, me.id))) {
    if (conv.kind === "room") {
      return (
        <div className="mx-auto max-w-md py-16 text-center">
          <Hash aria-hidden className="mx-auto size-8 text-muted-foreground" />
          <h1 className="page-title mt-3">{conv.title}</h1>
          <p className="mt-2 text-muted-foreground">{conv.topic}</p>
          <form action={joinRoom.bind(null, id)} className="mt-6">
            <Button type="submit" size="lg">
              Join room
            </Button>
          </form>
        </div>
      );
    }
    redirect("/chat");
  }

  const members = await getMembers(id);
  const other = conv.kind === "dm" ? members.find((m) => m.id !== me.id) : null;
  const title = other?.name ?? conv.title ?? "Chat";

  return (
    <div className="-mt-2 grid gap-8 md:-mt-4 lg:grid-cols-[1fr_240px]">
      <div className="flex h-[calc(100dvh-9.5rem)] min-h-[380px] min-w-0 flex-col md:h-[calc(100dvh-12rem)]">
        <div className="flex items-center gap-3 border-b pb-3">
          <Button asChild variant="ghost" size="icon-lg" className="-ml-2">
            <Link href="/chat" aria-label="Back to chats">
              <ArrowLeft aria-hidden />
            </Link>
          </Button>
          {other ? (
            <Avatar name={other.name} url={other.avatarUrl} size={36} />
          ) : (
            <Hash aria-hidden className="size-5 shrink-0 text-muted-foreground" />
          )}
          <div className="min-w-0 flex-1">
            {other ? (
              <Link href={`/people/${other.id}`} className="block truncate font-semibold hover:underline">
                {title}
              </Link>
            ) : (
              <h1 className="truncate font-semibold">{title}</h1>
            )}
            {conv.topic && <p className="truncate text-sm text-muted-foreground">{conv.topic}</p>}
            {conv.kind === "group" && <p className="tnum text-sm text-muted-foreground">{members.length} people</p>}
          </div>
          {other && (
            <BookDialog person={{ id: other.id, name: other.name, avatarUrl: other.avatarUrl }} label="Book a call" />
          )}
          {conv.kind !== "dm" && (
            <form action={leaveConversation.bind(null, id)}>
              <Button type="submit" variant="ghost" size="lg" aria-label="Leave">
                <LogOut aria-hidden /> <span className="hidden sm:inline">Leave</span>
              </Button>
            </form>
          )}
        </div>
        <ChatRoom conversationId={id} meId={me.id} />
      </div>

      <aside aria-labelledby="members" className="hidden lg:block">
        <h2 id="members" className="tnum pb-2 text-sm font-medium text-muted-foreground">
          {members.length} {members.length === 1 ? "member" : "members"}
        </h2>
        <ul className="mt-2 max-h-[60vh] overflow-y-auto">
          {members.map((m) => (
            <li key={m.id}>
              <Link href={`/people/${m.id}`} className="flex min-h-10 items-center gap-2.5 text-[0.9375rem] hover:underline">
                <Avatar name={m.name} url={m.avatarUrl} size={26} />
                <span className="truncate">{m.name}</span>
                {m.id === me.id && <span className="text-muted-foreground">(you)</span>}
              </Link>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
