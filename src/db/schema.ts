import {
  bigserial,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export type WsSession = { title: string; time: string; stage?: string; track?: string };

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkUserId: text("clerk_user_id").notNull().unique(),
    name: text("name").notNull(),
    jobTitle: text("job_title"),
    company: text("company"),
    location: text("location"),
    industry: text("industry"),
    bio: text("bio"),
    avatarUrl: text("avatar_url"),
    role: text("role").notNull().default("attendee"),
    lookingFor: text("looking_for").array().notNull().default([]),
    offering: text("offering").array().notNull().default([]),
    tags: text("tags").array().notNull().default([]),
    linkedinUrl: text("linkedin_url"),
    // Contact details: shown only to people you're connected with (a chat or a meeting).
    contactEmail: text("contact_email"),
    whatsapp: text("whatsapp"),
    // Web Summit link: pending until the owner proves it by putting verifyCode in their WS bio.
    pendingWsProfileId: text("pending_ws_profile_id"),
    wsEvent: text("ws_event"),
    wsProfileId: text("ws_profile_id").unique(),
    wsVerified: boolean("ws_verified").notNull().default(false),
    wsSessions: jsonb("ws_sessions").$type<WsSession[]>().notNull().default([]),
    verifyCode: text("verify_code").notNull(),
    onboarded: boolean("onboarded").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("profiles_industry_idx").on(t.industry), index("profiles_role_idx").on(t.role)],
);

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: text("kind").notNull(), // 'dm' | 'group' | 'room'
    title: text("title"),
    topic: text("topic"),
    dmKey: text("dm_key").unique(), // sorted "a:b" profile ids for DMs
    slug: text("slug").unique(), // public rooms only
    createdBy: uuid("created_by").references(() => profiles.id),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("conversations_kind_idx").on(t.kind)],
);

export const conversationMembers = pgTable(
  "conversation_members",
  {
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.conversationId, t.profileId] }),
    index("members_profile_idx").on(t.profileId),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id").references(() => profiles.id, { onDelete: "set null" }),
    body: text("body").notNull(),
    system: boolean("system").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("messages_conv_id_idx").on(t.conversationId, t.id)],
);

export const meetings = pgTable(
  "meetings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requesterId: uuid("requester_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    inviteeId: uuid("invitee_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    durationMin: integer("duration_min").notNull().default(20),
    note: text("note"),
    status: text("status").notNull().default("pending"), // pending | accepted | declined | cancelled
    videoUrl: text("video_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("meetings_requester_idx").on(t.requesterId), index("meetings_invitee_idx").on(t.inviteeId)],
);

export const matchSuggestions = pgTable(
  "match_suggestions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    score: real("score").notNull(),
    reason: text("reason").notNull(),
    opener: text("opener"),
    status: text("status").notNull().default("new"), // new | skipped | contacted
  },
  (t) => [uniqueIndex("match_unique").on(t.profileId, t.candidateId, t.day)],
);

export type Profile = typeof profiles.$inferSelect;
export type Meeting = typeof meetings.$inferSelect;
