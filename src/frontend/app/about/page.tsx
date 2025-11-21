import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUserServer } from "@/lib/auth/utils";
import { Leaf, Zap, Eye, Heart, Users, Globe, Recycle, Mail, Instagram, Linkedin } from "lucide-react";

interface ValueCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function ValueCard({ icon, title, description }: ValueCardProps) {
  return (
    <div className="flex flex-col items-center text-center p-6">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

interface ImpactCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function ImpactCard({ icon, title, description }: ImpactCardProps) {
  return (
    <Card className="bg-card border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full bg-brand-accent/20 flex items-center justify-center mb-4">
          {icon}
        </div>
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export default async function AboutPage() {
  const user = await getCurrentUserServer();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Image
              src="/assets/images/logo-transparent.png"
              alt="Bloem"
              width={140}
              height={40}
              className="h-9 md:h-11 w-auto"
              priority
            />
          </Link>
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
        {/* Hero Section */}
        <section className="pt-12 pb-8 md:pt-16 md:pb-10 bg-gradient-to-b from-brand-lavender/10 to-white relative overflow-hidden">
          <div className="container mx-auto px-2">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-primary mb-2">
                together we <span className="text-brand-accent">bloem</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground">
                We&apos;re on a mission to make circular fashion accessible, engaging, and community-focused—one shared item at a time.
              </p>
            </div>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="py-8 md:py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
              {/* Image */}
              <div className="lg:w-1/2">
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-lg">
                  <Image
                    src="/assets/images/Intro-pic.png"
                    alt="Bloem community"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="lg:w-1/2">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-primary mb-4">
                  our story
                </h2>
                <div className="space-y-3 text-muted-foreground text-lg">
                  <p>
                    Bloem was born from a simple belief: fashion should be circular, not disposable. We saw the growing mountain of textile waste and the disconnect between people who want to buy and sell preloved clothing.
                  </p>
                  <p>
                    Online resale platforms are cluttered with endless scrolling, shipping hassles, and uncertainty about quality. In-person flea markets require coordinating meetups and dealing with cash transactions. We knew there had to be a better way.
                  </p>
                  <p>
                    So we created bloem—a platform that bridges the gap between digital convenience and physical shopping. By combining a digital wardrobe app with self-serve racks at pop-up markets, we&apos;re making it easier than ever to keep clothes in circulation and out of landfills.
                  </p>
                  <p className="font-semibold text-primary">
                    Our vision is a world where every piece of clothing lives multiple lives, where community replaces consumption, and where sustainable fashion is the norm, not the exception.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Meet the Team Section */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4">
                meet the <span className="text-primary">team</span>
              </h2>
              <p className="text-base md:text-lg text-muted-foreground">
                The passionate people behind bloem, working to make circular fashion a reality.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Team Member 1 - Sophia */}
              <div className="bg-white rounded-3xl p-8 shadow-md hover:shadow-lg transition-shadow">
                {/* Photo */}
                <div className="relative w-48 h-48 mx-auto mb-6 rounded-xl overflow-hidden bg-gray-100">
                  {/* Replace '/assets/images/team/sophia.jpg' with actual image path */}
                  <Image
                    src="/assets/images/team/sophia.jpg"
                    alt="Sophia Haas - Founder"
                    fill
                    className="object-cover grayscale"
                  />
                </div>
                
                {/* Info */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-1 uppercase tracking-tight">Sophia Haas</h3>
                  <p className="text-primary font-medium text-sm mb-4">Founder</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    [Add bio and role description here]
                  </p>
                </div>

                {/* Social Links */}
                <div className="flex justify-center gap-4">
                  <a 
                    href="https://www.linkedin.com/in/sophia-haas" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Linkedin size={20} />
                  </a>
                  <a 
                    href="https://www.instagram.com/sophdagostino" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Instagram size={20} />
                  </a>
                  <a 
                    href="mailto:xxx@xxx.com"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Mail size={20} />
                  </a>
                </div>
              </div>

              {/* Team Member 2 - Yuqing */}
              <div className="bg-white rounded-3xl p-8 shadow-md hover:shadow-lg transition-shadow">
                {/* Photo */}
                <div className="relative w-48 h-48 mx-auto mb-6 rounded-xl overflow-hidden bg-gray-100">
                  {/* Replace '/assets/images/team/yuqing.jpg' with actual image path */}
                  <Image
                    src="/assets/images/team/yuqing.jpg"
                    alt="Yuqing Huang - Software Engineer"
                    fill
                    className="object-cover grayscale"
                  />
                </div>
                
                {/* Info */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-1 uppercase tracking-tight">Yuqing Huang</h3>
                  <p className="text-primary font-medium text-sm mb-4">Software Engineer</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Master&apos;s graduate from University of Zurich in Informatik, focusing on data science and human-centered design. Combines technical development with clear storytelling to build digital products that are intuitive, transparent, and useful in everyday life.
                  </p>
                </div>

                {/* Social Links */}
                <div className="flex justify-center gap-4">
                  <a 
                    href="https://linkedin.com/in/yuqing-huang-8309a61a2 " 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Linkedin size={20} />
                  </a>
                  <a 
                    href="https://www.instagram.com/darlene_qyh" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Instagram size={20} />
                  </a>
                  <a 
                    href="mailto:yuqing.h99@icloud.com"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Mail size={20} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Values Section */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4">
                what <span className="text-primary">bloem</span> stands for
              </h2>
              <p className="text-base md:text-lg text-muted-foreground">
                Our values guide everything we do—from the technology we build to the communities we serve.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <ValueCard
                icon={<Leaf className="h-8 w-8 text-brand-accent" />}
                title="resourceful"
                description="Fight fashion waste by keeping clothes in circulation and out of landfills."
              />
              <ValueCard
                icon={<Zap className="h-8 w-8 text-primary" />}
                title="convenient"
                description="Exchange items on your schedule with no need to coordinate meetups or shipping."
              />
              <ValueCard
                icon={<Eye className="h-8 w-8 text-primary" />}
                title="transparent"
                description="Track item history, understand your impact, and shop consciously."
              />
              <ValueCard
                icon={<Heart className="h-8 w-8 text-brand-lavender" />}
                title="community"
                description="A space to share your outfits, explore diverse expressions of style, and connect through mutual inspiration."
              />
            </div>
          </div>
        </section>

        {/* Our Impact Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-white to-brand-lavender/10">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4">
                our <span className="text-primary">impact</span>
              </h2>
              <p className="text-base md:text-lg text-muted-foreground">
                Together, we&apos;re creating meaningful change in the fashion industry.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <ImpactCard
                icon={<Users className="h-8 w-8 text-brand-accent" />}
                title="80+"
                description="Early bloemers ready to make a difference"
              />
              <ImpactCard
                icon={<Recycle className="h-8 w-8 text-brand-accent" />}
                title="circular"
                description="Every item sold extends clothing lifecycle"
              />
              <ImpactCard
                icon={<Globe className="h-8 w-8 text-brand-accent" />}
                title="local"
                description="Zero shipping emissions with community-based model"
              />
            </div>

            <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="md:w-1/3">
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden">
                    <Image
                      src="/assets/images/sustainable-fashion.png"
                      alt="Sustainable fashion impact"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className="md:w-2/3">
                  <h3 className="text-2xl font-bold mb-4 text-primary">Every item matters</h3>
                  <p className="text-muted-foreground text-lg mb-4">
                    The fashion industry is one of the world&apos;s largest polluters. By choosing to buy and sell preloved clothing through Bloem, you&apos;re actively reducing:
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start">
                      <span className="text-brand-accent mr-2">✓</span>
                      <span>Water consumption from new clothing production</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-brand-accent mr-2">✓</span>
                      <span>CO₂ emissions from manufacturing and shipping</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-brand-accent mr-2">✓</span>
                      <span>Textile waste ending up in landfills</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-brand-accent mr-2">✓</span>
                      <span>Demand for fast fashion production</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How We Work Section */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4">
                how we <span className="text-primary">work</span>
              </h2>
              <p className="text-base md:text-lg text-muted-foreground">
                We bridge the gap between digital convenience and physical shopping.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="space-y-8">
                  <div>
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-brand-lavender flex items-center justify-center flex-shrink-0">
                        <span className="text-xl font-bold text-white">1</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2">Digital Wardrobe</h3>
                        <p className="text-muted-foreground">
                          Use our AI-powered app to quickly digitize your closet. Upload items, set prices, and manage your inventory—all from your phone.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-brand-lavender flex items-center justify-center flex-shrink-0">
                        <span className="text-xl font-bold text-white">2</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2">Pop-up Markets</h3>
                        <p className="text-muted-foreground">
                          We set up self-serve racks at high-traffic locations for limited-time markets. No permanent store needed—just community spaces where people already gather.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-brand-lavender flex items-center justify-center flex-shrink-0">
                        <span className="text-xl font-bold text-white">3</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2">QR Code Magic</h3>
                        <p className="text-muted-foreground">
                          Link your items to hangers with QR codes. Buyers scan to see details, purchase instantly, and take the item home—no waiting, no shipping.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-brand-lavender flex items-center justify-center flex-shrink-0">
                        <span className="text-xl font-bold text-white">4</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2">Community Connection</h3>
                        <p className="text-muted-foreground">
                          Follow other bloemers, discover their style, share outfit inspiration, and build a local community around sustainable fashion.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-lg">
                  <Image
                    src="/assets/images/rack-display.png"
                    alt="Bloem physical racks"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Join the Movement Section */}
        <section className="py-16 md:py-24 bg-primary">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-3xl p-8 md:p-12 lg:p-16 shadow-2xl">
                <div className="text-center">
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-primary mb-4 md:mb-6">
                    join the <span className="text-brand-accent">movement</span>
                  </h2>
                  <p className="text-lg md:text-xl text-muted-foreground mb-8 md:mb-10 max-w-2xl mx-auto">
                    Whether you&apos;re a fashion lover, sustainability advocate, or just curious about circular fashion—there&apos;s a place for you in the Bloem community.
                  </p>
                  
                  <div className="space-y-6 mb-8">
                    <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                      {user ? (
                        <Button asChild variant="default" size="lg" className="text-lg shadow-lg w-full sm:w-auto">
                          <Link href="/wardrobe">Go to Your Wardrobe</Link>
                        </Button>
                      ) : (
                        <>
                          <Button asChild variant="default" size="lg" className="text-lg shadow-lg w-full sm:w-auto">
                            <Link href="/auth/sign-up">Get Started Free</Link>
                          </Button>
                          <Button asChild variant="outline" size="lg" className="text-lg w-full sm:w-auto">
                            <Link href="/">Learn More</Link>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-8 mt-8">
                    <h3 className="text-xl font-bold mb-4">Interested in partnering with us?</h3>
                    <p className="text-muted-foreground mb-6">
                      We&apos;re always looking for venues, brands, and organizations that share our vision for circular fashion.
                    </p>
                    <Button asChild variant="outline" size="lg">
                      <a href="mailto:hello@letsbloem.com">Get in Touch</a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 pt-16 pb-8">
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
                  <Link href="/#how-it-works" className="text-muted-foreground hover:text-primary transition-colors">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="/markets" className="text-muted-foreground hover:text-primary transition-colors">
                    Locations
                  </Link>
                </li>
                <li>
                  <Link href="/#together-we-bloem" className="text-muted-foreground hover:text-primary transition-colors">
                    Our Mission
                  </Link>
                </li>
                <li>
                  <Link href="/#what-bloem-stands-for" className="text-muted-foreground hover:text-primary transition-colors">
                    Sustainability
                  </Link>
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
                  <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
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
    </div>
  );
}

