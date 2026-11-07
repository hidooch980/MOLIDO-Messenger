import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "../src/db/prisma.js";
import { createRoom, getHistory, postMessage, editMessage, deleteMessage } from "../src/modules/rooms/service.js";
import { LocalizedError } from "@molido/i18n";

test("PostgreSQL persists room messages and enforces membership and ownership", {
  skip: !process.env.DATABASE_URL,
}, async () => {
  const suffix = randomUUID();
  const user = await prisma.user.create({
    data: {
      username: `it_${suffix.slice(0, 12)}`,
      email: `${suffix}@integration.invalid`,
      passwordHash: "test-only-hash",
    },
  });
  let roomId: string | undefined;

  try {
    const room = await createRoom(user.id, { name: "Integration room", isPublic: false });
    roomId = room.id;

    const created = await postMessage(room.id, user.id, "persisted integration message");
    assert.equal(created.body, "persisted integration message");
    assert.equal(created.senderId, user.id);

    const history = await getHistory(room.id, user.id, { limit: 10 });
    assert.equal(history.length, 1);
    assert.equal(history[0]?.id, created.id);

    const edited = await editMessage(room.id, created.id, user.id, "edited message");
    assert.equal(edited.body, "edited message");
    assert.ok(edited.editedAt);

    const deleted = await deleteMessage(room.id, created.id, user.id);
    assert.equal(deleted.body, null);
    assert.ok(deleted.deletedAt);

    await assert.rejects(
      () => postMessage(room.id, randomUUID(), "not a member"),
      (error: unknown) => error instanceof LocalizedError && error.code === "GROUP_FORBIDDEN",
    );
  } finally {
    if (roomId) await prisma.room.delete({ where: { id: roomId } });
    await prisma.user.delete({ where: { id: user.id } });
  }
});
