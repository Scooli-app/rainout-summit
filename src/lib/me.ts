import "server-only";
import { randomInt } from "node:crypto";
import { auth, currentUser } from "@clerk/nextjs/server";
import { and, eq, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getDb, schema } from "@/db";

function newVerifyCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 5; i++) s += alphabet[randomInt(alphabet.length)];
  return `RAIN-${s}`;
}

/** The signed-in user's profile, created on first visit from their Clerk account. */
export const getMe = cache(async () => {
  const { userId } = await auth();
  if (!userId) redirect("/");
  const db = await getDb();
  const [existing] = await db.select().from(schema.profiles).where(eq(schema.profiles.clerkUserId, userId));
  if (existing?.contactEmail) return existing;

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress ?? null;
  if (existing) {
    // Profiles from before contact details existed: prefill the sign-in email once.
    if (!email) return existing;
    const [updated] = await db.update(schema.profiles).set({ contactEmail: email }).where(eq(schema.profiles.id, existing.id)).returning();
    return updated;
  }
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.username || "New attendee";
  const [created] = await db
    .insert(schema.profiles)
    .values({ clerkUserId: userId, name, avatarUrl: user?.imageUrl ?? null, contactEmail: email, verifyCode: newVerifyCode() })
    .onConflictDoNothing({ target: schema.profiles.clerkUserId })
    .returning();
  if (created) return created;
  const [again] = await db.select().from(schema.profiles).where(eq(schema.profiles.clerkUserId, userId));
  return again;
});

/** Same as getMe, but sends people who haven't finished onboarding to /onboarding. */
export async function requireOnboarded() {
  const me = await getMe();
  if (!me.onboarded) redirect("/onboarding");
  return me;
}

/** Contact details are only shared between people who have a chat or a meeting together. */
export async function areConnected(a: string, b: string) {
  if (a === b) return true;
  const db = await getDb();
  const dmKey = [a, b].sort().join(":");
  const [dm] = await db.select({ id: schema.conversations.id }).from(schema.conversations).where(eq(schema.conversations.dmKey, dmKey));
  if (dm) return true;
  const [m] = await db
    .select({ id: schema.meetings.id })
    .from(schema.meetings)
    .where(
      or(
        and(eq(schema.meetings.requesterId, a), eq(schema.meetings.inviteeId, b)),
        and(eq(schema.meetings.requesterId, b), eq(schema.meetings.inviteeId, a)),
      ),
    );
  return !!m;
}

export function whatsappLink(raw: string | null) {
  const digits = (raw ?? "").replace(/\D/g, "");
  return digits.length >= 7 ? `https://wa.me/${digits}` : null;
}
