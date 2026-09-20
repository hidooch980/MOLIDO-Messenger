import { z } from "zod";

export const sendFriendRequestSchema = z.object({
  username: z.string().min(1),
});

export const updateProfileSchema = z.object({
  avatarUrl: z.string().url().max(2048).nullable().optional(),
  statusMessage: z.string().max(140).nullable().optional(),
});

export type SendFriendRequestInput = z.infer<typeof sendFriendRequestSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
