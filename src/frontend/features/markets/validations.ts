import { z } from "zod";

const SELLER_APPLICATION_MIN_PHOTOS = 4;
const SELLER_APPLICATION_MAX_PHOTOS = 5;
const itemCountRangeIds = ["1-10", "11-25", "26-50", "51-100", "100+"] as const;

export const submitSellerApplicationSchema = z.object({
  marketId: z.string().uuid(),
  stylePhotoUrls: z
    .array(z.string().url())
    .min(SELLER_APPLICATION_MIN_PHOTOS, `Upload at least ${SELLER_APPLICATION_MIN_PHOTOS} photos`)
    .max(SELLER_APPLICATION_MAX_PHOTOS),
  socialMediaConsent: z.literal(true, {
    errorMap: () => ({ message: "Social media consent is required to apply" }),
  }),
  itemCount: z.number().int().positive().max(500),
  itemCountRange: z.enum(itemCountRangeIds),
  brandIds: z.array(z.string().uuid()).min(1, "Select at least one brand"),
  wantsToVolunteer: z.boolean(),
});

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


