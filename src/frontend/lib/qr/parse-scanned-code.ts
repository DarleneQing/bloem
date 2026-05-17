import { validateQRCodeFormat } from "@/lib/qr/generation";

export function parseScannedQRCode(raw: string): string | null {
  const code = raw.trim();
  if (!code) return null;

  const urlMatch = code.match(/\/qr\/(BLOEM-[A-Z0-9_-]+-\d{5})/);
  if (urlMatch) return urlMatch[1];

  const codeMatch = code.match(/(BLOEM-[A-Z0-9_-]+-\d{5})/);
  const extracted = codeMatch ? codeMatch[1] : code;

  return validateQRCodeFormat(extracted) ? extracted : null;
}
