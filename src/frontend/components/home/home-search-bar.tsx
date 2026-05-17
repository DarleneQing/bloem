"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function HomeSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/markets?search=${encodeURIComponent(trimmed)}`);
      return;
    }
    router.push("/markets");
  }

  return (
    <form onSubmit={handleSubmit} className="mb-5">
      <div className="relative flex items-center">
        <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search markets, items, brands..."
          className="h-11 rounded-2xl border-border/70 bg-card pl-10 pr-12 text-sm shadow-sm"
        />
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          className="absolute right-1 h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
          aria-label="Search markets"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
