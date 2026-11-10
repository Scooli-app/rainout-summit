"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { requestMeeting } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Field, FieldDescription, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { Avatar } from "./Avatar";
import { Submit } from "./forms";

type Person = { id: string; name: string; avatarUrl?: string | null; subtitle?: string | null };

/** "Book" button that opens a dialog on desktop and a bottom drawer on phones. */
export function BookDialog({
  person,
  label = "Book",
  variant = "outline",
  className,
}: {
  person: Person;
  label?: string;
  variant?: "outline" | "default" | "secondary";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const desktop = useMediaQuery("(min-width: 640px)");
  const first = person.name.split(" ")[0];
  const trigger = (
    <Button variant={variant} size="lg" className={className}>
      <CalendarPlus aria-hidden /> {label}
    </Button>
  );
  const head = (
    <div className="flex items-center gap-3 text-left">
      <Avatar name={person.name} url={person.avatarUrl} size={40} />
      <div className="min-w-0">
        <p className="truncate text-base font-medium">Book a call with {first}</p>
        {person.subtitle && <p className="truncate text-sm font-normal text-muted-foreground">{person.subtitle}</p>}
      </div>
    </div>
  );
  // Rendered only while open: the slots depend on the viewer's clock and time zone
  const body = open && <BookForm inviteeId={person.id} firstName={first} onDone={() => setOpen(false)} />;

  if (desktop)
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle asChild>{head}</DialogTitle>
            <DialogDescription className="sr-only">Pick a day, a time and a length</DialogDescription>
          </DialogHeader>
          {body}
        </DialogContent>
      </Dialog>
    );

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle asChild>{head}</DrawerTitle>
          <DrawerDescription className="sr-only">Pick a day, a time and a length</DrawerDescription>
        </DrawerHeader>
        <div className="max-h-[72dvh] overflow-y-auto px-4 pb-6">{body}</div>
      </DrawerContent>
    </Drawer>
  );
}

function buildDays(count = 6) {
  const days: Date[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  for (let i = 0; i < count; i++) days.push(new Date(d.getTime() + i * 86_400_000));
  return days;
}

const SLOTS = Array.from({ length: 27 }, (_, i) => {
  const mins = 8 * 60 + i * 30; // 08:00 to 21:00, local time
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
});
const DURATIONS = ["15", "20", "30", "45"];
const ON = "data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground";

function at(day: Date, hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(day);
  d.setHours(h, m, 0, 0);
  return d;
}

function BookForm({ inviteeId, firstName, onDone }: { inviteeId: string; firstName: string; onDone: () => void }) {
  const [state, action] = useActionState(requestMeeting, {});
  const [days] = useState(() => buildDays());
  const [now] = useState(() => Date.now());
  const [dayIdx, setDayIdx] = useState(() => (SLOTS.some((t) => at(days[0], t).getTime() > now + 15 * 60_000) ? "0" : "1"));
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("20");
  const day = days[Number(dayIdx)];
  const iso = time ? at(day, time).toISOString() : "";
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, " ");

  const announced = useRef(false);
  useEffect(() => {
    if (!state.ok || announced.current) return;
    announced.current = true;
    toast.success(`Request sent to ${firstName}`, { description: "It shows in Meetings until they reply" });
    onDone();
  }, [state.ok, firstName, onDone]);

  return (
    <form action={action} className="flex flex-col gap-6 pt-2">
      <input type="hidden" name="inviteeId" value={inviteeId} />
      <input type="hidden" name="startsAt" value={iso} />
      <input type="hidden" name="durationMin" value={duration} />

      <FieldSet>
        <FieldLegend variant="label">Day</FieldLegend>
        <ToggleGroup
          type="single"
          variant="outline"
          spacing={2}
          value={dayIdx}
          onValueChange={(v) => {
            if (!v) return;
            setDayIdx(v);
            setTime("");
          }}
          className="-mx-1 w-auto justify-start overflow-x-auto px-1 pb-1"
        >
          {days.map((d, i) => (
            <ToggleGroupItem
              key={i}
              value={String(i)}
              aria-label={d.toDateString()}
              className={cn("h-16 w-[4.5rem] shrink-0 flex-col gap-0 rounded-lg leading-tight", ON)}
            >
              <span className="text-xs opacity-75">{i === 0 ? "Today" : d.toLocaleDateString([], { weekday: "short" })}</span>
              <span className="tnum text-lg font-medium">{d.getDate()}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend variant="label">
          Time <span className="font-normal text-muted-foreground">({tz})</span>
        </FieldLegend>
        <ToggleGroup
          type="single"
          variant="outline"
          spacing={2}
          value={time}
          onValueChange={(v) => setTime(v)}
          className="grid max-h-44 w-full grid-cols-4 overflow-y-auto pr-1 sm:grid-cols-5"
        >
          {SLOTS.map((t) => {
            const past = at(day, t).getTime() < now + 15 * 60_000;
            return (
              <ToggleGroupItem key={t} value={t} disabled={past} className={cn("tnum h-9 w-full rounded-lg", ON, past && "line-through")}>
                {t}
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend variant="label">Length</FieldLegend>
        <ToggleGroup
          type="single"
          variant="outline"
          spacing={2}
          value={duration}
          onValueChange={(v) => v && setDuration(v)}
          className="grid w-full grid-cols-4"
        >
          {DURATIONS.map((m) => (
            <ToggleGroupItem key={m} value={m} className={cn("tnum h-9 w-full rounded-lg", ON)}>
              {m} min
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </FieldSet>

      <Field>
        <FieldLabel htmlFor={`note-${inviteeId}`}>
          What&apos;s it about? <span className="font-normal text-muted-foreground">(optional)</span>
        </FieldLabel>
        <Textarea id={`note-${inviteeId}`} name="note" rows={2} maxLength={500} />
        {state.error && <FieldDescription className="text-destructive">{state.error}</FieldDescription>}
      </Field>

      <Submit pendingText="Sending…" className="h-11 w-full text-base" disabled={!time}>
        {time ? `Request ${day.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" })}, ${time}` : "Pick a time"}
      </Submit>
    </form>
  );
}
