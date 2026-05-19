import { redirect } from "next/navigation";
import { getUserProfileServer } from "@/lib/auth/utils";
import { getMyPurchaseHistory } from "@/features/profile/queries";
import { PurchaseHistoryView } from "@/components/profile/purchase-history-view";

export default async function PurchasesPage() {
  const profile = await getUserProfileServer();

  if (!profile) {
    redirect("/auth/sign-in");
  }

  const transactions = await getMyPurchaseHistory();

  return <PurchaseHistoryView transactions={transactions} />;
}
