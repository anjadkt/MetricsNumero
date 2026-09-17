import * as pdfjsLib from "pdfjs-dist";

// Point the PDF.js worker to the bundled worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

/**
 * Extract plain text from a File object.
 * Supports: PDF, TXT, CSV, DOCX (basic XML extraction).
 */
export async function extractText(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (ext === "pdf") {
    return extractPdf(file);
  }

  if (ext === "txt" || ext === "csv") {
    return file.text();
  }

  if (ext === "docx") {
    return extractDocx(file);
  }

  // Fallback: try to read as plain text
  try {
    return file.text();
  } catch {
    return `[Could not extract text from ${file.name}]`;
  }
}

async function extractPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const results: string[] = [];
  const batchSize = 20; // Increased for maximum throughput on modern browsers

  for (let i = 1; i <= pdf.numPages; i += batchSize) {
    const batchPageNumbers = Array.from(
      { length: Math.min(batchSize, pdf.numPages - i + 1) }, 
      (_, idx) => i + idx
    );
    
    const batchResults = await Promise.all(
      batchPageNumbers.map(async (pageNum) => {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        return content.items
          .map((item: any) => (item.str || ""))
          .join(" ");
      })
    );
    
    results.push(...batchResults);
  }

  return results.join("\n\n");
}

async function extractDocx(file: File): Promise<string> {
  // DOCX is a ZIP; extract the word/document.xml text content
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const xmlFile = zip.file("word/document.xml");
  if (!xmlFile) return `[No text found in ${file.name}]`;

  const xml = await xmlFile.async("text");
  // Strip all XML tags and collapse whitespace
  return xml
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
