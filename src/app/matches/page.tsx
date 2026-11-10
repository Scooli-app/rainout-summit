import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Handshake, X } from "lucide-react";
import { requireOnboarded } from "@/lib/me";
import { getTodaysMatches } from "@/lib/match";
import { messageMatch, skipMatch } from "@/app/actions";
import { Pair } from "@/components/Avatar";
import { RoleTag, VerifiedMark } from "@/components/Badge";
import { BookDialog } from "@/components/BookDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Profile } from "@/db/schema";

export const metadata: Metadata = { title: "Matches" };

export default async function Matches() {
  const me = await requireOnboarded();
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Lisbon" });
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="page-title">Today&apos;s matches</h1>
      <p className="mt-1 text-muted-foreground">
        <span className="tnum">{today}</span>. A new list every morning, based on what you need and what you offer
      </p>
      {me.lookingFor.length === 0 && (
        <Alert className="mt-6 flex flex-wrap items-center justify-between gap-3 py-3">
          <AlertDescription>You haven&apos;t said what you&apos;re looking for, so these matches are rough</AlertDescription>
          <Button asChild variant="outline" size="lg">
            <Link href="/onboarding">Add it to your profile</Link>
          </Button>
        </Alert>
      )}
      <Suspense fallback={<MatchSkeleton />}>
        <MatchList me={me} />
      </Suspense>
    </div>
  );
}

function MatchSkeleton() {
  return (
    <div aria-busy aria-label="Loading matches" className="mt-8 grid gap-4 md:grid-cols-2">
      {[0, 1, 2, 3].map((i) => (
        <Card key={i} className="gap-5 px-6 py-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-20 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3.5 w-44" />
            </div>
          </div>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-9 w-40" />
        </Card>
      ))}
    </div>
  );
}

async function MatchList({ me }: { me: Profile }) {
  const matches = await getTodaysMatches(me);
  if (!matches.length) {
    return (
      <Empty className="mt-8 border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Handshake aria-hidden />
          </EmptyMedia>
          <EmptyTitle>No matches yet</EmptyTitle>
          <EmptyDescription>You&apos;re early. Matches appear as more attendees move over</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild variant="outline" size="lg">
            <Link href="/chat">Say hi in the Lobby</Link>
          </Button>
        </EmptyContent>
      </Empty>
    );
  }
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-2">
      {matches.map(({ suggestion: s, person }) => {
        const subtitle = [person.jobTitle, person.company].filter(Boolean).join(" at ");
        return (
          <Card key={s.id} className="relative gap-5 py-6 transition-shadow hover:ring-foreground/20">
            <CardContent className="flex flex-col gap-5 px-6">
              <div className="flex items-center gap-4">
                <Pair me={me} them={person} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Link href={`/people/${person.id}`} className="truncate font-semibold after:absolute after:inset-0 after:rounded-xl">
                      {person.name}
                    </Link>
                    {person.wsVerified && <VerifiedMark />}
                  </div>
                  <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
                </div>
                <span className="hidden sm:inline-flex">
                  <RoleTag role={person.role} />
                </span>
              </div>
              <div>
                <p className="text-[1.0625rem] leading-relaxed">{s.reason}</p>
                {s.opener && <p className="mt-2 text-sm text-muted-foreground">Opener: “{s.opener}”</p>}
              </div>
            </CardContent>
            <CardFooter className="relative z-10 mt-auto gap-2 border-t-0 bg-transparent px-6 pt-0">
              <form action={messageMatch.bind(null, s.id)}>
                <Button type="submit" size="lg">
                  {s.status === "contacted" ? "Open chat" : "Say hi"}
                </Button>
              </form>
              <BookDialog person={{ id: person.id, name: person.name, avatarUrl: person.avatarUrl, subtitle }} />
              <form action={skipMatch.bind(null, s.id)} className="ml-auto">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="submit" variant="ghost" size="icon-lg" aria-label={`Skip ${person.name}`}>
                      <X aria-hidden />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Skip for today</TooltipContent>
                </Tooltip>
              </form>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
