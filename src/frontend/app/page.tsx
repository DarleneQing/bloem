"use client";

import { useState, useEffect, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ContactDialog } from "@/components/contact/ContactDialog";
import { createClient } from "@/lib/supabase/client";
import { ShoppingBag, MapPin, Star, Handshake, Heart, Leaf, Eye, Zap, Mail, Instagram, Linkedin } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { FadeIn, StaggerContainer, StaggerItem, ScaleIn } from "@/components/ui/motion";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard = memo(function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-white/90 p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
      <div className="w-12 h-12 bg-brand-lavender/30 rounded-full flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2 leading-snug">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
});

interface BenefitCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const BenefitCard = memo(function BenefitCard({ icon, title, description }: BenefitCardProps) {
  return (
    <div className="flex flex-col items-center text-center p-6 hover:scale-[1.02] transition-transform duration-300">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2 leading-snug">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
});

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [isContactOpen, setIsContactOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
    };
    fetchUser();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Image
            src="/assets/images/brand-transparent.png"
            alt="Bloem"
            width={140}
            height={40}
            className="h-9 md:h-11 w-auto"
            priority
          />
          {!user && (
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" size="sm">
                <Link href="/auth/sign-in">Sign In</Link>
              </Button>
              <Button asChild variant="default" size="sm" className="hidden sm:inline-flex">
                <Link href="/auth/sign-up">Get Started</Link>
              </Button>
            </div>
          )}
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="py-16 md:py-24 relative overflow-hidden">
          <div className="container relative z-10 px-4">
            <div className="flex flex-col lg:flex-row items-start gap-10 lg:gap-16">
              <div className="lg:w-1/2 flex flex-col items-start space-y-6">
                <FadeIn delay={0.1} direction="right">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium text-primary text-left leading-tight">
                    circular fashion.<br /> <span className="text-brand-accent">digital.</span> easy.
                  </h1>
                </FadeIn>
                <FadeIn delay={0.2} direction="right">
                  <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
                    from closets to local racks <br/> community-powered
                  </p>
                </FadeIn>
                <FadeIn delay={0.3} direction="up">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {user ? (
                      <Button asChild variant="accent" size="default" className="font-medium">
                        <Link href="/wardrobe">Go to Wardrobe</Link>
                      </Button>
                    ) : (
                      <>
                        <Button asChild variant="accent" size="default" className="font-medium">
                          <Link href="/auth/sign-up">Get Started</Link>
                        </Button>
                        <Button asChild variant="outline" size="default" className="font-medium bg-white/80">
                          <Link href="#how-it-works">Learn More</Link>
                        </Button>
                      </>
                    )}
                  </div>
                </FadeIn>
                <FadeIn delay={0.4} direction="up">
                  <div className="flex items-center gap-4 pt-4">
                    <div className="flex -space-x-2">
                      <div className="w-10 h-10 rounded-full bg-brand-lavender flex items-center justify-center border-2 border-white">
                        <span className="text-sm font-medium text-brand-purple">JD</span>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-brand-accent flex items-center justify-center border-2 border-white">
                        <span className="text-sm font-medium text-gray-700">SL</span>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-brand-purple flex items-center justify-center border-2 border-white">
                        <span className="text-sm font-medium text-white">KM</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-bold">80+</span> people expressed interest
                    </p>
                  </div>
                </FadeIn>
              </div>
              <div className="lg:w-1/2 relative">
                <ScaleIn delay={0.2} duration={0.6}>
                  <Image
                    src="/assets/images/Intro-pic.png"
                    alt="Bloem app scanning clothing tag"
                    width={600}
                    height={600}
                    className="rounded-lg shadow-lg"
                    priority
                  />
                </ScaleIn>
              </div>
            </div>
          </div>
        </section>

        {/* Together We Bloem */}
        <section id="together-we-bloem" className="py-16 md:py-20 relative bg-background">
          <div className="container relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <FadeIn direction="up">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium text-primary mb-6 leading-tight">
                  together we bloem
                </h2>
              </FadeIn>
              <FadeIn delay={0.1} direction="up">
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  Try on, check the quality, and skip the hassle. bloem keeps fashion flowing, through reselling, repairing, and repurposing. No messages, packaging, nor shipping. Enjoy effortless reselling with bloem.
                </p>
              </FadeIn>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
              {/* Left side: Feature cards in 2x2 grid */}
              <div className="w-full md:w-3/5">
                <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-6" staggerDelay={0.1}>
                  <StaggerItem>
                    <FeatureCard
                      icon={<ShoppingBag className="h-6 w-6 text-primary" />}
                      title="digital wardrobe"
                      description="Digitize your closet in seconds with AI. Sell, buy and manage everything effortlessly."
                    />
                  </StaggerItem>
                  <StaggerItem>
                    <FeatureCard
                      icon={<MapPin className="h-6 w-6 text-primary" />}
                      title="physical racks"
                      description="Secure racks in high-traffic spots, making it easy to drop off, pick up, and keep preloved fashion in cycle."
                    />
                  </StaggerItem>
                  <StaggerItem>
                    <FeatureCard
                      icon={<Star className="h-6 w-6 text-primary" />}
                      title="your page"
                      description="Discover outfits and pre-loved finds just for you. Get nearby rack picks and connect with fellow bloemers."
                    />
                  </StaggerItem>
                  <StaggerItem>
                    <FeatureCard
                      icon={<Handshake className="h-6 w-6 text-primary" />}
                      title="thriving community"
                      description="Connect with local bloemers, follow closets you love, and discover the stories behind each piece."
                    />
                  </StaggerItem>
                </StaggerContainer>
              </div>

              {/* Right side: Image */}
              <div className="w-full md:w-2/5 flex justify-center items-stretch">
                <FadeIn delay={0.3} direction="left" className="w-full h-full">
                  <div className="relative w-full h-full min-h-[300px] rounded-xl overflow-hidden shadow-lg">
                    <Image
                      src="/assets/images/rack-display.png"
                      alt="bloem circular rack with clothing"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-primary/10"></div>
                  </div>
                </FadeIn>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-16 md:py-20 bg-background">
          <div className="container mx-auto px-4">
            <FadeIn direction="up">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium text-center mb-12 leading-tight">
                <span className="text-primary">bloem</span> with us
              </h2>
            </FadeIn>
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" staggerDelay={0.15}>
              {/* Step 1 */}
              <StaggerItem>
                <div className="bg-card rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 h-full">
                  <div className="w-14 h-14 rounded-full bg-brand-lavender flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold text-white">1</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 leading-snug">upload items</h3>
                  <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                    Use AI-assisted uploads to quickly add pieces.
                  </p>
                  <div className="relative w-full h-48 rounded-xl overflow-hidden">
                    <Image
                      src="/assets/images/benefits.png"
                      alt="Upload items to bloem app"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </StaggerItem>

              {/* Step 2 */}
              <StaggerItem>
                <div className="bg-card rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 h-full">
                  <div className="w-14 h-14 rounded-full bg-brand-lavender flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold text-white">2</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 leading-snug">rent hangers</h3>
                  <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                    Choose a rack near you and link with a QR code.
                  </p>
                  <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gray-100">
                    <Image
                      src="/assets/images/hangers-with-logo.png"
                      alt="Rent hangers on bloem racks"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              </StaggerItem>

              {/* Step 3 */}
              <StaggerItem>
                <div className="bg-card rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 h-full">
                  <div className="w-14 h-14 rounded-full bg-brand-lavender flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold text-white">3</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 leading-snug">track sales</h3>
                  <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                    Monitor interest and sales in real time, right from the app.
                  </p>
                  <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gray-100">
                    <Image
                      src="/assets/images/Track.png"
                      alt="Track sales on bloem racks"
                      width={400}
                      height={200}
                      className="object-contain w-full h-full"
                    />
                  </div>
                </div>
              </StaggerItem>

              {/* Step 4 */}
              <StaggerItem>
                <div className="bg-card rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 h-full">
                  <div className="w-14 h-14 rounded-full bg-brand-lavender flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold text-white">4</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 leading-snug">discover</h3>
                  <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                    Follow bloemers, get personalized recommendation, love what you find.
                  </p>
                  <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gray-100">
                    <Image
                      src="/assets/images/browse.png"
                      alt="Discover items"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              </StaggerItem>
            </StaggerContainer>
          </div>
        </section>

        {/* Sustainability Section */}
        <section id="what-bloem-stands-for" className="py-16 md:py-20 bg-gradient-to-b from-white to-brand-lavender/10">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <FadeIn direction="up">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium mb-6 leading-tight">
                  what <span className="text-primary">bloem</span> stands for
                </h2>
              </FadeIn>
              <FadeIn delay={0.1} direction="up">
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  Bridging the gap between digital and in-person reselling through transparency and community.
                </p>
              </FadeIn>
            </div>

            <div className="flex flex-col md:flex-row items-stretch gap-8 md:gap-12">
              {/* Left side: Image */}
              <div className="w-full md:w-1/2 flex">
                <FadeIn direction="right" className="w-full">
                  <div className="relative w-full h-full min-h-[400px] rounded-2xl overflow-hidden shadow-lg">
                    <Image
                      src="/assets/images/sustainable-fashion.png"
                      alt="Circular Fashion"
                      fill
                      className="object-cover"
                    />
                  </div>
                </FadeIn>
              </div>

              {/* Right side: Benefit cards in 2x2 grid */}
              <div className="w-full md:w-1/2">
                <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-6" staggerDelay={0.1}>
                  <StaggerItem>
                    <BenefitCard
                      icon={<Leaf className="h-8 w-8 text-brand-accent" />}
                      title="resourceful"
                      description="Fight fashion waste by keeping clothes in circulation and out of landfills."
                    />
                  </StaggerItem>
                  <StaggerItem>
                    <BenefitCard
                      icon={<Zap className="h-8 w-8 text-primary" />}
                      title="convenient"
                      description="Exchange items on your schedule with no need to coordinate meetups or shipping."
                    />
                  </StaggerItem>
                  <StaggerItem>
                    <BenefitCard
                      icon={<Eye className="h-8 w-8 text-primary" />}
                      title="transparent"
                      description="Track item history, understand your impact, and shop consciously."
                    />
                  </StaggerItem>
                  <StaggerItem>
                    <BenefitCard
                      icon={<Heart className="h-8 w-8 text-brand-lavender" />}
                      title="community"
                      description="A space to share your outfits, explore diverse expressions of style, and connect through mutual inspiration."
                    />
                  </StaggerItem>
                </StaggerContainer>
              </div>
            </div>
          </div>
        </section>

        {/* App Experience */}
        <section className="py-16 md:py-20 bg-gradient-to-b from-white to-brand-ivory">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <FadeIn direction="up">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium mb-6 leading-tight">
                  let&apos;s <span className="text-primary">bloem</span>
                </h2>
              </FadeIn>
              <FadeIn delay={0.1} direction="up">
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  Redefining circular fashion—smarter, easier, and powered by community.
                </p>
              </FadeIn>
            </div>

            <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8" staggerDelay={0.15}>
              {/* Card 1: Digital Closet */}
              <StaggerItem>
                <Card className="bg-card border border-gray-100 shadow-md overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300 h-full">
                  <CardContent className="p-0 h-full flex flex-col">
                    <div className="p-6">
                      <h3 className="text-xl font-semibold mb-2 leading-snug">digital closet</h3>
                      <p className="text-muted-foreground mb-4 leading-relaxed">
                        Easily organize, manage, and track your wardrobe with AI-powered tools.
                      </p>
                    </div>
                    
                    <div className="px-6 pb-6 mt-auto">
                      <div className="bg-gray-100 rounded-lg p-2 mb-6">
                        <div className="aspect-[9/16] w-full overflow-hidden rounded-md bg-white shadow-inner">
                          <Image
                            src="/assets/images/styling-assist.png"
                            alt="digital closet"
                            width={300}
                            height={533}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>

              {/* Card 2: Outfit of the Day */}
              <StaggerItem>
                <Card className="bg-card border border-gray-100 shadow-md overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300 h-full">
                  <CardContent className="p-0 h-full flex flex-col">
                    <div className="p-6">
                      <h3 className="text-xl font-semibold mb-2 leading-snug">outfit-of-the-day</h3>
                      <p className="text-muted-foreground mb-4 leading-relaxed">
                        Snap your OOTD, grow your closet, and inspire others.
                      </p>
                    </div>
                    
                    <div className="px-6 pb-6 mt-auto">
                      <div className="bg-gray-100 rounded-lg p-2 mb-6">
                        <div className="aspect-[9/16] w-full overflow-hidden rounded-md bg-white shadow-inner">
                          <Image
                            src="/assets/images/OOTD.png"
                            alt="outfit of the day"
                            width={300}
                            height={533}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>

              {/* Card 3: Community Feed */}
              <StaggerItem>
                <Card className="bg-card border border-gray-100 shadow-md overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300 h-full">
                  <CardContent className="p-0 h-full flex flex-col">
                    <div className="p-6">
                      <h3 className="text-xl font-semibold mb-2 leading-snug">community feed</h3>
                      <p className="text-muted-foreground mb-4 leading-relaxed">
                        Explore outfits, follow bloemers, and discover pieces you love.
                      </p>
                    </div>
                    
                    <div className="px-6 pb-6 mt-auto">
                      <div className="bg-gray-100 rounded-lg p-2 mb-6">
                        <div className="aspect-[9/16] w-full overflow-hidden rounded-md bg-white shadow-inner">
                          <Image
                            src="/assets/images/item-discover.png"
                            alt="community feed"
                            width={300}
                            height={533}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            </StaggerContainer>
          </div>
        </section>

        {/* Social Proof - Testimonials */}
        <section className="py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <FadeIn direction="up">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium mb-6 leading-tight">
                  making a difference together
                </h2>
              </FadeIn>
              <FadeIn delay={0.1} direction="up">
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  See how our community is creating a more sustainable future for fashion, one shared item at a time.
                </p>
              </FadeIn>
            </div>

            <div>
              <FadeIn delay={0.2} direction="up">
                <h3 className="text-2xl md:text-3xl font-bold text-center mb-10 leading-snug">
                  what early <span className="text-primary">bloemers</span> say
                </h3>
              </FadeIn>
              <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6" staggerDelay={0.1}>
                {/* Testimonial 1 */}
                <StaggerItem>
                  <Card className="bg-card border border-gray-100 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 h-full">
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="mb-4">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className="text-primary">★</span>
                        ))}
                      </div>
                      <p className="italic mb-6 text-muted-foreground leading-relaxed flex-grow">
                        &quot;I love that bloem is a young, fun community with a meaningful purpose, namely real action towards a circular fashion economy.&quot;
                      </p>
                      <p className="font-medium text-right">— Nina Pearson</p>
                    </CardContent>
                  </Card>
                </StaggerItem>

                {/* Testimonial 2 */}
                <StaggerItem>
                  <Card className="bg-card border border-gray-100 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 h-full">
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="mb-4">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className="text-primary">★</span>
                        ))}
                      </div>
                      <p className="italic mb-6 text-muted-foreground leading-relaxed flex-grow">
                        &quot;I Believe we can all be Conscious consumers and we are at a point that we need to be Allies to our world to protect our Environment and ecosystems in any way we can.&quot;
                      </p>
                      <p className="font-medium text-right">— Laura Vidal</p>
                    </CardContent>
                  </Card>
                </StaggerItem>

                {/* Testimonial 3 */}
                <StaggerItem>
                  <Card className="bg-card border border-gray-100 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 h-full">
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="mb-4">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className="text-primary">★</span>
                        ))}
                      </div>
                      <p className="italic mb-6 text-muted-foreground leading-relaxed flex-grow">
                        &quot;I am beyond excited about the launch of this incredible platform- a digital wardrobe! In a world where the fashion industry moves at breakneck speed, this concept feels like a breath of fresh air.&quot;
                      </p>
                      <p className="font-medium text-right">— Melissa Wiss</p>
                    </CardContent>
                  </Card>
                </StaggerItem>
              </StaggerContainer>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 md:py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <FadeIn direction="up">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium mb-6 leading-tight">
                  frequently asked questions
                </h2>
              </FadeIn>
              <FadeIn delay={0.1} direction="up">
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  Everything you need to know about bloem and how it works.
                </p>
              </FadeIn>
            </div>

            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="w-full space-y-4">
                <AccordionItem value="item-1" className="border rounded-xl px-6 bg-card hover:shadow-md transition-shadow">
                  <AccordionTrigger className="text-left font-semibold hover:text-primary hover:no-underline py-5">
                    What is bloem?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                    bloem is a circular fashion platform that bridges digital and physical reselling. We combine a digital wardrobe app with physical self-serve racks in high-traffic locations, making it easy to buy and sell preloved fashion in your community without the hassle of shipping, packaging, or coordinating meetups.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border rounded-xl px-6 bg-card hover:shadow-md transition-shadow">
                  <AccordionTrigger className="text-left font-semibold hover:text-primary hover:no-underline py-5">
                    How does the digital wardrobe work?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                    Our AI-powered digital wardrobe helps you quickly upload and organize your clothing items. Simply take photos of your pieces, and our system assists with categorization and management. You can display your personal style, prepare items for selling, or just keep track of your wardrobe digitally.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border rounded-xl px-6 bg-card hover:shadow-md transition-shadow">
                  <AccordionTrigger className="text-left font-semibold hover:text-primary hover:no-underline py-5">
                    How do the physical racks work?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                    Our physical racks are located in high-traffic spots throughout your community. To sell items, you rent hangers, hang your clothes on the rack, and link them using QR codes. Buyers can browse items in person, check details on the app, and purchase directly. You can track interest and sales in real-time through the app.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border rounded-xl px-6 bg-card hover:shadow-md transition-shadow">
                  <AccordionTrigger className="text-left font-semibold hover:text-primary hover:no-underline py-5">
                    How much does it cost?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                    Creating a bloem account and building your digital wardrobe is completely free. When you&apos;re ready to sell items at a pop-up market, you&apos;ll rent hangers at the rack location. Pricing varies by market - check individual market details for specific hanger rental costs.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" className="border rounded-xl px-6 bg-card hover:shadow-md transition-shadow">
                  <AccordionTrigger className="text-left font-semibold hover:text-primary hover:no-underline py-5">
                    Where can I find bloem racks?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                    bloem racks are set up at pop-up markets in various high-traffic locations. Check the &quot;Locations&quot; page in the app to find upcoming markets near you, view available rack spaces, and see when markets are open. We&apos;re constantly expanding to new communities!
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6" className="border rounded-xl px-6 bg-card hover:shadow-md transition-shadow">
                  <AccordionTrigger className="text-left font-semibold hover:text-primary hover:no-underline py-5">
                    Is bloem really sustainable?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                    Absolutely! By keeping clothes in circulation and out of landfills, bloem fights fashion waste at its core. Every item resold through our platform reduces the need for new production, saving water, reducing CO₂ emissions, and preventing textile waste. Plus, our local model eliminates shipping emissions associated with online resale.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7" className="border rounded-xl px-6 bg-card hover:shadow-md transition-shadow">
                  <AccordionTrigger className="text-left font-semibold hover:text-primary hover:no-underline py-5">
                    How does the community feature work?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                    The bloem community lets you follow other bloemers, discover their wardrobes, get personalized recommendations, and share your own style through outfit-of-the-day posts. It&apos;s a space to find inspiration, connect with like-minded fashion lovers, and learn the stories behind each piece.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-8" className="border rounded-xl px-6 bg-card hover:shadow-md transition-shadow">
                  <AccordionTrigger className="text-left font-semibold hover:text-primary hover:no-underline py-5">
                    Can I try items before buying?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                    Yes! One of the biggest advantages of bloem&apos;s physical racks is that you can see, touch, and try on items in person before purchasing. This eliminates the uncertainty of online shopping and ensures you only buy pieces you truly love and that fit perfectly.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        {!user && (
          <section className="py-16 md:py-20 bg-primary">
            <div className="container mx-auto px-4">
              <FadeIn direction="up">
                <div className="max-w-4xl mx-auto">
                  <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl">
                    <div className="text-center">
                      <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium text-primary mb-6 leading-tight">
                        ready to <span className="text-brand-accent">bloem</span>?
                      </h2>
                      <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                        Start your sustainable fashion journey today. Create your digital wardrobe and connect with your local community.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Button asChild variant="default" size="lg" className="text-lg shadow-lg w-full sm:w-auto hover:scale-105 transition-transform">
                          <Link href="/auth/sign-up">Get Started Free</Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="text-lg w-full sm:w-auto hover:scale-105 transition-transform">
                          <Link href="#how-it-works">Learn More</Link>
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-6 leading-relaxed">
                        No credit card required • Free forever • Join 80+ early bloemers
                      </p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 pt-12 pb-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8">
            {/* Brand Column */}
            <div className="md:col-span-2">
              <Link href="/" className="inline-block mb-4">
                <span className="font-bold text-primary text-2xl">bloem</span>
              </Link>
              <p className="text-muted-foreground mb-4 max-w-md">
                Revolutionizing sustainable fashion through our innovative digital wardrobe and physical rack exchange system.
              </p>
              <div className="flex space-x-4">
                <a 
                  href="https://www.instagram.com/letsbloem/?hl=en" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-brand-lavender/20 flex items-center justify-center text-primary hover:bg-brand-lavender/40 transition-colors"
                >
                  <Instagram size={20} />
                </a>
                <a 
                  href="https://www.linkedin.com/company/bloemcircularfashion" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-brand-lavender/20 flex items-center justify-center text-primary hover:bg-brand-lavender/40 transition-colors"
                >
                  <Linkedin size={20} />
                </a>
                <a 
                  href="mailto:hello@letsbloem.com"
                  className="w-10 h-10 rounded-full bg-brand-lavender/20 flex items-center justify-center text-primary hover:bg-brand-lavender/40 transition-colors"
                >
                  <Mail size={20} />
                </a>
              </div>
            </div>
            
            {/* Discover Column */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Discover</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#how-it-works" className="text-muted-foreground hover:text-primary transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <Link href="/markets" className="text-muted-foreground hover:text-primary transition-colors">
                    Locations
                  </Link>
                </li>
                <li>
                  <a href="#together-we-bloem" className="text-muted-foreground hover:text-primary transition-colors">
                    Our Mission
                  </a>
                </li>
                <li>
                  <a href="#what-bloem-stands-for" className="text-muted-foreground hover:text-primary transition-colors">
                    Sustainability
                  </a>
                </li>
              </ul>
            </div>
            
            {/* Company Column */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Company</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    Partners
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    Press
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => setIsContactOpen(true)}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Contact
                  </button>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="pt-8 border-t border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-muted-foreground text-sm">
                © {new Date().getFullYear()} bloem. All rights reserved.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <Link href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                  Privacy Policy
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                  Terms of Service
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                  Cookies
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Contact Dialog */}
      <ContactDialog open={isContactOpen} onOpenChange={setIsContactOpen} />
    </div>
  );
}

