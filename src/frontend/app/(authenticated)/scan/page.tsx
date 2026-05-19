import { ScanPageClient } from "@/components/scan/scan-page-client";
import {
  getSellerLinkedItems,
  getWardrobeItemsForLinking,
} from "@/features/qr-codes/queries";
import { getUserProfileServer } from "@/lib/auth/utils";

interface PageProps {
  searchParams: Promise<{ code?: string }>;
}

export default async function ScanPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const code = resolvedSearchParams.code;
  const profile = await getUserProfileServer();
  const isActiveSeller = profile?.isActiveSeller ?? false;

  let wardrobeItems: Awaited<ReturnType<typeof getWardrobeItemsForLinking>> = [];
  let linkedItems: Awaited<ReturnType<typeof getSellerLinkedItems>> = [];

  if (isActiveSeller) {
    [wardrobeItems, linkedItems] = await Promise.all([
      getWardrobeItemsForLinking(),
      getSellerLinkedItems(5),
    ]);
  }

  return (
    <ScanPageClient
      isActiveSeller={isActiveSeller}
      code={code}
      wardrobeItems={wardrobeItems}
      linkedItems={linkedItems}
    />
  );
}
