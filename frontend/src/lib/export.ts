import { jsPDF } from "jspdf";
import PptxGenJS from "pptxgenjs";

export function exportAsPdf(title: string, content: string): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const maxWidth = pageWidth - margin * 2;
  let y = 20;

  doc.setFillColor(33, 33, 33);
  doc.rect(0, 0, pageWidth, 25, "F");
  doc.setTextColor(0, 229, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("MetricNumero", margin, 10);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text("Pharmaceutical Compliance Report", margin + 55, 10);
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.text(new Date().toLocaleDateString(), pageWidth - margin - 25, 10);

  y = 35;
  doc.setTextColor(33, 33, 33);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  const titleLines = doc.splitTextToSize(title, maxWidth);
  doc.text(titleLines[0], margin, y);
  y += titleLines.length * 8;

  doc.setDrawColor(0, 229, 255);
  doc.setLineWidth(0.5);
  doc.line(margin, y + 2, pageWidth - margin, y + 2);
  y += 10;

  const lines = content.split("\n");
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      y += 3;
      continue;
    }

    if (y > pageHeight - 15) {
      doc.addPage();
      y = 20;
      doc.setTextColor(33, 33, 33);
    }

    if (line.startsWith("## ")) {
      doc.setTextColor(0, 229, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      const text = line.replace("## ", "");
      const textLines = doc.splitTextToSize(text, maxWidth);
      doc.text(textLines, margin, y);
      y += textLines.length * 8;
    } else if (line.startsWith("### ")) {
      doc.setTextColor(51, 51, 51);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      const text = line.replace("### ", "");
      const textLines = doc.splitTextToSize(text, maxWidth);
      doc.text(textLines, margin, y);
      y += textLines.length * 7;
    } else if (line.startsWith("|") && line.includes("|") && !line.match(/^\|[-:\s]+\|/) && line.split("|").length > 2) {
      const cells = line.split("|").filter(c => c.trim());
      if (cells.length > 1) {
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, y - 3, maxWidth, 7, "F");
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(51, 51, 51);
        let x = margin;
        for (const cell of cells) {
          doc.text(cell.trim().substring(0, 20), x, y);
          x += maxWidth / cells.length;
        }
        y += 7;
      }
    } else if (line.match(/^\s*[-*•]\s/)) {
      doc.setTextColor(51, 51, 51);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("• " + line.replace(/^\s*[-*•]\s*/, "").substring(0, 80), margin + 5, y);
      y += 5;
    } else if (line.startsWith(">")) {
      doc.setFillColor(230, 250, 250);
      doc.rect(margin, y - 3, maxWidth, 8, "F");
      doc.setTextColor(51, 51, 51);
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      const text = line.replace(/^>\s*/, "").substring(0, 75);
      doc.text(text, margin + 3, y);
      y += 8;
    } else {
      doc.setTextColor(51, 51, 51);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const text = line.replace(/[*#`]/g, "");
      const textLines = doc.splitTextToSize(text, maxWidth);
      for (const textLine of textLines) {
        if (y > pageHeight - 15) {
          doc.addPage();
          y = 20;
        }
        doc.text(textLine, margin, y);
        y += 5;
      }
    }
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 8, { align: "center" });
  }

  doc.save("metricnumero-report.pdf");
}

export function exportAsPpt(title: string, content: string): void {
  const pres = new PptxGenJS();
  pres.layout = "LAYOUT_16x9";
  pres.author = "MetricNumero";
  pres.company = "Pharmaceutical Compliance";
  pres.title = title;
  pres.subject = "Compliance Report";

  const titleSlide = pres.addSlide();
  titleSlide.background = { color: "FFFFFF" };
  titleSlide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 10, h: 1.5, fill: { color: "212121" } });
  titleSlide.addText("MetricNumero", { x: 0.4, y: 0.5, w: 3, h: 0.5, fontSize: 28, bold: true, color: "00E5FF" });
  titleSlide.addText("Pharmaceutical Compliance", { x: 0.4, y: 0.95, w: 4, h: 0.3, fontSize: 12, color: "CCCCCC" });
  titleSlide.addText(title, { x: 0.4, y: 2.2, w: 9, h: 0.8, fontSize: 32, bold: true, color: "212121" });
  titleSlide.addText(`Generated: ${new Date().toLocaleDateString()}`, { x: 0.4, y: 3.0, w: 9, h: 0.3, fontSize: 12, color: "666666" });

  const lines = content.split("\n");
  let currentSlide = pres.addSlide();
  let y = 0.6;
  let tableRows: string[][] = [];
  let inTable = false;

  currentSlide.background = { color: "FFFFFF" };
  currentSlide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 10, h: 0.1, fill: { color: "00E5FF" } });

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) {
      if (tableRows.length > 0) {
        const headers = tableRows[0];
        const rows = tableRows.slice(1);
        if (headers.length > 0) {
          currentSlide.addTable(headers, rows, { 
            x: 0.4, y, 
            w: 9, 
            fontSize: 9, 
            color: "212121",
            border: { color: "DDDDDD" },
            headerFill: { color: "00E5FF" },
            headerColor: "FFFFFF",
          });
          y += Math.min(rows.length, 10) * 0.35 + 1;
        }
        tableRows = [];
      }
      y += 0.2;
      continue;
    }

    if (line.match(/\|.*\|.*\|/)) {
      const cells = line.split("|").filter(c => c.trim());
      if (cells.length > 1) {
        if (tableRows.length === 0) {
          if (y > 5) {
            currentSlide = pres.addSlide();
            y = 0.6;
            currentSlide.background = { color: "FFFFFF" };
            currentSlide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 10, h: 0.1, fill: { color: "00E5FF" } });
          }
        }
        tableRows.push(cells);
      }
    } else {
      if (tableRows.length > 0) {
        const headers = tableRows[0];
        const rows = tableRows.slice(1);
        if (headers.length > 0) {
          currentSlide.addTable(headers, rows, { 
            x: 0.4, y, 
            w: 9, 
            fontSize: 9, 
            color: "212121",
            border: { color: "DDDDDD" },
            headerFill: { color: "00E5FF" },
            headerColor: "FFFFFF",
          });
          y += Math.min(rows.length, 8) * 0.35 + 0.8;
        }
        tableRows = [];
      }

      if (y > 5) {
        currentSlide = pres.addSlide();
        y = 0.6;
        currentSlide.background = { color: "FFFFFF" };
        currentSlide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 10, h: 0.1, fill: { color: "00E5FF" } });
      }

      if (line.startsWith("## ")) {
        currentSlide.addText(line.replace("## ", ""), { 
          x: 0.4, y, w: 9, h: 0.5, 
          fontSize: 22, bold: true, color: "00E5FF" 
        });
        y += 0.7;
      } else if (line.startsWith("### ")) {
        currentSlide.addText(line.replace("### ", ""), { 
          x: 0.4, y, w: 9, h: 0.4, 
          fontSize: 16, bold: true, color: "212121" 
        });
        y += 0.5;
      } else if (line.match(/^\s*[-*•]\s/)) {
        currentSlide.addText("• " + line.replace(/^\s*[-*•]\s*/, ""), { 
          x: 0.7, y, w: 8.5, h: 0.35, 
          fontSize: 12, color: "333333" 
        });
        y += 0.4;
      } else if (line.startsWith(">")) {
        currentSlide.addShape(pres.ShapeType.rect, { x: 0.4, y: y - 0.1, w: 9, h: 0.5, fill: { color: "F0FAFA" } });
        currentSlide.addText(line.replace(/^>\s*/, ""), { 
          x: 0.6, y, w: 8.5, h: 0.35, 
          fontSize: 11, italic: true, color: "333333" 
        });
        y += 0.5;
      } else {
        const cleanText = line.replace(/[*#`_]/g, "");
        currentSlide.addText(cleanText, { 
          x: 0.4, y, w: 9, h: 0.35, 
          fontSize: 11, color: "333333" 
        });
        y += 0.4;
      }
    }
  }

  if (tableRows.length > 0) {
    const headers = tableRows[0];
    const rows = tableRows.slice(1);
    if (headers.length > 0) {
      currentSlide.addTable(headers, rows, { 
        x: 0.4, y, 
        w: 9, 
        fontSize: 9, 
        color: "212121",
        border: { color: "DDDDDD" },
        headerFill: { color: "00E5FF" },
        headerColor: "FFFFFF",
      });
    }
  }

  pres.save("metricnumero-report.pptx");
}