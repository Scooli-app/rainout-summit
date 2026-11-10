"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** A meeting time in the viewer's own time zone: day on one line, time large below. */
export function LocalTime({ iso }: { iso: string }) {
  // Snapshots must be stable values, so join to a string and split after.
  const [day, time] = useSyncExternalStore(
    subscribe,
    () => {
      const d = new Date(iso);
      return `${d.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" })}|${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    },
    () => {
      const d = new Date(iso);
      return `${d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })}|${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} UTC`;
    },
  ).split("|");
  return (
    <time dateTime={iso} className="block">
      <span className="block text-sm text-muted-foreground">{day}</span>
      <span className="block text-xl leading-tight font-medium">{time}</span>
    </time>
  );
}
