import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Instagram, Linkedin, Globe, Sparkles } from "lucide-react";
import { SOCIAL_LINKS } from "@/lib/constants/social-links";

export const metadata: Metadata = {
  title: "bloem · links",
  description:
    "Apply for the next bloem flea market, join the beta, and find us across the web.",
};

const APPLY_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSf3zyMeUOxIYSykc3WJGtLdF7rnApkouGdgd171ZxryQxc4JA/viewform?usp=publish-editor";

interface LinkButtonProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  external?: boolean;
}

function LinkButton({ href, label, icon, external = false }: LinkButtonProps) {
  const className =
    "group flex w-full items-center justify-center gap-2 rounded-xl border border-brand-purple/15 bg-white px-4 py-2.5 text-center shadow-sm transition-all duration-fast hover:-translate-y-0.5 hover:border-brand-purple/40 hover:shadow-md active:scale-98";

  const inner = (
    <span className="flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-purple/10 text-brand-purple transition-colors group-hover:bg-brand-purple group-hover:text-white">
        {icon}
      </span>
      <span className="text-base font-medium text-foreground">{label}</span>
    </span>
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}

export default function LinkPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-brand-ivory">
      <div
        className="pointer-events-none absolute inset-x-0 -top-32 h-80 bg-gradient-to-b from-brand-lavender/40 via-brand-lavender/10 to-transparent blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-40 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-brand-accent/15 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
        <header className="flex flex-col items-center text-center animate-fade-in">
          <Image
            src="/assets/images/brand-transparent.png"
            alt="bloem"
            width={280}
            height={86}
            priority
            className="h-auto w-44 sm:w-52"
          />
          <h1 className="sr-only">bloem</h1>
          <p className="mt-5 text-2xl font-medium leading-tight text-brand-purple sm:text-3xl">
            Circular fashion.
            <br />
            <span className="text-brand-accent">digital.</span> easy.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            from closets to local racks
            <br />
            community-powered
          </p>
        </header>

        <section className="mt-8 flex flex-col gap-2 animate-slide-up">
          <a
            href={APPLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-brand-purple px-4 py-2.5 text-center text-white shadow-md transition-all duration-fast hover:-translate-y-0.5 hover:bg-brand-purple/90 hover:shadow-lg active:scale-98"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-accent text-brand-purple">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span className="flex flex-col items-center">
              <span className="text-base font-semibold leading-tight">
                Apply for Early Access
              </span>
              <span className="text-xs font-normal text-white/70">
                Sellers, volunteers, partner designers, buyers
              </span>
            </span>
          </a>

          <LinkButton
            href={SOCIAL_LINKS.linkedin}
            label="LinkedIn"
            icon={<Linkedin className="h-4 w-4" aria-hidden />}
            external
          />
          <LinkButton
            href={SOCIAL_LINKS.instagram}
            label="Instagram"
            icon={<Instagram className="h-4 w-4" aria-hidden />}
            external
          />
          <LinkButton
            href="/"
            label="Visit Website"
            icon={<Globe className="h-4 w-4" aria-hidden />}
          />
        </section>

        <footer className="mt-10 text-center text-xs text-muted-foreground">
          <p>Made with care in Switzerland · letsbloem.com</p>
        </footer>
      </div>
    </main>
  );
}
