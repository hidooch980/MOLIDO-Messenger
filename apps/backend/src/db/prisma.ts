import { PrismaClient } from "@prisma/client";

// Single shared client per process (Prisma's documented pattern) — avoids
// exhausting Postgres connections under `tsx watch` hot-reload.
export const prisma = new PrismaClient();
