import { jsPDF } from "jspdf";

// ============================================================================
// QR CODE PDF EXPORT UTILITIES
// ============================================================================

/**
 * PDF Export Configuration
 */
const LABEL_SIZE_MM = 50; // 50mm x 50mm labels
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MARGIN_MM = 5; // Margin on all sides
const LABELS_PER_ROW = Math.floor((A4_WIDTH_MM - 2 * MARGIN_MM) / LABEL_SIZE_MM); // 4 labels per row
const LABELS_PER_COLUMN = Math.floor((A4_HEIGHT_MM - 2 * MARGIN_MM) / LABEL_SIZE_MM); // 5 labels per column
const LABELS_PER_PAGE = LABELS_PER_ROW * LABELS_PER_COLUMN; // 20 labels per page

const QR_CODE_SIZE_MM = 32; // QR code size within the label
const QR_PADDING_TOP_MM = 4; // Padding above QR code

/**
 * Interface for QR code data for PDF generation
 */
export interface QRCodePDFData {
  code: string;
  qrDataUrl: string;
  url: string;
}

/**
 * Interface for batch information
 */
export interface BatchInfo {
  name?: string | null;
  prefix: string;
  createdAt: string;
  codeCount: number;
}

/**
 * Load image from data URL and return as Image element
 */
function loadImageFromDataURL(dataURL: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataURL;
  });
}


/**
 * Generate PDF with QR codes in grid layout
 * @param codes - Array of QR code data (code, qrDataUrl, url)
 * @param batchInfo - Batch information for header
 * @returns Blob of the generated PDF
 */
export async function generateQRCodePDF(
  codes: QRCodePDFData[],
  batchInfo: BatchInfo
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const totalPages = Math.ceil(codes.length / LABELS_PER_PAGE);
  const HEADER_HEIGHT_MM = 25; // Height reserved for header on first page

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) {
      doc.addPage();
    }

    // Add batch information header on first page
    if (page === 0) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("QR Code Batch", MARGIN_MM, MARGIN_MM + 5);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      let yPos = MARGIN_MM + 10;
      doc.text(`Prefix: ${batchInfo.prefix}`, MARGIN_MM, yPos);
      yPos += 5;
      if (batchInfo.name) {
        doc.text(`Name: ${batchInfo.name}`, MARGIN_MM, yPos);
        yPos += 5;
      }
      doc.text(`Generated: ${new Date(batchInfo.createdAt).toLocaleDateString()}`, MARGIN_MM, yPos);
      yPos += 5;
      doc.text(`Total Codes: ${batchInfo.codeCount}`, MARGIN_MM, yPos);
      
      // Add a line separator
      doc.setLineWidth(0.5);
      doc.setDrawColor(200, 200, 200);
      doc.line(MARGIN_MM, HEADER_HEIGHT_MM, A4_WIDTH_MM - MARGIN_MM, HEADER_HEIGHT_MM);
    }

    // Calculate starting Y position (after header on first page, from margin on others)
    const startY = page === 0 ? HEADER_HEIGHT_MM + MARGIN_MM : MARGIN_MM;

    // Get codes for this page
    const startIndex = page * LABELS_PER_PAGE;
    const endIndex = Math.min(startIndex + LABELS_PER_PAGE, codes.length);
    const pageCodes = codes.slice(startIndex, endIndex);

    // Draw QR codes and labels
    for (let i = 0; i < pageCodes.length; i++) {
      const code = pageCodes[i];
      const row = Math.floor(i / LABELS_PER_ROW);
      const col = i % LABELS_PER_ROW;

      // Calculate label position (accounting for margins)
      const labelX = MARGIN_MM + col * LABEL_SIZE_MM;
      const labelY = startY + row * LABEL_SIZE_MM;

      // Check if label fits on page (with bottom margin)
      if (labelY + LABEL_SIZE_MM > A4_HEIGHT_MM - MARGIN_MM) {
        continue; // Skip if label would overflow
      }

      // Draw label border (light gray)
      doc.setLineWidth(0.1);
      doc.setDrawColor(200, 200, 200);
      doc.rect(labelX, labelY, LABEL_SIZE_MM, LABEL_SIZE_MM);

      // Calculate QR code position (centered horizontally, with top padding)
      const qrX = labelX + (LABEL_SIZE_MM - QR_CODE_SIZE_MM) / 2; // Center horizontally
      const qrY = labelY + QR_PADDING_TOP_MM; // Top padding

      // Load and add QR code image
      try {
        const img = await loadImageFromDataURL(code.qrDataUrl);
        doc.addImage(
          img,
          "PNG",
          qrX,
          qrY,
          QR_CODE_SIZE_MM,
          QR_CODE_SIZE_MM
        );
      } catch (error) {
        console.error(`Error adding QR code image for ${code.code}:`, error);
        // Draw placeholder rectangle if image fails to load
        doc.setFillColor(240, 240, 240);
        doc.rect(qrX, qrY, QR_CODE_SIZE_MM, QR_CODE_SIZE_MM, "F");
      }

      // Add QR code text below the image (centered)
      const textY = qrY + QR_CODE_SIZE_MM + 2; // 2mm gap between QR and text
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      
      // Split code into multiple lines if needed (max width is label width minus small margins)
      const maxTextWidth = LABEL_SIZE_MM - 4; // 2mm margin on each side
      const textLines = doc.splitTextToSize(code.code, maxTextWidth);
      
      // Calculate text position (centered horizontally)
      const textX = labelX + LABEL_SIZE_MM / 2;
      
      // Draw text lines
      let lineY = textY;
      for (const line of textLines) {
        doc.text(line, textX, lineY, {
          align: "center",
          maxWidth: maxTextWidth,
        });
        lineY += 3; // Line height
      }
    }

    // Add page number footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${page + 1} of ${totalPages}`,
      A4_WIDTH_MM / 2,
      A4_HEIGHT_MM - MARGIN_MM,
      { align: "center" }
    );
  }

  // Generate blob from PDF
  const pdfBlob = doc.output("blob");
  return pdfBlob;
}

/**
 * Download PDF file
 * @param blob - PDF blob
 * @param filename - Filename for download
 */
export function downloadPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate filename for QR code batch PDF
 * @param batchInfo - Batch information
 * @returns Filename string
 */
export function generatePDFFilename(batchInfo: BatchInfo): string {
  const date = new Date(batchInfo.createdAt).toISOString().split("T")[0];
  const prefix = batchInfo.prefix.replace(/[^A-Z0-9_-]/g, "_");
  return `qr-batch-${prefix}-${date}.pdf`;
}

