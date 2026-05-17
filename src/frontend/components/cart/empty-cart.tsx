import Image from "next/image";
import Link from "next/link";
import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";

const EMPTY_CART_IMAGE = "/assets/images/empty-cart-holder.png";

export function EmptyCart() {
  return (
    <div className="flex flex-1 flex-col items-center px-4 pb-8 pt-4 text-center">
      <div className="relative mb-6 w-full max-w-[280px]">
        <Image
          src={EMPTY_CART_IMAGE}
          alt=""
          width={560}
          height={420}
          priority
          sizes="(max-width: 512px) 80vw, 280px"
          className="h-auto w-full object-contain"
        />
      </div>

      <h2 className="mb-3 text-2xl font-bold text-foreground">Your cart is empty</h2>

      <p className="mb-8 max-w-sm text-base leading-relaxed text-muted-foreground">
        Looks like you haven&apos;t added any pre-loved finds yet. Explore markets and discover
        pieces you&apos;ll love.
      </p>

      <div className="flex w-full max-w-sm flex-col gap-3">
        <Button asChild size="lg" className="h-12 w-full rounded-full text-base font-semibold">
          <Link href="/markets">Explore Markets</Link>
        </Button>

        <Button
          asChild
          variant="outline"
          size="lg"
          className="h-12 w-full rounded-full border-2 border-primary text-base font-semibold text-primary hover:bg-primary/5"
        >
          <Link href="/">Continue Shopping</Link>
        </Button>
      </div>

      <p className="mt-10 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
        <Leaf className="h-4 w-4 text-brand-accent" aria-hidden />
        Sustainable finds are waiting for you
      </p>
    </div>
  );
}
