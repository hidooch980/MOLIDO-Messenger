import { z } from "zod";
import { ROOM_CATEGORIES } from "@molido/i18n";

export const createRoomSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(280).optional(),
  category: z.enum(ROOM_CATEGORIES).optional(),
  isPublic: z.boolean().optional(),
});

export const publicRoomsQuerySchema = z.object({
  category: z.enum(ROOM_CATEGORIES).optional(),
});

export const sendMessageSchema = z.object({
  body: z.string().min(1).max(4000),
});

export const editMessageSchema = z.object({
  body: z.string().min(1).max(4000),
});

export const historyQuerySchema = z.object({
  before: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type EditMessageInput = z.infer<typeof editMessageSchema>;
export type HistoryQueryInput = z.infer<typeof historyQuerySchema>;
export type PublicRoomsQueryInput = z.infer<typeof publicRoomsQuerySchema>;
