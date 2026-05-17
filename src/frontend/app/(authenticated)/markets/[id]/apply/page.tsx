import { redirect } from "next/navigation";
import { SellerApplicationForm } from "@/components/markets/seller-application-form";
import { getAllBrands } from "@/lib/data/brands";
import { sellerApplicationFromEnrollment } from "@/lib/markets/seller-application";
import { createClient } from "@/lib/supabase/server";

interface SellerApplyPageProps {
  params: { id: string };
}

export default async function SellerApplyPage({ params }: SellerApplyPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/sign-in?next=/markets/${params.id}/apply`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("iban_verified_at")
    .eq("id", user.id)
    .single();

  if (!profile?.iban_verified_at) {
    redirect("/profile?activate=seller");
  }

  const { data: market } = await supabase
    .from("markets")
    .select("id, name, status")
    .eq("id", params.id)
    .maybeSingle();

  if (!market || market.status !== "ACTIVE") {
    redirect("/markets");
  }

  const { data: enrollment } = await supabase
    .from("market_enrollments")
    .select(
      "status, style_photo_urls, social_media_consent, item_count, item_count_range, brand_ids, wants_to_volunteer"
    )
    .eq("market_id", params.id)
    .eq("seller_id", user.id)
    .maybeSingle();

  if (enrollment?.status === "APPROVED") {
    redirect(`/markets/${params.id}`);
  }

  const brands = await getAllBrands();
  const isEditingPending = enrollment?.status === "PENDING";
  const initialApplication =
    isEditingPending && enrollment
      ? sellerApplicationFromEnrollment(enrollment)
      : undefined;

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-6 md:max-w-xl md:py-8">
      <SellerApplicationForm
        marketId={params.id}
        marketName={market.name}
        brands={brands}
        isEditing={isEditingPending}
        initialApplication={initialApplication}
      />
    </div>
  );
}
