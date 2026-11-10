import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseWsUrl, parseWsProfileHtml } from "../src/lib/websummit";

test("parses share links and profile URLs", () => {
  const id = "95900b8e-19bd-4a8e-8a7d-2c1b391000cd";
  assert.deepEqual(parseWsUrl(`https://attend.websummit.com/dl/lis26/attendee?id=${id}&mobile=true&utm_source=x`), { event: "lis26", id });
  assert.deepEqual(parseWsUrl(`https://attend.websummit.com/lis26/profiles/${id}?mobile=true`), { event: "lis26", id });
  assert.equal(parseWsUrl(`https://evil.com/lis26/profiles/${id}`), null);
  assert.deepEqual(parseWsUrl(`http://attend.websummit.com/lis26/profiles/${id}`), { event: "lis26", id }, "http is upgraded");
  assert.deepEqual(parseWsUrl(`attend.websummit.com/dl/lis26/attendee?id=${id}`), { event: "lis26", id }, "no scheme");
  assert.deepEqual(parseWsUrl(`Check out my Web Summit profile! https://attend.websummit.com/dl/lis26/attendee?id=${id}&mobile=true`), { event: "lis26", id }, "share-sheet text");
  assert.deepEqual(parseWsUrl(`https://attend.websummit.com/lis26/attendees/${id.toUpperCase()}.`), { event: "lis26", id }, "other path, caps, trailing dot");
  assert.equal(parseWsUrl(`https://attend.websummit.com.evil.com/lis26/profiles/${id}`), null);
  assert.equal(parseWsUrl(`https://attend.websummit.com/lis26/profiles/not-a-uuid`), null);
  assert.equal(parseWsUrl("nonsense"), null);
});

test("extracts profile fields from the public page", () => {
  const html = readFileSync("tests/fixtures/ws-profile.html", "utf8");
  const p = parseWsProfileHtml(html, { event: "lis26", id: "x" })!;
  assert.equal(p.name, "Miguel Rodrigues");
  assert.equal(p.jobTitle, "Co-founder & CEO");
  assert.equal(p.company, "Scooli");
  assert.equal(p.location, "Aveiro, Portugal");
  assert.equal(p.industry, "Education");
  assert.match(p.bio ?? "", /lesson planning/);
  assert.ok(p.avatarUrl?.startsWith("https://"));
  assert.equal(p.sessions[0]?.title, "PITCH group round 12");
  assert.equal(p.sessions[0]?.stage, "Stage 12");
  assert.equal(p.sessions[0]?.track, "PITCH");
});
