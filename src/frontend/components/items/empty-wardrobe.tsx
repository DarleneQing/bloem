import Link from "next/link";
import { Button } from "@/components/ui/button";

interface EmptyWardrobeProps {
  isActiveSeller: boolean;
}

export function EmptyWardrobe({ isActiveSeller }: EmptyWardrobeProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-28 h-28 rounded-full bg-secondary/20 flex items-center justify-center mb-6">
        <svg
          className="w-14 h-14 text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      </div>

      <h2 className="text-3xl font-black text-primary mb-3">Your wardrobe is empty</h2>
      <p className="text-lg text-muted-foreground mb-8 max-w-md">
        Start building your digital wardrobe by uploading your clothing items.
        {isActiveSeller
          ? " You can display items or prepare them for selling at markets."
          : " Display your items and share your style."}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <Button asChild variant="accent" size="lg">
          <Link href="/wardrobe/upload">Upload First Item</Link>
        </Button>
        {!isActiveSeller && (
          <Button asChild variant="outline" size="lg">
            <Link href="/profile">Become a Seller</Link>
          </Button>
        )}
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="font-bold text-lg mb-2">Upload Items</h3>
          <p className="text-sm text-muted-foreground">Add photos and details of your clothing</p>
        </div>

        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <h3 className="font-bold text-lg mb-2">Display & Share</h3>
          <p className="text-sm text-muted-foreground">Show off your style to the community</p>
        </div>

        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-brand-accent/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-bold text-lg mb-2">Sell at Markets</h3>
          <p className="text-sm text-muted-foreground">
            {isActiveSeller ? "List items at pop-up markets" : "Activate seller to start earning"}
          </p>
        </div>
      </div>
    </div>
  );
}

