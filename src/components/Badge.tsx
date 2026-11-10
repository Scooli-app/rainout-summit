import { BadgeCheck } from "lucide-react";

export function RoleTag({ role }: { role: string }) {
  return (
    <span className="role" data-role={role}>
      {role}
    </span>
  );
}

export function VerifiedMark({ withLabel = false }: { withLabel?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 text-brand" title="Verified Web Summit 2026 attendee">
      <BadgeCheck aria-hidden className="size-4" strokeWidth={2} />
      {withLabel ? <span className="text-sm font-medium">Verified attendee</span> : <span className="sr-only">Verified attendee</span>}
    </span>
  );
}
