import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/layout/public-header";
import { Footer } from "@/components/layout/footer";
import { MemberCard } from "@/components/about/member-card";
import { getCurrentUserServer } from "@/lib/auth/utils";
import { ArrowRight, Quote, Sprout, Users, Flower2, ShoppingBag } from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/motion";
import CurvedLoop from "@/components/ui/CurvedLoop";

export default async function AboutPage() {
  const user = await getCurrentUserServer();

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader user={user} sticky variant="transparent" />

      <main>
        {/* Hero Section */}
        <section className="relative bg-brand-ivory pt-16 pb-16 md:pt-24 md:pb-20 overflow-hidden">
          <div className="container relative z-10 mx-auto px-4">
            <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-8">
              {/* Left: copy + CTA */}
              <div>
                <FadeIn>
                  <p className="mb-6 text-xs font-bold uppercase tracking-[0.3em] text-brand-purple">
                    About us
                  </p>
                </FadeIn>
                <FadeIn delay={0.1}>
                  <h1 className="text-4xl font-medium leading-tight text-foreground md:text-5xl lg:text-6xl">
                    Built on a belief.
                    <br />
                    Driven by{" "}
                    <span className="relative inline-block text-brand-purple">
                      purpose.
                      <span
                        aria-hidden
                        className="absolute -bottom-1 left-0 h-1 w-full rounded-full bg-brand-purple/70"
                      />
                    </span>
                  </h1>
                </FadeIn>
                <FadeIn delay={0.2}>
                  <p className="mt-6 max-w-md text-base text-muted-foreground leading-relaxed">
                    bloem was born out of the belief that fashion should be
                    circular, not disposable.
                  </p>
                </FadeIn>
                <FadeIn delay={0.3}>
                  <Button
                    asChild
                    size="lg"
                    className="mt-8 rounded-full bg-primary px-6 font-medium hover:bg-primary/90"
                  >
                    <Link href="#our-story" className="inline-flex items-center gap-3">
                      Our Story
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </Link>
                  </Button>
                </FadeIn>
              </div>

              {/* Right: illustration */}
              <div className="relative mx-auto w-full max-w-md md:max-w-none">
                <FadeIn direction="left">
                  <div className="relative aspect-square">
                    <Image
                      src="/assets/images/sign-in-fashion-illustration.png"
                      alt="Illustration of a person admiring a sustainable garment"
                      fill
                      priority
                      sizes="(max-width: 768px) 90vw, 50vw"
                      className="object-contain"
                    />
                  </div>
                </FadeIn>
              </div>
            </div>

          </div>
        </section>

        {/* Curved Text Loop */}
        <section className="pb-12 bg-brand-ivory overflow-hidden border-t border-white/50">
          <CurvedLoop 
            marqueeText="circular ✦ digital ✦ fashion ✦ with ✦ bloem ✦ "
            speed={1.5}
            curveAmount={80}
            direction="left"
            className="text-brand-purple/50"
          />
        </section>

        {/* Our Story Section */}
        <section id="our-story" className="pt-8 pb-16 md:pt-8 md:pb-24 bg-brand-ivory relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#6B22B1_1px,transparent_1px)] [background-size:20px_20px]" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-12">
              <FadeIn>
                <div className="flex items-center justify-center gap-3 text-primary">
                  <Image src="/assets/images/leaf_sprout_icon.svg" alt="" aria-hidden width={48} height={48} className="h-12 w-12" />
                  <h2 className="text-3xl font-medium inline-block relative pb-2">
                    our story
                    <span className="absolute bottom-0 left-0 w-full h-1 bg-brand-lavender rounded-full"></span>
                  </h2>
                  <Image src="/assets/images/leaf_sprout_icon.svg" alt="" aria-hidden width={48} height={48} className="h-12 w-12 -scale-x-100" />
                </div>
              </FadeIn>
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-16">
              {/* Content */}
              <div className="lg:w-1/2">
                <FadeIn direction="right">
                  <div className="relative mb-8 overflow-hidden rounded-[2rem] bg-brand-lavender/20 p-8 md:p-10">
                    {/* Decorative leaf on the right */}
                    <Image
                      src="/assets/images/leaf-purple.png"
                      alt=""
                      aria-hidden
                      width={96}
                      height={128}
                      className="pointer-events-none absolute right-4 top-1/2 h-32 w-24 -translate-y-1/2 object-contain"
                    />

                    <div className="relative flex items-start gap-5 pr-24 md:pr-32">
                      <Quote
                        aria-hidden
                        className="h-10 w-10 flex-shrink-0 -scale-x-100 text-brand-purple"
                        fill="currentColor"
                      />
                      <p className="text-lg md:text-xl font-medium text-foreground leading-relaxed">
                        Born out of a belief that fashion should be circular,
                        not disposable. bloem connects closets directly to
                        communities.
                      </p>
                    </div>

                    {/* Founder illustrations directly below the text */}
                    <div className="relative mt-4 flex justify-end gap-1 pr-24 md:pr-32 md:gap-2">
                      <Image
                        src="/assets/images/draw-sophia.png"
                        alt=""
                        aria-hidden
                        width={112}
                        height={112}
                        className="h-10 w-20 object-contain md:h-14 md:w-28"
                      />
                      <Image
                        src="/assets/images/draw-yuqing.png"
                        alt=""
                        aria-hidden
                        width={112}
                        height={112}
                        className="h-10 w-20 object-contain md:h-14 md:w-28"
                      />
                    </div>
                  </div>
                  <div className="space-y-6 text-muted-foreground text-lg leading-relaxed mb-6 md:mb-10">
                    <p>
                      We saw the growing mountain of textile waste and the disconnect between people who want to buy and sell preloved clothing. Online resale is cluttered; flea markets are hassle.
                    </p>
                    <p>
                      So we created bloem—bridging digital convenience with physical shopping. By combining a digital wardrobe app with self-serve racks, we&apos;re making it easier to keep clothes in circulation.
                    </p>
                  </div>
                  <Button asChild variant="default" size="lg" className="rounded-full px-8 font-medium bg-primary hover:bg-primary/90">
                    <Link href="/markets">Discover Our Markets</Link>
                  </Button>
                </FadeIn>
              </div>

              {/* Image Collage — layered portrait + scene shots */}
              <div className="w-full lg:w-1/2 flex items-center justify-center mt-6 lg:mt-0">
                <div className="relative w-full max-w-md aspect-[5/6]">
                  {/* Main portrait — top right */}
                  <div className="absolute right-0 top-0 w-[72%] aspect-[3/4] rounded-[2rem] overflow-hidden shadow-2xl">
                    <Image
                      src="/assets/images/team/about-us-1.png"
                      alt="A bloem community member smiling"
                      fill
                      sizes="(max-width: 1024px) 50vw, 28vw"
                      className="object-cover"
                    />
                  </div>

                  {/* Purple logo badge — overlapping top-left of portrait */}
                  <div className="absolute right-[64%] top-4 z-20 flex h-16 w-16 items-center justify-center rounded-full bg-brand-purple shadow-lg">
                    <Image
                      src="/assets/images/brand-white.png"
                      alt="bloem"
                      width={36}
                      height={36}
                      className="object-contain"
                    />
                  </div>

                  {/* Bottom-left smaller image — event/speaking */}
                  <div className="absolute left-0 bottom-[18%] z-10 w-[42%] aspect-square rounded-[1.75rem] overflow-hidden shadow-xl">
                    <Image
                      src="/assets/images/Intro-pic.png"
                      alt="bloem member at a pop-up rack"
                      fill
                      sizes="(max-width: 1024px) 25vw, 15vw"
                      className="object-cover"
                    />
                  </div>

                  {/* Bottom-right medium image — rack browse */}
                  <div className="absolute right-[2%] bottom-0 z-10 w-[58%] aspect-[5/4] rounded-[1.75rem] overflow-hidden shadow-xl">
                    <Image
                      src="/assets/images/team/about-us-2.jpeg"
                      alt="bloem members browsing a rack together"
                      fill
                      sizes="(max-width: 1024px) 32vw, 18vw"
                      className="object-cover object-top"
                    />
                  </div>

                  {/* Decorative purple swirl arrow */}
                  <svg
                    aria-hidden
                    viewBox="0 0 60 60"
                    className="pointer-events-none absolute left-[36%] bottom-[6%] z-20 h-12 w-12 text-brand-purple"
                  >
                    <path
                      d="M10 45 C 10 25, 30 15, 45 30 M40 25 L45 30 L40 35"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M15 50 C 18 35, 32 28, 48 38 M43 33 L48 38 L43 43"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.5"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What Drives Us Section */}
        <section className="py-20 bg-brand-ivory">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <FadeIn direction="up">
                <div className="flex items-center justify-center gap-3 text-brand-purple">
                  <Image src="/assets/images/leaf_sprout_icon.svg" alt="" aria-hidden width={48} height={48} className="h-12 w-12" />
                  <h2 className="text-3xl font-medium">What drives us</h2>
                  <Image src="/assets/images/leaf_sprout_icon.svg" alt="" aria-hidden width={48} height={48} className="h-12 w-12 -scale-x-100" />
                </div>
              </FadeIn>
            </div>

            <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              <StaggerItem>
                <div className="bg-white rounded-[1.75rem] p-8 shadow-md text-center h-full flex flex-col items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-lavender/25">
                    <Sprout className="h-10 w-10 text-brand-purple" />
                  </div>
                  <h3 className="text-lg md:text-2xl font-semibold text-foreground">Sustainability</h3>
                  <span aria-hidden className="block h-0.5 w-10 rounded-full bg-brand-lavender" />
                  <p className="text-sm md:text-lg leading-relaxed text-muted-foreground">
                    Every piece has the potential for another life.
                  </p>
                </div>
              </StaggerItem>

              <StaggerItem>
                <div className="bg-white rounded-[1.75rem] p-8 shadow-md text-center h-full flex flex-col items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-lavender/25">
                    <Users className="h-10 w-10 text-brand-purple" />
                  </div>
                  <h3 className="text-lg md:text-2xl font-semibold text-foreground">Community</h3>
                  <span aria-hidden className="block h-0.5 w-10 rounded-full bg-brand-lavender" />
                  <p className="text-sm md:text-lg leading-relaxed text-muted-foreground">
                    We build connections that go beyond clothing.
                  </p>
                </div>
              </StaggerItem>

              <StaggerItem>
                <div className="bg-white rounded-[1.75rem] p-8 shadow-md text-center h-full flex flex-col items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-lavender/25">
                    <Flower2 className="h-10 w-10 text-brand-purple" />
                  </div>
                  <h3 className="text-lg md:text-2xl font-semibold text-foreground">Transparency</h3>
                  <span aria-hidden className="block h-0.5 w-10 rounded-full bg-brand-lavender" />
                  <p className="text-sm md:text-lg leading-relaxed text-muted-foreground">
                    Trust through honest processes and clear communication.
                  </p>
                </div>
              </StaggerItem>

              <StaggerItem>
                <div className="bg-white rounded-[1.75rem] p-8 shadow-md text-center h-full flex flex-col items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-lavender/25">
                    <ShoppingBag className="h-10 w-10 text-brand-purple" />
                  </div>
                  <h3 className="text-lg md:text-2xl font-semibold text-foreground">Convenience</h3>
                  <span aria-hidden className="block h-0.5 w-10 rounded-full bg-brand-lavender" />
                  <p className="text-sm md:text-lg leading-relaxed text-muted-foreground">
                    Thrift made simple, accessible, and meaningful.
                  </p>
                </div>
              </StaggerItem>
            </StaggerContainer>
          </div>
        </section>

        {/* Meet the Team Section */}
        <section className="py-20 bg-brand-ivory relative overflow-hidden">
          {/* Background pattern — matches our story */}
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#6B22B1_1px,transparent_1px)] [background-size:20px_20px]" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-12">
              <FadeIn direction="up">
                <div className="flex items-center justify-center gap-3 text-primary">
                  <Image src="/assets/images/leaf_sprout_icon.svg" alt="" aria-hidden width={48} height={48} className="h-12 w-12" />
                  <h2 className="text-3xl font-medium inline-block relative pb-2">
                    our team
                    <span className="absolute bottom-0 left-0 w-full h-1 bg-brand-lavender rounded-full"></span>
                  </h2>
                  <Image src="/assets/images/leaf_sprout_icon.svg" alt="" aria-hidden width={48} height={48} className="h-12 w-12 -scale-x-100" />
                </div>
              </FadeIn>
            </div>

            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 max-w-5xl mx-auto">
              {/* Team Member 1 - Sophia */}
              <StaggerItem>
                <MemberCard
                  name="Sophia Haas"
                  role="Founder"
                  bio="Entrepreneur and founder of bloem, with a focus on developing and validating concepts from the ground up. Combining creative thinking with a structured, strategic approach."
                  imageSrc="/assets/images/team/sophia.jpg"
                  linkedinUrl="https://www.linkedin.com/in/sophia-haas"
                  instagramUrl="https://www.instagram.com/sophdagostino"
                />
              </StaggerItem>

              {/* Team Member 2 - Yuqing */}
              <StaggerItem>
                <MemberCard
                  name="Yuqing Huang"
                  role="Software Engineer"
                  bio="Master's graduate from University of Zurich in Informatik, focusing on data science and human-centered design. Combines technical development with clear storytelling to build digital products that are intuitive, transparent, and useful in everyday life."
                  imageSrc="/assets/images/team/yuqing.png"
                  linkedinUrl="https://linkedin.com/in/yuqing-huang-8309a61a2"
                  instagramUrl="https://www.instagram.com/darlene_qyh"
                  email="yuqing.h99@icloud.com"
                />
              </StaggerItem>
            </StaggerContainer>
          </div>
        </section>

        {/* Join the Movement / Footer Callout */}
        <section className="relative overflow-hidden bg-brand-ivory">
          {/* Background illustration */}
          <Image
            src="/assets/images/about-bottom.png"
            alt=""
            aria-hidden
            fill
            sizes="100vw"
            className="object-cover object-bottom md:object-center"
            priority={false}
          />
          {/* Content overlay */}
          <div className="relative z-10 container mx-auto px-4 py-14 md:py-32 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-lavender/30 shadow-lg md:mb-6 md:h-28 md:w-28">
              <Image
                src="/assets/images/logo-transparent.png"
                alt="bloem"
                width={72}
                height={72}
                className="h-10 w-10 object-contain md:h-20 md:w-20"
              />
            </div>
            <h2 className="mx-auto max-w-md text-xl font-medium leading-snug text-foreground md:max-w-2xl md:text-3xl">
              We&apos;re here to change the way fashion is consumed—
              <span className="relative inline-block text-brand-purple">
                together.
                <span
                  aria-hidden
                  className="absolute -bottom-1 left-0 h-1 w-full rounded-full bg-brand-purple/70"
                />
              </span>
            </h2>
            <p className="mt-3 text-xs text-muted-foreground md:mt-4 md:text-base">
              One shared item. One conscious choice. One step at a time.
            </p>
          </div>
        </section>
      </main>

      <Footer variant="about" />
    </div>
  );
}
