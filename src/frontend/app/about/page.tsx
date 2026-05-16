import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/layout/public-header";
import { Footer } from "@/components/layout/footer";
import { MemberCard } from "@/components/about/member-card";
import { InstagramEmbed } from "@/components/about/instagram-embed";
import { getCurrentUserServer } from "@/lib/auth/utils";
import { INSTAGRAM_REEL_EMBED_HTML } from "@/lib/constants/instagram-embeds";
import { Leaf, Zap, Eye, Heart, Globe } from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/motion";
import CurvedLoop from "@/components/ui/CurvedLoop";

export default async function AboutPage() {
  const user = await getCurrentUserServer();

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader user={user} sticky variant="transparent" />

      <main>
        {/* Hero Section */}
        <section className="relative h-[40vh] min-h-[400px] flex items-center justify-center overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/assets/images/sustainable-fashion.png"
              alt="Sustainable Fashion"
              fill
              className="object-cover brightness-[0.6]"
              priority
            />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center text-white">
              <FadeIn>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-medium mb-6 leading-tight">
                  empowering community.<br />
                  nourishing <span className="text-brand-accent">style.</span>
                </h1>
              </FadeIn>
              <FadeIn delay={0.2}>
                <p className="text-xl md:text-2xl text-white/90 leading-relaxed max-w-2xl mx-auto">
                  We&apos;re on a mission to make circular fashion accessible, engaging, and community-focused—one shared item at a time.
                </p>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* Curved Text Loop */}
        <section className="py-12 bg-brand-ivory overflow-hidden border-t border-white/50">
          <CurvedLoop 
            marqueeText="circular ✦ digital ✦ fashion ✦ with ✦ bloem ✦ "
            speed={1.5}
            curveAmount={80}
            direction="left"
            className="text-brand-purple/50"
          />
        </section>

        {/* Our Story Section */}
        <section className="pt-8 pb-16 md:pt-8 md:pb-24 bg-brand-ivory relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#6B22B1_1px,transparent_1px)] [background-size:20px_20px]" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-12">
              <FadeIn>
                <h2 className="text-3xl font-medium text-primary inline-block relative pb-2">
                  our story
                  <span className="absolute bottom-0 left-0 w-full h-1 bg-brand-accent rounded-full"></span>
                </h2>
              </FadeIn>
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-16">
              {/* Content */}
              <div className="lg:w-1/2">
                <FadeIn direction="right">
                  <p className="text-2xl md:text-3xl font-medium text-foreground mb-8 leading-snug">
                    &quot;Born out of a belief that fashion should be circular, not disposable. bloem connects closets directly to communities.&quot;
                  </p>
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

              {/* Image Collage */}
              <div className="lg:w-1/2 flex items-center justify-center mt-6 lg:mt-0">
                <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
                  <div className="col-span-1 pt-12">
                    <div className="relative aspect-[2/3] rounded-[2rem] overflow-hidden shadow-lg transform rotate-[-2deg] hover:rotate-0 transition-all duration-500">
                      <Image
                        src="/assets/images/Intro-pic.png"
                        alt="Story 1"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div className="col-span-1">
                    <div className="relative aspect-[2/3] rounded-[2rem] overflow-hidden shadow-xl z-10 transform hover:scale-105 transition-all duration-500">
                      <Image
                        src="/assets/images/rack-display.png"
                        alt="Story 2"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div className="col-span-1 pt-24">
                    <div className="relative aspect-[2/3] rounded-[2rem] overflow-hidden shadow-lg transform rotate-[2deg] hover:rotate-0 transition-all duration-500">
                      <Image
                        src="/assets/images/styling-assist.png"
                        alt="Story 3"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Previous Event Section - Instagram Reel */}
        <section className="pt-16 md:pt-24 bg-white relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <FadeIn direction="up">
                <p className="text-sm font-bold tracking-widest text-muted-foreground uppercase mb-3">Our Events</p>
                <h2 className="text-3xl md:text-4xl font-medium text-primary">
                  See Us in Action
                </h2>
              </FadeIn>
            </div>

            <div className="flex justify-center max-w-2xl mx-auto">
              <FadeIn delay={0.2}>
                <InstagramEmbed
                  embedHtml={INSTAGRAM_REEL_EMBED_HTML}
                  className="w-full"
                />
              </FadeIn>
            </div>
          </div>
        </section>

        {/* Identity, Vision & Values Section */}
        <section className="py-20 md:py-32 bg-white relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <FadeIn direction="up">
                <p className="text-sm font-bold tracking-widest text-muted-foreground uppercase mb-3">About Us</p>
                <h2 className="text-4xl md:text-5xl font-medium text-primary">
                  Our Identity, Vision and Values
                </h2>
              </FadeIn>
            </div>

            <div className="max-w-5xl mx-auto relative">
              {/* Values Bar (Floating Top) */}
              <div className="relative z-20 -mb-10 mx-4">
                <FadeIn direction="down">
                  <div className="bg-primary rounded-[2.5rem] p-8 md:p-10 shadow-2xl text-white flex flex-wrap justify-around gap-8 md:gap-12">
                    <div className="flex flex-col items-center text-center gap-3">
                      <Leaf className="w-8 h-8 text-brand-accent" />
                      <span className="font-medium text-sm md:text-base">Sustainability</span>
                    </div>
                    <div className="flex flex-col items-center text-center gap-3">
                      <Heart className="w-8 h-8 text-brand-accent" />
                      <span className="font-medium text-sm md:text-base">Community</span>
                    </div>
                    <div className="flex flex-col items-center text-center gap-3">
                      <Eye className="w-8 h-8 text-brand-accent" />
                      <span className="font-medium text-sm md:text-base">Transparency</span>
                    </div>
                    <div className="flex flex-col items-center text-center gap-3">
                      <Zap className="w-8 h-8 text-brand-accent" />
                      <span className="font-medium text-sm md:text-base">Convenience</span>
                    </div>
                  </div>
                </FadeIn>
              </div>

              {/* Vision & Mission Card (Bottom) */}
              <div className="relative z-10 pt-20 pb-12 px-8 md:px-16 bg-brand-ivory rounded-[3rem] shadow-lg">
                <FadeIn delay={0.2}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:divide-x md:divide-gray-200">
                    {/* Vision */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Eye className="w-6 h-6 text-primary" />
                        <h3 className="text-2xl font-medium text-primary">Vision</h3>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        A world where every piece of clothing lives multiple lives, where community replaces consumption, and where sustainable fashion is the norm, not the exception.
                      </p>
                    </div>

                    {/* Mission */}
                    <div className="space-y-4 md:pl-12">
                      <div className="flex items-center gap-3 mb-2">
                        <Globe className="w-6 h-6 text-primary" />
                        <h3 className="text-2xl font-medium text-primary">Mission</h3>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        To source, deliver, and inspire access to the freshest circular fashion with integrity, innovation, and heart. Empowering local communities to reduce waste together.
                      </p>
                    </div>
                  </div>
                </FadeIn>
              </div>
            </div>
          </div>
        </section>

        {/* Meet the Team Section */}
        <section className="py-20 bg-brand-ivory">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <FadeIn direction="up">
                <p className="text-sm font-bold tracking-widest text-muted-foreground uppercase mb-3">Meet Our Team</p>
                <h2 className="text-4xl font-medium text-primary">
                  Our Team
                </h2>
              </FadeIn>
            </div>

            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
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
                  imageSrc="/assets/images/team/yuqing.jpg"
                  linkedinUrl="https://linkedin.com/in/yuqing-huang-8309a61a2"
                  instagramUrl="https://www.instagram.com/darlene_qyh"
                  email="yuqing.h99@icloud.com"
                />
              </StaggerItem>
            </StaggerContainer>
          </div>
        </section>

        {/* Join the Movement / Footer Callout */}
        <section className="py-20 bg-primary text-white relative overflow-hidden">
           <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
           <div className="container mx-auto px-4 relative z-10 text-center">
             <h2 className="text-4xl md:text-5xl font-medium mb-8">Ready to join the movement?</h2>
             <Button asChild variant="secondary" size="lg" className="rounded-full px-10 h-14 text-lg font-medium bg-brand-accent text-primary hover:bg-white hover:text-primary transition-colors">
               <Link href="/auth/sign-up">Get Started Today</Link>
             </Button>
           </div>
        </section>
      </main>

      <Footer variant="about" />
    </div>
  );
}
