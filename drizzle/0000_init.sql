CREATE TABLE "conversation_members" (
	"conversation_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conversation_members_conversation_id_profile_id_pk" PRIMARY KEY("conversation_id","profile_id")
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"title" text,
	"topic" text,
	"dm_key" text,
	"slug" text,
	"created_by" uuid,
	"last_message_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conversations_dm_key_unique" UNIQUE("dm_key"),
	CONSTRAINT "conversations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "match_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"day" date NOT NULL,
	"score" real NOT NULL,
	"reason" text NOT NULL,
	"opener" text,
	"status" text DEFAULT 'new' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meetings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_id" uuid NOT NULL,
	"invitee_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"duration_min" integer DEFAULT 20 NOT NULL,
	"note" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"video_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_id" uuid,
	"body" text NOT NULL,
	"system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"name" text NOT NULL,
	"job_title" text,
	"company" text,
	"location" text,
	"industry" text,
	"bio" text,
	"avatar_url" text,
	"role" text DEFAULT 'attendee' NOT NULL,
	"looking_for" text[] DEFAULT '{}' NOT NULL,
	"offering" text[] DEFAULT '{}' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"linkedin_url" text,
	"pending_ws_profile_id" text,
	"ws_event" text,
	"ws_profile_id" text,
	"ws_verified" boolean DEFAULT false NOT NULL,
	"ws_sessions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"verify_code" text NOT NULL,
	"onboarded" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_clerk_user_id_unique" UNIQUE("clerk_user_id"),
	CONSTRAINT "profiles_ws_profile_id_unique" UNIQUE("ws_profile_id")
);
--> statement-breakpoint
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_suggestions" ADD CONSTRAINT "match_suggestions_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_suggestions" ADD CONSTRAINT "match_suggestions_candidate_id_profiles_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_requester_id_profiles_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_invitee_id_profiles_id_fk" FOREIGN KEY ("invitee_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_profiles_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "members_profile_idx" ON "conversation_members" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "conversations_kind_idx" ON "conversations" USING btree ("kind");--> statement-breakpoint
CREATE UNIQUE INDEX "match_unique" ON "match_suggestions" USING btree ("profile_id","candidate_id","day");--> statement-breakpoint
CREATE INDEX "meetings_requester_idx" ON "meetings" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "meetings_invitee_idx" ON "meetings" USING btree ("invitee_id");--> statement-breakpoint
CREATE INDEX "messages_conv_id_idx" ON "messages" USING btree ("conversation_id","id");--> statement-breakpoint
CREATE INDEX "profiles_industry_idx" ON "profiles" USING btree ("industry");--> statement-breakpoint
CREATE INDEX "profiles_role_idx" ON "profiles" USING btree ("role");