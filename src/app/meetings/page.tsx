import type { Metadata } from "next";
import Link from "next/link";
import { CalendarPlus, Mail, MessageCircle, Video } from "lucide-react";
import { eq, inArray, or } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireOnboarded, whatsappLink } from "@/lib/me";
import { googleCalendarUrl } from "@/lib/video";
import { cancelMeeting, respondToMeeting } from "@/app/actions";
import { Avatar } from "@/components/Avatar";
import { LocalTime } from "@/components/LocalTime";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Meeting } from "@/db/schema";

export const metadata: Metadata = { title: "Meetings" };
const { meetings, profiles } = schema;

type Person = { id: string; name: string; avatarUrl: string | null; company: string | null; contactEmail: string | null; whatsapp: string | null };

async function loadMeetings(meId: string) {
  const db = await getDb();
  const all = await db
    .select()
    .from(meetings)
    .where(or(eq(meetings.requesterId, meId), eq(meetings.inviteeId, meId)))
    .orderBy(meetings.startsAt)
    .limit(200);
  const ids = [...new Set(all.flatMap((m) => [m.requesterId, m.inviteeId]))];
  const people: Person[] = ids.length
    ? await db
        .select({ id: profiles.id, name: profiles.name, avatarUrl: profiles.avatarUrl, company: profiles.company, contactEmail: profiles.contactEmail, whatsapp: profiles.whatsapp })
        .from(profiles)
        .where(inArray(profiles.id, ids))
    : [];
  const now = Date.now();
  const ended = (m: Meeting) => m.startsAt.getTime() + m.durationMin * 60_000 < now;
  return {
    who: new Map(people.map((p) => [p.id, p])),
    incoming: all.filter((m) => m.status === "pending" && m.inviteeId === meId && !ended(m)),
    upcoming: all.filter((m) => m.status === "accepted" && !ended(m)),
    outgoing: all.filter((m) => m.status === "pending" && m.requesterId === meId && !ended(m)),
    past: all
      .filter((m) => ended(m) || m.status === "declined" || m.status === "cancelled")
      .reverse()
      .slice(0, 20),
  };
}

function Row({ m, other, children }: { m: Meeting; other?: Person; children?: React.ReactNode }) {
  const closed = m.status === "declined" || m.status === "cancelled";
  return (
    <li>
      <Card className={closed ? "py-5 opacity-70" : "py-5"}>
        <CardContent className="grid gap-x-6 gap-y-4 px-5 sm:grid-cols-[8.5rem_1fr_auto] sm:items-center">
          <div className="tnum">
            <LocalTime iso={m.startsAt.toISOString()} />
            <p className="text-sm text-muted-foreground">{m.durationMin} min</p>
          </div>
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={other?.name ?? "?"} url={other?.avatarUrl} size={44} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {other ? (
                  <Link href={`/people/${other.id}`} className="font-medium hover:underline">
                    {other.name}
                  </Link>
                ) : (
                  <span className="font-medium">Someone</span>
                )}
                {closed && (
                  <Badge variant="secondary" className="capitalize">
                    {m.status}
                  </Badge>
                )}
              </div>
              {other?.company && <p className="truncate text-sm text-muted-foreground">{other.company}</p>}
              {m.note && <p className="line-clamp-2 max-w-[60ch] text-sm text-muted-foreground">“{m.note}”</p>}
            </div>
          </div>
          {children && <div className="flex flex-wrap gap-2 sm:justify-end">{children}</div>}
        </CardContent>
      </Card>
    </li>
  );
}

function Section({ title, count, empty, children }: { title: string; count: number; empty: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="section-title flex items-center gap-2">
        {title}
        <span className="tnum text-base font-normal text-subtle-foreground">{count}</span>
      </h2>
      {count === 0 ? <p className="mt-2 text-muted-foreground">{empty}</p> : <ul className="mt-3 flex flex-col gap-3">{children}</ul>}
    </section>
  );
}

function ContactButtons({ p }: { p?: Person }) {
  if (!p) return null;
  const wa = whatsappLink(p.whatsapp);
  return (
    <>
      {p.contactEmail && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild variant="outline" size="icon-lg">
              <a href={`mailto:${p.contactEmail}`} aria-label={`Email ${p.name}`}>
                <Mail aria-hidden />
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{p.contactEmail}</TooltipContent>
        </Tooltip>
      )}
      {wa && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild variant="outline" size="icon-lg">
              <a href={wa} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${p.name}`}>
                <MessageCircle aria-hidden />
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>WhatsApp</TooltipContent>
        </Tooltip>
      )}
    </>
  );
}

export default async function Meetings() {
  const me = await requireOnboarded();
  const { who, incoming, upcoming, outgoing, past } = await loadMeetings(me.id);
  const otherOf = (m: Meeting) => who.get(m.requesterId === me.id ? m.inviteeId : m.requesterId);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10">
      <div>
        <h1 className="page-title">Meetings</h1>
        <p className="mt-1 text-muted-foreground">Book calls from anyone&apos;s profile. Once they accept, you both get a video link. Times are in your time zone</p>
      </div>

      <Section title="Requests for you" count={incoming.length} empty="No one is waiting on you">
        {incoming.map((m) => (
          <Row key={m.id} m={m} other={otherOf(m)}>
            <form action={respondToMeeting.bind(null, m.id, true)}>
              <Button type="submit" size="lg">
                Accept
              </Button>
            </form>
            <form action={respondToMeeting.bind(null, m.id, false)}>
              <Button type="submit" variant="ghost" size="lg">
                Decline
              </Button>
            </form>
          </Row>
        ))}
      </Section>

      <Section title="Upcoming" count={upcoming.length} empty="Nothing booked yet. Find someone in Matches or People and book a call">
        {upcoming.map((m) => (
          <Row key={m.id} m={m} other={otherOf(m)}>
            {m.videoUrl && (
              <Button asChild size="lg">
                <a href={m.videoUrl} target="_blank" rel="noopener noreferrer">
                  <Video aria-hidden /> Join call
                </a>
              </Button>
            )}
            <Button asChild variant="outline" size="lg">
              <a
                href={googleCalendarUrl(`Rainout Summit: ${me.name} and ${otherOf(m)?.name ?? "call"}`, m.startsAt, m.durationMin, m.videoUrl ?? "")}
                target="_blank"
                rel="noopener noreferrer"
              >
                <CalendarPlus aria-hidden /> Calendar
              </a>
            </Button>
            <ContactButtons p={otherOf(m)} />
            <form action={cancelMeeting.bind(null, m.id)}>
              <Button type="submit" variant="ghost" size="lg">
                Cancel
              </Button>
            </form>
          </Row>
        ))}
      </Section>

      <Section title="Waiting for a reply" count={outgoing.length} empty="No open requests">
        {outgoing.map((m) => (
          <Row key={m.id} m={m} other={otherOf(m)}>
            <form action={cancelMeeting.bind(null, m.id)}>
              <Button type="submit" variant="ghost" size="lg">
                Withdraw
              </Button>
            </form>
          </Row>
        ))}
      </Section>

      {past.length > 0 && (
        <Section title="Past and closed" count={past.length} empty="">
          {past.map((m) => (
            <Row key={m.id} m={m} other={otherOf(m)} />
          ))}
        </Section>
      )}
    </div>
  );
}
