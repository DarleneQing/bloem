"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";

interface VerifyToBeSellerBannerProps {
  onVerify: () => void;
}

export function VerifyToBeSellerBanner({ onVerify }: VerifyToBeSellerBannerProps) {
  return (
    <section className="relative min-h-[88px] overflow-hidden rounded-2xl">
      <Image
        src="/assets/images/verify-to-be-seller-banner.png"
        alt=""
        fill
        className="object-cover object-right"
        sizes="(max-width: 512px) 100vw, 512px"
      />
      <div className="relative flex max-w-[62%] flex-col justify-center gap-2 px-4 py-4 pr-2">
        <p className="text-sm font-bold text-foreground">Become a Verified Seller</p>
        <p className="text-xs text-muted-foreground">
          Add your bank details to list items and earn at pop-up markets.
        </p>
        <Button type="button" variant="accent" size="sm" className="mt-0.5 w-fit" onClick={onVerify}>
          Verify Now
        </Button>
      </div>
    </section>
  );
}
