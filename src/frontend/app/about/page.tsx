import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { getCurrentUserServer } from "@/lib/auth/utils";
import { Leaf, Zap, Eye, Heart, Globe, Mail, Instagram, Linkedin } from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/motion";
import CurvedLoop from "@/components/ui/CurvedLoop";

interface MemberCardProps {
  name: string;
  role: string;
  bio: string;
  imageSrc: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  email?: string;
}

function MemberCard({ name, role, bio, imageSrc, linkedinUrl, instagramUrl, email }: MemberCardProps) {
  return (
    <div className="w-[400px] h-[400px] bg-white rounded-[32px] p-[3px] relative shadow-[0_70px_30px_-50px_rgba(0,0,0,0.1)] transition-all duration-500 ease-in-out hover:rounded-tl-[55px] group mx-auto">
      {/* Mail Button - Always visible */}
      <div className="absolute right-8 top-6 z-0 transition-colors duration-300">
         {email && (
            <a href={`mailto:${email}`} className="text-brand-lavender hover:text-brand-purple transition-colors">
               <Mail size={24} strokeWidth={2.5} />
            </a>
         )}
      </div>

      {/* Profile Picture - Shrinks and moves on hover */}
      <div className="absolute top-[3px] left-[3px] w-[calc(100%-6px)] h-[calc(100%-6px)] rounded-[29px] z-10 overflow-hidden transition-all duration-500 ease-in-out delay-200 bg-gray-100 group-hover:w-[150px] group-hover:h-[150px] group-hover:top-[10px] group-hover:left-[10px] group-hover:rounded-full group-hover:z-30 group-hover:border-[7px] group-hover:border-brand-lavender group-hover:shadow-md group-hover:delay-0">
         <Image
           src={imageSrc}
           alt={name}
           fill
           className="object-cover transition-all duration-500 ease-in-out group-hover:scale-110"
         />
      </div>

      {/* Bottom Card - Slides up on hover */}
      <div className="absolute bottom-[3px] left-[3px] right-[3px] top-[calc(100%-60px)] bg-brand-lavender rounded-[29px] z-20 overflow-hidden transition-all duration-500 cubic-bezier(0.645,0.045,0.355,1) shadow-[rgba(96,75,74,0.1882352941)_0px_5px_5px_0px_inset] group-hover:top-[80px] group-hover:rounded-[80px_29px_29px_29px] group-hover:delay-200">
          {/* Content */}
          <div className="absolute bottom-0 left-6 right-6 top-0 flex flex-col justify-end pb-20">
              <h3 className="text-2xl font-bold text-white leading-tight">{name}</h3>
              <p className="text-white/80 mt-4 text-sm leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-300">
                {bio}
              </p>
          </div>

          {/* Bottom Actions - Always visible */}
          <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between transition-opacity duration-300">
              <div className="flex gap-3">
                  {linkedinUrl && (
                    <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white hover:scale-110 transition-all">
                      <Linkedin size={18} />
                    </a>
                  )}
                  {instagramUrl && (
                    <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white hover:scale-110 transition-all">
                      <Instagram size={18} />
                    </a>
                  )}
              </div>
              <span className="text-white/90 text-s font-bold uppercase tracking-wider">
                 {role}
              </span>
          </div>
      </div>
    </div>
  );
}

export default async function AboutPage() {
  const user = await getCurrentUserServer();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Image
              src="/assets/images/brand-transparent.png"
              alt="Bloem"
              width={140}
              height={40}
              className="h-9 md:h-11 w-auto"
              priority
            />
          </Link>
          {!user && (
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" size="sm" className="font-medium">
                <Link href="/auth/sign-in">Sign In</Link>
              </Button>
              <Button asChild variant="default" size="sm" className="hidden sm:inline-flex font-medium">
                <Link href="/auth/sign-up">Get Started</Link>
              </Button>
            </div>
          )}
        </div>
      </header>

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
        <section className="pt-8 pb-20 md:pt-8 md:pb-24 bg-brand-ivory relative overflow-hidden">
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
                  <div className="space-y-6 text-muted-foreground text-lg leading-relaxed mb-10">
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
              <div className="lg:w-1/2 h-full min-h-[400px] flex items-center justify-center">
                <div className="grid grid-cols-3 gap-4 h-full w-full max-w-lg">
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
                  bio="[Add bio and role description here]"
                  imageSrc="/assets/images/team/sophia.jpg"
                  linkedinUrl="https://www.linkedin.com/in/sophia-haas"
                  instagramUrl="https://www.instagram.com/sophdagostino"
                  email="xxx@xxx.com"
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

      {/* Footer */}
      <footer className="bg-gray-50 pt-16 pb-8 border-t border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12">
            {/* Brand Column */}
            <div className="md:col-span-2">
              <Link href="/" className="inline-block mb-6 group">
                <span className="font-bold text-primary text-3xl group-hover:text-brand-purple transition-colors">bloem</span>
              </Link>
              <p className="text-muted-foreground mb-6 max-w-md leading-relaxed">
                Revolutionizing sustainable fashion through our innovative digital wardrobe and physical rack exchange system.
              </p>
              <div className="flex space-x-4">
                <a 
                  href="https://www.instagram.com/letsbloem/?hl=en" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full bg-brand-lavender/20 flex items-center justify-center text-primary hover:bg-brand-lavender hover:text-white hover:-translate-y-1 transition-all duration-300"
                >
                  <Instagram size={22} />
                </a>
                <a 
                  href="https://www.linkedin.com/company/bloemcircularfashion" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full bg-brand-lavender/20 flex items-center justify-center text-primary hover:bg-brand-lavender hover:text-white hover:-translate-y-1 transition-all duration-300"
                >
                  <Linkedin size={22} />
                </a>
                <a 
                  href="mailto:hello@letsbloem.com"
                  className="w-12 h-12 rounded-full bg-brand-lavender/20 flex items-center justify-center text-primary hover:bg-brand-lavender hover:text-white hover:-translate-y-1 transition-all duration-300"
                >
                  <Mail size={22} />
                </a>
              </div>
            </div>
            
            {/* Discover Column */}
            <div>
              <h3 className="font-semibold text-foreground mb-6 text-lg">Discover</h3>
              <ul className="space-y-4">
                <li>
                  <Link href="/#how-it-works" className="text-muted-foreground hover:text-primary transition-colors hover:pl-2 inline-block">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="/markets" className="text-muted-foreground hover:text-primary transition-colors hover:pl-2 inline-block">
                    Locations
                  </Link>
                </li>
                <li>
                  <Link href="/#together-we-bloem" className="text-muted-foreground hover:text-primary transition-colors hover:pl-2 inline-block">
                    Our Mission
                  </Link>
                </li>
                <li>
                  <Link href="/#what-bloem-stands-for" className="text-muted-foreground hover:text-primary transition-colors hover:pl-2 inline-block">
                    Sustainability
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Company Column */}
            <div>
              <h3 className="font-semibold text-foreground mb-6 text-lg">Company</h3>
              <ul className="space-y-4">
                <li>
                  <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors hover:pl-2 inline-block">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-primary transition-colors hover:pl-2 inline-block">
                    Partners
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-primary transition-colors hover:pl-2 inline-block">
                    Press
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-primary transition-colors hover:pl-2 inline-block">
                    Contact
                  </Link>
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
              <div className="flex space-x-8 mt-4 md:mt-0">
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
    </div>
  );
}
