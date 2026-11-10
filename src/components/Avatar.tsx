import { Avatar as AvatarRoot, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** A person's photo, or neutral initials. Size in px. */
export function Avatar({ name, url, size = 40, className }: { name: string; url?: string | null; size?: number; className?: string }) {
  return (
    <AvatarRoot className={cn("shrink-0", className)} style={{ width: size, height: size }}>
      {url && <AvatarImage src={url} alt="" />}
      <AvatarFallback className="font-medium" style={{ fontSize: Math.round(size * 0.36) }}>
        {initials(name)}
      </AvatarFallback>
    </AvatarRoot>
  );
}

type Who = { name: string; avatarUrl?: string | null };

/** The signature: you and them, overlapping. Used wherever a connection is shown. */
export function Pair({ me, them, size = 44 }: { me: Who; them: Who; size?: number }) {
  return (
    <span className="inline-flex shrink-0 items-center" role="img" aria-label={`You and ${them.name}`}>
      <Avatar name={me.name} url={me.avatarUrl} size={size} className="ring-[3px] ring-card" />
      <span style={{ marginLeft: -Math.round(size * 0.3) }}>
        <Avatar name={them.name} url={them.avatarUrl} size={size} className="ring-[3px] ring-card" />
      </span>
    </span>
  );
}
