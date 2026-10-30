import { PDFDocument, degrees } from "pdf-lib";

// Merge multiple PDFs (base64 strings or ArrayBuffers)
export async function mergePdfs(pdfDataArray: { name: string; base64: string }[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const item of pdfDataArray) {
    const pdfBytes = Uint8Array.from(atob(item.base64), (c) => c.charCodeAt(0));
    const srcDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return await mergedPdf.save();
}

// Split PDF (extract pages, 1-indexed)
export async function splitPdf(
  base64Pdf: string,
  startPage: number,
  endPage: number
): Promise<Uint8Array> {
  const pdfBytes = Uint8Array.from(atob(base64Pdf), (c) => c.charCodeAt(0));
  const srcDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const newPdf = await PDFDocument.create();

  const totalPages = srcDoc.getPageCount();
  const validStart = Math.max(0, startPage - 1);
  const validEnd = Math.min(totalPages - 1, endPage - 1);

  const indices: number[] = [];
  for (let i = validStart; i <= validEnd; i++) {
    indices.push(i);
  }

  const copiedPages = await newPdf.copyPages(srcDoc, indices);
  copiedPages.forEach((page) => newPdf.addPage(page));

  return await newPdf.save();
}

// Rotate PDF pages (rotationAngle in degrees: 90, 180, 270)
export async function rotatePdf(base64Pdf: string, rotationAngle: number = 90): Promise<Uint8Array> {
  const pdfBytes = Uint8Array.from(atob(base64Pdf), (c) => c.charCodeAt(0));
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  pages.forEach((page) => {
    const currentRotation = page.getRotation().angle;
    page.setRotation(degrees((currentRotation + rotationAngle) % 360));
  });

  return await pdfDoc.save();
}

// Get PDF Page Count & basic Info
export async function inspectPdf(base64Pdf: string): Promise<{
  pageCount: number;
  title?: string;
  author?: string;
  creator?: string;
}> {
  try {
    const pdfBytes = Uint8Array.from(atob(base64Pdf), (c) => c.charCodeAt(0));
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    return {
      pageCount: pdfDoc.getPageCount(),
      title: pdfDoc.getTitle(),
      author: pdfDoc.getAuthor(),
      creator: pdfDoc.getCreator(),
    };
  } catch (e) {
    return { pageCount: 1 };
  }
}

// Helper to trigger browser download of Uint8Array
export function downloadUint8Array(data: Uint8Array, fileName: string, mimeType: string = "application/pdf") {
  // Fix for potential detached buffer: slice it
  const blob = new Blob([data.slice()], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
