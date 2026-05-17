import Image from "next/image";
import Link from "next/link";

const PROMO_IMAGE = "/assets/images/home-promo-card.png";

export function HomePromoCard() {
  return (
    <section className="relative mb-6 min-h-[168px] overflow-hidden rounded-3xl bg-[#E8DFF8] shadow-sm">
      <Image
        src={PROMO_IMAGE}
        alt=""
        fill
        priority
        sizes="(max-width: 512px) 100vw, 512px"
        className="object-cover object-left"
      />

      <div className="relative z-10 flex min-h-[168px] max-w-[58%] flex-col justify-center px-5 py-5 sm:max-w-[55%] sm:px-6">
        <h2 className="text-lg font-bold leading-tight text-foreground sm:text-xl">
          Circular Fashion.
          <br />
          Stronger Together.
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
          Shop pre-loved. Support communities. Protect our planet.
        </p>
        <Link
          href="/markets"
          className="mt-4 inline-flex w-fit items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Explore Markets
        </Link>
      </div>
    </section>
  );
}
