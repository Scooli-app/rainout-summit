import Link from "next/link";
import type { Profile } from "@/db/schema";
import { startDm } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar } from "./Avatar";
import { RoleTag, VerifiedMark } from "./Badge";
import { BookDialog } from "./BookDialog";

/** A person: face first, then who they are and what they can help with. */
export function PersonCard({ p }: { p: Profile }) {
  const subtitle = [p.jobTitle, p.company].filter(Boolean).join(" at ");
  const place = [p.industry, p.location?.split(",")[0]].filter(Boolean).join(", ");
  return (
    <Card className="relative gap-4 py-5 transition-shadow hover:ring-foreground/20">
      <CardContent className="flex flex-col gap-4 px-5">
        <div className="flex items-start gap-4">
          <Avatar name={p.name} url={p.avatarUrl} size={56} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {/* Stretched link: the whole card opens the profile */}
              <Link href={`/people/${p.id}`} className="truncate text-base font-semibold after:absolute after:inset-0 after:rounded-xl">
                {p.name}
              </Link>
              {p.wsVerified && <VerifiedMark />}
            </div>
            <p className="truncate text-muted-foreground">{subtitle || " "}</p>
            <div className="mt-1 flex min-w-0 items-center gap-3">
              <RoleTag role={p.role} />
              {place && <span className="truncate text-sm text-subtle-foreground">{place}</span>}
            </div>
          </div>
        </div>
        {p.offering.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Can help with <span className="text-foreground">{p.offering.slice(0, 3).join(", ").toLowerCase()}</span>
          </p>
        )}
      </CardContent>
      <CardFooter className="relative z-10 mt-auto gap-2 border-t-0 bg-transparent px-5 pt-0">
        <form action={startDm.bind(null, p.id)} className="flex-1">
          <Button type="submit" size="lg" className="w-full">
            Message
          </Button>
        </form>
        <BookDialog person={{ id: p.id, name: p.name, avatarUrl: p.avatarUrl, subtitle }} className="flex-1" />
      </CardFooter>
    </Card>
  );
}
