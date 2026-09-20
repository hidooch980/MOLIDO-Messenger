import { Redis } from "ioredis";

function redisUrl(): string {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL is not set");
  return url;
}

// Single shared connection per process, mirroring db/prisma.ts's pattern.
export const redis = new Redis(redisUrl());
