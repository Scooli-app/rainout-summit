// Local-only demo people so lists, matches and chats have something to show.
// Usage: stop `npm run dev`, then `npm run seed:demo`. Refuses to run against a real DATABASE_URL.
import { and, eq, inArray, isNull, like } from "drizzle-orm";

if (process.env.DATABASE_URL) {
  console.error("Refusing to seed demo data into DATABASE_URL. This is for local PGlite only.");
  process.exit(1);
}

const PEOPLE = [
  { name: "Ana Costa", jobTitle: "Partner", company: "Atlantic Ventures", location: "Lisbon, Portugal", industry: "Education", role: "investor", lookingFor: ["Deal flow"], offering: ["Funding", "Mentorship"], tags: ["edtech", "seed"], bio: "Seed investor in learning and future-of-work startups across southern Europe." },
  { name: "João Reis", jobTitle: "CTO", company: "Fieldwork", location: "Porto, Portugal", industry: "Education", role: "startup", lookingFor: ["Funding", "Talent"], offering: ["Product feedback", "Partnerships"], tags: ["ai", "edtech"], bio: "Building assessment tools for secondary schools." },
  { name: "Mia Lund", jobTitle: "Head of AI", company: "Nordbank", location: "Copenhagen, Denmark", industry: "Fintech", role: "speaker", lookingFor: ["Partnerships"], offering: ["Mentorship", "Customers"], tags: ["genai", "banking"], bio: "Runs applied AI at a Nordic bank. Was due on Centre Stage on Wednesday." },
  { name: "Samuel Okafor", jobTitle: "Founder", company: "GridLoop", location: "Lagos, Nigeria", industry: "Climate", role: "startup", lookingFor: ["Funding", "Customers"], offering: ["Deal flow"], tags: ["energy", "seed"], bio: "Pay-as-you-go solar for small businesses." },
  { name: "Léa Martin", jobTitle: "Reporter", company: "Tech Hebdo", location: "Paris, France", industry: "Media", role: "media", lookingFor: ["Press"], offering: ["Press"], tags: ["startups"], bio: "Covering European startups. Looking for stories from the summit that wasn't." },
  { name: "Priya Nair", jobTitle: "Principal", company: "Lumen Capital", location: "London, UK", industry: "AI", role: "investor", lookingFor: ["Deal flow"], offering: ["Funding"], tags: ["ai", "b2b saas", "series a"], bio: "Series A, B2B software with AI at the core." },
  { name: "Tomás Silva", jobTitle: "Product designer", company: null, location: "Lisbon, Portugal", industry: "SaaS", role: "attendee", lookingFor: ["Jobs"], offering: ["Product feedback"], tags: ["design", "b2b saas"], bio: "Between roles, happy to give honest product feedback." },
  { name: "Hannah Weber", jobTitle: "Partnerships lead", company: "CloudHaus", location: "Berlin, Germany", industry: "SaaS", role: "partner", lookingFor: ["Customers", "Partnerships"], offering: ["Partnerships", "Talent"], tags: ["cloud"], bio: "Startup programme credits and partnerships." },
];

async function main() {
  const { getDb, schema } = await import("../src/db");
  const { ensureDm, postMessage } = await import("../src/lib/chat");
  const db = await getDb();
  // Re-runnable: clear previous demo people and the DMs they started.
  const old = await db.select({ id: schema.profiles.id }).from(schema.profiles).where(like(schema.profiles.clerkUserId, "demo_%"));
  if (old.length) {
    await db.delete(schema.messages).where(inArray(schema.messages.senderId, old.map((o) => o.id)));
    await db.delete(schema.conversations).where(inArray(schema.conversations.createdBy, old.map((o) => o.id)));
    await db.delete(schema.profiles).where(like(schema.profiles.clerkUserId, "demo_%"));
  }
  const rows = await db
    .insert(schema.profiles)
    .values(PEOPLE.map((p, i) => ({ ...p, clerkUserId: `demo_${i}`, contactEmail: `${p.name.split(" ")[0].toLowerCase()}@example.com`, whatsapp: i % 2 ? null : `+351 91${i} 000 00${i}`, verifyCode: "RAIN-DEMO0", onboarded: true, wsVerified: i % 3 !== 2 })))
    .returning();

  const [lobby] = await db.select().from(schema.conversations).where(eq(schema.conversations.slug, "lobby"));
  // Orphans from older seed runs (sender deleted, not a system note)
  await db.delete(schema.messages).where(and(eq(schema.messages.conversationId, lobby.id), isNull(schema.messages.senderId), eq(schema.messages.system, false)));
  await db.insert(schema.conversationMembers).values(rows.map((r) => ({ conversationId: lobby.id, profileId: r.id }))).onConflictDoNothing();
  await postMessage(lobby.id, rows[0].id, "Morning all. Rain is still coming down sideways here in Lisbon. Happy to take founder calls today, edtech especially.");
  await postMessage(lobby.id, rows[3].id, "Same. Anyone in climate want to compare notes on what you were going to pitch?");
  await postMessage(lobby.id, rows[4].id, "Writing a piece on how people are making the most of this. Ping me if you have a story.");

  // A DM from Ana to every real (non-demo) user, so the chat list isn't empty.
  const real = (await db.select().from(schema.profiles)).filter((p) => !p.clerkUserId.startsWith("demo_"));
  for (const u of real) {
    const dm = await ensureDm(rows[0].id, u.id);
    await postMessage(dm, rows[0].id, `Hi ${u.name.split(" ")[0]}, saw you're in education too. Free for 20 minutes this afternoon?`);
    await db.insert(schema.meetings).values({
      requesterId: rows[0].id,
      inviteeId: u.id,
      startsAt: new Date(Date.now() + 3 * 3600_000),
      durationMin: 20,
      note: "Your seed round and what you're seeing from schools.",
    });
  }
  console.log(`Seeded ${rows.length} demo people, Lobby messages, and a DM + meeting request for ${real.length} real user(s).`);
  process.exit(0);
}

main();
