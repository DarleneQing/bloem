import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/features/auth/queries";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Image
            src="/assets/images/logo-transparent.png"
            alt="Bloem"
            width={140}
            height={40}
            className="h-9 md:h-11 w-auto"
            priority
          />
          {!user && (
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/auth/sign-in">Sign In</Link>
              </Button>
              <Button asChild variant="default" size="sm">
                <Link href="/auth/sign-up">Get Started</Link>
              </Button>
            </div>
          )}
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="bg-gradient-to-b from-card to-background py-12 md:py-20">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-primary mb-4 md:mb-6">
                  Make Preloved Fashion Smarter
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground mb-6 md:mb-8 max-w-2xl">
                  Digital wardrobes meet local self-serve racks. The sustainable way to buy and sell fashion in your community.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start">
                  {user ? (
                    <Button asChild variant="accent" size="lg" className="text-lg">
                      <Link href="/wardrobe">Go to Wardrobe</Link>
                    </Button>
                  ) : (
                    <>
                      <Button asChild variant="accent" size="lg" className="text-lg">
                        <Link href="/auth/sign-up">Get Started Free</Link>
                      </Button>
                      <Button asChild variant="outline" size="lg" className="text-lg">
                        <Link href="/auth/sign-in">Sign In</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex-1 w-full max-w-lg">
                <div className="relative aspect-square rounded-2xl overflow-hidden shadow-xl">
                  <Image
                    src="/assets/images/Intro-pic.png"
                    alt="Bloem Platform"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-12 md:py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 md:mb-16">
              How Bloem Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {/* Feature 1 */}
              <div className="text-center">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 md:w-12 md:h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-3">Build Your Wardrobe</h3>
                <p className="text-muted-foreground">
                  Upload photos of your clothing items to create your digital wardrobe. Display your style or prepare items for selling.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="text-center">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 md:w-12 md:h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-3">Attend Pop-up Markets</h3>
                <p className="text-muted-foreground">
                  Discover local pop-up markets in your area. Browse items from your community and find unique preloved fashion.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="text-center">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-brand-accent/20 flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 md:w-12 md:h-12 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-3">Sell & Earn</h3>
                <p className="text-muted-foreground">
                  Activate your seller account, rent hangers at markets, and start earning from your preloved wardrobe.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Sustainability Section */}
        <section className="py-12 md:py-20 bg-card">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
              <div className="flex-1 w-full max-w-lg order-2 md:order-1">
                <div className="relative aspect-square rounded-2xl overflow-hidden shadow-lg">
                  <Image
                    src="/assets/images/sustainable-fashion.png"
                    alt="Circular Fashion"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="flex-1 order-1 md:order-2 text-center md:text-left">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 md:mb-6">
                  Circular Fashion, Made Easy
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Join the sustainable fashion movement. Every item you buy or sell helps reduce waste and extends the life of clothing.
                </p>
                <ul className="space-y-3 text-left inline-block">
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-muted-foreground">Reduce fashion waste</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-muted-foreground">Support local community</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-muted-foreground">Earn from your wardrobe</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        {!user && (
          <section className="py-16 md:py-24 bg-gradient-to-br from-primary to-secondary">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 md:mb-6">
                Ready to Join Bloem?
              </h2>
              <p className="text-lg md:text-xl text-white/90 mb-8 md:mb-10 max-w-2xl mx-auto">
                Start your sustainable fashion journey today. Create your digital wardrobe and connect with your local community.
              </p>
              <Button asChild variant="accent" size="lg" className="text-lg shadow-xl">
                <Link href="/auth/sign-up">Get Started Free</Link>
              </Button>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-card py-8 md:py-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Bloem. Making sustainable fashion accessible.</p>
        </div>
      </footer>
    </div>
  );
}

