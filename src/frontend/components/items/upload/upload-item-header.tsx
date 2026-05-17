"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, X } from "lucide-react";

export function UploadItemHeader() {
  const router = useRouter();

  return (
    <header className="mb-5 flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
        aria-label="Go back"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <h1 className="flex-1 text-center text-lg font-bold text-foreground">Upload Item</h1>

      <Link
        href="/wardrobe"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </Link>
    </header>
  );
}
