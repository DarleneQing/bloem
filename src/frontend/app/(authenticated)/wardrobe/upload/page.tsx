import { getUserProfileServer } from "@/lib/auth/utils";
import { UploadItemForm } from "./upload-item-form";

export default async function UploadItemPage() {
  const profile = await getUserProfileServer();
  const isActiveSeller = profile?.isActiveSeller ?? false;

  return <UploadItemForm isActiveSeller={isActiveSeller} />;
}
