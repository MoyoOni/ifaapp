import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '@nestjs/common';
// pdfkit is CommonJS with no default export, and esModuleInterop is off:
// a default import compiled to `new pdfkit_1.default()` and every PDF
// download threw until October 30, 2026.
import PDFDocument = require('pdfkit');

// PDFKit's built-in fonts (Helvetica etc.) only cover Western European
// characters: a Yoruba name ("Ọjà Ṣọlá") or the naira sign came out as
// garbage on invoices. DejaVu Sans (free licence, assets/fonts) covers
// Yoruba's dotted letters, tone marks and ₦.
const FONT_FILE = 'assets/fonts/DejaVuSans.ttf';
const logger = new Logger('Pdf');
let fontPath: string | null | undefined;

function resolveFont(): string | null {
  if (fontPath !== undefined) return fontPath;
  const candidates = [
    path.join(process.cwd(), FONT_FILE), // production (/app) and the backend dir
    path.resolve(__dirname, '../../..', FONT_FILE), // running from src/
  ];
  fontPath = candidates.find((p) => fs.existsSync(p)) ?? null;
  if (!fontPath) logger.warn(`${FONT_FILE} not found; PDFs fall back to Helvetica`);
  return fontPath;
}

export function createPdfDocument(options?: PDFKit.PDFDocumentOptions): PDFKit.PDFDocument {
  const doc = new PDFDocument(options);
  const font = resolveFont();
  if (font) doc.font(font);
  return doc;
}

/** PDFKit lays out precomposed letters more reliably than combining marks. */
export function pdfText(text: string | null | undefined): string {
  return (text ?? '').normalize('NFC');
}
