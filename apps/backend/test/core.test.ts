import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { isJwtSecretStrong } from "../src/modules/auth/service.js";

import { registerSchema, loginSchema } from "../src/modules/auth/schemas.js";
import {
  createRoomSchema,
  sendMessageSchema,
  editMessageSchema,
  historyQuerySchema,
} from "../src/modules/rooms/schemas.js";
import { sendFriendRequestSchema, updateProfileSchema } from "../src/modules/friends/schemas.js";
import { allowRate } from "../src/realtime/rate-limit.js";
import { isManualPresenceState, MANUAL_PRESENCE_STATES } from "@molido/i18n";

test("JWT secret validation rejects missing, weak, and example secrets", () => {
  assert.equal(isJwtSecretStrong(undefined), false);
  assert.equal(isJwtSecretStrong("short"), false);
  assert.equal(isJwtSecretStrong("replace-with-a-unique-random-secret-of-at-least-32-characters"), false);
  assert.equal(isJwtSecretStrong("change-me-in-every-environment"), false);
  assert.equal(isJwtSecretStrong("a-random-production-secret-with-more-than-32-characters"), true);
});

test("registration accepts valid input and rejects unsafe or incomplete values", () => {
  assert.equal(registerSchema.safeParse({
    username: "molido_user",
    email: "user@example.com",
    password: "correct-horse-123",
    localePreference: "en",
  }).success, true);

  assert.equal(registerSchema.safeParse({
    username: "bad name",
    email: "not-an-email",
    password: "short",
  }).success, false);
});

test("login requires both an identifier and password", () => {
  assert.equal(loginSchema.safeParse({ usernameOrEmail: "user", password: "secret" }).success, true);
  assert.equal(loginSchema.safeParse({ usernameOrEmail: "", password: "secret" }).success, false);
  assert.equal(loginSchema.safeParse({ usernameOrEmail: "user", password: "" }).success, false);
});

test("room creation enforces name and description bounds", () => {
  assert.equal(createRoomSchema.safeParse({ name: "General", description: "Welcome" }).success, true);
  assert.equal(createRoomSchema.safeParse({ name: "" }).success, false);
  assert.equal(createRoomSchema.safeParse({ name: "x".repeat(81) }).success, false);
  assert.equal(createRoomSchema.safeParse({ name: "General", description: "x".repeat(281) }).success, false);
});

test("message schemas enforce the 1..4000 character contract", () => {
  assert.equal(sendMessageSchema.safeParse({ body: "hello" }).success, true);
  assert.equal(sendMessageSchema.safeParse({ body: "hello", clientMessageId: randomUUID() }).success, true);
  assert.equal(sendMessageSchema.safeParse({ body: "hello", clientMessageId: "not-a-uuid" }).success, false);
  assert.equal(editMessageSchema.safeParse({ body: "edited" }).success, true);
  assert.equal(sendMessageSchema.safeParse({ body: "" }).success, false);
  assert.equal(sendMessageSchema.safeParse({ body: "x".repeat(4001) }).success, false);
});

test("history query coerces limits and rejects out-of-range values", () => {
  assert.equal(historyQuerySchema.safeParse({ limit: "50" }).success, true);
  assert.equal(historyQuerySchema.safeParse({ limit: "0" }).success, false);
  assert.equal(historyQuerySchema.safeParse({ limit: "101" }).success, false);
  assert.equal(historyQuerySchema.safeParse({ before: "not-a-date" }).success, false);
});

test("friend request and profile schemas reject malformed input", () => {
  assert.equal(sendFriendRequestSchema.safeParse({ username: "friend" }).success, true);
  assert.equal(sendFriendRequestSchema.safeParse({ username: "" }).success, false);
  assert.equal(updateProfileSchema.safeParse({ statusMessage: "available" }).success, true);
  assert.equal(updateProfileSchema.safeParse({ statusMessage: "x".repeat(141) }).success, false);
  assert.equal(updateProfileSchema.safeParse({ avatarUrl: "not-a-url" }).success, false);
});

test("socket rate limiter enforces per-user, per-event fixed windows", () => {
  const user = `test-user-${Date.now()}-${Math.random()}`;
  assert.equal(allowRate(user, "test-event", 2, 60_000), true);
  assert.equal(allowRate(user, "test-event", 2, 60_000), true);
  assert.equal(allowRate(user, "test-event", 2, 60_000), false);
  assert.equal(allowRate(user, "other-event", 2, 60_000), true);
});

test("presence supports Invisible as a private manual state", () => {
  assert.deepEqual(MANUAL_PRESENCE_STATES, ["online", "away", "busy", "invisible"]);
  assert.equal(isManualPresenceState("invisible"), true);
  assert.equal(isManualPresenceState("offline"), false);
  assert.equal(isManualPresenceState("hidden"), false);
});
