import type { CsvParseResult, DataQualityIssue, RequiredColumn, ReviewRow } from '@/types';
import { REQUIRED_COLUMNS } from '@/types';

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields.map((f) => f.trim());
}

function isBlankOrUnknown(raw: string): boolean {
  if (!raw) return true;
  const trimmed = raw.trim().toLowerCase();
  return trimmed === '' || trimmed === 'unknown' || trimmed === 'n/a' || trimmed === 'na' || trimmed === 'null' || trimmed === 'none';
}

function parseRating(raw: string): number | null {
  if (isBlankOrUnknown(raw)) return null;
  const cleaned = raw.replace(/[^0-9.]/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (Number.isNaN(n)) return null;
  if (n < 1 || n > 5) return null;
  return n;
}

function parseDate(raw: string): string | null {
  if (isBlankOrUnknown(raw)) return null;
  const trimmed = raw.trim();
  // ISO YYYY-MM-DD
  let m = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const [_, y, mo, d] = m;
    const dt = new Date(`${y}-${mo}-${d}T00:00:00Z`);
    if (!Number.isNaN(dt.getTime())) return `${y}-${mo}-${d}`;
    return null;
  }
  // Numeric slash format: try MM/DD/YYYY (US), fall back to DD/MM/YYYY (European)
  m = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const [_, first, second, y] = m;
    const firstN = Number(first);
    const secondN = Number(second);
    // If first > 12, it must be DD/MM. If second > 12, it must be MM/DD.
    let mo: string;
    let d: string;
    if (firstN > 12 && secondN <= 12) {
      d = first.padStart(2, '0');
      mo = second.padStart(2, '0');
    } else if (secondN > 12 && firstN <= 12) {
      mo = first.padStart(2, '0');
      d = second.padStart(2, '0');
    } else {
      // Both <= 12: ambiguous, assume US MM/DD/YYYY
      mo = first.padStart(2, '0');
      d = second.padStart(2, '0');
    }
    const dt = new Date(`${y}-${mo}-${d}T00:00:00Z`);
    if (!Number.isNaN(dt.getTime())) return `${y}-${mo}-${d}`;
    return null;
  }
  // DD-MM-YYYY or D-M-YYYY (European dash format, e.g. 25-09-2026)
  m = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (m) {
    const [_, d, mo, y] = m;
    const moPadded = mo.padStart(2, '0');
    const dPadded = d.padStart(2, '0');
    const dt = new Date(`${y}-${moPadded}-${dPadded}T00:00:00Z`);
    if (!Number.isNaN(dt.getTime())) return `${y}-${moPadded}-${dPadded}`;
    return null;
  }
  // Month name formats: "January 5, 2026" or "Jan 5, 2026"
  m = trimmed.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (m) {
    const monthName = m[1];
    const day = m[2].padStart(2, '0');
    const year = m[3];
    const monthMap: Record<string, string> = {
      january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
      july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
      jan: '01', feb: '02', mar: '03', apr: '04', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    };
    const mo = monthMap[monthName.toLowerCase()];
    if (mo) {
      const dt = new Date(`${year}-${mo}-${day}T00:00:00Z`);
      if (!Number.isNaN(dt.getTime())) return `${year}-${mo}-${day}`;
    }
    return null;
  }
  return null;
}

function hasRequiredContent(row: Record<string, string>): boolean {
  const { body, author, title, source } = row;
  return (
    !isBlankOrUnknown(body) &&
    !isBlankOrUnknown(author) &&
    !isBlankOrUnknown(title) &&
    !isBlankOrUnknown(source)
  );
}

export function parseCsv(csvText: string): CsvParseResult {
  const rows: ReviewRow[] = [];
  const errors: DataQualityIssue[] = [];
  const missingRequiredColumns: string[] = [];

  const text = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  if (!text) {
    return { rows, errors, missingRequiredColumns: [...REQUIRED_COLUMNS] };
  }

  const lines = text.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return { rows, errors, missingRequiredColumns: [...REQUIRED_COLUMNS] };
  }

  const headerFields = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const columnIndices: Partial<Record<RequiredColumn, number>> = {};
  for (const required of REQUIRED_COLUMNS) {
    const idx = headerFields.findIndex((h) => h === required || h.includes(required));
    if (idx === -1) {
      missingRequiredColumns.push(required);
    } else {
      columnIndices[required] = idx;
    }
  }

  if (missingRequiredColumns.length > 0) {
    return { rows, errors, missingRequiredColumns };
  }

  const seen = new Set<string>();
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const fields = parseCsvLine(line);
    const obj: Record<string, string> = {};
    (Object.keys(columnIndices) as RequiredColumn[]).forEach((key) => {
      const idx = columnIndices[key]!;
      obj[key] = fields[idx] ?? '';
    });

    const rowNumber = i + 1;

    // if (!hasRequiredContent(obj)) {
    //   errors.push({
    //     row: rowNumber,
    //     type: 'missing_required',
    //     message: `Row ${rowNumber} is missing required content (author, title, or body).`,
    //   });
    //   continue;
    // }

    const rating = parseRating(obj.rating);
    // if (rating === null) {
    //   errors.push({
    //     row: rowNumber,
    //     type: 'invalid_rating',
    //     message: `Row ${rowNumber} has invalid rating "${obj.rating}". Expected 1-5.`,
    //   });
    //   continue;
    // }

    const parsedDate = parseDate(obj.date);
    // if (!parsedDate) {
    //   errors.push({
    //     row: rowNumber,
    //     type: 'malformed_date',
    //     message: `Row ${rowNumber} has malformed date "${obj.date}".`,
    //   });
    //   continue;
    // }

    const fingerprint = `${obj.author}|${obj.title}|${obj.body}`.toLowerCase().trim();
    if (seen.has(fingerprint)) {
      errors.push({
        row: rowNumber,
        type: 'duplicate',
        message: `Row ${rowNumber} is a duplicate of an earlier review.`,
      });
      continue;
    }
    seen.add(fingerprint);

    rows.push({
      id: `row-${i}`,
      author: obj.author,
      date: parsedDate,
      rawDate: obj.date,
      rating,
      title: obj.title,
      body: obj.body,
      source: obj.source,
    });
  }

  return { rows, errors, missingRequiredColumns };
}
