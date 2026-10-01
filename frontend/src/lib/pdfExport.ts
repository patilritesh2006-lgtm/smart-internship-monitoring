// Real PDF document generator & downloader for EduIntern System
// Produces valid %PDF-1.4 binary files and downloads them directly as .pdf attachments

export interface PdfSection {
  heading: string;
  lines: string[];
}

export interface PdfDocumentOptions {
  filename: string;
  title: string;
  subtitle?: string;
  metadata?: Record<string, string | number>;
  sections: PdfSection[];
}

function sanitizePdfText(input: string): string {
  return String(input ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[—–]/g, "-")
    .replace(/•/g, "*")
    .replace(/[^\x20-\x7E]/g, " ");
}

function wrapTextLine(text: string, maxChars = 92): string[] {
  const clean = text.trim();
  if (!clean) return [""];
  if (clean.length <= maxChars) return [clean];
  const words = clean.split(/\s+/);
  const wrapped: string[] = [];
  let current = "";
  for (const w of words) {
    if (!current) {
      current = w;
    } else if (current.length + 1 + w.length <= maxChars) {
      current += " " + w;
    } else {
      wrapped.push(current);
      current = w;
    }
  }
  if (current) wrapped.push(current);
  return wrapped;
}

export function generatePdfBytes(options: PdfDocumentOptions): Uint8Array {
  const { title, subtitle, metadata, sections } = options;
  const generatedAt = new Date().toLocaleString();

  interface RenderInstruction {
    font: "F1" | "F2";
    size: number;
    leading: number;
    text: string;
  }

  const instructions: RenderInstruction[] = [
    { font: "F2", size: 16, leading: 0, text: title },
    {
      font: "F1",
      size: 9,
      leading: 16,
      text: subtitle || `EduIntern Official Academic Record | Generated: ${generatedAt}`,
    },
    { font: "F1", size: 9, leading: 12, text: "=".repeat(82) },
  ];

  if (metadata && Object.keys(metadata).length > 0) {
    const entries = Object.entries(metadata);
    for (let i = 0; i < entries.length; i += 2) {
      const left = `${entries[i][0]}: ${entries[i][1]}`;
      const right = entries[i + 1] ? `   |   ${entries[i + 1][0]}: ${entries[i + 1][1]}` : "";
      instructions.push({
        font: "F1",
        size: 9.5,
        leading: 13,
        text: `${left}${right}`,
      });
    }
    instructions.push({ font: "F1", size: 9, leading: 11, text: "-".repeat(82) });
  }

  for (const section of sections) {
    instructions.push({
      font: "F2",
      size: 11.5,
      leading: 17,
      text: section.heading.toUpperCase(),
    });
    for (const rawLine of section.lines) {
      const wrapped = wrapTextLine(rawLine, 92);
      for (const line of wrapped) {
        instructions.push({
          font: "F1",
          size: 9.5,
          leading: 13,
          text: line,
        });
      }
    }
  }

  // Paginate instructions (approx 46 lines per A4 page)
  const MAX_LINES_PER_PAGE = 46;
  const pagesInstructions: RenderInstruction[][] = [];
  for (let i = 0; i < instructions.length; i += MAX_LINES_PER_PAGE) {
    pagesInstructions.push(instructions.slice(i, i + MAX_LINES_PER_PAGE));
  }
  if (pagesInstructions.length === 0) {
    pagesInstructions.push([{ font: "F2", size: 14, leading: 0, text: title }]);
  }

  // Object numbering:
  // 1: Catalog
  // 2: Pages
  // 3: Font Helvetica (F1)
  // 4: Font Helvetica-Bold (F2)
  // For each page p (0..P-1):
  //   pageObjNum = 5 + p * 2
  //   contentObjNum = 6 + p * 2
  const objects: string[] = [];
  const pageObjNums: number[] = [];

  for (let p = 0; p < pagesInstructions.length; p++) {
    const pageObjNum = 5 + p * 2;
    const contentObjNum = 6 + p * 2;
    pageObjNums.push(pageObjNum);
    const pageLines = pagesInstructions[p];

    const ops: string[] = ["BT", "48 792 Td"];
    for (let idx = 0; idx < pageLines.length; idx++) {
      const item = pageLines[idx];
      if (idx > 0 || item.leading > 0) {
        const dy = idx === 0 ? 0 : -(item.leading || 13);
        if (dy !== 0) ops.push(`0 ${dy} Td`);
      }
      ops.push(`/${item.font} ${item.size} Tf`);
      ops.push(`(${sanitizePdfText(item.text)}) Tj`);
    }
    ops.push("0 -22 Td");
    ops.push("/F1 8 Tf");
    ops.push(
      `(${sanitizePdfText(
        `Page ${p + 1} of ${pagesInstructions.length} - EduIntern Smart Internship Management System`
      )}) Tj`
    );
    ops.push("ET");

    const streamContent = ops.join("\n");
    objects.push(
      `${pageObjNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Contents ${contentObjNum} 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> >>\nendobj\n`
    );
    objects.push(
      `${contentObjNum} 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj\n`
    );
  }

  const allObjects: string[] = [
    `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`,
    `2 0 obj\n<< /Type /Pages /Kids [${pageObjNums.map((n) => `${n} 0 R`).join(" ")}] /Count ${pageObjNums.length} >>\nendobj\n`,
    `3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`,
    `4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n`,
    ...objects,
  ];

  let pdfText = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (const objStr of allObjects) {
    offsets.push(pdfText.length);
    pdfText += objStr;
  }

  const xrefStart = pdfText.length;
  pdfText += `xref\n0 ${allObjects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    pdfText += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdfText += `trailer\n<< /Size ${allObjects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  const bytes = new Uint8Array(pdfText.length);
  for (let i = 0; i < pdfText.length; i++) {
    bytes[i] = pdfText.charCodeAt(i) & 0xff;
  }
  return bytes;
}

export function downloadRealPdf(options: PdfDocumentOptions): void {
  if (typeof window === "undefined") return;
  const pdfBytes = generatePdfBytes(options);
  const safeFilename = options.filename.endsWith(".pdf")
    ? options.filename
    : `${options.filename}.pdf`;
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = safeFilename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 300);
}
