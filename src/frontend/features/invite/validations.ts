import { z } from "zod";

export const inviteCodeSchema = z.object({
  code: z
    .string()
    .min(1, "Invite code is required")
    .max(100, "Invite code is too long")
    .trim(),
});

export type InviteCodeInput = z.infer<typeof inviteCodeSchema>;
