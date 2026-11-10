import type { Metadata } from "next";
import Link from "next/link";
import { and, arrayContains, count, desc, eq, ilike, ne, or, type SQL } from "drizzle-orm";
import { Search, Users } from "lucide-react";
import { getDb, schema } from "@/db";
import { requireOnboarded } from "@/lib/me";
import { INDUSTRIES, INTENTS, ROLES } from "@/lib/constants";
import { PersonCard } from "@/components/PersonCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const metadata: Metadata = { title: "People" };
const { profiles } = schema;

export default async function People({ searchParams }: PageProps<"/people">) {
  const me = await requireOnboarded();
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).trim() : "");
  const q = str("q").slice(0, 80);
  const any = (v: string) => (v === "all" ? "" : v);
  const role = any(str("role"));
  const industry = any(str("industry"));
  const offers = any(str("offers"));
  const verified = str("verified") === "1";
  const filtered = !!(q || role || industry || offers || verified);

  const where: SQL[] = [eq(profiles.onboarded, true), ne(profiles.id, me.id)];
  if (q) {
    const like = `%${q.replace(/[%_\\]/g, "\\$&")}%`;
    where.push(or(ilike(profiles.name, like), ilike(profiles.company, like), ilike(profiles.jobTitle, like), ilike(profiles.bio, like))!);
  }
  if ((ROLES as readonly string[]).includes(role)) where.push(eq(profiles.role, role));
  if (industry) where.push(ilike(profiles.industry, industry));
  if ((INTENTS as readonly string[]).includes(offers)) where.push(arrayContains(profiles.offering, [offers]));
  if (verified) where.push(eq(profiles.wsVerified, true));

  const db = await getDb();
  const [people, [{ total }]] = await Promise.all([
    db.select().from(profiles).where(and(...where)).orderBy(desc(profiles.wsVerified), desc(profiles.updatedAt)).limit(60),
    db.select({ total: count() }).from(profiles).where(and(...where)),
  ]);

  return (
    <div>
      <h1 className="page-title">People</h1>
      <p className="tnum mt-1 text-muted-foreground">
        {total.toLocaleString("en")} {total === 1 ? "person" : "people"}
        {filtered ? " match these filters" : " here so far"}
      </p>

      <Card className="mt-6 py-3">
        <form role="search" className="grid grid-cols-2 gap-2 px-3 lg:grid-cols-[2fr_1fr_1fr_1.2fr_auto_auto] lg:items-center">
          <InputGroup className="col-span-2 h-10 lg:col-span-1">
            <InputGroupAddon>
              <Search aria-hidden />
            </InputGroupAddon>
            <InputGroupInput name="q" defaultValue={q} placeholder="Search" aria-label="Search people" />
          </InputGroup>
          <Select name="role" defaultValue={role || "all"}>
            <SelectTrigger className="h-10 w-full" aria-label="Role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any role</SelectItem>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r[0].toUpperCase() + r.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select name="industry" defaultValue={industry || "all"}>
            <SelectTrigger className="h-10 w-full" aria-label="Industry">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any industry</SelectItem>
              {INDUSTRIES.map((i) => (
                <SelectItem key={i} value={i}>
                  {i}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select name="offers" defaultValue={offers || "all"}>
            <SelectTrigger className="h-10 w-full" aria-label="Offers">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Offers anything</SelectItem>
              {INTENTS.map((i) => (
                <SelectItem key={i} value={i}>
                  Offers {i.toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex h-10 items-center gap-2 px-1">
            <Checkbox id="verified" name="verified" value="1" defaultChecked={verified} />
            <Label htmlFor="verified" className="font-normal">
              Verified only
            </Label>
          </div>
          <Button type="submit" size="lg" className="col-span-2 h-10 px-4 lg:col-span-1">
            Search
          </Button>
        </form>
      </Card>

      {people.length === 0 ? (
        <Empty className="mt-8 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users aria-hidden />
            </EmptyMedia>
            <EmptyTitle>{filtered ? "Nobody matches these filters yet" : "You're one of the first here"}</EmptyTitle>
            <EmptyDescription>{filtered ? "People are still arriving. Loosen a filter or check back soon" : "More attendees are moving over now"}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild variant="outline" size="lg">
              {filtered ? <Link href="/people">Clear filters</Link> : <Link href="/chat">Say hi in the Lobby</Link>}
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((p) => (
            <PersonCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}
