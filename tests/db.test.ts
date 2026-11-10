// Integration test against embedded PGlite. Run with: npm run test:db
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const dir = mkdtempSync(path.join(os.tmpdir(), "rainout-db-"));
process.chdir(dir);
process.env.DATABASE_URL = "";
delete process.env.ANTHROPIC_API_KEY;

test("rooms, DMs, messages and rule-based matches work on a fresh database", async () => {
  // migrations folder is resolved from cwd, so point it back at the repo
  const repo = path.resolve(import.meta.dirname, "..");
  const { symlinkSync } = await import("node:fs");
  symlinkSync(path.join(repo, "drizzle"), path.join(dir, "drizzle"));

  const { getDb, schema } = await import("../src/db");
  const { ensureDm, postMessage, isMember } = await import("../src/lib/chat");
  const { getTodaysMatches } = await import("../src/lib/match");
  const db = await getDb();

  const rooms = await db.select().from(schema.conversations);
  assert.ok(rooms.length >= 5, "rooms seeded");

  const mk = (n: string, extra: Partial<typeof schema.profiles.$inferInsert>) =>
    db
      .insert(schema.profiles)
      .values({ clerkUserId: n, name: n, verifyCode: "RAIN-TEST0", onboarded: true, ...extra })
      .returning()
      .then((r) => r[0]);
  const founder = await mk("Founder", { role: "startup", lookingFor: ["Funding", "Customers"], offering: ["Deal flow"], industry: "Education", tags: ["ai"] });
  const vc = await mk("Investor", { role: "investor", lookingFor: ["Deal flow"], offering: ["Funding", "Mentorship"], industry: "Education" });
  const random = await mk("Random", { role: "attendee", lookingFor: ["Jobs"], offering: ["Press"] });

  const dm1 = await ensureDm(founder.id, vc.id);
  const dm2 = await ensureDm(vc.id, founder.id);
  assert.equal(dm1, dm2, "DM is reused regardless of order");
  assert.ok(await isMember(dm1, vc.id));
  assert.ok(!(await isMember(dm1, random.id)));
  await postMessage(dm1, founder.id, "hello");

  const matches = await getTodaysMatches(founder);
  assert.equal(matches[0]?.person.id, vc.id, "investor is the top match for the founder");
  assert.match(matches[0].suggestion.reason, /funding/i);
  assert.ok(!matches[0].suggestion.reason.endsWith("."), "no trailing period");
  const again = await getTodaysMatches(founder);
  assert.equal(again.length, matches.length, "matches are cached for the day");
});
