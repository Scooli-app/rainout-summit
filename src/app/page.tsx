import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { count, eq } from "drizzle-orm";
import { CloudRain, Link2 } from "lucide-react";
import { SignInButton } from "@clerk/nextjs";
import { getDb, schema } from "@/db";
import { Pair } from "@/components/Avatar";
import { RoleTag } from "@/components/Badge";
import { Logo } from "@/components/Logo";
import { StormMascot } from "@/components/StormMascot";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

const STEPS = [
  ["Paste your link", "We read your public Web Summit profile and copy your name, role, company and bio. Never your password"],
  ["Say what you need", "Pick what you're looking for and what you can offer. Matching runs on that"],
  ["Meet", "Message today's matches, join a topic room, or book a 20 minute video call"],
];

export default async function Home() {
  const { userId } = await auth();
  if (userId) redirect("/matches");
  const db = await getDb();
  const [{ n }] = await db.select({ n: count() }).from(schema.profiles).where(eq(schema.profiles.onboarded, true));

  return (
    <div className="-mt-8 md:-mt-12">
      {/* Hero: no top bar, the storm is the star */}
      <section className="flex min-h-[100dvh] flex-col py-6 lg:py-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" aria-label="Rainout Summit home" className="w-fit">
            <Logo />
          </Link>
          <SignInButton mode="modal">
            <Button variant="outline" size="lg" className="h-9 px-4">
              Log in
            </Button>
          </SignInButton>
        </div>
        <div className="grid flex-1 items-center gap-8 pt-6 lg:grid-cols-[1fr_1fr] lg:gap-14 lg:pt-0">
        <div className="flex min-w-0 flex-col">
          <h1 className="text-[clamp(2.4rem,1.5rem+3.4vw,4rem)] leading-[1.03] font-medium tracking-[-0.03em] text-balance">
            The storm cancelled Web Summit. It feels terrible about it
          </h1>
          <p className="mt-5 max-w-[34rem] text-lg leading-relaxed text-muted-foreground">
            So it built you this. Bring your attendee profile over, get matched with the founders, investors and speakers you were going to
            meet, and meet them on a call instead.
          </p>

          <form action="/onboarding" method="get" className="mt-8 max-w-xl">
            <Field>
              <FieldLabel htmlFor="ws">Your Web Summit profile link</FieldLabel>
              <div className="flex flex-col gap-2 sm:flex-row">
                <InputGroup className="h-12 min-w-0 flex-1 bg-card">
                  <InputGroupAddon>
                    <Link2 aria-hidden />
                  </InputGroupAddon>
                  <InputGroupInput id="ws" name="ws" inputMode="url" autoComplete="off" placeholder="attend.websummit.com/…" />
                </InputGroup>
                <Button type="submit" size="lg" className="h-12 px-6 text-base">
                  Accept the apology
                </Button>
              </div>
              <FieldDescription>In the Web Summit app, open your profile and tap Copy profile link. No link? Continue and fill it in by hand</FieldDescription>
            </Field>
          </form>

          {n >= 20 && (
            <p className="mt-6 text-sm text-muted-foreground">
              <span className="tnum text-foreground">{n.toLocaleString("en")}</span> attendees have moved over so far
            </p>
          )}
        </div>

        <StormScene />
        </div>
      </section>

      <section aria-labelledby="preview" className="grid items-center gap-10 border-t py-16 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div>
          <h2 id="preview" className="text-[clamp(1.75rem,1.3rem+1.4vw,2.5rem)] leading-tight font-medium tracking-[-0.02em] text-balance">
            Every morning, a short list of people worth your time
          </h2>
          <p className="mt-4 max-w-[34rem] text-muted-foreground">
            Matches go both ways: they have what you&apos;re after, or need what you offer. Say hi, start a small group, or book a call in a
            couple of taps.
          </p>
          <ol className="mt-10 grid gap-8 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {STEPS.map(([t, d], i) => (
              <li key={t}>
                <span className="tnum text-sm text-subtle-foreground">Step {i + 1}</span>
                <h3 className="mt-1.5 font-medium">{t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{d}</p>
              </li>
            ))}
          </ol>
        </div>
        <ProductPreview />
      </section>
    </div>
  );
}

/** The hero's one bright moment: Storm, apologising, still drizzling. */
function StormScene() {
  return (
    <figure className="relative order-first mx-auto w-full max-w-[560px] min-w-0 lg:order-none">
      <div className="relative overflow-hidden rounded-[28px] bg-brand-soft px-6 pt-20 pb-5 sm:px-10 sm:pt-28 sm:pb-6">
        {/* speech bubble */}
        <div className="absolute top-5 left-5 max-w-[15rem] rounded-2xl rounded-bl-sm bg-card px-4 py-2.5 text-sm leading-snug shadow-lg shadow-foreground/5 ring-1 ring-foreground/5 sm:top-6 sm:left-10 sm:max-w-[16rem] sm:py-3 sm:text-[0.9375rem]">
          Sorry about Web Summit. I made you this instead
        </div>
        <StormMascot className="mx-auto max-w-[230px] drop-shadow-[0_18px_24px_rgb(35_67_213/0.18)] sm:max-w-[380px]" />
        {/* the forecast */}
        <div className="mx-auto mt-2 flex w-fit max-w-full items-center gap-3 rounded-xl bg-card px-4 py-2.5 text-[0.8125rem] shadow-sm ring-1 ring-foreground/5 sm:text-sm">
          <CloudRain aria-hidden className="size-5 text-brand" />
          <span>
            Lisbon right now: <span className="text-muted-foreground">pouring.</span> Chance of meetings:{" "}
            <span className="tnum font-medium">100%</span>
          </span>
        </div>
      </div>
      <figcaption className="sr-only">Charles, the cloud that cancelled Web Summit, apologising with a speech bubble</figcaption>
    </figure>
  );
}

/** What the app looks like, built from the same parts, with sample people. */
function ProductPreview() {
  const you = { name: "You" };
  const rows = [
    { name: "Ana Costa", role: "investor", sub: "Partner at Atlantic Ventures", reason: "Writes seed cheques in edtech, which is the round you're raising" },
    { name: "Mia Lund", role: "speaker", sub: "Head of AI at Nordbank", reason: "Was due to speak on AI in banking and is looking for partners" },
  ];
  return (
    <figure className="min-w-0">
      <Card className="gap-0 py-0 shadow-xl shadow-foreground/5">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <span className="font-medium">Today&apos;s matches</span>
          <span className="tnum text-sm text-subtle-foreground">Wed 11 Nov</span>
        </div>
        <ul>
          {rows.map((r) => (
            <li key={r.name} className="border-b px-5 py-5 last:border-0">
              <div className="flex items-center gap-3">
                <Pair me={you} them={r} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{r.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{r.sub}</p>
                </div>
                <span className="hidden sm:inline-flex">
                  <RoleTag role={r.role} />
                </span>
              </div>
              <p className="mt-3">{r.reason}</p>
            </li>
          ))}
        </ul>
        <div className="border-t bg-background px-5 py-4">
          <p className="text-sm text-muted-foreground">Book a call with Ana, Thursday 12</p>
          <div className="mt-3 grid grid-cols-4 gap-2 text-sm">
            {["10:00", "11:30", "15:00", "16:30"].map((t) => (
              <span
                key={t}
                className={cn(
                  "tnum flex h-9 items-center justify-center rounded-lg border",
                  t === "15:00" ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card",
                )}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </Card>
      <figcaption className="mt-3 text-sm text-subtle-foreground">Preview with sample people</figcaption>
    </figure>
  );
}
