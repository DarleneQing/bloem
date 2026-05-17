import Image from "next/image";

interface ItemQrCodeCardProps {
  qrImageDataUrl: string;
}

export function ItemQrCodeCard({ qrImageDataUrl }: ItemQrCodeCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
      <div className="min-w-0 flex-1">
        <h3 className="font-bold text-foreground">Item QR Code</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Link this QR with a physical tag for in-store scanning.
        </p>
      </div>
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-white">
        <Image
          src={qrImageDataUrl}
          alt="Item QR code"
          fill
          className="object-contain p-1"
          unoptimized
        />
      </div>
    </div>
  );
}
