"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { QRCodeLinkingDialog } from "./QRCodeLinkingDialog";
import { QrCode } from "lucide-react";

export function QRCodeLinkingButton() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setDialogOpen(true)}
        variant="outline"
        size="default"
        className="w-full sm:w-auto h-11 sm:h-14 px-4 sm:px-6 text-sm sm:text-lg"
      >
        <QrCode className="h-4 w-4 sm:mr-2" />
        <span className="sm:inline">Link QR Code</span>
      </Button>
      <QRCodeLinkingDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}

