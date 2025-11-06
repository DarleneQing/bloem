import { z } from "zod";

export const createHangerRentalSchema = z.object({
  marketId: z.string().uuid(),
  hangerCount: z.number().int().min(1).max(100),
});

export const updateHangerRentalSchema = z.object({
  id: z.string().uuid(),
  hangerCount: z.number().int().min(1).max(100),
});

export const hangerRentalIdSchema = z.object({ id: z.string().uuid() });


