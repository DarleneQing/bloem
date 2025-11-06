import { HangerRental } from "@/types/rentals";

export async function getMyHangerRentals(): Promise<HangerRental[]> {
  const res = await fetch(`/api/hanger-rentals/my`, { cache: "no-store", credentials: "include" as any });
  const json = await res.json();
  if (!json?.success) return [];
  return json.data as HangerRental[];
}


