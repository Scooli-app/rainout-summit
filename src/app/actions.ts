"use server";

import { and, eq, inArray, ne, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { getMe } from "@/lib/me";
import { fetchWsProfile, parseWsUrl } from "@/lib/websummit";
import { ensureDm, isMember, postMessage } from "@/lib/chat";
import { createVideoRoom } from "@/lib/video";
import { INDUSTRIES, INTENTS, MAX_GROUP_SIZE, ROLES } from "@/lib/constants";

const { profiles, conversations, conversationMembers, meetings, matchSuggestions } = schema;

export type FormState = { ok?: boolean; error?: string; message?: string };

// ---------- Web Summit import & verification ----------

export async function importWsProfile(_: FormState, formData: FormData): Promise<FormState> {
  const me = await getMe();
  const ref = parseWsUrl(String(formData.get("url") ?? ""));
  if (!ref) return { error: "That doesn't look like a Web Summit profile link. In the Web Summit app, open your profile and tap Copy profile link" };

  let ws;
  try {
    ws = await fetchWsProfile(ref);
  } catch {
    return { error: "Couldn't reach Web Summit right now. Try again in a minute, or fill in your profile by hand." };
  }
  if (!ws) return { error: "We couldn't read that profile. Is it public?" };

  const db = await getDb();
  await db
    .update(profiles)
    .set({
      name: ws.name,
      jobTitle: ws.jobTitle,
      company: ws.company,
      location: ws.location,
      industry: ws.industry,
      bio: ws.bio,
      avatarUrl: ws.avatarUrl ?? me.avatarUrl,
      wsSessions: ws.sessions,
      wsEvent: ws.event,
      pendingWsProfileId: me.wsVerified && me.wsProfileId === ws.id ? null : ws.id,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, me.id));
  revalidatePath("/onboarding");
  return { ok: true, message: `Imported ${ws.name}${ws.company ? ` from ${ws.company}` : ""}.` };
}

export async function verifyWsProfile(): Promise<FormState> {
  const me = await getMe();
  if (!me.pendingWsProfileId || !me.wsEvent) return { error: "Import your Web Summit profile first." };
  const ws = await fetchWsProfile({ event: me.wsEvent, id: me.pendingWsProfileId }).catch(() => null);
  if (!ws) return { error: "Couldn't reach Web Summit. Try again shortly." };
  if (!(ws.bio ?? "").toUpperCase().includes(me.verifyCode)) {
    return { error: `We didn't find ${me.verifyCode} in your Web Summit bio yet. It can take a minute to update.` };
  }
  const db = await getDb();
  const [taken] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(eq(profiles.wsProfileId, ws.id), ne(profiles.id, me.id)));
  if (taken) return { error: "That Web Summit profile is already linked to another account." };
  await db
    .update(profiles)
    .set({ wsProfileId: ws.id, wsVerified: true, pendingWsProfileId: null, updatedAt: new Date() })
    .where(eq(profiles.id, me.id));
  revalidatePath("/onboarding");
  return { ok: true, message: "Verified. You can remove the code from your Web Summit bio now" };
}

// ---------- Profile ----------

const ProfileForm = z.object({
  name: z.string().trim().min(1).max(100),
  jobTitle: z.string().trim().max(120).optional(),
  company: z.string().trim().max(120).optional(),
  location: z.string().trim().max(120).optional(),
  industry: z.string().trim().max(60).optional(),
  bio: z.string().trim().max(1200).optional(),
  linkedinUrl: z.union([z.literal(""), z.url({ message: "LinkedIn needs to be a full https:// link" }).startsWith("https://")]).optional(),
  contactEmail: z.email({ message: "Add an email so people you meet can reach you" }).max(200),
  whatsapp: z.union([z.literal(""), z.string().trim().regex(/^\+?[\d\s().-]{7,20}$/, "WhatsApp needs to be a phone number, e.g. +351 912 345 678")]).optional(),
  role: z.enum(ROLES),
  lookingFor: z.array(z.enum(INTENTS)).max(5),
  offering: z.array(z.enum(INTENTS)).max(5),
  tags: z.string().max(300).optional(),
});

export async function saveProfile(_: FormState, formData: FormData): Promise<FormState> {
  const me = await getMe();
  const parsed = ProfileForm.safeParse({
    name: formData.get("name"),
    jobTitle: formData.get("jobTitle") ?? undefined,
    company: formData.get("company") ?? undefined,
    location: formData.get("location") ?? undefined,
    industry: formData.get("industry") ?? undefined,
    bio: formData.get("bio") ?? undefined,
    linkedinUrl: formData.get("linkedinUrl") ?? "",
    contactEmail: String(formData.get("contactEmail") ?? "").trim(),
    whatsapp: String(formData.get("whatsapp") ?? "").trim(),
    role: formData.get("role"),
    lookingFor: formData.getAll("lookingFor"),
    offering: formData.getAll("offering"),
    tags: formData.get("tags") ?? undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(". ") };
  const v = parsed.data;
  const tags = (v.tags ?? "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 10);
  const db = await getDb();
  await db
    .update(profiles)
    .set({
      name: v.name,
      jobTitle: v.jobTitle || null,
      company: v.company || null,
      location: v.location || null,
      industry: v.industry && (INDUSTRIES as readonly string[]).includes(v.industry) ? v.industry : v.industry || null,
      bio: v.bio || null,
      linkedinUrl: v.linkedinUrl || null,
      contactEmail: v.contactEmail,
      whatsapp: v.whatsapp || null,
      role: v.role,
      lookingFor: v.lookingFor,
      offering: v.offering,
      tags,
      onboarded: true,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, me.id));
  // New info → fresh matches today
  await db.delete(matchSuggestions).where(and(eq(matchSuggestions.profileId, me.id), eq(matchSuggestions.status, "new")));
  if (!me.onboarded) redirect("/matches");
  revalidatePath("/", "layout");
  return { ok: true, message: "Saved" };
}

// ---------- Chat ----------

export async function startDm(otherId: string) {
  const me = await getMe();
  if (otherId === me.id) redirect("/chat");
  const id = await ensureDm(me.id, otherId);
  redirect(`/chat/${id}`);
}

export async function joinRoom(conversationId: string) {
  const me = await getMe();
  const db = await getDb();
  const [room] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, conversationId), eq(conversations.kind, "room")));
  if (!room) redirect("/chat");
  await db.insert(conversationMembers).values({ conversationId, profileId: me.id }).onConflictDoNothing();
  redirect(`/chat/${conversationId}`);
}

export async function leaveConversation(conversationId: string) {
  const me = await getMe();
  const db = await getDb();
  await db
    .delete(conversationMembers)
    .where(and(eq(conversationMembers.conversationId, conversationId), eq(conversationMembers.profileId, me.id)));
  redirect("/chat");
}

export async function createGroup(_: FormState, formData: FormData): Promise<FormState> {
  const me = await getMe();
  const title = String(formData.get("title") ?? "").trim().slice(0, 80);
  const memberIds = [...new Set(formData.getAll("members").map(String))].filter((id) => id !== me.id);
  if (!title) return { error: "Give the group a name." };
  if (memberIds.length < 1) return { error: "Pick at least one person." };
  if (memberIds.length + 1 > MAX_GROUP_SIZE) return { error: `Groups are capped at ${MAX_GROUP_SIZE} people. Use a room for bigger crowds.` };
  const db = await getDb();
  const valid = await db.select({ id: profiles.id }).from(profiles).where(inArray(profiles.id, memberIds));
  const [conv] = await db.insert(conversations).values({ kind: "group", title, createdBy: me.id }).returning();
  await db
    .insert(conversationMembers)
    .values([me.id, ...valid.map((v) => v.id)].map((profileId) => ({ conversationId: conv.id, profileId })));
  await postMessage(conv.id, null, `${me.name} created the group “${title}”.`, true);
  redirect(`/chat/${conv.id}`);
}

export async function addToGroup(conversationId: string, profileId: string) {
  const me = await getMe();
  if (!(await isMember(conversationId, me.id))) return;
  const db = await getDb();
  const members = await db
    .select({ p: conversationMembers.profileId })
    .from(conversationMembers)
    .where(eq(conversationMembers.conversationId, conversationId));
  if (members.length >= MAX_GROUP_SIZE) return;
  await db.insert(conversationMembers).values({ conversationId, profileId }).onConflictDoNothing();
  revalidatePath(`/chat/${conversationId}`);
}

// ---------- Meetings ----------

const MeetingForm = z.object({
  inviteeId: z.uuid(),
  startsAt: z.iso.datetime({ offset: true }),
  durationMin: z.coerce.number().int().refine((n) => [10, 15, 20, 30, 45].includes(n)),
  note: z.string().trim().max(500).optional(),
});

export async function requestMeeting(_: FormState, formData: FormData): Promise<FormState> {
  const me = await getMe();
  const parsed = MeetingForm.safeParse({
    inviteeId: formData.get("inviteeId"),
    startsAt: formData.get("startsAt"),
    durationMin: formData.get("durationMin"),
    note: formData.get("note") ?? undefined,
  });
  if (!parsed.success) return { error: "Pick a time and duration." };
  const v = parsed.data;
  const startsAt = new Date(v.startsAt);
  if (startsAt.getTime() < Date.now() - 5 * 60_000) return { error: "That time is in the past." };
  if (v.inviteeId === me.id) return { error: "You can't meet yourself (yet)." };
  const db = await getDb();
  await db.insert(meetings).values({ requesterId: me.id, inviteeId: v.inviteeId, startsAt, durationMin: v.durationMin, note: v.note || null });
  const dm = await ensureDm(me.id, v.inviteeId);
  await postMessage(dm, null, `${me.name} requested a ${v.durationMin}-min meeting. Check Meetings to accept.`, true);
  revalidatePath("/meetings");
  return { ok: true, message: "Request sent. It shows in Meetings" };
}

export async function respondToMeeting(meetingId: string, accept: boolean) {
  const me = await getMe();
  const db = await getDb();
  const [m] = await db
    .select()
    .from(meetings)
    .where(and(eq(meetings.id, meetingId), eq(meetings.inviteeId, me.id), eq(meetings.status, "pending")));
  if (!m) return;
  const videoUrl = accept ? await createVideoRoom(m.startsAt, m.durationMin) : null;
  await db
    .update(meetings)
    .set({ status: accept ? "accepted" : "declined", videoUrl })
    .where(eq(meetings.id, meetingId));
  const dm = await ensureDm(m.requesterId, me.id);
  await postMessage(dm, null, accept ? `${me.name} accepted the meeting. Video link: ${videoUrl}` : `${me.name} declined the meeting.`, true);
  revalidatePath("/meetings");
}

export async function cancelMeeting(meetingId: string) {
  const me = await getMe();
  const db = await getDb();
  await db
    .update(meetings)
    .set({ status: "cancelled" })
    .where(and(eq(meetings.id, meetingId), or(eq(meetings.requesterId, me.id), eq(meetings.inviteeId, me.id))));
  revalidatePath("/meetings");
}

// ---------- Matches ----------

export async function skipMatch(suggestionId: string) {
  const me = await getMe();
  const db = await getDb();
  await db
    .update(matchSuggestions)
    .set({ status: "skipped" })
    .where(and(eq(matchSuggestions.id, suggestionId), eq(matchSuggestions.profileId, me.id)));
  revalidatePath("/matches");
}

export async function messageMatch(suggestionId: string) {
  const me = await getMe();
  const db = await getDb();
  const [s] = await db
    .select()
    .from(matchSuggestions)
    .where(and(eq(matchSuggestions.id, suggestionId), eq(matchSuggestions.profileId, me.id)));
  if (!s) redirect("/matches");
  await db.update(matchSuggestions).set({ status: "contacted" }).where(eq(matchSuggestions.id, s.id));
  const id = await ensureDm(me.id, s.candidateId);
  redirect(`/chat/${id}`);
}
