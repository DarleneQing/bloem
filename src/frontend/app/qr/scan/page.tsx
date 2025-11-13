import { QRScanPageClient } from "./QRScanPageClient";

interface PageProps {
  searchParams: Promise<{ code?: string }>;
}

export default async function QRScanPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const code = resolvedSearchParams.code;

  return <QRScanPageClient code={code} />;
}
