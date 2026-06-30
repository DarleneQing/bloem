import { notFound, redirect } from "next/navigation";
import { getItemById } from "@/features/items/queries";
import { getUserProfileServer } from "@/lib/auth/utils";
import { EditItemForm } from "./edit-item-form";

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const resolvedParams = await params;
  const [item, profile] = await Promise.all([
    getItemById(resolvedParams.itemId),
    getUserProfileServer(),
  ]);

  if (!item) {
    notFound();
  }

  if (!profile) {
    redirect("/auth/sign-in");
  }

  if (profile.id !== item.owner_id) {
    notFound();
  }

  if (item.status === "SOLD") {
    notFound();
  }

  return <EditItemForm item={item} isActiveSeller={profile.isActiveSeller} />;
}
