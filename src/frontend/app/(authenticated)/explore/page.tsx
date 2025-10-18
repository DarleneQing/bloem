import Image from "next/image";

export default function ExplorePage() {
  return (
    <div className="container mx-auto py-6 md:py-8 px-4">
      <div className="flex items-center gap-3 mb-6 md:mb-8">
        <Image
          src="/assets/images/logo-transparent.png"
          alt="Bloem"
          width={100}
          height={30}
          className="h-8 w-auto md:hidden"
          priority
        />
        <h1 className="text-3xl md:text-4xl font-black text-primary">Explore</h1>
      </div>
      
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-24 h-24 rounded-full bg-secondary/20 flex items-center justify-center mb-6">
          <svg
            className="h-12 w-12 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-primary mb-4">Coming Soon</h2>
        <p className="text-base md:text-lg text-muted-foreground max-w-md leading-relaxed">
          Explore feature will be available in a future update. 
          Discover markets, items, and sellers all in one place.
        </p>
      </div>
    </div>
  );
}
