import Image from "next/image";
import Link from "next/link";
import { Leaf, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

const EMPTY_WARDROBE_IMAGE = "/assets/images/empty-wardrobe-holder.png";

export function EmptyWardrobe() {
  return (
    <div className="flex flex-col items-center px-2 pb-6 pt-2 text-center">
      <div className="relative mb-6 w-full max-w-[300px]">
        <Image
          src={EMPTY_WARDROBE_IMAGE}
          alt=""
          width={600}
          height={450}
          priority
          sizes="(max-width: 512px) 85vw, 300px"
          className="h-auto w-full object-contain"
        />
      </div>

      <h2 className="mb-3 text-2xl font-bold text-foreground">Your wardrobe is empty</h2>

      <p className="mb-8 max-w-sm text-base leading-relaxed text-muted-foreground">
        Add items to your wardrobe to keep track of what you own, sell, or love.
      </p>

      <div className="flex w-full max-w-sm flex-col gap-3">
        <Button
          asChild
          size="lg"
          className="h-12 w-full rounded-full text-base font-semibold"
        >
          <Link href="/wardrobe/upload">
            <Plus className="mr-2 h-5 w-5" aria-hidden />
            Add Your First Item
          </Link>
        </Button>

        <Button
          asChild
          variant="outline"
          size="lg"
          className="h-12 w-full rounded-full border-2 border-primary text-base font-semibold text-primary hover:bg-primary/5"
        >
          <Link href="/markets">
            <ShoppingBag className="mr-2 h-5 w-5" aria-hidden />
            Shop for Items
          </Link>
        </Button>
      </div>

      <div
        className="mt-10 flex w-full max-w-sm items-center gap-3 rounded-2xl bg-brand-lavender/25 px-4 py-3.5 text-left"
        role="note"
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-accent/30"
          aria-hidden
        >
          <Leaf className="h-5 w-5 text-brand-accent" />
        </div>
        <p className="text-sm leading-snug text-foreground">
          List items you no longer use and give them a new life.
        </p>
      </div>
    </div>
  );
}
