import { QRScanPageClient } from "@/app/qr/scan/QRScanPageClient";

interface PageProps {
  searchParams: Promise<{ code?: string }>;
}

export default async function ScanPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const code = resolvedSearchParams.code;

  return <QRScanPageClient code={code} />;
}
