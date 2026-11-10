import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Lock, Mail, MapPin, MessageCircle, MessageSquare } from "lucide-react";
import { getDb, schema } from "@/db";
import { areConnected, requireOnboarded, whatsappLink } from "@/lib/me";
import { startDm } from "@/app/actions";
import { Avatar } from "@/components/Avatar";
import { RoleTag, VerifiedMark } from "@/components/Badge";
import { BookDialog } from "@/components/BookDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function Person({ params }: PageProps<"/people/[id]">) {
  const me = await requireOnboarded();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const db = await getDb();
  const [p] = await db.select().from(schema.profiles).where(eq(schema.profiles.id, id));
  if (!p || !p.onboarded) notFound();
  const isMe = p.id === me.id;
  const first = p.name.split(" ")[0];
  const subtitle = [p.jobTitle, p.company].filter(Boolean).join(" at ");
  const connected = await areConnected(me.id, p.id);
  const wa = whatsappLink(p.whatsapp);
  const lists: [string, string[]][] = [
    ["Looking for", p.lookingFor],
    ["Can help with", p.offering],
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr] lg:gap-10">
      <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
        <Card className="py-7">
          <CardContent className="flex w-full flex-col items-center px-6 text-center">
            <Avatar name={p.name} url={p.avatarUrl} size={104} />
            <div className="mt-5 flex items-center justify-center gap-1.5">
              <h1 className="text-2xl font-medium tracking-[-0.02em]">{p.name}</h1>
              {p.wsVerified && <VerifiedMark />}
            </div>
            {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
              <RoleTag role={p.role} />
              {p.location && (
                <span className="inline-flex items-center gap-1 text-sm text-subtle-foreground">
                  <MapPin aria-hidden className="size-3.5" /> {p.location}
                </span>
              )}
            </div>
            {isMe ? (
              <Button asChild variant="outline" size="lg" className="mt-6 w-full">
                <Link href="/onboarding">Edit your profile</Link>
              </Button>
            ) : (
              <div className="mt-6 flex w-full flex-col gap-2">
                <form action={startDm.bind(null, p.id)}>
                  <Button type="submit" size="lg" className="h-10 w-full">
                    <MessageSquare aria-hidden /> Message {first}
                  </Button>
                </form>
                <BookDialog person={{ id: p.id, name: p.name, avatarUrl: p.avatarUrl, subtitle }} label="Book a call" className="h-10 w-full" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="gap-3 py-5">
          <CardHeader className="px-5">
            <CardTitle className="text-[0.9375rem] font-medium">Contact</CardTitle>
          </CardHeader>
          <CardContent className="px-5">
            {connected ? (
              <ul className="flex flex-col gap-2.5 text-[0.9375rem]">
                {p.contactEmail && (
                  <li>
                    <a href={`mailto:${p.contactEmail}`} className="inline-flex items-center gap-2.5 break-all hover:underline">
                      <Mail aria-hidden className="size-4 shrink-0 text-subtle-foreground" /> {p.contactEmail}
                    </a>
                  </li>
                )}
                {wa && (
                  <li>
                    <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2.5 hover:underline">
                      <MessageCircle aria-hidden className="size-4 shrink-0 text-subtle-foreground" /> WhatsApp{" "}
                      <span className="tnum text-muted-foreground">{p.whatsapp}</span>
                    </a>
                  </li>
                )}
                {p.linkedinUrl && (
                  <li>
                    <a href={p.linkedinUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-2.5 hover:underline">
                      <LinkedInMark /> LinkedIn
                    </a>
                  </li>
                )}
                {!p.contactEmail && !wa && !p.linkedinUrl && <li className="text-sm text-muted-foreground">No contact details added yet</li>}
              </ul>
            ) : (
              <p className="flex gap-2 text-sm text-muted-foreground">
                <Lock aria-hidden className="mt-0.5 size-4 shrink-0" /> Email and WhatsApp unlock once you&apos;ve messaged {first} or booked a call
              </p>
            )}
          </CardContent>
        </Card>
      </aside>

      <div className="flex min-w-0 flex-col gap-4">
        {p.bio && (
          <Card className="gap-3 py-6">
            <CardHeader className="px-6">
              <CardTitle className="section-title">About {first}</CardTitle>
            </CardHeader>
            <CardContent className="px-6">
              <p className="max-w-[68ch] whitespace-pre-line text-muted-foreground">{p.bio}</p>
              {p.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {p.tags.map((t) => (
                    <Badge key={t} variant="secondary">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {lists.map(([title, items]) => (
            <Card key={title} className="gap-3 py-5">
              <CardHeader className="px-5">
                <CardTitle className="text-[0.9375rem] font-medium">{title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1.5 px-5">
                {items.length ? (
                  items.map((x) => (
                    <Badge key={x} variant="secondary">
                      {x}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Not said yet</span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {p.wsSessions.length > 0 && (
          <Card className="gap-3 py-6">
            <CardHeader className="px-6">
              <CardTitle className="section-title">Was on the Web Summit programme</CardTitle>
            </CardHeader>
            <CardContent className="px-6">
              {p.wsSessions.map((s, i) => (
                <div key={i}>
                  {i > 0 && <Separator className="my-3" />}
                  <div className="flex gap-4">
                    <span className="tnum w-28 shrink-0 text-sm text-muted-foreground">{s.time}</span>
                    <span>
                      <span className="font-medium">{s.title}</span>
                      <span className="block text-sm text-muted-foreground">{[s.stage, s.track].filter(Boolean).join(", ")}</span>
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// lucide no longer ships brand icons; a minimal "in" mark in the same stroke weight
function LinkedInMark() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-4 shrink-0 text-subtle-foreground" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M8 11v5M8 8v.01M12 16v-5M16 16v-3a2 2 0 0 0-4 0" />
    </svg>
  );
}
