"use client";

import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminItemsPageHeaderProps {
  onExport?: () => void;
  isExporting?: boolean;
}

export function AdminItemsPageHeader({
  onExport,
  isExporting = false,
}: AdminItemsPageHeaderProps) {
  return (
    <header className="mb-6 flex items-center gap-3">
      <Button
        asChild
        variant="ghost"
        size="icon"
        className="h-10 w-10 shrink-0 rounded-full"
      >
        <Link href="/admin" aria-label="Back to admin dashboard">
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </Button>

      <h1 className="flex-1 text-center text-lg font-bold text-foreground sm:text-xl">
        Item Management
      </h1>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-10 w-10 shrink-0 rounded-full"
        onClick={onExport}
        disabled={!onExport || isExporting}
        aria-label="Export items"
      >
        <Download className="h-5 w-5" />
      </Button>
    </header>
  );
}
