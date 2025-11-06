import { z } from "zod";

export const marketListQuerySchema = z.object({
  status: z.enum(["ACTIVE", "COMPLETED", "all"]).optional(),
  search: z.string().max(200).optional(),
  page: z.number().int().positive().max(1000).optional(),
  limit: z.number().int().positive().max(50).optional(),
  sortBy: z.enum(["start_date", "created_at"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const registerMarketSchema = z.object({
  marketId: z.string().uuid(),
});


