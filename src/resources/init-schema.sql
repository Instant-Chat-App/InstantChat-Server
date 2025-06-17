CREATE TYPE "chat_type" AS ENUM (
  'PRIVATE',
  'GROUP',
  'CHANNEL'
);

CREATE TYPE "attach_type" AS ENUM (
  'IMAGE',
  'VIDEO',
  'RAW',
);

CREATE TYPE "message_status_enum" AS ENUM (
  'READ',
  'UNREAD'
);

CREATE TYPE "gender" AS ENUM (
  'MALE',
  'FEMALE'
);

CREATE TYPE "reaction" AS ENUM (
  'LIKE',
  'LOVE',
  'WOW',
  'LAUGH',
  'SAD',
  'ANGRY'
);

CREATE TYPE "join_status" AS ENUM (
  'PENDING',
  'APPROVED',
  'REJECTED'
);

CREATE TABLE "accounts" (
  "account_id" SERIAL PRIMARY KEY,
  "phone" VARCHAR UNIQUE,
  "password" VARCHAR,
  "is_active" BOOLEAN
);

CREATE TABLE "users" (
  "user_id" INT PRIMARY KEY,
  "full_name" VARCHAR,
  "email" VARCHAR,
  "avatar" VARCHAR,
  "dob" DATE,
  "gender" gender,
  "bio" TEXT
);

CREATE TABLE "contacts" (
  "user_id" INTEGER,
  "contact_id" INTEGER,
  PRIMARY KEY ("user_id", "contact_id")
);

CREATE TABLE "user_blocked" (
  "blocker_id" INTEGER,
  "blocked_id" INTEGER,
  PRIMARY KEY ("blocker_id", "blocked_id")
);

CREATE TABLE "chats" (
  "chat_id" SERIAL PRIMARY KEY,
  "type" chat_type,
  "chat_name" VARCHAR,
  "cover_image" VARCHAR,
  "description" TEXT
);

CREATE TABLE "chat_members" (
  "chat_id" INTEGER,
  "member_id" INTEGER,
  "is_owner" BOOLEAN,
  "joined_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("chat_id", "member_id")
);

CREATE TABLE "messages" (
  "message_id" SERIAL PRIMARY KEY,
  "chat_id" INTEGER,
  "sender_id" INTEGER,
  "content" TEXT,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "is_edited" BOOLEAN DEFAULT FALSE,
  "is_deleted" BOOLEAN DEFAULT FALSE,
  "reply_to" INTEGER
);

CREATE TABLE "message_status"
(
    "message_id" INTEGER,
    "member_id"  INTEGER,
    "status"     message_status_enum,
    PRIMARY KEY ("message_id", "member_id")
);


CREATE TABLE "message_reactions" (
  "user_id" INTEGER,
  "message_id" INTEGER,
  "type" reaction,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("user_id", "message_id")
);

CREATE TABLE "attachments" (
  "attachment_id" SERIAL PRIMARY KEY,
  "message_id" INTEGER,
  "url" VARCHAR,
  "type" attach_type
);

CREATE INDEX "idx_accounts_phone" ON "accounts" ("phone");

CREATE INDEX "idx_users_email" ON "users" ("email");

CREATE INDEX "idx_chat_members_chat_id" ON "chat_members" ("chat_id");

CREATE INDEX "idx_chat_members_member_id" ON "chat_members" ("member_id");

CREATE INDEX "idx_messages_chat_id" ON "messages" ("chat_id");

CREATE INDEX "idx_messages_sender_id" ON "messages" ("sender_id");

CREATE INDEX "idx_messages_created_at" ON "messages" ("created_at");

CREATE INDEX "idx_message_status_message_id" ON "message_status" ("message_id");

CREATE INDEX "idx_message_reactions_message_id" ON "message_reactions" ("message_id");

CREATE INDEX "idx_attachments_message_id" ON "attachments" ("message_id");

ALTER TABLE "users" ADD CONSTRAINT "fk_users_accounts" FOREIGN KEY  ("user_id") REFERENCES  "accounts" ("account_id");

ALTER TABLE "contacts" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("user_id");

ALTER TABLE "contacts" ADD FOREIGN KEY ("contact_id") REFERENCES "users" ("user_id");

ALTER TABLE "user_blocked" ADD FOREIGN KEY ("blocker_id") REFERENCES "users" ("user_id");

ALTER TABLE "user_blocked" ADD FOREIGN KEY ("blocked_id") REFERENCES "users" ("user_id");

ALTER TABLE "chat_members" ADD FOREIGN KEY ("chat_id") REFERENCES "chats" ("chat_id");

ALTER TABLE "chat_members" ADD FOREIGN KEY ("member_id") REFERENCES "users" ("user_id");

ALTER TABLE "messages" ADD FOREIGN KEY ("chat_id") REFERENCES "chats" ("chat_id");

ALTER TABLE "messages" ADD FOREIGN KEY ("sender_id") REFERENCES "users" ("user_id");

ALTER TABLE "message_status" ADD FOREIGN KEY ("message_id") REFERENCES "messages" ("message_id");

ALTER TABLE "message_status" ADD FOREIGN KEY ("member_id") REFERENCES "users" ("user_id");

ALTER TABLE "message_reactions" ADD FOREIGN KEY ("message_id") REFERENCES "messages" ("message_id");

ALTER TABLE "message_reactions" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("user_id");

ALTER TABLE "attachments" ADD FOREIGN KEY ("message_id") REFERENCES "messages" ("message_id");

ALTER TABLE "messages" ADD CONSTRAINT fk_messages_replyto FOREIGN KEY ("reply_to") REFERENCES "messages"("message_id");
