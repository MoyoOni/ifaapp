// VENDOR_BACKLOG.md VND-006: minimal RFC4180-ish CSV read/write for one
// fixed product column schema -- not a general-purpose CSV library, since
// the columns here are exactly what a vendor's bulk product template needs
// (core catalog fields only; SEO/scheduling/pre-order stay per-product
// settings edited individually, not bulk-templated).

export const PRODUCT_CSV_COLUMNS = [
  'id',
  'name',
  'category',
  'subcategory',
  'description',
  'longDescription',
  'price',
  'currency',
  'stock',
  'images',
  'provenance',
  'usageProtocol',
  'requiresInitiation',
  'status',
  'yorubaName',
  'regionOfOrigin',
  'tags',
] as const;

export interface ProductCsvRow {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  description: string;
  longDescription: string;
  price: string;
  currency: string;
  stock: string;
  images: string; // semicolon-joined URLs -- CSV cells can't hold arrays
  provenance: string;
  usageProtocol: string;
  requiresInitiation: string;
  status: string;
  yorubaName: string;
  regionOfOrigin: string;
  tags: string; // semicolon-joined
}

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function productsToCsv(products: Array<Record<string, any>>): string {
  const header = PRODUCT_CSV_COLUMNS.join(',');
  const rows = products.map((p) =>
    PRODUCT_CSV_COLUMNS.map((col) => {
      let raw: any = p[col] ?? '';
      if (col === 'images' || col === 'tags') raw = (raw as string[]).join(';');
      return escapeCsvField(String(raw));
    }).join(',')
  );
  return [header, ...rows].join('\n');
}

// Simple state-machine parser -- handles quoted fields containing commas,
// escaped quotes ("") inside a quoted field, and \n or \r\n line endings.
function parseCsvLines(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    if (inQuotes) {
      if (char === '"') {
        if (csv[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && csv[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

export function parseProductsCsv(csv: string): ProductCsvRow[] {
  const lines = parseCsvLines(csv.trim());
  if (lines.length === 0) return [];
  const header = lines[0].map((h) => h.trim());
  return lines.slice(1).map((cells) => {
    const row: any = {};
    header.forEach((col, i) => {
      row[col] = (cells[i] ?? '').trim();
    });
    return row as ProductCsvRow;
  });
}
