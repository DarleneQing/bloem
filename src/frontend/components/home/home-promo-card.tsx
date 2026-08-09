import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const PROMO_IMAGE = "/assets/images/home-promo-card.png";

export function HomePromoCard() {
  return (
    <section className="relative mb-6 min-h-[168px] overflow-hidden rounded-3xl bg-brand-lavender/30 shadow-sm md:min-h-[220px]">
      <Image
        src={PROMO_IMAGE}
        alt=""
        fill
        priority
        sizes="(max-width: 512px) 100vw, (max-width: 1024px) 512px, 1024px"
        className="object-cover object-left"
      />

      <div className="relative z-10 flex min-h-[168px] max-w-[58%] flex-col justify-center px-5 py-5 sm:max-w-[55%] sm:px-6 md:min-h-[220px] md:max-w-sm md:px-8">
        <h2 className="text-lg font-bold leading-tight text-foreground sm:text-xl md:text-2xl">
          Circular Fashion.
          <br />
          Stronger Together.
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm md:text-base">
          Shop pre-loved. Support communities. Protect our planet.
        </p>
        <Button asChild size="sm" className="w-fit rounded-full">
          <Link href="/markets">Explore Markets</Link>
        </Button>
      </div>
    </section>
  );
}
