// End-to-end server-action flows with two fake signed-in users on a throwaway PGlite.
// Run with: npm run test:flows   (hits attend.websummit.com once for the import step)
import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, symlinkSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const repo = path.resolve(import.meta.dirname, "..");
const dir = mkdtempSync(path.join(os.tmpdir(), "rainout-flows-"));
symlinkSync(path.join(repo, "drizzle"), path.join(dir, "drizzle"));
process.chdir(dir);
process.env.DATABASE_URL = "";
delete process.env.ANTHROPIC_API_KEY;
delete process.env.DAILY_API_KEY;

class Redirect extends Error {
  constructor(public to: string) {
    super(`redirect:${to}`);
  }
}
let currentClerkId = "user_a";

mock.module(require.resolve("next/navigation"), { namedExports: { redirect: (to: string) => { throw new Redirect(to); }, notFound: () => { throw new Error("404"); } } });
mock.module(require.resolve("next/cache"), { namedExports: { revalidatePath: () => {} } });
mock.module(require.resolve("@clerk/nextjs/server"), {
  namedExports: {
    auth: async () => ({ userId: currentClerkId }),
    currentUser: async () => ({ firstName: currentClerkId === "user_a" ? "Ana" : "Bruno", lastName: "Test", imageUrl: null }),
  },
});

const fd = (o: Record<string, string | string[]>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) for (const x of [v].flat()) f.append(k, x);
  return f;
};
async function redirectOf(p: Promise<unknown>) {
  try {
    await p;
  } catch (e) {
    if (e instanceof Redirect) return e.to;
    throw e;
  }
  return null;
}

test("onboarding, import, verify, chat, groups, meetings, matches", async () => {
  const actions = await import("../src/app/actions");
  const { getMe } = await import("../src/lib/me");
  const { getTodaysMatches } = await import("../src/lib/match");
  const { getDb, schema } = await import("../src/db");
  const { eq } = await import("drizzle-orm");
  const db = await getDb();
  const as = (id: string) => (currentClerkId = id);

  // --- A: import real WS profile, fail verification, save profile
  as("user_a");
  const bad = await actions.importWsProfile({}, fd({ url: "https://evil.example/lis26/profiles/x" }));
  assert.ok(bad.error);
  const imp = await actions.importWsProfile({}, fd({ url: "https://attend.websummit.com/dl/lis26/attendee?id=95900b8e-19bd-4a8e-8a7d-2c1b391000cd&mobile=true" }));
  assert.equal(imp.error, undefined, imp.error);
  let a = await getMe();
  assert.equal(a.company, "Scooli");
  assert.equal(a.pendingWsProfileId, "95900b8e-19bd-4a8e-8a7d-2c1b391000cd");
  const ver = await actions.verifyWsProfile();
  assert.match(ver.error ?? "", /didn't find RAIN-/, "code not in bio, so verification must fail");

  const toMatches = await redirectOf(
    actions.saveProfile({}, fd({ name: "Ana Test", role: "startup", industry: "Education", lookingFor: ["Funding", "Customers"], offering: ["Deal flow"], tags: "AI, edtech", linkedinUrl: "", contactEmail: "ana@example.com", whatsapp: "+351 912 345 678" })),
  );
  assert.equal(toMatches, "/matches", "first save sends you to matches");
  a = await getMe();
  assert.deepEqual(a.tags, ["ai", "edtech"]);
  const invalid = await actions.saveProfile({}, fd({ name: "Ana", role: "hacker", lookingFor: [], offering: [], contactEmail: "ana@example.com" }));
  assert.ok(invalid.error, "invalid role rejected");
  const noEmail = await actions.saveProfile({}, fd({ name: "Ana", role: "startup", contactEmail: "" }));
  assert.match(noEmail.error ?? "", /email/i, "email is required");
  const badWa = await actions.saveProfile({}, fd({ name: "Ana", role: "startup", contactEmail: "ana@example.com", whatsapp: "call me" }));
  assert.match(badWa.error ?? "", /WhatsApp/, "WhatsApp must look like a phone number");
  assert.equal(a.whatsapp, "+351 912 345 678");

  // --- B: investor
  as("user_b");
  await redirectOf(actions.saveProfile({}, fd({ name: "Bruno VC", role: "investor", industry: "Education", lookingFor: ["Deal flow"], offering: ["Funding"], linkedinUrl: "", contactEmail: "bruno@example.com" })));
  const b = await getMe();

  // contacts are private until connected
  const { areConnected, whatsappLink } = await import("../src/lib/me");
  assert.equal(await areConnected(a.id, b.id), false);
  assert.equal(whatsappLink("+351 912 345 678"), "https://wa.me/351912345678");

  // matches both ways
  as("user_a");
  const ma = await getTodaysMatches(a);
  assert.equal(ma[0]?.person.id, b.id);

  // --- DM via match, message, rooms
  const dmUrl = await redirectOf(actions.messageMatch(ma[0].suggestion.id));
  assert.match(dmUrl ?? "", /^\/chat\/[0-9a-f-]{36}$/);
  assert.equal(await areConnected(a.id, b.id), true, "a DM connects them");
  const [room] = await db.select().from(schema.conversations).where(eq(schema.conversations.slug, "lobby"));
  assert.equal(await redirectOf(actions.joinRoom(room.id)), `/chat/${room.id}`);
  assert.equal(await redirectOf(actions.leaveConversation(room.id)), "/chat");

  // --- groups: validation + creation
  const g0 = await actions.createGroup({}, fd({ title: "Edtech circle" }));
  assert.ok(g0.error);
  const gUrl = await redirectOf(actions.createGroup({}, fd({ title: "Edtech circle", members: [b.id] })));
  assert.match(gUrl ?? "", /^\/chat\//);
  const gid = gUrl!.split("/").pop()!;
  const gm = await db.select().from(schema.conversationMembers).where(eq(schema.conversationMembers.conversationId, gid));
  assert.equal(gm.length, 2);

  // --- meetings: A requests, B accepts, A can't accept own request
  const past = await actions.requestMeeting({}, fd({ inviteeId: b.id, startsAt: "2020-01-01T10:00:00.000Z", durationMin: "20" }));
  assert.match(past.error ?? "", /past/);
  const when = new Date(Date.now() + 3600_000).toISOString();
  const req = await actions.requestMeeting({}, fd({ inviteeId: b.id, startsAt: when, durationMin: "20", note: "Seed round" }));
  assert.ok(req.ok, req.error);
  const [m] = await db.select().from(schema.meetings);
  await actions.respondToMeeting(m.id, true); // A is not the invitee → no-op
  assert.equal((await db.select().from(schema.meetings))[0].status, "pending");
  as("user_b");
  await actions.respondToMeeting(m.id, true);
  const [accepted] = await db.select().from(schema.meetings);
  assert.equal(accepted.status, "accepted");
  assert.match(accepted.videoUrl ?? "", /^https:\/\/meet\.jit\.si\/rainout-/);
  const sys = await db.select().from(schema.messages).where(eq(schema.messages.system, true));
  assert.ok(sys.some((s) => s.body.includes("accepted the meeting")));
});

test("chat API: members can post and poll, outsiders get 404, floods get 429", async () => {
  const route = await import("../src/app/api/conversations/[id]/messages/route");
  const { getDb, schema } = await import("../src/db");
  const { eq } = await import("drizzle-orm");
  const db = await getDb();
  const [group] = await db.select().from(schema.conversations).where(eq(schema.conversations.kind, "group"));
  const ctx = { params: Promise.resolve({ id: group.id }) } as never;
  const url = `http://x/api/conversations/${group.id}/messages`;
  const post = (body: unknown) => route.POST(new Request(url, { method: "POST", body: JSON.stringify(body) }), ctx);

  currentClerkId = "user_a";
  assert.equal((await post({ body: "hi Bruno" })).status, 200);
  assert.equal((await post({ body: "again" })).status, 429, "second message within 700ms is throttled");
  assert.equal((await post({ body: "" })).status, 400);
  const first = await (await route.GET(new Request(url), ctx)).json();
  const mine = first.messages.find((m: { body: string }) => m.body === "hi Bruno");
  assert.ok(mine && mine.senderName === "Ana Test");

  currentClerkId = "user_b";
  await new Promise((r) => setTimeout(r, 750));
  assert.equal((await post({ body: "hey Ana" })).status, 200);
  const newer = await (await route.GET(new Request(`${url}?after=${mine.id}`), ctx)).json();
  assert.deepEqual(newer.messages.map((m: { body: string }) => m.body), ["hey Ana"]);

  currentClerkId = "user_c";
  assert.equal((await route.GET(new Request(url), ctx)).status, 404, "non-member can't read");
});
