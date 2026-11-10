import { conversations } from "./schema";
import { ROOMS } from "@/lib/constants";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// Public topic rooms. Idempotent and safe to run from several instances at once.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function seedRooms(db: any) {
  await db
    .insert(conversations)
    .values(ROOMS.map((r) => ({ kind: "room", title: r.title, topic: r.topic, slug: slugify(r.title) })))
    .onConflictDoNothing({ target: conversations.slug });
}
